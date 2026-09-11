#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")/Cloudflare"

echo "暮霞 MOOHSIA Cloud 0.4.0 升級"
echo "--------------------------------"
echo "不更換 MOOHSIA_TOKEN，也不刪除既有聊天或索引。"
echo
npx wrangler whoami

echo
echo "1/5 套用 D1 資料表升級…"
npx wrangler d1 execute moohsia-db --remote --file migrations/0002.sql
npx wrangler d1 execute moohsia-db --remote --file migrations/0003.sql

put_secret_if_entered() {
  local name="$1"; local label="$2"; local value=""
  echo
  read -r -s -p "$label（直接 Enter 可略過並保留既有設定）: " value
  echo
  if [[ -n "$value" ]]; then
    printf '%s' "$value" | npx wrangler secret put "$name"
    echo "✓ $name 已安全寫入 Cloudflare Secret"
  else
    echo "－略過 $name"
  fi
}

echo
echo "2/5 外部系統授權（密鑰只從你的 Terminal 送到 Cloudflare，不會寫入 GitHub）"
put_secret_if_entered "BRAVE_SEARCH_API_KEY" "Brave Search API Key"
put_secret_if_entered "NOTION_TOKEN" "Notion Internal Integration Token"
put_secret_if_entered "SLACK_BOT_TOKEN" "Slack Bot OAuth Token"
put_secret_if_entered "SLACK_CHANNEL_IDS" "Slack 要同步的 Channel ID，可用逗號分隔"
put_secret_if_entered "SLACK_REPORT_CHANNEL_ID" "Slack 主動情報通知 Channel ID"
put_secret_if_entered "GITHUB_TOKEN" "GitHub Token（公開 repo 可留空）"

echo
echo "3/5 部署 Worker 0.4.0 + 每小時 Cron…"
npx wrangler deploy

echo
echo "4/5 檢查 api.moohsia.com…"
curl -fsS "https://api.moohsia.com/health"
echo

echo
echo "5/5 完成"
echo "請確認 health 顯示 version 0.4.0。"
echo "若 Brave / Notion / Slack 尚未授權，App 仍可正常聊天；聯動中心會標示待授權。"
echo "Brave 自動搜尋預設每月安全上限 900 次，避免意外付費。"
