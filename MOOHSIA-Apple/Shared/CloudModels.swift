import Foundation

struct CloudHealth: Codable, Hashable {
    let ok: Bool
    let service: String
    let version: String
    let capabilities: [String]
}

struct CloudMessage: Identifiable, Codable, Hashable {
    let id: UUID
    let role: String
    let text: String
    let createdAt: Date
}

struct KnowledgeItem: Identifiable, Codable, Hashable {
    let id: UUID
    let title: String
    let body: String
    let category: String
    let sourceURL: String?
    let sourceType: String
    let createdAt: Date
    let updatedAt: Date
}

struct SearchResultItem: Identifiable, Codable, Hashable {
    let id: UUID
    let title: String
    let url: String
    let snippet: String
    let provider: String
    let publishedAt: Date?
}

struct ChatReply: Codable, Hashable {
    let text: String
    let provider: String?
    let model: String?
    let usedLiveSearch: Bool?
    let sources: [SearchResultItem]?
}

struct ActivityEvent: Identifiable, Codable, Hashable {
    let id: UUID
    let kind: String
    let title: String
    let detail: String
    let sourceURL: String?
    let severity: String
    let createdAt: Date
}

struct IntegrationStatus: Identifiable, Codable, Hashable {
    var id: String { name }
    let name: String
    let label: String
    let configured: Bool
    let connected: Bool
    let lastSyncAt: Date?
    let lastError: String?
    let itemCount: Int
}

struct Watchlist: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let query: String
    let category: String
    let enabled: Bool
    let intervalMinutes: Int
    let lastRunAt: Date?
    let createdAt: Date
}

struct DashboardSnapshot: Codable, Hashable {
    let knowledgeCount: Int
    let activityCount: Int
    let pendingTasks: Int
    let enabledWatchlists: Int
    let lastActivityAt: Date?
}

struct RemoteCommand: Identifiable, Codable, Hashable {
    enum Status: String, Codable { case pending, approved, rejected, completed, failed }
    let id: UUID
    let action: String
    let payload: String
    let createdAt: Date
    var status: Status
    var result: String?
}

struct BackupPayload: Codable {
    let exportedAt: Date
    let messages: [CloudMessage]
    let knowledge: [KnowledgeItem]
    let activity: [ActivityEvent]
}
