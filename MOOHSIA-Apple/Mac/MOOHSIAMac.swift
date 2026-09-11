import SwiftUI
import AppKit
import UniformTypeIdentifiers

@main
struct MOOHSIAMacApp: App {
    var body: some Scene {
        WindowGroup {
            MacRootView()
                .frame(minWidth: 1080, minHeight: 720)
                .preferredColorScheme(.dark)
        }
        .windowStyle(.hiddenTitleBar)
    }
}

private enum MacSection: String, CaseIterable, Identifiable {
    case home = "總覽", chat = "暮霞", search = "即時搜尋", intelligence = "情報", memory = "知識索引", integrations = "聯動", tasks = "Mac 任務"
    var id: String { rawValue }
    var icon: String {
        switch self {
        case .home: return "circle.grid.2x2.fill"
        case .chat: return "sparkles"
        case .search: return "globe.asia.australia.fill"
        case .intelligence: return "wave.3.right.circle.fill"
        case .memory: return "books.vertical.fill"
        case .integrations: return "point.3.connected.trianglepath.dotted"
        case .tasks: return "macbook.and.iphone"
        }
    }
}

struct MacRootView: View {
    @StateObject private var store = MOOHSIAStore()
    @StateObject private var voice = MacVoiceService()
    @State private var selection: MacSection? = .home
    @State private var input = ""
    @State private var searchQuery = ""
    @State private var knowledgeQuery = ""
    @State private var showSettings = false
    @State private var showAddKnowledge = false
    @AppStorage("MOOHSIA.speakReplies") private var speakReplies = true

    var body: some View {
        ZStack {
            MOOHSIABackground()
            NavigationSplitView {
                sidebar
            } detail: {
                switch selection ?? .home {
                case .home: homeView
                case .chat: chatView
                case .search: searchView
                case .intelligence: intelligenceView
                case .memory: memoryView
                case .integrations: integrationsView
                case .tasks: tasksView
                }
            }
            .navigationSplitViewStyle(.balanced)
        }
        .task {
            await store.load()
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60_000_000_000)
                if store.connection.isOnline, !store.token.isEmpty { await store.refreshAll() }
            }
        }
        .sheet(isPresented: $showSettings) { settingsView }
        .sheet(isPresented: $showAddKnowledge) { addKnowledgeView }
    }

    private var sidebar: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(MColors.accent.opacity(0.18)).frame(width: 44, height: 44)
                    Image(systemName: "sparkles").font(.title2.weight(.semibold)).foregroundStyle(MColors.accent)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("暮霞").font(.headline)
                    Text("MOOHSIA").font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
            }.padding(18)

            List(MacSection.allCases, selection: $selection) { item in
                Label(item.rawValue, systemImage: item.icon).tag(item).padding(.vertical, 4)
            }
            .scrollContentBackground(.hidden)

            VStack(alignment: .leading, spacing: 7) {
                HStack {
                    Circle().fill(connectionColor).frame(width: 8, height: 8).shadow(color: connectionColor, radius: 4)
                    Text(store.connection.label).font(.caption.weight(.semibold))
                    Spacer()
                    Button { showSettings = true } label: { Image(systemName: "gearshape.fill") }.buttonStyle(.plain)
                }
                Text(store.statusMessage).font(.caption2).foregroundStyle(.secondary).lineLimit(2)
            }
            .padding(14).background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16)).padding(12)
        }
        .background(.ultraThinMaterial)
    }

    private var connectionColor: Color {
        switch store.connection {
        case .online: return .green
        case .needsAuthorization: return .orange
        case .checking: return .yellow
        case .offline: return .red
        }
    }

    private var homeView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("MOOHSIA COMMAND CENTER").font(.caption.bold()).tracking(2).foregroundStyle(MColors.accent)
                    Text("暮霞已待命。") .font(.system(size: 34, weight: .bold, design: .rounded))
                    Text("Cloud-first 個人 AI 助理 · Mac 關機時，iPhone 與雲端仍可獨立工作。") .font(.title3).foregroundStyle(.secondary)
                }

                HStack(spacing: 14) {
                    metric("長期索引", store.dashboard?.knowledgeCount ?? store.knowledge.count, "books.vertical.fill")
                    metric("情報事件", store.dashboard?.activityCount ?? store.activity.count, "wave.3.right")
                    metric("主動監控", store.dashboard?.enabledWatchlists ?? store.watchlists.filter(\.enabled).count, "eye.fill")
                    metric("待處理任務", store.dashboard?.pendingTasks ?? store.tasks.filter { $0.status == .pending }.count, "checklist")
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack { Label("主動情報", systemImage: "antenna.radiowaves.left.and.right").font(.title3.bold()); Spacer(); Button("查看全部") { selection = .intelligence }.buttonStyle(.plain) }
                        if store.activity.isEmpty { Text("Cloud 0.4 啟用後，暮霞會定期搜尋、整理、去重並存入索引。") .foregroundStyle(.secondary) }
                        ForEach(store.activity.prefix(6)) { activityRow($0) }
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("系統聯動", systemImage: "point.3.connected.trianglepath.dotted").font(.title3.bold())
                        if store.integrations.isEmpty { Text("Notion、Slack、GitHub 會在 Cloud 0.4 授權後顯示於此。") .foregroundStyle(.secondary) }
                        ForEach(store.integrations) { IntegrationRow(item: $0) { Task { await store.syncIntegrations([$0.name]) } } }
                    }
                }
            }.padding(28)
        }
    }

    private var chatView: some View {
        VStack(spacing: 0) {
            header("暮霞", "文字 · 語音 · 即時網路 · 長期記憶")
            if store.messages.isEmpty {
                VStack(spacing: 14) {
                    Spacer(); Image(systemName: "sparkles").font(.system(size: 48)).foregroundStyle(MColors.accent)
                    Text("暮霞在這裡").font(.largeTitle.bold()); Text("直接說話或輸入任何問題。") .foregroundStyle(.secondary); Spacer()
                }
            } else {
                ScrollViewReader { proxy in
                    List(store.messages) { message in
                        MessageBubble(message: message).id(message.id).listRowSeparator(.hidden).listRowBackground(Color.clear)
                    }
                    .scrollContentBackground(.hidden)
                    .onChange(of: store.messages.count) {
                        if let id = store.messages.last?.id { withAnimation { proxy.scrollTo(id, anchor: .bottom) } }
                    }
                }
            }

            if !store.lastChatSources.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack { ForEach(store.lastChatSources.prefix(5)) { source in Button(source.title) { if let u = URL(string: source.url) { NSWorkspace.shared.open(u) } }.buttonStyle(.bordered) } }.padding(.horizontal)
                }.padding(.bottom, 6)
            }

            VStack(spacing: 10) {
                HStack { Toggle(isOn: $store.liveSearch) { Label("即時網路", systemImage: "globe") }.toggleStyle(.switch).controlSize(.small); Spacer(); Text(voice.status).font(.caption).foregroundStyle(voice.listening ? MColors.accent : .secondary) }
                HStack(alignment: .bottom, spacing: 10) {
                    Button { Task { await voice.toggle(); if !voice.transcript.isEmpty { input = voice.transcript } } } label: { Image(systemName: voice.listening ? "stop.circle.fill" : "mic.circle.fill").font(.title) }.buttonStyle(.plain).foregroundStyle(voice.listening ? .red : MColors.accent)
                    TextField("問暮霞任何事情…", text: $input, axis: .vertical).textFieldStyle(.roundedBorder).lineLimit(1...6)
                    Button { send() } label: { Image(systemName: store.isSending ? "hourglass" : "arrow.up.circle.fill").font(.title) }.buttonStyle(.plain).foregroundStyle(MColors.accent).disabled(store.isSending || input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }.padding(16).background(.ultraThinMaterial)
        }
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        input = ""
        Task {
            let before = store.messages.count
            await store.send(text)
            if speakReplies, store.messages.count > before, let reply = store.messages.last, reply.role == "assistant" { voice.speak(reply.text) }
        }
    }

    private var searchView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                headerText("即時搜尋", "搜尋結果會由暮霞整理、保留來源，並自動寫入長期索引。")
                GlassCard {
                    VStack(spacing: 12) {
                        HStack { TextField("要查什麼？", text: $searchQuery).textFieldStyle(.roundedBorder).onSubmit { Task { await store.searchWeb(searchQuery) } }; Button("AI 搜尋") { Task { await store.searchWeb(searchQuery) } }.buttonStyle(.borderedProminent).tint(MColors.accent) }
                        HStack { directSearch("Google", "https://www.google.com/search?q="); directSearch("Brave", "https://search.brave.com/search?q="); directSearch("Bing", "https://www.bing.com/search?q="); directSearch("Yahoo", "https://search.yahoo.com/search?p="); Spacer() }
                    }
                }
                if store.isSearching { ProgressView("暮霞正在搜尋與整理…") }
                ForEach(store.searchResults) { result in
                    GlassCard { VStack(alignment: .leading, spacing: 7) { HStack { Text(result.title).font(.headline); Spacer(); Text(result.provider).font(.caption).foregroundStyle(.secondary) }; Text(result.snippet).foregroundStyle(.secondary); Button(result.url) { if let u = URL(string: result.url) { NSWorkspace.shared.open(u) } }.buttonStyle(.link) } }
                }
            }.padding(28)
        }
    }

    private func directSearch(_ name: String, _ base: String) -> some View {
        Button(name) { let q = searchQuery.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""; if let url = URL(string: base + q) { NSWorkspace.shared.open(url) } }.buttonStyle(.bordered).disabled(searchQuery.isEmpty)
    }

    private var intelligenceView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                headerText("主動情報", "Cloud 排程在 Mac 關機時也能繼續；有變化才寫入事件與索引。")
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("監控器").font(.title3.bold())
                        if store.watchlists.isEmpty { Text("Cloud 0.4 預設會建立全球、台灣、資安三個監控器。") .foregroundStyle(.secondary) }
                        ForEach(store.watchlists) { item in HStack { Image(systemName: item.enabled ? "eye.fill" : "eye.slash").foregroundStyle(item.enabled ? MColors.accent : .secondary); VStack(alignment: .leading) { Text(item.name).fontWeight(.semibold); Text(item.query).font(.caption).foregroundStyle(.secondary) }; Spacer(); Text("每 \(item.intervalMinutes) 分鐘").font(.caption).foregroundStyle(.secondary) } }
                    }
                }
                ForEach(store.activity) { activityRow($0) }
            }.padding(28)
        }
    }

    private func activityRow(_ event: ActivityEvent) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Circle().fill(event.severity == "high" ? Color.red : event.severity == "medium" ? Color.orange : MColors.accent).frame(width: 9, height: 9).padding(.top, 6)
            VStack(alignment: .leading, spacing: 4) { Text(event.title).fontWeight(.semibold); Text(event.detail).font(.callout).foregroundStyle(.secondary).lineLimit(4); Text(event.createdAt.formatted()).font(.caption2).foregroundStyle(.tertiary) }
            Spacer()
            if let s = event.sourceURL, let u = URL(string: s) { Button { NSWorkspace.shared.open(u) } label: { Image(systemName: "arrow.up.right.square") }.buttonStyle(.plain) }
        }
    }

    private var memoryView: some View {
        VStack(spacing: 0) {
            header("知識索引", "網路、Notion、Slack、GitHub 與手動資料共用同一套記憶")
            HStack { TextField("搜尋暮霞索引…", text: $knowledgeQuery).textFieldStyle(.roundedBorder).onSubmit { Task { await store.searchKnowledge(knowledgeQuery) } }; Button("搜尋") { Task { await store.searchKnowledge(knowledgeQuery) } }; Button { showAddKnowledge = true } label: { Label("加入", systemImage: "plus") }.buttonStyle(.borderedProminent).tint(MColors.accent) }.padding()
            if store.knowledge.isEmpty { Spacer(); Text("尚無索引資料").font(.title2.bold()); Text("同步外部系統或進行 AI 搜尋後，資料會出現在這裡。") .foregroundStyle(.secondary); Spacer() }
            else { List(store.knowledge) { item in VStack(alignment: .leading, spacing: 5) { HStack { Text(item.title).font(.headline); Spacer(); Text(item.category).font(.caption).foregroundStyle(.secondary) }; Text(item.body).lineLimit(4).foregroundStyle(.secondary); HStack { Text(item.sourceType.uppercased()).font(.caption2).foregroundStyle(MColors.accent); if let u = item.sourceURL { Text(u).font(.caption2).foregroundStyle(.tertiary).lineLimit(1) } } }.padding(.vertical, 5).listRowBackground(Color.clear) }.scrollContentBackground(.hidden) }
        }
    }

    private var integrationsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                headerText("系統聯動", "授權只存於 Cloudflare Secret；暮霞把同步資料標準化後寫入自己的索引。")
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack { Text("Notion · Slack · GitHub").font(.title3.bold()); Spacer(); Button(store.isSyncing ? "同步中…" : "全部同步") { Task { await store.syncIntegrations() } }.buttonStyle(.borderedProminent).tint(MColors.accent).disabled(store.isSyncing) }
                        ForEach(store.integrations) { IntegrationRow(item: $0) { Task { await store.syncIntegrations([$0.name]) } } }
                        if store.integrations.isEmpty { Text("Cloud 0.4 部署後，GitHub 可先以公開資料同步；Notion/Slack 需你在本機安全授權 Token。") .foregroundStyle(.secondary) }
                    }
                }
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("iCloud").font(.title3.bold()); Text("免費 Personal Team 先採 MOOHSIA Cloud 即時同步；這裡提供 iCloud Drive 備份匯出。加入 Apple Developer Program 後再啟用 CloudKit 鏡像。") .foregroundStyle(.secondary); Button("匯出到 iCloud Drive…") { exportBackup() }.buttonStyle(.bordered)
                    }
                }
            }.padding(28)
        }
    }

    private var tasksView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                headerText("Mac 安全任務", "iPhone 可把工作排到雲端；真正操作 Mac 前仍需你在此核准。")
                HStack { Button("重新載入") { Task { await store.refreshTasks() } }; Button("測試：開啟 Pages") { Task { await store.enqueueRemote(action: "openPages") } }; Button("測試：開啟備忘錄") { Task { await store.enqueueRemote(action: "openNotes") } } }
                ForEach(store.tasks) { task in
                    GlassCard { HStack { VStack(alignment: .leading, spacing: 5) { Text(taskTitle(task.action)).font(.headline); Text(task.payload).font(.caption).foregroundStyle(.secondary); Text(task.status.rawValue).font(.caption2).foregroundStyle(.secondary) }; Spacer(); if task.status == .pending { Button("拒絕") { Task { await store.updateTask(task.id, status: .rejected, result: "使用者拒絕") } }; Button("核准並執行") { Task { await approveAndRun(task) } }.buttonStyle(.borderedProminent).tint(MColors.accent) } } }
                }
            }.padding(28)
        }
    }

    private func approveAndRun(_ task: RemoteCommand) async {
        await store.updateTask(task.id, status: .approved, result: "已核准，準備執行")
        switch await MacTaskExecutor.execute(task) {
        case let .success(message): await store.updateTask(task.id, status: .completed, result: message); store.statusMessage = message
        case let .failure(error): await store.updateTask(task.id, status: .failed, result: error.localizedDescription); store.statusMessage = "任務失敗：\(error.localizedDescription)"
        }
    }

    private func taskTitle(_ action: String) -> String { action == "openPages" ? "開啟 Pages" : action == "openNotes" ? "開啟備忘錄" : action == "openURL" ? "開啟網址" : action }

    private var settingsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack { Text("暮霞設定").font(.title2.bold()); Spacer(); Button { showSettings = false } label: { Image(systemName: "xmark.circle.fill") }.buttonStyle(.plain) }
            SecureField("MOOHSIA Cloud Token", text: $store.token).textFieldStyle(.roundedBorder)
            Text("Token 只存於 Keychain；Mac 若找到桌面 MOOHSIA-Cloud-Token.txt，也可自動匯入。") .font(.caption).foregroundStyle(.secondary)
            Toggle("回答後朗讀", isOn: $speakReplies)
            HStack { Spacer(); Button("儲存並重新連線") { store.saveToken(); showSettings = false }.buttonStyle(.borderedProminent).tint(MColors.accent) }
        }.padding(24).frame(width: 520)
    }

    private var addKnowledgeView: some View { MacAddKnowledgeView { title, content, category, sourceURL in Task { await store.addKnowledge(title: title, body: content, category: category, sourceURL: sourceURL); showAddKnowledge = false } } }

    private func exportBackup() {
        guard let source = store.makeBackupFile() else { return }
        let panel = NSSavePanel(); panel.nameFieldStringValue = source.lastPathComponent; panel.allowedContentTypes = [.json]; panel.canCreateDirectories = true
        if panel.runModal() == .OK, let destination = panel.url {
            do { if FileManager.default.fileExists(atPath: destination.path) { try FileManager.default.removeItem(at: destination) }; try FileManager.default.copyItem(at: source, to: destination); store.statusMessage = "備份已匯出，可選 iCloud Drive 保存" }
            catch { store.statusMessage = "匯出失敗：\(error.localizedDescription)" }
        }
    }

    private func header(_ title: String, _ subtitle: String) -> some View { HStack { headerText(title, subtitle); Spacer(); Button { Task { await store.refreshAll() } } label: { Image(systemName: "arrow.clockwise") }.buttonStyle(.plain); Button { showSettings = true } label: { Image(systemName: "gearshape.fill") }.buttonStyle(.plain) }.padding(18).background(.ultraThinMaterial) }
    private func headerText(_ title: String, _ subtitle: String) -> some View { VStack(alignment: .leading, spacing: 3) { Text(title).font(.title.bold()); Text(subtitle).font(.callout).foregroundStyle(.secondary) } }
    private func metric(_ title: String, _ value: Int, _ icon: String) -> some View { GlassCard { VStack(alignment: .leading, spacing: 10) { Image(systemName: icon).font(.title2).foregroundStyle(MColors.accent); Text("\(value)").font(.system(size: 28, weight: .bold, design: .rounded)); Text(title).font(.caption).foregroundStyle(.secondary) }.frame(maxWidth: .infinity, alignment: .leading) } }
}

private struct MessageBubble: View {
    let message: CloudMessage
    var body: some View { HStack { if message.role == "user" { Spacer(minLength: 120) }; VStack(alignment: .leading, spacing: 6) { Text(message.role == "user" ? "你" : "暮霞").font(.caption.bold()).foregroundStyle(message.role == "user" ? .secondary : MColors.accent); Text(message.text).textSelection(.enabled) }.padding(13).background(message.role == "user" ? Color.white.opacity(0.08) : MColors.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 18)); if message.role != "user" { Spacer(minLength: 120) } }.padding(.vertical, 3) }
}

private struct IntegrationRow: View {
    let item: IntegrationStatus
    let sync: () -> Void
    var body: some View { HStack(spacing: 12) { Circle().fill(item.connected ? Color.green : item.configured ? Color.orange : Color.secondary).frame(width: 9, height: 9); VStack(alignment: .leading, spacing: 3) { Text(item.label).fontWeight(.semibold); Text(item.connected ? "已連線 · \(item.itemCount) 筆" : item.configured ? (item.lastError ?? "已設定，尚未同步") : "尚未授權").font(.caption).foregroundStyle(.secondary) }; Spacer(); if item.configured { Button("同步", action: sync).buttonStyle(.bordered) } }.padding(.vertical, 4) }
}

private struct GlassCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { content.padding(16).background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20)).overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.07), lineWidth: 1)) }
}

private enum MColors { static let accent = Color(red: 0.36, green: 0.82, blue: 1.0) }

private struct MOOHSIABackground: View {
    var body: some View { LinearGradient(colors: [Color(red: 0.025, green: 0.035, blue: 0.065), Color(red: 0.035, green: 0.055, blue: 0.10), .black], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea().overlay(alignment: .topTrailing) { Circle().fill(MColors.accent.opacity(0.08)).frame(width: 520, height: 520).blur(radius: 80).offset(x: 160, y: -180) } }
}

private struct MacAddKnowledgeView: View {
    @State private var title = ""
    @State private var content = ""
    @State private var category = "一般"
    @State private var sourceURL = ""
    let onSave: (String, String, String, String?) -> Void
    var body: some View { VStack(alignment: .leading, spacing: 14) { Text("加入暮霞索引").font(.title2.bold()); TextField("標題", text: $title).textFieldStyle(.roundedBorder); TextField("分類", text: $category).textFieldStyle(.roundedBorder); TextField("來源網址（可留空）", text: $sourceURL).textFieldStyle(.roundedBorder); TextEditor(text: $content).frame(height: 200).padding(6).background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 10)); HStack { Spacer(); Button("儲存") { let source = sourceURL.trimmingCharacters(in: .whitespacesAndNewlines); onSave(title.trimmingCharacters(in: .whitespacesAndNewlines), content.trimmingCharacters(in: .whitespacesAndNewlines), category.trimmingCharacters(in: .whitespacesAndNewlines), source.isEmpty ? nil : source) }.buttonStyle(.borderedProminent).tint(MColors.accent).disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) } }.padding(24).frame(width: 600).background(MOOHSIABackground()) }
}
