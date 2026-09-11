import Foundation

@MainActor
final class ConversationStore: ObservableObject {
    @Published var messages: [CloudMessage] = []
    @Published var statusText = "連線 MOOHSIA Cloud…"
    @Published var token = TokenStore.load() ?? ""

    private var api: CloudAPI { CloudAPI(token: token.isEmpty ? nil : token) }

    func load() async {
        do {
            guard try await api.health() else { throw CloudAPIError.invalidResponse }
            messages = try await api.listMessages()
            statusText = "MOOHSIA Cloud 已同步"
        } catch {
            statusText = "雲端尚未部署或尚未授權：\(error.localizedDescription)"
        }
    }

    func append(role: String, text: String) async {
        let optimistic = CloudMessage(id: UUID(), role: role, text: text, createdAt: Date())
        messages.append(optimistic)
        do {
            let saved = try await api.append(role: role, text: text)
            if let i = messages.firstIndex(where: { $0.id == optimistic.id }) { messages[i] = saved }
            statusText = "MOOHSIA Cloud 已同步"
        } catch { statusText = "雲端寫入失敗：\(error.localizedDescription)" }
    }

    func ask(_ prompt: String) async {
        do {
            let reply = try await api.chat(prompt)
            _ = try await api.append(role: "assistant", text: reply)
            messages.append(CloudMessage(id: UUID(), role: "assistant", text: reply, createdAt: Date()))
            statusText = "MOOHSIA Cloud 已同步"
        } catch { statusText = "AI 雲端請求失敗：\(error.localizedDescription)" }
    }

    func saveToken() {
        if TokenStore.save(token) {
            statusText = "Cloud Token 已安全存入 Keychain"
        } else {
            statusText = "Cloud Token 儲存失敗"
        }
    }

    func enqueueRemote(action: String, payload: String) async {
        statusText = "此動作需要 Mac 在線；目前僅排入後續安全工作佇列功能。"
    }
}
