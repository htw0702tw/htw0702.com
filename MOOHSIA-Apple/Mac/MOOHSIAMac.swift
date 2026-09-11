import SwiftUI

@main
struct MOOHSIAMacApp: App {
    var body: some Scene {
        WindowGroup {
            MacContentView()
                .frame(minWidth: 760, minHeight: 560)
        }
    }
}

@MainActor
final class MacConversationStore: ObservableObject {
    @Published var messages: [CloudMessage] = []
    @Published var status = "連線 MOOHSIA Cloud…"
    @Published var token = TokenStore.load() ?? ""
    private var api: CloudAPI { CloudAPI(token: token.isEmpty ? nil : token) }

    func load() async {
        do {
            guard try await api.health() else { throw CloudAPIError.invalidResponse }
            messages = try await api.listMessages()
            status = "MOOHSIA Cloud 已同步"
        } catch {
            status = "雲端尚未就緒：\(error.localizedDescription)"
        }
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
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

    func saveToken() {
        if TokenStore.save(token) { status = "Cloud Token 已安全存入 Keychain" }
        else { status = "Cloud Token 儲存失敗" }
    }
}

struct MacContentView: View {
    @StateObject private var store = MacConversationStore()
    @State private var input = ""
    @State private var showingSettings = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(store.status).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("設定") { showingSettings = true }
            }
            .padding()

            List(store.messages) { message in
                VStack(alignment: .leading, spacing: 5) {
                    Text(message.role == "user" ? "你" : "暮霞").font(.caption).foregroundStyle(.secondary)
                    Text(message.text).textSelection(.enabled)
                }
                .padding(.vertical, 4)
            }

            HStack {
                TextField("問暮霞…", text: $input, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                Button("送出") {
                    let text = input
                    input = ""
                    Task { await store.send(text) }
                }
                .keyboardShortcut(.return, modifiers: [.command])
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
        .navigationTitle("暮霞 MOOHSIA")
        .task { await store.load() }
        .sheet(isPresented: $showingSettings) {
            VStack(alignment: .leading, spacing: 14) {
                Text("MOOHSIA Cloud Token").font(.headline)
                SecureField("貼上 Cloud Token", text: $store.token)
                    .textFieldStyle(.roundedBorder)
                HStack {
                    Spacer()
                    Button("儲存到 Keychain") { store.saveToken(); showingSettings = false }
                }
            }
            .padding(24)
            .frame(width: 460)
        }
    }
}
