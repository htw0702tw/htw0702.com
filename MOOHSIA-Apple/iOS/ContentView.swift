import SwiftUI
import UIKit

struct ContentView: View {
    @StateObject private var store = MOOHSIAStore()
    @StateObject private var voice = VoiceService()
    @State private var input = ""
    @State private var searchQuery = ""
    @State private var knowledgeQuery = ""
    @State private var showSettings = false
    @State private var showAddKnowledge = false
    @State private var shareURL: URL?
    @AppStorage("MOOHSIA.speakReplies") private var speakReplies = true

    var body: some View {
        ZStack {
            MobileBackground()
            TabView {
                NavigationStack { chatTab }
                    .tabItem { Label("暮霞", systemImage: "sparkles") }
                NavigationStack { searchTab }
                    .tabItem { Label("搜尋", systemImage: "globe.asia.australia.fill") }
                NavigationStack { intelligenceTab }
                    .tabItem { Label("情報", systemImage: "wave.3.right.circle.fill") }
                NavigationStack { memoryTab }
                    .tabItem { Label("索引", systemImage: "books.vertical.fill") }
                NavigationStack { integrationsTab }
                    .tabItem { Label("聯動", systemImage: "point.3.connected.trianglepath.dotted") }
            }
            .tint(MobileColors.accent)
        }
        .preferredColorScheme(.dark)
        .task { await store.load() }
        .sheet(isPresented: $showSettings) { settingsSheet }
        .sheet(isPresented: $showAddKnowledge) { addKnowledgeSheet }
        .sheet(item: $shareURL) { ShareSheet(items: [$0]) }
    }

    private var chatTab: some View {
        VStack(spacing: 0) {
            cloudBar
            if store.messages.isEmpty {
                ScrollView {
                    VStack(spacing: 18) {
                        Spacer(minLength: 70)
                        ZStack {
                            Circle().fill(MobileColors.accent.opacity(0.12)).frame(width: 112, height: 112)
                            Image(systemName: "sparkles").font(.system(size: 44, weight: .semibold)).foregroundStyle(MobileColors.accent)
                        }
                        Text("暮霞已待命").font(.largeTitle.bold())
                        Text("文字、語音、即時網路與你的長期索引都在同一個地方。")
                            .multilineTextAlignment(.center).foregroundStyle(.secondary).padding(.horizontal, 30)
                        dashboardStrip
                        Spacer(minLength: 50)
                    }
                }
            } else {
                List(store.messages) { message in
                    MobileMessageBubble(message: message)
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                }
                .scrollContentBackground(.hidden)
            }

            if !store.lastChatSources.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack { ForEach(store.lastChatSources.prefix(4)) { source in Link(destination: URL(string: source.url)!) { Label(source.title, systemImage: "link").lineLimit(1) }.buttonStyle(.bordered) } }.padding(.horizontal)
                }.padding(.bottom, 6)
            }

            VStack(spacing: 8) {
                HStack { Toggle("即時網路", isOn: $store.liveSearch).toggleStyle(.switch).font(.caption); Spacer(); Text(voice.status).font(.caption).foregroundStyle(voice.listening ? MobileColors.accent : .secondary) }
                HStack(alignment: .bottom, spacing: 9) {
                    Button { Task { await voice.toggle(); if !voice.transcript.isEmpty { input = voice.transcript } } } label: { Image(systemName: voice.listening ? "stop.circle.fill" : "mic.circle.fill").font(.title) }.foregroundStyle(voice.listening ? .red : MobileColors.accent)
                    TextField("問暮霞任何事情…", text: $input, axis: .vertical).textFieldStyle(.roundedBorder).lineLimit(1...5)
                    Button { send() } label: { Image(systemName: store.isSending ? "hourglass" : "arrow.up.circle.fill").font(.title) }.foregroundStyle(MobileColors.accent).disabled(store.isSending || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }.padding().background(.ultraThinMaterial)
        }
        .navigationTitle("暮霞")
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showSettings = true } label: { Image(systemName: "gearshape.fill") } } }
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        input = ""
        Task {
            let count = store.messages.count
            await store.send(text)
            if speakReplies, store.messages.count > count, let last = store.messages.last, last.role == "assistant" { voice.speak(last.text) }
        }
    }

    private var cloudBar: some View {
        HStack(spacing: 8) {
            Circle().fill(connectionColor).frame(width: 8, height: 8)
            Text(store.connection.label).font(.caption.bold())
            Spacer()
            Button { Task { await store.refreshAll() } } label: { Image(systemName: "arrow.clockwise") }
        }
        .padding(.horizontal).padding(.vertical, 8).background(.thinMaterial)
    }

    private var connectionColor: Color {
        switch store.connection {
        case .online: return .green
        case .needsAuthorization: return .orange
        case .checking: return .yellow
        case .offline: return .red
        }
    }

    private var dashboardStrip: some View {
        HStack(spacing: 10) {
            mobileMetric("索引", store.dashboard?.knowledgeCount ?? store.knowledge.count)
            mobileMetric("情報", store.dashboard?.activityCount ?? store.activity.count)
            mobileMetric("監控", store.dashboard?.enabledWatchlists ?? store.watchlists.filter(\.enabled).count)
        }.padding(.horizontal)
    }

    private func mobileMetric(_ name: String, _ value: Int) -> some View {
        VStack(spacing: 4) { Text("\(value)").font(.title2.bold()); Text(name).font(.caption2).foregroundStyle(.secondary) }
            .frame(maxWidth: .infinity).padding(12).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var searchTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                MobileHero(title: "即時搜尋", subtitle: "暮霞搜尋、整理、保留來源，並將結果寫入自己的長期索引。")
                MobileCard {
                    VStack(spacing: 10) {
                        TextField("要搜尋什麼？", text: $searchQuery).textFieldStyle(.roundedBorder).onSubmit { Task { await store.searchWeb(searchQuery) } }
                        Button { Task { await store.searchWeb(searchQuery) } } label: { Label(store.isSearching ? "搜尋中…" : "暮霞 AI 搜尋", systemImage: "sparkle.magnifyingglass") }.buttonStyle(.borderedProminent).tint(MobileColors.accent).disabled(searchQuery.isEmpty || store.isSearching)
                        HStack { browserButton("Google", "https://www.google.com/search?q="); browserButton("Brave", "https://search.brave.com/search?q=") }
                        HStack { browserButton("Bing", "https://www.bing.com/search?q="); browserButton("Yahoo", "https://search.yahoo.com/search?p=") }
                    }
                }
                ForEach(store.searchResults) { item in
                    MobileCard { VStack(alignment: .leading, spacing: 7) { HStack { Text(item.title).font(.headline); Spacer(); Text(item.provider).font(.caption2).foregroundStyle(.secondary) }; Text(item.snippet).foregroundStyle(.secondary); if let u = URL(string: item.url) { Link(item.url, destination: u).font(.caption).lineLimit(1) } } }
                }
            }.padding()
        }
        .navigationTitle("搜尋")
    }

    private func browserButton(_ name: String, _ base: String) -> some View {
        Button(name) {
            let q = searchQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let url = URL(string: base + q) { UIApplication.shared.open(url) }
        }.buttonStyle(.bordered).frame(maxWidth: .infinity).disabled(searchQuery.isEmpty)
    }

    private var intelligenceTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                MobileHero(title: "主動情報", subtitle: "雲端監控在 Mac 關機時仍可執行；新資料會去重、記錄並進入索引。")
                MobileCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("監控器").font(.headline)
                        if store.watchlists.isEmpty { Text("Cloud 0.4 啟用後會建立全球、台灣、資安監控。") .foregroundStyle(.secondary) }
                        ForEach(store.watchlists) { item in HStack(alignment: .top) { Image(systemName: item.enabled ? "eye.fill" : "eye.slash").foregroundStyle(MobileColors.accent); VStack(alignment: .leading) { Text(item.name).fontWeight(.semibold); Text(item.query).font(.caption).foregroundStyle(.secondary) }; Spacer() } }
                    }
                }
                ForEach(store.activity) { event in
                    MobileCard { VStack(alignment: .leading, spacing: 6) { HStack { Circle().fill(event.severity == "high" ? .red : event.severity == "medium" ? .orange : MobileColors.accent).frame(width: 8, height: 8); Text(event.title).font(.headline); Spacer() }; Text(event.detail).foregroundStyle(.secondary); Text(event.createdAt.formatted()).font(.caption2).foregroundStyle(.tertiary); if let s = event.sourceURL, let u = URL(string: s) { Link("來源", destination: u) } } }
                }
            }.padding()
        }
        .navigationTitle("情報")
    }

    private var memoryTab: some View {
        VStack(spacing: 0) {
            HStack { TextField("搜尋暮霞索引…", text: $knowledgeQuery).textFieldStyle(.roundedBorder).onSubmit { Task { await store.searchKnowledge(knowledgeQuery) } }; Button { Task { await store.searchKnowledge(knowledgeQuery) } } label: { Image(systemName: "magnifyingglass") }; Button { showAddKnowledge = true } label: { Image(systemName: "plus.circle.fill") } }.padding()
            if store.knowledge.isEmpty {
                ContentUnavailableView("尚無索引", systemImage: "books.vertical", description: Text("AI 搜尋與外部系統同步後，資料會自動進到這裡。"))
            } else {
                List(store.knowledge) { item in
                    VStack(alignment: .leading, spacing: 5) { HStack { Text(item.title).font(.headline); Spacer(); Text(item.category).font(.caption).foregroundStyle(.secondary) }; Text(item.body).lineLimit(4).foregroundStyle(.secondary); Text(item.sourceType.uppercased()).font(.caption2).foregroundStyle(MobileColors.accent) }
                        .padding(.vertical, 4).listRowBackground(Color.clear)
                }.scrollContentBackground(.hidden)
            }
        }.navigationTitle("知識索引")
    }

    private var integrationsTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                MobileHero(title: "聯動中心", subtitle: "MOOHSIA Cloud 是主同步層；Notion、Slack、GitHub 與備份都在這裡管理。")
                MobileCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack { Text("Notion · Slack · GitHub").font(.headline); Spacer(); Button("全部同步") { Task { await store.syncIntegrations() } }.disabled(store.isSyncing) }
                        if store.integrations.isEmpty { Text("Cloud 0.4 部署後會顯示連線狀態。Notion/Slack 需你安全授權。") .foregroundStyle(.secondary) }
                        ForEach(store.integrations) { item in HStack { Circle().fill(item.connected ? .green : item.configured ? .orange : .secondary).frame(width: 8, height: 8); VStack(alignment: .leading) { Text(item.label).fontWeight(.semibold); Text(item.connected ? "已連線 · \(item.itemCount) 筆" : item.configured ? (item.lastError ?? "已設定") : "待授權").font(.caption).foregroundStyle(.secondary) }; Spacer(); if item.configured { Button("同步") { Task { await store.syncIntegrations([item.name]) } } } } }
                    }
                }
                MobileCard {
                    VStack(alignment: .leading, spacing: 9) { Text("iCloud Drive 備份").font(.headline); Text("目前用 MOOHSIA Cloud 做 Mac/iPhone 即時同步；免費 Personal Team 可把完整 JSON 備份存到 iCloud Drive。") .foregroundStyle(.secondary); Button("匯出備份") { if let url = store.makeBackupFile() { shareURL = url } }.buttonStyle(.bordered) }
                }
                MobileCard {
                    VStack(alignment: .leading, spacing: 10) { Text("Mac 安全任務").font(.headline); Text("任務會先進 Cloud 佇列；Mac 上仍需你核准才執行。") .foregroundStyle(.secondary); Button("請 Mac 開啟 Pages") { Task { await store.enqueueRemote(action: "openPages") } }; Button("請 Mac 開啟備忘錄") { Task { await store.enqueueRemote(action: "openNotes") } } }
                }
            }.padding()
        }
        .navigationTitle("聯動")
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showSettings = true } label: { Image(systemName: "gearshape.fill") } } }
    }

    private var settingsSheet: some View {
        NavigationStack {
            Form {
                Section("MOOHSIA Cloud") { SecureField("Cloud Token", text: $store.token); Button("儲存並重新連線") { store.saveToken(); showSettings = false }; LabeledContent("狀態", value: store.connection.label) }
                Section("語音") { Toggle("回答後朗讀", isOn: $speakReplies) }
                Section { Text("Token 只存於這台 iPhone 的 Keychain，不會寫入 GitHub、Notion 或 Slack。") .font(.caption).foregroundStyle(.secondary) }
            }.navigationTitle("暮霞設定").toolbar { ToolbarItem(placement: .cancellationAction) { Button("關閉") { showSettings = false } } }
        }
    }

    private var addKnowledgeSheet: some View {
        MobileAddKnowledgeView { title, content, category, source in
            Task { await store.addKnowledge(title: title, body: content, category: category, sourceURL: source); showAddKnowledge = false }
        }
    }
}

private struct MobileMessageBubble: View {
    let message: CloudMessage
    var body: some View { HStack { if message.role == "user" { Spacer(minLength: 44) }; VStack(alignment: .leading, spacing: 5) { Text(message.role == "user" ? "你" : "暮霞").font(.caption.bold()).foregroundStyle(message.role == "user" ? .secondary : MobileColors.accent); Text(message.text).textSelection(.enabled) }.padding(12).background(message.role == "user" ? Color.white.opacity(0.09) : MobileColors.accent.opacity(0.11), in: RoundedRectangle(cornerRadius: 17)); if message.role != "user" { Spacer(minLength: 44) } } }
}

private struct MobileHero: View {
    let title: String; let subtitle: String
    var body: some View { VStack(alignment: .leading, spacing: 6) { Text(title).font(.largeTitle.bold()); Text(subtitle).foregroundStyle(.secondary) }.frame(maxWidth: .infinity, alignment: .leading) }
}

private struct MobileCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { content.padding(14).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18)).overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.06))) }
}

private enum MobileColors { static let accent = Color(red: 0.36, green: 0.82, blue: 1.0) }
private struct MobileBackground: View { var body: some View { LinearGradient(colors: [Color(red: 0.025, green: 0.035, blue: 0.065), Color(red: 0.035, green: 0.055, blue: 0.10), .black], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea() } }

private struct MobileAddKnowledgeView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""; @State private var content = ""; @State private var category = "一般"; @State private var source = ""
    let onSave: (String, String, String, String?) -> Void
    var body: some View { NavigationStack { Form { TextField("標題", text: $title); TextField("分類", text: $category); TextField("來源網址（可留空）", text: $source).textInputAutocapitalization(.never); TextField("內容", text: $content, axis: .vertical).lineLimit(6...14) }.navigationTitle("加入索引").toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }; ToolbarItem(placement: .confirmationAction) { Button("儲存") { let s = source.trimmingCharacters(in: .whitespacesAndNewlines); onSave(title.trimmingCharacters(in: .whitespacesAndNewlines), content.trimmingCharacters(in: .whitespacesAndNewlines), category.trimmingCharacters(in: .whitespacesAndNewlines), s.isEmpty ? nil : s) }.disabled(title.isEmpty || content.isEmpty) } } } }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: items, applicationActivities: nil) }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

extension URL: @retroactive Identifiable { public var id: String { absoluteString } }
