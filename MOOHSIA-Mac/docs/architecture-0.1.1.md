# 暮霞 MOOHSIA 0.1.1 架構

## 同步分工

- **iCloud Drive**：對話記錄與跨 Mac 同步。App 開啟、Mac 未睡眠時每 60 秒交換。
- **GitHub**：只保存程式碼、文件與版本，不保存對話、API Key、Slack/Notion token 或私人 iCloud 資料。
- **Notion / Slack**：專案文件與狀態中樞。獨立 MOOHSIA App 的即時雙向同步仍需各服務自己的 integration/app 憑證，且必須保存於 Keychain。

## AI Router

1. 預設：Ollama `localhost:11434`，完全本機，不需 OpenAI API 額度。
2. 模型自動挑選：`qwen3:8b` → `gemma3:4b` → `llama3.2:3b` → `qwen2.5:3b` → 其他已安裝模型。
3. OpenAI API 僅保留為選配 fallback，外傳前逐次確認。
4. Gemini / Claude / Grok 使用同一 Provider 介面加入；各家雲端 API 是否免費取決於供應商方案，不能保證 24/7 零費用。

## 搜尋與安全

- 只提供 Google / Brave / Bing / Yahoo 搜尋入口。Firefox 是瀏覽器，不是搜尋引擎。
- 搜尋結果顯示於 MOOHSIA 自己的 WKWebView 視窗。
- 0.1.1 封鎖 WKWebView 下載，不會自動執行任何下載檔。
- 在 VirusTotal 驗證層完成前，下載執行功能維持關閉；不把「尚未掃描」標示為安全。

## 電腦控制

- App 啟動、Pages 建立新草稿等都必須逐次顯示完整動作與內容並由使用者同意。
- Pages 動作只建立新文件，不覆寫既有文件。
- 未授權動作預設拒絕。

## 24/7 的真實限制

MOOHSIA 只有在 Mac mini 開機、未睡眠、服務正在執行且網路／本機模型可用時才可 24/7 提供服務。iCloud 實際上傳時點由 Apple 管理；GitHub 不用來同步即時個人資料。
