import SwiftUI

struct ContentView: View {
    @StateObject private var store = ConversationStore()
    @StateObject private var voice = VoiceService()
    @State private var input = ""
    @State private var searchQuery = ""
    @State private var knowledgeQuery = ""
    @State private var showSearch = false
    @State private var searchURL = URL(string: "https://www.google.com")!
    @State private var showSettings = false
    @State private var showAddKnowledge = false

    var body: some View {
        TabView {
            NavigationStack { chatView }
                .tabItem { Label("暮霞", systemImage: "sparkles") }

            NavigationStack { searchHome }
                .tabItem { Label("搜尋", systemImage: "magnifyingglass") }

            NavigationStack { knowledgeView }
                .tabItem { Label("索引", systemImage: "books.vertical") }

            NavigationStack { systemView }
                .tabItem { Label("系統", systemImage: "square.grid.2x2") }
        }
        .task { await store.load() }
        .sheet(isPresented: $showSearch) {
            NavigationStack {
                SearchView(url: searchURL)
                    .ignoresSafeArea(edges: .bottom)
                    .navigationTitle("網路搜尋")
                    .navigationBarTitleDisplayMode(.inline)
            }
        }
        .sheet(isPresented: $showSettings) { settingsView }
        .sheet(isPresented: $showAddKnowledge) { addKnowledgeView }
    }

    private var chatView: some View {
        VStack(spacing: 0) {
            statusBar
            if store.messages.isEmpty {
                ContentUnavailableView(
                    "暮霞已上線",
                    systemImage: "sparkles",
                    description: Text("從這裡開始聊天。對話由 MOOHSIA Cloud 同步。")
                )
            } else {
                List(store.messages) { msg in
                    VStack(alignment: msg.role == "user" ? .trailing : .leading, spacing: 5) {
                        Text(msg.role == "user" ? "你" : "暮霞")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(msg.text)
                            .textSelection(.enabled)
                            .padding(10)
                            .background(msg.role == "user" ? Color.accentColor.opacity(0.16) : Color.secondary.opacity(0.10))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .frame(maxWidth: .infinity, alignment: msg.role == "user" ? .trailing : .leading)
                    .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
            }

            HStack(alignment: .bottom, spacing: 8) {
                TextField("問暮霞任何事情…", text: $input, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...6)

                Button {
                    Task {
                        await voice.toggle()
                        if !voice.transcript.isEmpty { input = voice.transcript }
                    }
                } label: {
                    Image(systemName: voice.listening ? "stop.circle.fill" : "mic.fill")
                }

                Button {
                    let text = input
                    input = ""
                    Task { await store.send(text) }
                } label: {
                    Image(systemName: store.isSending ? "hourglass" : "arrow.up.circle.fill")
                        .font(.title2)
                }
                .disabled(store.isSending || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
        .navigationTitle("暮霞 MOOHSIA")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showSettings = true } label: { Image(systemName: "gearshape") }
            }
        }
    }

    private var searchHome: some View {
        Form {
            Section("7×24 網路搜尋入口") {
                TextField("輸入搜尋內容", text: $searchQuery)
                searchButton("Google", base: "https://www.google.com/search?q=")
                searchButton("Brave", base: "https://search.brave.com/search?q=")
                searchButton("Bing", base: "https://www.bing.com/search?q=")
                searchButton("Yahoo", base: "https://search.yahoo.com/search?p=")
            }
            Section("下一階段") {
                Text("目前為安全的內建瀏覽搜尋入口。要做到「暮霞自動搜尋→整理→查核→寫入索引」，還需要把搜尋提供者 API / RSS / 官方資料源接進 MOOHSIA Cloud。")
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("搜尋")
    }

    private func searchButton(_ name: String, base: String) -> some View {
        Button {
            let q = searchQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let url = URL(string: base + q) {
                searchURL = url
                showSearch = true
            }
        } label: {
            Label("用 \(name) 搜尋", systemImage: "safari")
        }
        .disabled(searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    private var knowledgeView: some View {
        VStack(spacing: 0) {
            HStack {
                TextField("搜尋暮霞索引…", text: $knowledgeQuery)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { Task { await store.searchKnowledge(knowledgeQuery) } }
                Button { Task { await store.searchKnowledge(knowledgeQuery) } } label: {
                    Image(systemName: "magnifyingglass")
                }
                Button { showAddKnowledge = true } label: {
                    Image(systemName: "plus")
                }
            }
            .padding()

            if store.knowledge.isEmpty {
                ContentUnavailableView(
                    "尚無索引資料",
                    systemImage: "books.vertical",
                    description: Text("可先手動加入資料；之後 Notion、Slack、GitHub 與網路來源會匯入同一個索引。")
                )
            } else {
                List(store.knowledge) { item in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Text(item.title).font(.headline)
                            Spacer()
                            Text(item.category).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(item.body).lineLimit(3).foregroundStyle(.secondary)
                        if let source = item.sourceURL, !source.isEmpty {
                            Text(source).font(.caption2).foregroundStyle(.tertiary)
                        }
                    }
                }
            }
        }
        .navigationTitle("知識索引")
    }

    private var systemView: some View {
        Form {
            Section("MOOHSIA Cloud") {
                LabeledContent("API", value: "api.moohsia.com")
                LabeledContent("狀態", value: store.statusText)
            }
            Section("Mac 安全任務") {
                Button("請 Mac 開啟 Pages") {
                    Task { await store.enqueueRemote(action: "openPages", payload: "") }
                }
                Button("請 Mac 開啟備忘錄") {
                    Task { await store.enqueueRemote(action: "openNotes", payload: "") }
                }
                Text("任務只會排入雲端；真正操作 Mac 前仍需要本機執行器與核准規則。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Section {
                Button("Cloud Token 設定") { showSettings = true }
            }
        }
        .navigationTitle("系統")
    }

    private var statusBar: some View {
        HStack(spacing: 8) {
            Circle()
                .frame(width: 8, height: 8)
                .foregroundStyle(store.statusText.contains("已同步") ? Color.green : Color.orange)
            Text(store.statusText).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.thinMaterial)
    }

    private var settingsView: some View {
        NavigationStack {
            Form {
                Section("MOOHSIA Cloud Token") {
                    SecureField("只貼 Token 值", text: $store.token)
                    Button("儲存到 Keychain") {
                        store.saveToken()
                        showSettings = false
                        Task { await store.load() }
                    }
                }
                Section {
                    Text("Token 只存於這台裝置的 Apple Keychain，不寫入 GitHub、Notion 或 Slack。")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("暮霞設定")
        }
    }

    private var addKnowledgeView: some View {
        AddKnowledgeView { title, body, category, sourceURL in
            Task {
                await store.addKnowledge(title: title, body: body, category: category, sourceURL: sourceURL)
                showAddKnowledge = false
            }
        }
    }
}

private struct AddKnowledgeView: View {
    @State private var title = ""
    @State private var body = ""
    @State private var category = "一般"
    @State private var sourceURL = ""
    let onSave: (String, String, String, String?) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("標題", text: $title)
                TextField("分類", text: $category)
                TextField("來源網址（可留空）", text: $sourceURL)
                    .textInputAutocapitalization(.never)
                TextField("內容", text: $body, axis: .vertical)
                    .lineLimit(6...14)
            }
            .navigationTitle("加入索引")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("儲存") {
                        onSave(
                            title.trimmingCharacters(in: .whitespacesAndNewlines),
                            body.trimmingCharacters(in: .whitespacesAndNewlines),
                            category.trimmingCharacters(in: .whitespacesAndNewlines),
                            sourceURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : sourceURL
                        )
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
