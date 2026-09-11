import Foundation

struct CloudMessage: Identifiable, Codable, Hashable {
    let id: UUID
    let role: String
    let text: String
    let createdAt: Date
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
