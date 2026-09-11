#!/bin/zsh
set -e
cd "$(dirname "$0")/Cloudflare"

echo "MOOHSIA Cloud 0.3.0 升級"
echo "1/4 確認 Cloudflare 登入"
npx wrangler whoami >/dev/null

DB_ID="$(npx wrangler d1 list --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);const x=a.find(v=>v.name==="moohsia-db");if(!x)process.exit(2);console.log(x.uuid||x.id)})')"

cat > wrangler.toml <<EOF
name = "moohsia-cloud"
main = "src/index.js"
compatibility_date = "2026-09-11"
workers_dev = true
preview_urls = false

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "moohsia-db"
database_id = "$DB_ID"

[vars]
AI_MODEL = "@cf/zai-org/glm-4.7-flash"
EOF

echo "2/4 建立知識索引與任務佇列表"
npx wrangler d1 execute moohsia-db --remote --file migrations/0002.sql

echo "3/4 部署 Worker"
npx wrangler deploy

echo "4/4 驗證"
curl -fsS https://api.moohsia.com/health
echo ""
echo "✅ MOOHSIA Cloud 0.3.0 升級完成"
echo "既有 MOOHSIA_TOKEN 不會被變更。"
echo "按 Enter 結束…"
read
