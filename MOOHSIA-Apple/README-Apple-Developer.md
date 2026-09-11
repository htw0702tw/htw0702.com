# MOOHSIA iOS · Apple Developer Program 安裝

此版本已改為付費 Apple Developer Program 的正式開發流程。

## 專案
- Xcode project：`MOOHSIA.xcodeproj`
- Bundle ID：`com.moohsia.personal.ios`
- CloudKit container：`iCloud.com.moohsia.personal.ios`
- Signing：Automatic

## 第一次在 Xcode 開啟
1. 開啟 `MOOHSIA.xcodeproj`。
2. 左側選 `MOOHSIA` 專案，再選 `MOOHSIA-iOS` target。
3. 進入 `Signing & Capabilities`。
4. 勾選 `Automatically manage signing`。
5. `Team` 選付費 Apple Developer Program Team，不要選 Personal Team。
6. 確認 iCloud capability 包含 `CloudKit`，並選取 `iCloud.com.moohsia.personal.ios`。
7. 如果 Xcode 顯示需要建立或更新 iCloud container / App ID，允許 Xcode 自動處理。

## 安裝到自己的 iPhone
1. 用 USB 或 Xcode Device Hub 將 iPhone 與 Mac 配對。
2. 將 iPhone 選為 Run Destination。
3. 若 Xcode 顯示 `Register Device`，按下去。
4. 按 Run 安裝暮霞。

## CloudKit
App 啟動後會檢查 iCloud account，並在 private CloudKit database 建立或更新 `MOOHSIADevicePresence` 紀錄，用來驗證此裝置已成功連上暮霞的 CloudKit container。

Cloudflare MOOHSIA Cloud 仍是 24/7 AI、網路搜尋、長期情報與主要索引層；CloudKit 是 Apple 裝置同步層，不取代 Cloudflare backend。

## 安全
不要把 Apple Account 密碼、雙重驗證碼、憑證私鑰、Cloud Token 或 API Key 提交到 GitHub。
