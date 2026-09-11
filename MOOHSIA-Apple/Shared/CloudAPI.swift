import Foundation

struct CloudConfig {
    static let defaultBaseURL = URL(string: "https://api.moohsia.com")!
}

enum CloudAPIError: LocalizedError {
    case invalidResponse, http(Int, String)
    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "MOOHSIA Cloud 回應格式不正確。"
        case let .http(code, text): return "MOOHSIA Cloud HTTP \(code)：\(text)"
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
        var r = URLRequest(url: url)
        r.httpMethod = method
        r.timeoutInterval = 40
        r.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token, !token.isEmpty {
            r.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            r.httpBody = body
            r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await URLSession.shared.data(for: r)
        guard let http = response as? HTTPURLResponse else { throw CloudAPIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            throw CloudAPIError.http(http.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
        return data
    }

    func health() async throws -> Bool {
        let data = try await request(path: "/health")
        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return obj?["ok"] as? Bool == true
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

    func chat(_ prompt: String) async throws -> String {
        let body = try JSONSerialization.data(withJSONObject: ["prompt": prompt])
        let data = try await request(path: "/v1/chat", method: "POST", body: body)
        guard
            let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let text = obj["text"] as? String
        else { throw CloudAPIError.invalidResponse }
        return text
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

    func enqueueRemote(action: String, payload: String) async throws -> RemoteCommand {
        let data = try JSONSerialization.data(withJSONObject: ["action": action, "payload": payload])
        let out = try await request(path: "/v1/tasks", method: "POST", body: data)
        return try JSONDecoder.moohsia.decode(RemoteCommand.self, from: out)
    }

    func listRemoteTasks() async throws -> [RemoteCommand] {
        let data = try await request(path: "/v1/tasks")
        return try JSONDecoder.moohsia.decode([RemoteCommand].self, from: data)
    }
}

extension JSONDecoder {
    static var moohsia: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }
}

extension JSONEncoder {
    static var moohsia: JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }
}
