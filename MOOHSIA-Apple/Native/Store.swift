import Foundation
import SQLite3

final class Store {
    let root: URL
    private var db: OpaquePointer?
    private let lock = NSRecursiveLock()
    private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
    init() throws {
        let support=try FileManager.default.url(for:.applicationSupportDirectory,in:.userDomainMask,appropriateFor:nil,create:true)
        root=support.appendingPathComponent("com.moohsia.personal",isDirectory:true)
        try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700])
        guard sqlite3_open_v2(root.appendingPathComponent("moohsia.sqlite3").path,&db,SQLITE_OPEN_READWRITE|SQLITE_OPEN_CREATE|SQLITE_OPEN_FULLMUTEX,nil)==SQLITE_OK else { throw AppError("無法開啟本機 SQLite。") }
        sqlite3_busy_timeout(db,5000)
        guard let schema=Bundle.main.url(forResource:"schema",withExtension:"sql") else { throw AppError("安裝包缺少資料庫結構。") }
        let sql=try String(contentsOf:schema,encoding:.utf8)
        guard sqlite3_exec(db,sql,nil,nil,nil)==SQLITE_OK else { throw AppError("無法初始化 SQLite：\(String(cString:sqlite3_errmsg(db)))") }
    }
    deinit { sqlite3_close(db) }
    private func locked<T>(_ body:() throws -> T) rethrows -> T { lock.lock();defer{lock.unlock()};return try body() }
    @discardableResult func execute(_ sql:String,_ values:[String]=[]) throws -> [[String:String]] {
        try locked {
            var stmt:OpaquePointer?
            guard sqlite3_prepare_v2(db,sql,-1,&stmt,nil)==SQLITE_OK else { throw AppError("SQLite 準備操作失敗。") }
            defer { sqlite3_finalize(stmt) }
            for (i,value) in values.enumerated() {
                guard sqlite3_bind_text(stmt,Int32(i+1),value,-1,transient)==SQLITE_OK else { throw AppError("SQLite 參數失敗。") }
            }
            var rows=[[String:String]]()
            while true {
                let code=sqlite3_step(stmt)
                if code==SQLITE_DONE { break }
                guard code==SQLITE_ROW else { throw AppError("SQLite 操作失敗：\(String(cString:sqlite3_errmsg(db)))") }
                var row=[String:String]()
                for col in 0..<sqlite3_column_count(stmt) {
                    let name=String(cString:sqlite3_column_name(stmt,col))
                    if let value=sqlite3_column_text(stmt,col) { row[name]=String(cString:value) }
                }
                rows.append(row)
            }
            return rows
        }
    }
    func history() throws -> [[String:String]] { try execute("SELECT id,role,text,at FROM messages ORDER BY at,id") }
    func deleted() throws -> [[String:String]] { try execute("SELECT id,at FROM tombstones ORDER BY id") }
    func append(_ m:[String:Any]) throws {
        try locked {
            try Policy.message(m)
            let id=m["id"] as! String
            if !(try execute("SELECT id FROM tombstones WHERE id=?",[id])).isEmpty { return }
            let values=[id,m["role"] as! String,m["text"] as! String,m["at"] as! String]
            try execute("INSERT OR IGNORE INTO messages(id,role,text,at) VALUES(?,?,?,?)",values)
            guard let row=try execute("SELECT id,role,text,at FROM messages WHERE id=?",[id]).first,
                  row["role"]==values[1],row["text"]==values[2],row["at"]==values[3] else { throw AppError("對話 ID 衝突或寫入驗證失敗，未覆蓋原始內容。") }
        }
    }
    func cache(_ value:[String:Any]) throws {
        let bytes=try JSONSerialization.data(withJSONObject:value,options:.sortedKeys)
        let text=String(decoding:bytes,as:UTF8.self)
        try execute("INSERT OR REPLACE INTO cache(key,json) VALUES('cisa',?)",[text])
        guard try execute("SELECT json FROM cache WHERE key='cisa'").first?["json"]==text else { throw AppError("快取回讀驗證失敗。") }
    }
    func cached() throws -> [String:Any]? {
        guard let json=try execute("SELECT json FROM cache WHERE key='cisa'").first?["json"] else{return nil}
        return try JSONSerialization.jsonObject(with:Data(json.utf8)) as? [String:Any]
    }
    func audit(_ action:String,_ outcome:String) throws {
        try execute("INSERT INTO audit(id,at,action,outcome) VALUES(?,?,?,?)",[UUID().uuidString,Policy.now(),action,outcome])
    }
    func audits() throws -> [[String:String]] { try execute("SELECT at,action,outcome FROM audit ORDER BY at DESC LIMIT 200") }
    func clearHistory() throws {
        try locked {
            try execute("BEGIN IMMEDIATE")
            do {
                try execute("INSERT OR IGNORE INTO tombstones(id,at) SELECT id,? FROM messages",[Policy.now()])
                try execute("DELETE FROM messages")
                try execute("COMMIT")
            } catch {try? execute("ROLLBACK");throw error}
            guard try history().isEmpty else { throw AppError("刪除對話後回讀仍有資料。") }
        }
    }
    func merge(_ records:[[String:Any]],_ tombstones:[[String:Any]]) throws {
        try locked {
            try execute("BEGIN IMMEDIATE")
            do {
                for t in tombstones {
                    guard let id=t["id"] as? String,UUID(uuidString:id) != nil,let at=t["at"] as? String,Policy.validDate(at) else{throw AppError("刪除標記格式不符。")}
                    try execute("INSERT OR IGNORE INTO tombstones(id,at) VALUES(?,?)",[id,at])
                    try execute("DELETE FROM messages WHERE id=?",[id])
                }
                for record in records {try append(record)}
                try execute("COMMIT")
            } catch {try? execute("ROLLBACK");throw error}
        }
    }
}
