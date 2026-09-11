import SwiftUI
import AppKit

@main
struct MOOHSIAMacApp: App {
    var body: some Scene {
        WindowGroup {
            MacContentView()
                .frame(minWidth: 940, minHeight: 650)
        }
    }
}

private enum MacSection: String, CaseIterable, Identifiable {
    case chat = "暮霞"
    case search = "搜尋"
    case knowledge = "知識索引"
    case system = "系統"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .chat: return "sparkles"
        case .search: return "magnifyingglass"
        case .knowledge: return "books.vertical"
        case .system: return "square.grid.2x2"
        }
    }
}

@MainActor
final class MacConversationStore: ObservableObject {
    @Published var messages: [CloudMessage] = []
    @Published var knowledge: [KnowledgeItem] = []
    @Published var status = "連線 MOOHSIA Cloud…"
    @Published var token = TokenStore.load() ?? ""
    @Published var isSending = false

    private var api: CloudAPI { CloudAPI(token: token.isEmpty ? nil : token) }

    func load() async {
        do {
            guard try await api.health() else { throw CloudAPIError.invalidResponse }
            messages = try await api.listMessages()
            do { knowledge = try await api.listKnowledge() } catch { knowledge = [] }
            status = "MOOHSIA Cloud 已同步"
        } catch {
            status = "雲端尚未就緒：\(error.localizedDescription)"
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
            status = "MOOHSIA Cloud 已同步"
        } catch {
            status = "雲端請求失敗：\(error.localizedDescription)"
        }
    }

    func searchKnowledge(_ query: String) async {
        do {
            knowledge = try await api.listKnowledge(query: query)
            status = query.isEmpty ? "知識索引已同步" : "知識索引搜尋完成"
        } catch {
            status = "知識索引尚未升級：\(error.localizedDescription)"
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
            knowledge = try await api.listKnowledge()
            status = "已加入暮霞知識索引"
        } catch {
            status = "建立索引失敗：\(error.localizedDescription)"
        }
    }

    func saveToken() {
        status = TokenStore.save(token)
            ? "Cloud Token 已安全存入 Keychain"
            : "Cloud Token 儲存失敗"
    }
}

struct MacContentView: View {
    @StateObject private var store = MacConversationStore()
    @State private var selection: MacSection? = .chat
    @State private var input = ""
    @State private var webQuery = ""
    @State private var knowledgeQuery = ""
    @State private var showingSettings = false
    @State private var showingAddKnowledge = false

    var body: some View {
        NavigationSplitView {
            List(MacSection.allCases, selection: $selection) { section in
                Label(section.rawValue, systemImage: section.icon)
                    .tag(section)
            }
            .navigationTitle("MOOHSIA")
            .safeAreaInset(edge: .bottom) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 7) {
                        Circle()
                            .frame(width: 8, height: 8)
                            .foregroundStyle(store.status.contains("已同步") ? Color.green : Color.orange)
                        Text("MOOHSIA Cloud")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    Text(store.status)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.thinMaterial)
            }
        } detail: {
            switch selection ?? .chat {
            case .chat: chatView
            case .search: searchView
            case .knowledge: knowledgeView
            case .system: systemView
            }
        }
        .task { await store.load() }
        .sheet(isPresented: $showingSettings) { settingsView }
        .sheet(isPresented: $showingAddKnowledge) { addKnowledgeView }
    }

    private var chatView: some View {
        VStack(spacing: 0) {
            header(title: "暮霞", subtitle: "你的 Cloud-first AI 助理")

            if store.messages.isEmpty {
                ContentUnavailableView(
                    "暮霞已上線",
                    systemImage: "sparkles",
                    description: Text("從這裡開始聊天。Mac 關機時，MOOHSIA Cloud 仍可由 iPhone 使用。")
                )
            } else {
                ScrollViewReader { proxy in
                    List(store.messages) { message in
                        VStack(alignment: message.role == "user" ? .trailing : .leading, spacing: 6) {
                            Text(message.role == "user" ? "你" : "暮霞")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(message.text)
                                .textSelection(.enabled)
                                .padding(12)
                                .background(message.role == "user" ? Color.accentColor.opacity(0.15) : Color.secondary.opacity(0.10))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .frame(maxWidth: .infinity, alignment: message.role == "user" ? .trailing : .leading)
                        .listRowSeparator(.hidden)
                        .id(message.id)
                    }
                    .listStyle(.plain)
                    .onChange(of: store.messages.count) {
                        if let id = store.messages.last?.id { proxy.scrollTo(id, anchor: .bottom) }
                    }
                }
            }

            Divider()
            HStack(alignment: .bottom, spacing: 10) {
                TextField("問暮霞任何事情…", text: $input, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...6)

                Button {
                    let text = input
                    input = ""
                    Task { await store.send(text) }
                } label: {
                    Label(store.isSending ? "處理中" : "送出", systemImage: store.isSending ? "hourglass" : "arrow.up.circle.fill")
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.return, modifiers: [.command])
                .disabled(store.isSending || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
    }

    private var searchView: some View {
        VStack(alignment: .leading, spacing: 18) {
            header(title: "7×24 網路搜尋", subtitle: "Google、Brave、Bing、Yahoo 搜尋入口")

            VStack(alignment: .leading, spacing: 12) {
                TextField("要搜尋什麼？", text: $webQuery)
                    .textFieldStyle(.roundedBorder)
                    .font(.title3)

                HStack {
                    webButton("Google", "https://www.google.com/search?q=")
                    webButton("Brave", "https://search.brave.com/search?q=")
                    webButton("Bing", "https://www.bing.com/search?q=")
                    webButton("Yahoo", "https://search.yahoo.com/search?p=")
                }

                GroupBox("AI 搜尋整合狀態") {
                    Text("目前 App 已提供安全的搜尋入口。下一個雲端階段會把搜尋 API / RSS / 官方資料源接入 MOOHSIA Cloud，讓暮霞自動整理、交叉查核並寫入長期索引。")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 6)
                }
            }
            .padding(24)

            Spacer()
        }
    }

    private func webButton(_ name: String, _ base: String) -> some View {
        Button(name) {
            let q = webQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            guard let url = URL(string: base + q) else { return }
            NSWorkspace.shared.open(url)
        }
        .buttonStyle(.borderedProminent)
        .disabled(webQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    private var knowledgeView: some View {
        VStack(spacing: 0) {
            header(title: "知識索引", subtitle: "讓暮霞把重要資料留下來，之後可再次搜尋與用於回答")
            HStack {
                TextField("搜尋索引…", text: $knowledgeQuery)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { Task { await store.searchKnowledge(knowledgeQuery) } }
                Button("搜尋") { Task { await store.searchKnowledge(knowledgeQuery) } }
                Button {
                    showingAddKnowledge = true
                } label: {
                    Label("加入資料", systemImage: "plus")
                }
            }
            .padding()

            if store.knowledge.isEmpty {
                ContentUnavailableView(
                    "尚無索引資料",
                    systemImage: "books.vertical",
                    description: Text("先手動加入；之後 Notion、Slack、GitHub、網站與 RSS 會匯入同一套索引。")
                )
            } else {
                List(store.knowledge) { item in
                    VStack(alignment: .leading, spacing: 7) {
                        HStack {
                            Text(item.title).font(.headline)
                            Spacer()
                            Text(item.category).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(item.body).lineLimit(4).foregroundStyle(.secondary)
                        if let source = item.sourceURL, !source.isEmpty {
                            Text(source).font(.caption2).foregroundStyle(.tertiary)
                        }
                    }
                    .padding(.vertical, 5)
                }
            }
        }
    }

    private var systemView: some View {
        VStack(alignment: .leading, spacing: 16) {
            header(title: "系統", subtitle: "Cloud-first 架構與授權狀態")

            Form {
                LabeledContent("Cloud API", value: "api.moohsia.com")
                LabeledContent("狀態", value: store.status)
                LabeledContent("Token", value: store.token.isEmpty ? "尚未設定" : "已存於 Keychain")
                Divider()
                Button("Cloud Token 設定") { showingSettings = true }
            }
            .formStyle(.grouped)
            .padding(.horizontal)

            Spacer()
        }
    }

    private func header(title: String, subtitle: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.largeTitle).fontWeight(.semibold)
                Text(subtitle).foregroundStyle(.secondary)
            }
            Spacer()
            Button { showingSettings = true } label: { Image(systemName: "gearshape") }
        }
        .padding(20)
        .background(.thinMaterial)
    }

    private var settingsView: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("MOOHSIA Cloud Token").font(.headline)
            SecureField("只貼 Token 值", text: $store.token)
                .textFieldStyle(.roundedBorder)
            Text("Token 只存於這台 Mac 的 Apple Keychain。")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Spacer()
                Button("儲存") {
                    store.saveToken()
                    showingSettings = false
                    Task { await store.load() }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(24)
        .frame(width: 480)
    }

    private var addKnowledgeView: some View {
        MacAddKnowledgeView { title, contentText, category, sourceURL in
            Task {
                await store.addKnowledge(title: title, body: contentText, category: category, sourceURL: sourceURL)
                showingAddKnowledge = false
            }
        }
    }
}

private struct MacAddKnowledgeView: View {
    @State private var title = ""
    @State private var contentText = ""
    @State private var category = "一般"
    @State private var sourceURL = ""
    let onSave: (String, String, String, String?) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("加入暮霞索引").font(.title2).fontWeight(.semibold)
            TextField("標題", text: $title).textFieldStyle(.roundedBorder)
            TextField("分類", text: $category).textFieldStyle(.roundedBorder)
            TextField("來源網址（可留空）", text: $sourceURL).textFieldStyle(.roundedBorder)
            TextEditor(text: $contentText)
                .frame(height: 180)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.secondary.opacity(0.3)))
            HStack {
                Spacer()
                Button("儲存") {
                    let source = sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)
                    onSave(
                        title.trimmingCharacters(in: .whitespacesAndNewlines),
                        contentText.trimmingCharacters(in: .whitespacesAndNewlines),
                        category.trimmingCharacters(in: .whitespacesAndNewlines),
                        source.isEmpty ? nil : source
                    )
                }
                .buttonStyle(.borderedProminent)
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || contentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(24)
        .frame(width: 560)
    }
}
