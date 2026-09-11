import Foundation

struct CloudConfig {
    static let defaultBaseURL = URL(string: "https://api.moohsia.com")!
}

enum CloudAPIError: LocalizedError {
    case invalidResponse
    case unauthorized
    case http(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "MOOHSIA Cloud 回應格式不正確。"
        case .unauthorized:
            return "MOOHSIA Cloud 已上線，但這台裝置尚未授權。"
        case let .http(code, text):
            return "MOOHSIA Cloud HTTP \(code)：\(text)"
        }
    }
}

actor CloudAPI {
    let baseURL: URL
    let token: String?

    init(baseURL: URL = CloudConfig.defaultBaseURL, token: String? = nil) {
        self.baseURL = baseURL
        self.token = token
    }

    private func request(path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL) else { throw CloudAPIError.invalidResponse }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 45
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw CloudAPIError.invalidResponse }
        if http.statusCode == 401 { throw CloudAPIError.unauthorized }
        guard (200..<300).contains(http.statusCode) else {
            throw CloudAPIError.http(http.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
        return data
    }

    func health() async throws -> CloudHealth {
        let data = try await request(path: "/health")
        return try JSONDecoder.moohsia.decode(CloudHealth.self, from: data)
    }

    func dashboard() async throws -> DashboardSnapshot {
        let data = try await request(path: "/v1/dashboard")
        return try JSONDecoder.moohsia.decode(DashboardSnapshot.self, from: data)
    }

    func listMessages() async throws -> [CloudMessage] {
        let data = try await request(path: "/v1/messages")
        return try JSONDecoder.moohsia.decode([CloudMessage].self, from: data)
    }

    func append(role: String, text: String) async throws -> CloudMessage {
        let item = CloudMessage(id: UUID(), role: role, text: text, createdAt: Date())
        let data = try JSONEncoder.moohsia.encode(item)
        let out = try await request(path: "/v1/messages", method: "POST", body: data)
        return try JSONDecoder.moohsia.decode(CloudMessage.self, from: out)
    }

    func chat(_ prompt: String, liveSearch: Bool = true) async throws -> ChatReply {
        let body = try JSONSerialization.data(withJSONObject: [
            "prompt": prompt,
            "liveSearch": liveSearch
        ])
        let data = try await request(path: "/v1/chat", method: "POST", body: body)
        return try JSONDecoder.moohsia.decode(ChatReply.self, from: data)
    }

    func webSearch(_ query: String, save: Bool = true) async throws -> [SearchResultItem] {
        let body = try JSONSerialization.data(withJSONObject: ["query": query, "save": save])
        let data = try await request(path: "/v1/search", method: "POST", body: body)
        struct Wrapper: Codable { let results: [SearchResultItem] }
        return try JSONDecoder.moohsia.decode(Wrapper.self, from: data).results
    }

    func listKnowledge(query: String = "") async throws -> [KnowledgeItem] {
        var components = URLComponents(string: "/v1/knowledge")!
        if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            components.queryItems = [URLQueryItem(name: "q", value: query)]
        }
        let data = try await request(path: components.string ?? "/v1/knowledge")
        return try JSONDecoder.moohsia.decode([KnowledgeItem].self, from: data)
    }

    func addKnowledge(title: String, body: String, category: String, sourceURL: String? = nil, sourceType: String = "manual") async throws -> KnowledgeItem {
        var payload: [String: Any] = [
            "title": title,
            "body": body,
            "category": category,
            "sourceType": sourceType
        ]
        if let sourceURL { payload["sourceURL"] = sourceURL }
        let bodyData = try JSONSerialization.data(withJSONObject: payload)
        let data = try await request(path: "/v1/knowledge", method: "POST", body: bodyData)
        return try JSONDecoder.moohsia.decode(KnowledgeItem.self, from: data)
    }

    func listActivity() async throws -> [ActivityEvent] {
        let data = try await request(path: "/v1/activity")
        return try JSONDecoder.moohsia.decode([ActivityEvent].self, from: data)
    }

    func listIntegrations() async throws -> [IntegrationStatus] {
        let data = try await request(path: "/v1/integrations")
        return try JSONDecoder.moohsia.decode([IntegrationStatus].self, from: data)
    }

    func syncIntegrations(_ names: [String] = []) async throws -> [IntegrationStatus] {
        let body = try JSONSerialization.data(withJSONObject: ["names": names])
        let data = try await request(path: "/v1/integrations/sync", method: "POST", body: body)
        return try JSONDecoder.moohsia.decode([IntegrationStatus].self, from: data)
    }

    func listWatchlists() async throws -> [Watchlist] {
        let data = try await request(path: "/v1/watchlists")
        return try JSONDecoder.moohsia.decode([Watchlist].self, from: data)
    }

    func enqueueRemote(action: String, payload: String) async throws -> RemoteCommand {
        let data = try JSONSerialization.data(withJSONObject: ["action": action, "payload": payload])
        let out = try await request(path: "/v1/tasks", method: "POST", body: data)
        return try JSONDecoder.moohsia.decode(RemoteCommand.self, from: out)
    }

    func listRemoteTasks() async throws -> [RemoteCommand] {
        let data = try await request(path: "/v1/tasks")
        return try JSONDecoder.moohsia.decode([RemoteCommand].self, from: data)
    }

    func updateRemoteTask(id: UUID, status: RemoteCommand.Status, result: String? = nil) async throws -> RemoteCommand {
        var payload: [String: Any] = ["status": status.rawValue]
        if let result { payload["result"] = result }
        let body = try JSONSerialization.data(withJSONObject: payload)
        let data = try await request(path: "/v1/tasks/\(id.uuidString)", method: "PATCH", body: body)
        return try JSONDecoder.moohsia.decode(RemoteCommand.self, from: data)
    }
}

extension JSONDecoder {
    static var moohsia: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var moohsia: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }
}
