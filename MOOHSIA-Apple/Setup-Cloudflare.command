#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/Cloudflare"
echo "MOOHSIA Cloud 0.2.0 部署"
echo "這個流程會開啟 Cloudflare 官方登入授權，不會要求你把密碼貼給 ChatGPT。"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "缺少 Node.js/npm。請先安裝 Node.js LTS，再重新執行。"
  open "https://nodejs.org/" || true
  read -r -p "按 Enter 結束…"
  exit 1
fi
npm install
npx wrangler login
DB_JSON=$(npx wrangler d1 create moohsia-db 2>&1 | tee /tmp/moohsia-d1.txt)
DB_ID=$(printf '%s\n' "$DB_JSON" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | tail -1)
if [ -z "$DB_ID" ]; then
  echo "未能自動取得 D1 database_id。請保留 /tmp/moohsia-d1.txt。"
  exit 1
fi
sed "s/REPLACE_WITH_D1_DATABASE_ID/$DB_ID/" wrangler.toml.example > wrangler.toml
npx wrangler d1 execute moohsia-db --remote --file=./migrations/0001.sql
TOKEN=$(openssl rand -hex 32)
printf '%s' "$TOKEN" | npx wrangler secret put MOOHSIA_TOKEN
npx wrangler deploy
printf '\nMOOHSIA_TOKEN=%s\n' "$TOKEN" > "$HOME/Desktop/MOOHSIA-Cloud-Token.txt"
chmod 600 "$HOME/Desktop/MOOHSIA-Cloud-Token.txt"
echo "部署完成。Token 已只寫到桌面 MOOHSIA-Cloud-Token.txt；不要上傳 GitHub/Slack/Notion。"
echo "下一步：在 Cloudflare Dashboard 將 api.moohsia.com 綁到 moohsia-cloud Worker。"
read -r -p "按 Enter 結束…"
