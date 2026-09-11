import Foundation

@MainActor
final class ConversationStore: ObservableObject {
    @Published var messages: [CloudMessage] = []
    @Published var knowledge: [KnowledgeItem] = []
    @Published var statusText = "連線 MOOHSIA Cloud…"
    @Published var token = TokenStore.load() ?? ""
    @Published var isSending = false

    private var api: CloudAPI { CloudAPI(token: token.isEmpty ? nil : token) }

    func load() async {
        do {
            guard try await api.health() else { throw CloudAPIError.invalidResponse }
            messages = try await api.listMessages()
            do { knowledge = try await api.listKnowledge() } catch { knowledge = [] }
            statusText = "MOOHSIA Cloud 已同步"
        } catch {
            statusText = "雲端尚未就緒：\(error.localizedDescription)"
        }
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }
        isSending = true
        defer { isSending = false }

        do {
            _ = try await api.append(role: "user", text: trimmed)
            let reply = try await api.chat(trimmed)
            _ = try await api.append(role: "assistant", text: reply)
            messages = try await api.listMessages()
            statusText = "MOOHSIA Cloud 已同步"
        } catch {
            statusText = "AI 雲端請求失敗：\(error.localizedDescription)"
        }
    }

    func searchKnowledge(_ query: String) async {
        do {
            knowledge = try await api.listKnowledge(query: query)
            statusText = query.isEmpty ? "知識索引已同步" : "知識索引搜尋完成"
        } catch {
            statusText = "知識索引尚未升級：\(error.localizedDescription)"
        }
    }

    func addKnowledge(title: String, body: String, category: String, sourceURL: String? = nil) async {
        do {
            _ = try await api.addKnowledge(
                title: title,
                body: body,
                category: category.isEmpty ? "未分類" : category,
                sourceURL: sourceURL,
                sourceType: sourceURL == nil ? "manual" : "web"
            )
            knowledge = try await api.listKnowledge()
            statusText = "已加入暮霞知識索引"
        } catch {
            statusText = "建立索引失敗：\(error.localizedDescription)"
        }
    }

    func saveToken() {
        statusText = TokenStore.save(token)
            ? "Cloud Token 已安全存入 Keychain"
            : "Cloud Token 儲存失敗"
    }

    func enqueueRemote(action: String, payload: String) async {
        do {
            _ = try await api.enqueueRemote(action: action, payload: payload)
            statusText = "已送入 Mac 安全任務佇列；Mac 在線後仍需本機核准"
        } catch {
            statusText = "任務佇列尚未升級：\(error.localizedDescription)"
        }
    }
}
