# htw0702.com 個人世界 — 第一版

本版沿用既有 GitHub / Cloudflare Pages 架構。尚未部署，不等於正式網站已更新。

## 已完成的程式

- 台日海岸／花火視覺，42 個三語頁面（含各語言管理介面），根目錄與未帶語系路徑導向 /tw。
- /wiki、/works、/blog、/world、/now、/contact、/games/aov、/store 與三個 /plans 頁面。
- 原文文章保留，首頁文章提供三語版本。原圖庫與社群舊網址保留為舊版頁面，尚未全面三語重製。
- 原創 AI 輔助海岸概念圖；不是已完成的動畫作品。
- Apple OIDC code flow，伺服器校驗簽章、issuer、audience、nonce、時效與唯一擁有者 sub。
- D1 工作室內容 CRUD、版本衝突防護、CSRF、私人／公開與語言篩選。
- Notion 完整快照同步：雙重公開條件，取消公開／封存後下次成功同步移除公開副本。同步失敗保持既有資料。最大 500 筆，超過需升級為分頁背景任務。
- 傳說對決 KDA、擊殺參與率與復盤提示；不是 LLM、OCR 或影片分析。
- 6 項安全與資料測試，含真實 SQLite 與加密驗證。

## 尚未完成或未啟用

- Cloudflare 生產部署、D1 建立／綁定、Apple 真實帳號登入驗證。
- Notion 長期 integration token 設定與雲端排程啟用。ChatGPT 的 Notion 連線不會自動授權網站伺服器。
- Slack 通知、Python 背景工作、Swift 原生應用、LLM 深度分析。
- 官方完整英雄／角色／模式／排位資料，以及自動取得私人戰績。尚未確認合法可用的完整 API，沒有抓取受限制來源或捏造資料。可先由使用者提供可使用的戰績與素材。
- PayPal USD、Wise USD、Bitcoin 訂單／付款／退款／庫存；店鋪目前僅準備頁，不可收款。
- 任意 Notion 區塊、附件、影片上傳與圖片 OCR；第一版僅同步 Body 文字欄位及指定戰績欄位。
- 自動翻譯；三語文章為三筆內容，需逐語言填寫及確認後公開。
- 首頁主視覺與固定導覽由原始碼維護；後台管理的是各區新增內容，尚非全站任意視覺編輯器。

## Cloudflare Pages 啟用

1. 在既有 Pages 專案先部署此分支的 Preview。不要先覆蓋 main。
2. Build command: `node scripts/build.mjs`；Build output directory: `dist`；Node 24。
3. Pages Functions 從 repository 的 functions/ 打包。根目錄是原始碼，不要直接作為新版 output，以免把伺服器檔案當靜態資產。
4. 建立 D1，執行 migrations/0001.sql，將 D1 綁定為 `DB`。Preview 與 Production 使用不同資料庫。
5. 將 htw0702.com 與 admin.htw0702.com 綁定同一 Pages 專案；不更動郵件 MX/SPF/DKIM/TXT。
6. 在 Pages 環境變數／Secrets 設定 .env.example 欄位。Apple 私鑰、Notion token 不可提交 GitHub，也不可放進前端。
7. Preview 可先只展示，未配置 Apple 時會拒絕所有管理 API。若測試登入，需為預覽的固定 HTTPS 網域另設 Apple 回呼設定，勿共用正式 cookies。
8. 驗證手機／桌機版面、Apple 真實登入、他人帳號拒絕、Notion 公開／撤回、儲存與版本衝突，再合併部署。

## Apple 設定

Apple Developer 需設定支援 Sign in with Apple 的 primary App ID、對應 Services ID、網域與 return URL：`https://admin.htw0702.com/api/auth/callback`。

APPLE_OWNER_SUB 是 Apple 對該 app/service 的使用者識別，不是 email、Apple ID 字串或 GitHub 名稱。需以受控開發流程驗證擁有者的 Apple ID token 並取得 sub，再設為 allowlist；本版不提供「第一個登入的人即管理員」開放註冊。未設定時不放行。正式啟用需 Apple Developer 帳號與網域權限，不能只靠前端按鈕完成。

Apple 文件：https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/

## Notion 設定

已建立內容資料庫： https://app.notion.com/p/a97dfbe4135148f19bea5e9d3cfb483c

資料來源 ID：`95498a7d-a777-4c54-9755-eeea21933331`。integration 僅給此資料庫 read 存取；在 Cloudflare 設 NOTION_DATA_SOURCE_ID 與 NOTION_TOKEN。

| 欄位 | 填寫方式 |
| --- | --- |
| Name | 標題 |
| Kind | blog / works / wiki / world / now / match / catalog / store / plan-animation / plan-ai / plan-metaverse |
| Locale | tw / en / jp |
| Slug | 小寫英數與連字號，同類別同語言不可重複 |
| Body | 同步到網站的純文字內文，支援換行；頁面區塊不會同步 |
| Visibility | private / public |
| Publish | 必須勾選且 Visibility 為 public 才會公開 |
| hero / mode / rank | 英雄、模式、排位文字 |
| result | win / loss；僅 match 必填 |
| minutes / kills / deaths / assists / teamKills | 數字，未知可空白 |
| evidence | 證據連結與時間點，僅文字展示 |

資料必須通過驗證才會寫入。尚未填完的 Notion 記錄亦會令整批同步停止，請先補齐欄位再同步。先在 Notion 維護匯入內容，工作室內避免雙邊修改衝突。

登入後可手動同步。若啟用伺服器排程，對 `/api/notion/pull` 發送 POST，使用 `Authorization: Bearer <NOTION_SYNC_SECRET>`，金鑰至少 32 字元。網站不保存使用者的 GitHub token。尚未開啟任何定時同步。

Notion 文件：https://developers.notion.com/reference/webhooks
Cloudflare 文件：https://developers.cloudflare.com/pages/functions/bindings/

## 金流後續

PayPal 需商戶帳號、伺服器建立／擷取訂單、webhook 驗證與冪等處理，不能只放一個按鈕就認定付款成功。Wise 是否有 USD 收款功能必須以使用者實際帳號資格為準，不可視為等同 PayPal 的購物車金流。Bitcoin 需選擇自管或支付服務、逐單 invoice、匯率與確認數策略。商品、費用與帳號尚未提供，本版不啟用收款。

PayPal 文件：https://developer.paypal.com/studio/checkout/standard/integrate

## 職涯與三個人生計畫

目前以英文、Python、Git、SQL、API 與 AI 應用作品為主。Blender 不應成為開始這條路的前置門檻；Swift 與 3D 可待需要時再學。這個網站是練習與作品平台，不代表保證兩年後特定薪资。動畫先做一分鐘短片；AI 先做可靠的小工具；元宇宙先做一個可行走場景。

## 驗證範圍

`node scripts/build.mjs`；`node --test tests/security.test.mjs`。
測試使用 Node 24 SQLite adapter 模擬 D1 API；不是 Cloudflare 生產整合測試。Apple 以測試 RSA 金鑰驗證伺服器邏輯，尚未跑真實帳號回呼。未執行瀏覽器視覺 QA，版面仍需真機確認。
