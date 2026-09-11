import Foundation
import Combine

enum CloudConnectionState: Equatable {
    case checking
    case online(version: String)
    case needsAuthorization(version: String)
    case offline(message: String)

    var label: String {
        switch self {
        case .checking: return "檢查雲端…"
        case let .online(version): return "Cloud \(version) · 已連線"
        case let .needsAuthorization(version): return "Cloud \(version) · 需要授權"
        case .offline: return "暫時無法連線"
        }
    }

    var isOnline: Bool {
        switch self {
        case .online, .needsAuthorization: return true
        case .checking, .offline: return false
        }
    }
}

@MainActor
final class MOOHSIAStore: ObservableObject {
    @Published var messages: [CloudMessage] = []
    @Published var knowledge: [KnowledgeItem] = []
    @Published var searchResults: [SearchResultItem] = []
    @Published var activity: [ActivityEvent] = []
    @Published var integrations: [IntegrationStatus] = []
    @Published var watchlists: [Watchlist] = []
    @Published var tasks: [RemoteCommand] = []
    @Published var dashboard: DashboardSnapshot?
    @Published var connection: CloudConnectionState = .checking
    @Published var statusMessage = "正在連線 MOOHSIA Cloud…"
    @Published var token = TokenStore.load() ?? ""
    @Published var liveSearch = true
    @Published var isSending = false
    @Published var isSearching = false
    @Published var isSyncing = false
    @Published var lastChatSources: [SearchResultItem] = []

    private var api: CloudAPI { CloudAPI(token: token.isEmpty ? nil : token) }

    func load() async {
        connection = .checking
        do {
            let health = try await CloudAPI().health()
            if token.isEmpty {
                connection = .needsAuthorization(version: health.version)
                statusMessage = "MOOHSIA Cloud 在線；請完成這台裝置的 Cloud Token 授權。"
                return
            }
            connection = .online(version: health.version)
            statusMessage = "正在同步所有資料…"
            await refreshAll()
        } catch {
            connection = .offline(message: error.localizedDescription)
            statusMessage = "Cloud 無法連線：\(error.localizedDescription)"
        }
    }

    func refreshAll() async {
        guard !token.isEmpty else { return }
        do {
            async let messagesValue = api.listMessages()
            async let knowledgeValue = api.listKnowledge()
            async let activityValue = api.listActivity()
            async let integrationsValue = api.listIntegrations()
            async let watchlistsValue = api.listWatchlists()
            async let tasksValue = api.listRemoteTasks()
            async let dashboardValue = api.dashboard()

            messages = try await messagesValue
            knowledge = try await knowledgeValue
            activity = try await activityValue
            integrations = try await integrationsValue
            watchlists = try await watchlistsValue
            tasks = try await tasksValue
            dashboard = try await dashboardValue

            if case let .online(version) = connection {
                connection = .online(version: version)
            }
            statusMessage = "所有雲端資料已同步"
        } catch CloudAPIError.unauthorized {
            let version = (try? await CloudAPI().health().version) ?? "?"
            connection = .needsAuthorization(version: version)
            statusMessage = "Cloud 在線，但 Token 無效或尚未設定。"
        } catch {
            statusMessage = "部分資料同步失敗：\(error.localizedDescription)"
        }
    }

    func send(_ text: String) async {
        let prompt = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !prompt.isEmpty, !isSending else { return }
        isSending = true
        defer { isSending = false }

        let local = CloudMessage(id: UUID(), role: "user", text: prompt, createdAt: Date())
        messages.append(local)

        do {
            _ = try await api.append(role: "user", text: prompt)
            let reply = try await api.chat(prompt, liveSearch: liveSearch)
            _ = try await api.append(role: "assistant", text: reply.text)
            messages.append(CloudMessage(id: UUID(), role: "assistant", text: reply.text, createdAt: Date()))
            lastChatSources = reply.sources ?? []
            statusMessage = reply.usedLiveSearch == true ? "已使用即時網路 + 暮霞索引回答" : "已使用暮霞索引回答"
            await refreshDashboardAndActivity()
        } catch {
            if let index = messages.firstIndex(where: { $0.id == local.id }) {
                messages.remove(at: index)
            }
            statusMessage = "送出失敗：\(error.localizedDescription)"
        }
    }

    func searchWeb(_ query: String) async {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty, !isSearching else { return }
        isSearching = true
        defer { isSearching = false }

        do {
            searchResults = try await api.webSearch(q, save: true)
            statusMessage = "搜尋完成，結果已寫入暮霞索引"
            await refreshKnowledge()
            await refreshDashboardAndActivity()
        } catch {
            statusMessage = "AI 網路搜尋尚未啟用：\(error.localizedDescription)"
        }
    }

    func searchKnowledge(_ query: String) async {
        do {
            knowledge = try await api.listKnowledge(query: query)
            statusMessage = query.isEmpty ? "知識索引已同步" : "索引搜尋完成"
        } catch {
            statusMessage = "索引搜尋失敗：\(error.localizedDescription)"
        }
    }

    func addKnowledge(title: String, body: String, category: String, sourceURL: String?) async {
        do {
            _ = try await api.addKnowledge(
                title: title,
                body: body,
                category: category.isEmpty ? "未分類" : category,
                sourceURL: sourceURL,
                sourceType: sourceURL == nil ? "manual" : "web"
            )
            await refreshKnowledge()
            await refreshDashboardAndActivity()
            statusMessage = "已加入暮霞長期索引"
        } catch {
            statusMessage = "建立索引失敗：\(error.localizedDescription)"
        }
    }

    func syncIntegrations(_ names: [String] = []) async {
        guard !isSyncing else { return }
        isSyncing = true
        defer { isSyncing = false }
        do {
            integrations = try await api.syncIntegrations(names)
            await refreshKnowledge()
            await refreshDashboardAndActivity()
            statusMessage = "Notion / Slack / GitHub 同步完成"
        } catch {
            statusMessage = "外部系統同步失敗：\(error.localizedDescription)"
        }
    }

    func enqueueRemote(action: String, payload: String = "") async {
        do {
            let item = try await api.enqueueRemote(action: action, payload: payload)
            tasks.insert(item, at: 0)
            statusMessage = "Mac 任務已排入安全佇列"
        } catch {
            statusMessage = "任務排入失敗：\(error.localizedDescription)"
        }
    }

    func refreshTasks() async {
        do { tasks = try await api.listRemoteTasks() }
        catch { statusMessage = "任務同步失敗：\(error.localizedDescription)" }
    }

    func updateTask(_ id: UUID, status: RemoteCommand.Status, result: String? = nil) async {
        do {
            let updated = try await api.updateRemoteTask(id: id, status: status, result: result)
            if let index = tasks.firstIndex(where: { $0.id == id }) { tasks[index] = updated }
        } catch {
            statusMessage = "任務狀態更新失敗：\(error.localizedDescription)"
        }
    }

    func saveToken() {
        let clean = token.trimmingCharacters(in: .whitespacesAndNewlines)
        token = clean
        if TokenStore.save(clean) {
            statusMessage = "Cloud Token 已安全存入 Keychain"
            Task { await load() }
        } else {
            statusMessage = "Cloud Token 儲存失敗"
        }
    }

    func makeBackupFile() -> URL? {
        let payload = BackupPayload(
            exportedAt: Date(),
            messages: messages,
            knowledge: knowledge,
            activity: activity
        )
        do {
            let data = try JSONEncoder.moohsia.encode(payload)
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyyMMdd-HHmmss"
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("MOOHSIA-Backup-\(formatter.string(from: Date())).json")
            try data.write(to: url, options: .atomic)
            return url
        } catch {
            statusMessage = "建立備份失敗：\(error.localizedDescription)"
            return nil
        }
    }

    private func refreshKnowledge() async {
        if let value = try? await api.listKnowledge() { knowledge = value }
    }

    private func refreshDashboardAndActivity() async {
        if let value = try? await api.dashboard() { dashboard = value }
        if let value = try? await api.listActivity() { activity = value }
    }
}
