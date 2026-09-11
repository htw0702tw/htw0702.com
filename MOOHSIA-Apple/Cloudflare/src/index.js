import { addActivity, activityRow, aiReply, auth, braveSearch, dashboard, getSearchUsage, indexSearchResults, json, knowledgeRow, nowISO, taskRow, upsertKnowledge, watchlistRow } from "./core.js";
import { getIntegrationRows, scheduledSync, syncNamedIntegrations } from "./integrations.js";

async function handleFetch(req, env) {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return json({
      ok: true,
      service: "MOOHSIA Cloud",
      version: "0.4.0",
      capabilities: ["chat", "messages", "live-web-search", "knowledge-index", "knowledge-rag", "activity-feed", "watchlists", "notion-sync", "slack-sync", "github-sync", "remote-task-queue"],
    });
  }

  if (!auth(req, env)) return json({ error: "unauthorized" }, 401);

  if (url.pathname === "/v1/dashboard" && req.method === "GET") return json(await dashboard(env));

  if (url.pathname === "/v1/messages" && req.method === "GET") {
    const r = await env.DB.prepare("SELECT id,role,text,created_at FROM messages ORDER BY created_at ASC LIMIT 1000").all();
    return json((r.results || []).map((x) => ({ id: x.id, role: x.role, text: x.text, createdAt: new Date(x.created_at).toISOString() })));
  }

  if (url.pathname === "/v1/messages" && req.method === "POST") {
    const message = await req.json();
    if (!message.id || !["user", "assistant"].includes(message.role) || typeof message.text !== "string") return json({ error: "bad_request" }, 400);
    const createdAt = message.createdAt || nowISO();
    await env.DB.prepare("INSERT OR REPLACE INTO messages(id,role,text,created_at) VALUES(?,?,?,?)").bind(message.id, message.role, message.text, createdAt).run();
    return json({ id: message.id, role: message.role, text: message.text, createdAt }, 201);
  }

  if (url.pathname === "/v1/chat" && req.method === "POST") {
    try {
      const body = await req.json();
      const prompt = String(body.prompt || "").trim();
      if (!prompt) return json({ error: "empty_prompt" }, 400);
      let liveResults = [];
      if (body.liveSearch !== false && env.BRAVE_SEARCH_API_KEY) {
        try { liveResults = await braveSearch(prompt, env, { count: 6 }); await indexSearchResults(env, liveResults, "AI 即時搜尋"); }
        catch (error) { console.error("MOOHSIA live search skipped", error); }
      }
      const reply = await aiReply(prompt, env, liveResults);
      await addActivity(env, { kind: "chat", title: liveResults.length ? "AI 回答使用即時網路" : "AI 回答完成", detail: prompt.slice(0, 240) });
      return json({ ...reply, usedLiveSearch: liveResults.length > 0, sources: liveResults });
    } catch (error) {
      console.error("MOOHSIA chat error", error);
      return json({ error: "ai_response_error", detail: error.message }, 502);
    }
  }

  if (url.pathname === "/v1/search" && req.method === "POST") {
    try {
      const body = await req.json();
      const query = String(body.query || "").trim();
      if (!query) return json({ error: "empty_query" }, 400);
      const results = await braveSearch(query, env, { count: 12 });
      if (body.save !== false) {
        const inserted = await indexSearchResults(env, results, "網路搜尋");
        await addActivity(env, { kind: "search", title: `網路搜尋：${query.slice(0, 80)}`, detail: `取得 ${results.length} 筆結果，新增 ${inserted} 筆到長期索引。` });
      }
      return json({ provider: "Brave Search", query, results });
    } catch (error) {
      const status = error.code === "search_not_configured" ? 503 : error.code === "search_budget_exhausted" ? 429 : 502;
      return json({ error: error.code || "search_error", detail: error.message }, status);
    }
  }

  if (url.pathname === "/v1/knowledge" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").trim();
    let r;
    if (q) {
      const like = `%${q}%`;
      r = await env.DB.prepare(`SELECT id,title,body,category,source_url,source_type,created_at,updated_at FROM knowledge WHERE title LIKE ? OR body LIKE ? OR category LIKE ? ORDER BY updated_at DESC LIMIT 300`).bind(like, like, like).all();
    } else {
      r = await env.DB.prepare(`SELECT id,title,body,category,source_url,source_type,created_at,updated_at FROM knowledge ORDER BY updated_at DESC LIMIT 300`).all();
    }
    return json((r.results || []).map(knowledgeRow));
  }

  if (url.pathname === "/v1/knowledge" && req.method === "POST") {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const text = String(body.body || "").trim();
    if (!title || !text) return json({ error: "bad_request" }, 400);
    const result = await upsertKnowledge(env, { title, body: text, category: String(body.category || "未分類").trim() || "未分類", sourceURL: body.sourceURL ? String(body.sourceURL) : null, sourceType: String(body.sourceType || "manual") });
    await addActivity(env, { kind: "memory", title: `加入索引：${title.slice(0, 120)}`, detail: String(body.category || "未分類"), sourceURL: body.sourceURL || null });
    return json(result.item, result.inserted ? 201 : 200);
  }

  if (url.pathname === "/v1/activity" && req.method === "GET") {
    const r = await env.DB.prepare(`SELECT id,kind,title,detail,source_url,severity,created_at FROM activity ORDER BY created_at DESC LIMIT 300`).all();
    return json((r.results || []).map(activityRow));
  }

  if (url.pathname === "/v1/integrations" && req.method === "GET") return json(await getIntegrationRows(env));

  if (url.pathname === "/v1/integrations/sync" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const names = Array.isArray(body.names) ? body.names.map(String) : [];
    return json(await syncNamedIntegrations(env, names));
  }

  if (url.pathname === "/v1/watchlists" && req.method === "GET") {
    const r = await env.DB.prepare(`SELECT id,name,query,category,enabled,interval_minutes,last_run_at,created_at FROM watchlists ORDER BY created_at ASC`).all();
    return json((r.results || []).map(watchlistRow));
  }

  if (url.pathname === "/v1/tasks" && req.method === "GET") {
    const r = await env.DB.prepare(`SELECT id,action,payload,status,result,created_at FROM remote_tasks ORDER BY created_at DESC LIMIT 200`).all();
    return json((r.results || []).map(taskRow));
  }

  if (url.pathname === "/v1/tasks" && req.method === "POST") {
    const body = await req.json();
    const action = String(body.action || "").trim();
    if (!["openPages", "openNotes", "openURL"].includes(action)) return json({ error: "unsupported_action" }, 400);
    const id = crypto.randomUUID(), payload = String(body.payload || ""), createdAt = nowISO();
    await env.DB.prepare(`INSERT INTO remote_tasks(id,action,payload,status,result,created_at) VALUES(?,?,?,?,?,?)`).bind(id, action, payload, "pending", null, createdAt).run();
    return json({ id, action, payload, status: "pending", result: null, createdAt }, 201);
  }

  const taskMatch = url.pathname.match(/^\/v1\/tasks\/([0-9a-fA-F-]+)$/);
  if (taskMatch && req.method === "PATCH") {
    const body = await req.json();
    const status = String(body.status || "");
    if (!["pending", "approved", "rejected", "completed", "failed"].includes(status)) return json({ error: "bad_status" }, 400);
    await env.DB.prepare("UPDATE remote_tasks SET status=?,result=? WHERE id=?").bind(status, body.result ? String(body.result) : null, taskMatch[1]).run();
    const row = await env.DB.prepare("SELECT id,action,payload,status,result,created_at FROM remote_tasks WHERE id=?").bind(taskMatch[1]).first();
    return row ? json(taskRow(row)) : json({ error: "not_found" }, 404);
  }

  if (url.pathname === "/v1/search-usage" && req.method === "GET") return json({ used: await getSearchUsage(env), limit: Number(env.SEARCH_MONTHLY_BUDGET || 900) });
  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(req, env) {
    try { return await handleFetch(req, env); }
    catch (error) { console.error("MOOHSIA unhandled error", error); return json({ error: "internal_error", detail: error.message }, 500); }
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(scheduledSync(env).catch((error) => console.error("MOOHSIA scheduled sync failed", error))); },
};
