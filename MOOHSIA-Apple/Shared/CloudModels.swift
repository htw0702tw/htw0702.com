import Foundation

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

struct RemoteCommand: Identifiable, Codable, Hashable {
    enum Status: String, Codable { case pending, approved, rejected, completed, failed }
    let id: UUID
    let action: String
    let payload: String
    let createdAt: Date
    var status: Status
    var result: String?
}
