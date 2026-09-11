import SwiftUI

@main
struct MOOHSIAApp: App {
    @StateObject private var cloudKit = CloudKitSyncService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(cloudKit)
                .task { await cloudKit.bootstrap() }
        }
    }
}
