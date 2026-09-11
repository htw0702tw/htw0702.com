import SwiftUI

struct ContentView: View {
    @StateObject private var store = ConversationStore()
    @StateObject private var voice = VoiceService()
    @State private var input = ""
    @State private var showSearch = false
    @State private var searchURL = URL(string: "https://www.google.com")!

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Text(store.statusText).font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Button("Google") { openSearch("https://www.google.com/search?q=") }
                    Button("Brave") { openSearch("https://search.brave.com/search?q=") }
                }.padding(.horizontal).padding(.vertical, 8)

                List(store.messages) { msg in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(msg.role == "user" ? "你" : "暮霞").font(.caption).foregroundStyle(.secondary)
                        Text(msg.text)
                    }
                }

                HStack {
                    TextField("問暮霞…", text: $input, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                    Button(voice.listening ? "停止" : "語音") {
                        Task { await voice.toggle(); if !voice.transcript.isEmpty { input = voice.transcript } }
                    }
                    Button("送出") { send() }.disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }.padding()
            }
            .navigationTitle("暮霞 MOOHSIA")
            .toolbar {
                Menu("Mac") {
                    Button("請 Mac 開啟 Pages") { Task { await store.enqueueRemote(action: "openPages", payload: "") } }
                    Button("請 Mac 開啟備忘錄") { Task { await store.enqueueRemote(action: "openNotes", payload: "") } }
                }
            }
        }
        .task { await store.load() }
        .sheet(isPresented: $showSearch) { SearchView(url: searchURL).ignoresSafeArea() }
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        input = ""
        Task {
            await store.append(role: "user", text: text)
            await store.ask(text)
        }
    }

    private func openSearch(_ base: String) {
        let q = input.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        searchURL = URL(string: base + q)!
        showSearch = true
    }
}
