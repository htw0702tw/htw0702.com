import { addActivity, braveSearch, getSearchUsage, indexSearchResults, iso, nowISO, upsertKnowledge } from "./core.js";

async function setState(env, name, { connected = false, error = null, itemCount = 0 } = {}) {
  const syncedAt = connected ? nowISO() : null;
  await env.DB.prepare(`INSERT INTO integration_state(name,last_sync_at,last_error,item_count) VALUES(?,?,?,?) ON CONFLICT(name) DO UPDATE SET last_sync_at=COALESCE(excluded.last_sync_at,integration_state.last_sync_at),last_error=excluded.last_error,item_count=excluded.item_count`).bind(name, syncedAt, error, itemCount).run();
}

export async function getIntegrationRows(env) {
  const r = await env.DB.prepare("SELECT name,last_sync_at,last_error,item_count FROM integration_state").all();
  const map = new Map((r.results || []).map((x) => [x.name, x]));
  const configs = [
    ["notion", "Notion", Boolean(env.NOTION_TOKEN)],
    ["slack", "Slack", Boolean(env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_IDS)],
    ["github", "GitHub", true],
    ["brave", "Brave Search", Boolean(env.BRAVE_SEARCH_API_KEY)],
  ];
  return configs.map(([name, label, configured]) => { const state = map.get(name); return { name, label, configured, connected: configured && Boolean(state?.last_sync_at) && !state?.last_error, lastSyncAt: state?.last_sync_at ? iso(state.last_sync_at) : null, lastError: state?.last_error || null, itemCount: Number(state?.item_count || 0) }; });
}

function notionTitle(page) {
  for (const value of Object.values(page?.properties || {})) {
    if (value?.type === "title" && Array.isArray(value.title)) { const title = value.title.map((x) => x.plain_text || "").join("").trim(); if (title) return title; }
  }
  return page?.url || "Notion Page";
}
function blockText(block) { const value = block?.[block.type]; if (!value) return ""; if (Array.isArray(value.rich_text)) return value.rich_text.map((x) => x?.plain_text || x?.text?.content || "").join(""); return typeof value.title === "string" ? value.title : ""; }

async function syncNotion(env) {
  if (!env.NOTION_TOKEN) return;
  try {
    const response = await fetch("https://api.notion.com/v1/search", { method: "POST", headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2026-03-11", "Content-Type": "application/json" }, body: JSON.stringify({ page_size: 50, sort: { direction: "descending", timestamp: "last_edited_time" } }) });
    if (!response.ok) throw new Error(`Notion HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const data = await response.json();
    const pages = (data.results || []).filter((x) => x.object === "page");
    let count = 0;
    for (const page of pages) {
      let body = "";
      const blocks = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`, { headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2026-03-11" } });
      if (blocks.ok) { const payload = await blocks.json(); body = (payload.results || []).map(blockText).filter(Boolean).join("\n").slice(0, 18000); }
      const title = notionTitle(page);
      await upsertKnowledge(env, { title, body: body || `Notion 頁面：${title}`, category: "Notion", sourceURL: page.url || `notion://page/${page.id}`, sourceType: "notion" }); count += 1;
    }
    await setState(env, "notion", { connected: true, itemCount: count });
    await addActivity(env, { kind: "sync", title: "Notion 同步完成", detail: `已同步 ${count} 個可存取頁面到暮霞索引。` });
  } catch (error) { await setState(env, "notion", { error: error.message }); throw error; }
}

async function slackAPI(env, method, params = {}) {
  const body = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.set(k, String(v));
  const response = await fetch(`https://slack.com/api/${method}`, { method: "POST", headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json(); if (!data.ok) throw new Error(`Slack ${method}: ${data.error || "unknown_error"}`); return data;
}

async function syncSlack(env) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_IDS) return;
  try {
    let count = 0;
    for (const channel of String(env.SLACK_CHANNEL_IDS).split(",").map((x) => x.trim()).filter(Boolean)) {
      const history = await slackAPI(env, "conversations.history", { channel, limit: 100 });
      for (const message of history.messages || []) {
        const text = String(message.text || "").trim(); if (!text) continue;
        const when = new Date(Number(message.ts) * 1000).toISOString();
        await upsertKnowledge(env, { title: `Slack · ${channel} · ${when}`, body: text.slice(0, 12000), category: "Slack", sourceURL: `slack://channel/${channel}/${message.ts}`, sourceType: "slack" }); count += 1;
      }
    }
    await setState(env, "slack", { connected: true, itemCount: count });
    await addActivity(env, { kind: "sync", title: "Slack 同步完成", detail: `已同步 ${count} 則訊息到暮霞索引。` });
  } catch (error) { await setState(env, "slack", { error: error.message }); throw error; }
}

async function githubFetch(env, path) {
  const repo = env.GITHUB_REPO || "htw0702tw/htw0702.com";
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "MOOHSIA-Cloud", "X-GitHub-Api-Version": "2022-11-28" };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function syncGitHub(env) {
  try {
    const repo = env.GITHUB_REPO || "htw0702tw/htw0702.com";
    const [commits, issues] = await Promise.all([githubFetch(env, "/commits?per_page=20"), githubFetch(env, "/issues?state=all&per_page=20&sort=updated&direction=desc")]);
    let count = 0;
    for (const item of commits || []) { const message = item?.commit?.message || "GitHub commit"; await upsertKnowledge(env, { title: `GitHub Commit · ${message.split("\n")[0]}`, body: [message, item?.commit?.author?.name ? `作者：${item.commit.author.name}` : "", item?.commit?.author?.date ? `時間：${item.commit.author.date}` : ""].filter(Boolean).join("\n"), category: "GitHub", sourceURL: item.html_url, sourceType: "github" }); count += 1; }
    for (const item of issues || []) { await upsertKnowledge(env, { title: `GitHub #${item.number} · ${item.title}`, body: String(item.body || item.title || "").slice(0, 16000), category: "GitHub", sourceURL: item.html_url, sourceType: "github" }); count += 1; }
    await setState(env, "github", { connected: true, itemCount: count });
    await addActivity(env, { kind: "sync", title: "GitHub 同步完成", detail: `${repo}：已同步 ${count} 筆 Commit / Issue。` });
  } catch (error) { await setState(env, "github", { error: error.message }); throw error; }
}

export async function syncNamedIntegrations(env, names = []) {
  const requested = names.length ? new Set(names) : new Set(["notion", "slack", "github"]);
  const jobs = [];
  if (requested.has("notion") && env.NOTION_TOKEN) jobs.push(syncNotion);
  if (requested.has("slack") && env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_IDS) jobs.push(syncSlack);
  if (requested.has("github")) jobs.push(syncGitHub);
  for (const job of jobs) { try { await job(env); } catch (error) { console.error("MOOHSIA integration sync failed", error); } }
  return getIntegrationRows(env);
}

async function integrationDue(env, name, hours = 3) {
  const row = await env.DB.prepare("SELECT last_sync_at FROM integration_state WHERE name=?").bind(name).first();
  return !row?.last_sync_at || Date.now() - new Date(row.last_sync_at).getTime() >= hours * 3600 * 1000;
}

async function notifySlack(env, title, results) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_REPORT_CHANNEL_ID || !results.length) return;
  try { await slackAPI(env, "chat.postMessage", { channel: env.SLACK_REPORT_CHANNEL_ID, text: `*暮霞 MOOHSIA｜${title}*\n${results.slice(0, 5).map((r) => `• ${r.title}\n${r.url}`).join("\n")}`, unfurl_links: false, unfurl_media: false }); } catch (error) { console.error("Slack notification failed", error); }
}

async function runDueWatchlist(env) {
  const row = await env.DB.prepare(`SELECT id,name,query,category,enabled,interval_minutes,last_run_at,created_at FROM watchlists WHERE enabled=1 AND (last_run_at IS NULL OR datetime(last_run_at, '+' || interval_minutes || ' minutes') <= datetime('now')) ORDER BY COALESCE(last_run_at,'1970-01-01T00:00:00Z') ASC LIMIT 1`).first();
  if (!row) return;
  try {
    const results = await braveSearch(row.query, env, { freshness: "pd", count: 10 });
    const inserted = await indexSearchResults(env, results, row.category);
    await env.DB.prepare("UPDATE watchlists SET last_run_at=? WHERE id=?").bind(nowISO(), row.id).run();
    await setState(env, "brave", { connected: true, itemCount: await getSearchUsage(env) });
    if (inserted > 0) { await addActivity(env, { kind: "watchlist", title: `${row.name}：發現 ${inserted} 筆新資料`, detail: results.slice(0, 4).map((x) => x.title).join("｜"), severity: row.category === "資安" ? "high" : "info" }); await notifySlack(env, `${row.name} 新情報`, results); }
  } catch (error) { await env.DB.prepare("UPDATE watchlists SET last_run_at=? WHERE id=?").bind(nowISO(), row.id).run(); await setState(env, "brave", { error: error.message, itemCount: await getSearchUsage(env) }); console.error("MOOHSIA watchlist failed", error); }
}

export async function scheduledSync(env) {
  await runDueWatchlist(env);
  const names = [];
  if (env.NOTION_TOKEN && await integrationDue(env, "notion")) names.push("notion");
  if (env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_IDS && await integrationDue(env, "slack")) names.push("slack");
  if (await integrationDue(env, "github")) names.push("github");
  if (names.length) await syncNamedIntegrations(env, names);
}
