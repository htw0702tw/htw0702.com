import Foundation
import CloudKit
import UIKit

@MainActor
final class CloudKitSyncService: ObservableObject {
    @Published private(set) var status = "正在檢查 iCloud…"
    @Published private(set) var isAvailable = false

    private let container = CKContainer(identifier: "iCloud.com.moohsia.personal.ios")

    func bootstrap() async {
        do {
            let accountStatus = try await container.accountStatus()
            switch accountStatus {
            case .available:
                isAvailable = true
                status = "CloudKit 已連線"
                try await saveDevicePresence()
            case .noAccount:
                isAvailable = false
                status = "這台 iPhone 尚未登入 iCloud"
            case .restricted:
                isAvailable = false
                status = "iCloud 存取受到限制"
            case .couldNotDetermine:
                isAvailable = false
                status = "暫時無法確認 iCloud 狀態"
            case .temporarilyUnavailable:
                isAvailable = false
                status = "iCloud 暫時無法使用"
            @unknown default:
                isAvailable = false
                status = "未知的 iCloud 狀態"
            }
        } catch {
            isAvailable = false
            status = "CloudKit 初始化失敗：\(error.localizedDescription)"
        }
    }

    private func saveDevicePresence() async throws {
        let identifier = UIDevice.current.identifierForVendor?.uuidString ?? "unknown-device"
        let recordID = CKRecord.ID(recordName: "device-\(identifier)")
        let record = CKRecord(recordType: "MOOHSIADevicePresence", recordID: recordID)
        record["deviceName"] = UIDevice.current.name as CKRecordValue
        record["systemName"] = UIDevice.current.systemName as CKRecordValue
        record["systemVersion"] = UIDevice.current.systemVersion as CKRecordValue
        record["lastSeenAt"] = Date() as CKRecordValue
        _ = try await container.privateCloudDatabase.save(record)
        status = "CloudKit 已連線 · 本機已登記"
    }
}
