import Foundation
import Security

enum TokenStore {
    private static let service = "com.moohsia.personal.cloud"
    private static let account = "MOOHSIA_TOKEN"

    static func load() -> String? {
        if let keychain = loadKeychain(), !keychain.isEmpty {
            return keychain
        }
        #if os(macOS)
        if let imported = importDesktopToken(), !imported.isEmpty {
            _ = save(imported)
            return imported
        }
        #endif
        return nil
    }

    private static func loadKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    @discardableResult
    static func save(_ token: String) -> Bool {
        let clean = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty, let data = clean.data(using: .utf8) else { return false }

        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(base as CFDictionary)

        var item = base
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(item as CFDictionary, nil) == errSecSuccess
    }

    #if os(macOS)
    private static func importDesktopToken() -> String? {
        let url = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Desktop")
            .appendingPathComponent("MOOHSIA-Cloud-Token.txt")
        guard let text = try? String(contentsOf: url, encoding: .utf8) else { return nil }
        for line in text.split(whereSeparator: \.isNewline) {
            let raw = String(line)
            if raw.hasPrefix("MOOHSIA_TOKEN=") {
                return String(raw.dropFirst("MOOHSIA_TOKEN=".count))
                    .trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        return nil
    }
    #endif
}
