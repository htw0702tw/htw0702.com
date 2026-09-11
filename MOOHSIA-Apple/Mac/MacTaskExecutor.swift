import Foundation
import AppKit

enum MacTaskExecutor {
    static func execute(_ task: RemoteCommand) async -> Result<String, Error> {
        do {
            switch task.action {
            case "openPages":
                try openApplication(bundleIdentifier: "com.apple.iWork.Pages")
                return .success("已開啟 Pages")
            case "openNotes":
                try openApplication(bundleIdentifier: "com.apple.Notes")
                return .success("已開啟備忘錄")
            case "openURL":
                guard
                    let url = URL(string: task.payload),
                    ["https", "http"].contains(url.scheme?.lowercased() ?? "")
                else { throw TaskExecutionError.invalidPayload }
                let ok = NSWorkspace.shared.open(url)
                if !ok { throw TaskExecutionError.openFailed }
                return .success("已開啟網址")
            default:
                throw TaskExecutionError.unsupportedAction(task.action)
            }
        } catch {
            return .failure(error)
        }
    }

    private static func openApplication(bundleIdentifier: String) throws {
        guard let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleIdentifier) else {
            throw TaskExecutionError.applicationNotFound
        }
        NSWorkspace.shared.openApplication(at: url, configuration: NSWorkspace.OpenConfiguration()) { _, _ in }
    }
}

enum TaskExecutionError: LocalizedError {
    case invalidPayload
    case openFailed
    case applicationNotFound
    case unsupportedAction(String)

    var errorDescription: String? {
        switch self {
        case .invalidPayload: return "任務內容格式不正確"
        case .openFailed: return "無法開啟指定項目"
        case .applicationNotFound: return "找不到指定 App"
        case let .unsupportedAction(action): return "不支援的任務：\(action)"
        }
    }
}
