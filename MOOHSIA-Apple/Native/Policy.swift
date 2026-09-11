import Foundation

struct AppError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

enum Policy {
    static let cisa = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    static let mirror = "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json"
    static let apps = ["備忘錄":"com.apple.Notes", "Pages":"com.apple.iWork.Pages", "Safari":"com.apple.Safari", "行事曆":"com.apple.iCal", "Finder":"com.apple.finder", "計算機":"com.apple.calculator"]
    static let searchEngines: [String:String] = ["Google":"https://www.google.com/search?q=", "Brave":"https://search.brave.com/search?q=", "Bing":"https://www.bing.com/search?q=", "Yahoo":"https://search.yahoo.com/search?p="]
    static let methods: Set<String> = ["bootstrap","settings","history","appendMessage","audit","systemStatus","fetchCatalog","openApp","saveNote","openSource","speak","stopSpeaking","startListening","stopListening","configureAI","removeKey","askAI","chooseSync","disableSync","sync","preference","deleteHistory","showData","askLocalAI","searchWeb","draftPages"]
    static func appID(_ name: String) throws -> String { guard let value = apps[name] else { throw AppError("這個 App 尚未加入可操作清單。") }; return value }
    static func searchURL(engine:String, query:String) throws -> URL {
        guard let base=searchEngines[engine] else { throw AppError("只允許 Google、Brave、Bing、Yahoo 搜尋。Firefox 是瀏覽器，不是搜尋引擎。") }
        guard !query.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty, query.utf16.count <= 1000 else { throw AppError("搜尋字串格式不符。") }
        guard var c=URLComponents(string:base) else { throw AppError("搜尋引擎網址設定錯誤。") }
        c.queryItems=[URLQueryItem(name: engine == "Yahoo" ? "p" : "q",value:query)]
        guard let url=c.url else { throw AppError("無法建立搜尋網址。") }; return url
    }
    static func sourceURL(_ string: String) throws -> URL {
        guard let u = URL(string:string), u.scheme == "https", u.user == nil, u.password == nil, u.port == nil || u.port == 443 else { throw AppError("只允許指定來源的 HTTPS 網址。") }
        let hosts: Set<String> = ["www.cisa.gov","cisa.gov","nvd.nist.gov","support.apple.com","developer.apple.com","learn.microsoft.com","msrc.microsoft.com","developers.openai.com","platform.openai.com"]
        guard hosts.contains(u.host ?? "") || string == mirror || string == "https://github.com/cisagov/kev-data" else { throw AppError("來源不在允許清單；沒有開啟。") }; return u
    }
    static func message(_ m:[String:Any]) throws {
        guard let id=m["id"] as? String, UUID(uuidString:id) != nil, let role=m["role"] as? String, ["user","assistant"].contains(role), let text=m["text"] as? String, text.utf16.count <= 24000, let at=m["at"] as? String, validDate(at) else { throw AppError("對話記錄格式不符。") }
    }
    static func validDate(_ value:String) -> Bool { let formatter=ISO8601DateFormatter(); if formatter.date(from:value) != nil { return true }; formatter.formatOptions=[.withInternetDateTime,.withFractionalSeconds]; return formatter.date(from:value) != nil }
    static func catalog(_ object:[String:Any]) throws {
        guard let records=object["vulnerabilities"] as? [[String:Any]], !records.isEmpty, records.count <= 50000 else { throw AppError("CISA 資料格式不符；快取未更新。") }
        var seen = [String:Data](); for record in records { guard let id=record["cveID"] as? String, id.range(of:"^CVE-[0-9]{4}-[0-9]{4,}$",options:.regularExpression) != nil, let date=record["dateAdded"] as? String, date.range(of:"^[0-9]{4}-[0-9]{2}-[0-9]{2}$",options:.regularExpression) != nil else { throw AppError("CISA 記錄缺少有效 CVE 或日期。") }; let bytes=try JSONSerialization.data(withJSONObject:record,options:.sortedKeys); if let old=seen[id], old != bytes { throw AppError("CISA 同一 CVE 有衝突，未覆蓋快取。") }; seen[id]=bytes }
    }
    static func now() -> String { ISO8601DateFormatter().string(from:Date()) }
    static func serviceError(status:Int,body:Data,endpoint:String,model:String?,requestID:String?,secret:String?) -> String {
        func redact(_ value:String) -> String { var result=value; if let secret=secret,!secret.isEmpty {result=result.replacingOccurrences(of:secret,with:"[已遮蔽金鑰]")}; result=result.replacingOccurrences(of:"sk-[A-Za-z0-9_-]+",with:"[已遮蔽金鑰]",options:.regularExpression); return String(result.prefix(1800)) }
        var lines=["服務回傳 HTTP \(status)。","端點：\(redact(endpoint))"]; if let model=model {lines.append("模型：\(redact(model))")}; if body.count<=65536,let object=try? JSONSerialization.jsonObject(with:body),let root=object as? [String:Any],let error=root["error"] as? [String:Any] { for (field,label) in [("code","錯誤代碼"),("type","錯誤類型"),("message","服務說明")] { if let value=error[field] as? String,!value.isEmpty {lines.append("\(label)：\(redact(value))")} } }; if let id=requestID {lines.append("請求 ID：\(redact(id))")}; if status==404 {lines.append("請核對模型 ID 與此 API 專案的存取權限；僅憑 404 尚無法確定原因。")} ; lines.append("未自動重試。"); return lines.joined(separator:"\n")
    }
}
