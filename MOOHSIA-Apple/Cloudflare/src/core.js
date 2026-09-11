export const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
export const nowISO = () => new Date().toISOString();
export const iso = (value) => new Date(value).toISOString();
const monthKey = () => new Date().toISOString().slice(0, 7);

export function auth(req, env) {
  if (!env.MOOHSIA_TOKEN) return true;
  return req.headers.get("authorization") === `Bearer ${env.MOOHSIA_TOKEN}`;
}

function extractFinalText(out) {
  if (!out) return "";
  if (typeof out === "string") return out.trim();
  if (typeof out.response === "string" && out.response.trim()) return out.response.trim();
  if (typeof out.result?.response === "string" && out.result.response.trim()) return out.result.response.trim();
  const a = out.choices?.[0]?.message?.content;
  if (typeof a === "string" && a.trim()) return a.trim();
  const b = out.result?.choices?.[0]?.message?.content;
  return typeof b === "string" ? b.trim() : "";
}

export async function addActivity(env, { kind = "system", title, detail = "", sourceURL = null, severity = "info" }) {
  const id = crypto.randomUUID();
  const createdAt = nowISO();
  await env.DB.prepare(`INSERT INTO activity(id,kind,title,detail,source_url,severity,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id, kind, title, detail, sourceURL, severity, createdAt).run();
  return { id, kind, title, detail, sourceURL, severity, createdAt };
}

export async function upsertKnowledge(env, { title, body, category = "未分類", sourceURL = null, sourceType = "manual" }) {
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();
  if (!cleanTitle || !cleanBody) return { item: null, inserted: false };
  const updatedAt = nowISO();
  if (sourceURL) {
    const existing = await env.DB.prepare("SELECT id,created_at FROM knowledge WHERE source_url=? LIMIT 1").bind(sourceURL).first();
    if (existing?.id) {
      await env.DB.prepare(`UPDATE knowledge SET title=?,body=?,category=?,source_type=?,updated_at=? WHERE id=?`).bind(cleanTitle, cleanBody, category, sourceType, updatedAt, existing.id).run();
      return { inserted: false, item: { id: existing.id, title: cleanTitle, body: cleanBody, category, sourceURL, sourceType, createdAt: iso(existing.created_at), updatedAt } };
    }
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO knowledge(id,title,body,category,source_url,source_type,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`).bind(id, cleanTitle, cleanBody, category, sourceURL, sourceType, updatedAt, updatedAt).run();
  return { inserted: true, item: { id, title: cleanTitle, body: cleanBody, category, sourceURL, sourceType, createdAt: updatedAt, updatedAt } };
}

function formatKnowledge(rows) {
  return rows.map((x, i) => `[索引 ${i + 1}] ${x.title}（${x.category}）\n${String(x.body).slice(0, 1800)}${x.source_url ? `\n來源：${x.source_url}` : ""}`).join("\n\n");
}

async function knowledgeContext(prompt, env) {
  const words = String(prompt || "").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((x) => x.length >= 2).slice(0, 5);
  try {
    if (!words.length) {
      const r = await env.DB.prepare(`SELECT title,body,category,source_url FROM knowledge ORDER BY updated_at DESC LIMIT 5`).all();
      return formatKnowledge(r.results || []);
    }
    const clauses = [], binds = [];
    for (const word of words) { clauses.push("(title LIKE ? OR body LIKE ? OR category LIKE ?)"); const like = `%${word}%`; binds.push(like, like, like); }
    const r = await env.DB.prepare(`SELECT title,body,category,source_url FROM knowledge WHERE ${clauses.join(" OR ")} ORDER BY updated_at DESC LIMIT 7`).bind(...binds).all();
    return formatKnowledge(r.results || []);
  } catch { return ""; }
}

export async function getSearchUsage(env) {
  const row = await env.DB.prepare("SELECT request_count FROM search_usage WHERE month_key=?").bind(monthKey()).first();
  return Number(row?.request_count || 0);
}

async function incrementSearchUsage(env) {
  await env.DB.prepare(`INSERT INTO search_usage(month_key,request_count,updated_at) VALUES(?,1,?) ON CONFLICT(month_key) DO UPDATE SET request_count=request_count+1,updated_at=excluded.updated_at`).bind(monthKey(), nowISO()).run();
}

export async function braveSearch(query, env, { freshness = null, count = 10 } = {}) {
  if (!env.BRAVE_SEARCH_API_KEY) { const e = new Error("Brave Search API 尚未授權"); e.code = "search_not_configured"; throw e; }
  const limit = Math.max(1, Math.min(Number(env.SEARCH_MONTHLY_BUDGET || 900), 5000));
  if (await getSearchUsage(env) >= limit) { const e = new Error(`本月自動搜尋已達安全上限 ${limit} 次`); e.code = "search_budget_exhausted"; throw e; }
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", String(query).slice(0, 600)); url.searchParams.set("count", String(Math.max(1, Math.min(count, 20)))); url.searchParams.set("safesearch", "moderate"); url.searchParams.set("extra_snippets", "true");
  if (freshness) url.searchParams.set("freshness", freshness);
  const response = await fetch(url, { headers: { Accept: "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": env.BRAVE_SEARCH_API_KEY } });
  if (!response.ok) { const e = new Error(`Brave Search HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`); e.code = "search_provider_error"; throw e; }
  await incrementSearchUsage(env);
  const data = await response.json();
  return (data?.web?.results || []).map((item) => ({ id: crypto.randomUUID(), title: String(item.title || item.url || "未命名結果"), url: String(item.url || ""), snippet: String(item.description || item.extra_snippets?.join("\n") || "").slice(0, 2500), provider: "Brave Search", publishedAt: null })).filter((item) => item.url);
}

export async function indexSearchResults(env, results, category = "網路搜尋") {
  let inserted = 0;
  for (const result of results) { const outcome = await upsertKnowledge(env, { title: result.title, body: result.snippet || result.title, category, sourceURL: result.url, sourceType: "web" }); if (outcome.inserted) inserted += 1; }
  return inserted;
}

export async function aiReply(prompt, env, liveResults = []) {
  if (!env.AI) return { text: `MOOHSIA Cloud 已上線，但 Workers AI 尚未啟用。你說的是：「${String(prompt).slice(0, 300)}」`, provider: "MOOHSIA Cloud", model: null };
  const model = env.AI_MODEL || "@cf/zai-org/glm-4.7-flash";
  const context = await knowledgeContext(prompt, env);
  const live = liveResults.length ? liveResults.map((x, i) => `[即時網路 ${i + 1}] ${x.title}\n${x.snippet}\n來源：${x.url}`).join("\n\n") : "";
  const system = ["你是暮霞 MOOHSIA，使用繁體中文（台灣）。", "你是使用者的 Cloud-first 個人 AI 助理。誠實、清楚、可操作。", "不得虛構已執行的外部動作；不得輸出思考過程、reasoning、token 資訊或原始 JSON。", "若有即時網路資料，清楚區分即時資料與長期索引，並保留來源。", context ? `\n暮霞長期索引：\n${context}` : "", live ? `\n即時網路結果：\n${live}` : ""].join("\n");
  const out = await env.AI.run(model, { messages: [{ role: "system", content: system }, { role: "user", content: prompt }], max_tokens: 1300 });
  const text = extractFinalText(out);
  if (!text) throw new Error("Workers AI returned no displayable final text");
  return { text, provider: "Cloudflare Workers AI", model };
}

export function knowledgeRow(x) { return { id: x.id, title: x.title, body: x.body, category: x.category, sourceURL: x.source_url, sourceType: x.source_type, createdAt: iso(x.created_at), updatedAt: iso(x.updated_at) }; }
export function activityRow(x) { return { id: x.id, kind: x.kind, title: x.title, detail: x.detail || "", sourceURL: x.source_url, severity: x.severity || "info", createdAt: iso(x.created_at) }; }
export function taskRow(x) { return { id: x.id, action: x.action, payload: x.payload || "", createdAt: iso(x.created_at), status: x.status, result: x.result }; }
export function watchlistRow(x) { return { id: x.id, name: x.name, query: x.query, category: x.category, enabled: Boolean(x.enabled), intervalMinutes: Number(x.interval_minutes), lastRunAt: x.last_run_at ? iso(x.last_run_at) : null, createdAt: iso(x.created_at) }; }

export async function dashboard(env) {
  const [knowledge, activity, tasks, watchlists, latest] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS c FROM knowledge").first(), env.DB.prepare("SELECT COUNT(*) AS c FROM activity").first(), env.DB.prepare("SELECT COUNT(*) AS c FROM remote_tasks WHERE status='pending'").first(), env.DB.prepare("SELECT COUNT(*) AS c FROM watchlists WHERE enabled=1").first(), env.DB.prepare("SELECT created_at FROM activity ORDER BY created_at DESC LIMIT 1").first()
  ]);
  return { knowledgeCount: Number(knowledge?.c || 0), activityCount: Number(activity?.c || 0), pendingTasks: Number(tasks?.c || 0), enabledWatchlists: Number(watchlists?.c || 0), lastActivityAt: latest?.created_at ? iso(latest.created_at) : null };
}
