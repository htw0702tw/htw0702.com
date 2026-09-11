const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });

const iso = (d) => new Date(d).toISOString();

function auth(req, env) {
  if (!env.MOOHSIA_TOKEN) return true;
  return req.headers.get("authorization") === `Bearer ${env.MOOHSIA_TOKEN}`;
}

function extractFinalText(out) {
  if (!out) return "";
  if (typeof out === "string") return out.trim();
  if (typeof out.response === "string" && out.response.trim()) return out.response.trim();
  if (typeof out.result?.response === "string" && out.result.response.trim()) return out.result.response.trim();
  const directChoice = out.choices?.[0]?.message?.content;
  if (typeof directChoice === "string" && directChoice.trim()) return directChoice.trim();
  const resultChoice = out.result?.choices?.[0]?.message?.content;
  if (typeof resultChoice === "string" && resultChoice.trim()) return resultChoice.trim();
  return "";
}

async function knowledgeContext(prompt, env) {
  const q = `%${prompt.slice(0, 120)}%`;
  try {
    const r = await env.DB.prepare(
      `SELECT title, body, category, source_url
       FROM knowledge
       WHERE title LIKE ? OR body LIKE ?
       ORDER BY updated_at DESC
       LIMIT 5`
    ).bind(q, q).all();
    const rows = r.results || [];
    if (!rows.length) return "";
    return rows.map((x, i) => {
      const source = x.source_url ? `\n來源：${x.source_url}` : "";
      return `[索引 ${i + 1}] ${x.title}（${x.category}）\n${x.body}${source}`;
    }).join("\n\n");
  } catch {
    return "";
  }
}

async function aiReply(prompt, env) {
  if (!env.AI) {
    return `MOOHSIA Cloud 已上線，但 Workers AI binding 尚未啟用。你說的是：「${prompt.slice(0, 300)}」`;
  }

  const model = env.AI_MODEL || "@cf/zai-org/glm-4.7-flash";
  const context = await knowledgeContext(prompt, env);
  const contextText = context
    ? `\n\n以下是暮霞自己的長期索引，只有在與問題相關時才使用；不要假裝它是最新網路資料：\n${context}`
    : "";

  const out = await env.AI.run(model, {
    messages: [
      {
        role: "system",
        content:
          "你是暮霞 MOOHSIA，使用繁體中文（台灣）。你是使用者的 Cloud-first 個人 AI 助理。誠實、清楚、可操作，不得虛構已執行的外部動作。只輸出給使用者看的最終回答，不輸出思考過程、reasoning、token 資訊或原始 JSON。" +
          contextText,
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
  });

  const text = extractFinalText(out);
  if (!text) throw new Error("Workers AI returned no displayable final text");
  return text;
}

function knowledgeRow(x) {
  return {
    id: x.id,
    title: x.title,
    body: x.body,
    category: x.category,
    sourceURL: x.source_url,
    sourceType: x.source_type,
    createdAt: iso(x.created_at),
    updatedAt: iso(x.updated_at),
  };
}

function taskRow(x) {
  return {
    id: x.id,
    action: x.action,
    payload: x.payload || "",
    createdAt: iso(x.created_at),
    status: x.status,
    result: x.result,
  };
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);

    if (u.pathname === "/health") {
      return json({
        ok: true,
        service: "MOOHSIA Cloud",
        version: "0.3.0",
        capabilities: ["chat", "messages", "knowledge-index", "knowledge-rag", "remote-task-queue"],
      });
    }

    if (!auth(req, env)) return json({ error: "unauthorized" }, 401);

    if (u.pathname === "/v1/messages" && req.method === "GET") {
      const r = await env.DB.prepare(
        "SELECT id,role,text,created_at FROM messages ORDER BY created_at ASC LIMIT 500"
      ).all();
      return json((r.results || []).map((x) => ({
        id: x.id,
        role: x.role,
        text: x.text,
        createdAt: iso(x.created_at),
      })));
    }

    if (u.pathname === "/v1/messages" && req.method === "POST") {
      const m = await req.json();
      if (!m.id || !["user", "assistant"].includes(m.role) || typeof m.text !== "string") {
        return json({ error: "bad_request" }, 400);
      }
      const created = m.createdAt || new Date().toISOString();
      await env.DB.prepare(
        "INSERT OR REPLACE INTO messages(id,role,text,created_at) VALUES(?,?,?,?)"
      ).bind(m.id, m.role, m.text, created).run();
      return json({ id: m.id, role: m.role, text: m.text, createdAt: created }, 201);
    }

    if (u.pathname === "/v1/chat" && req.method === "POST") {
      try {
        const b = await req.json();
        const prompt = String(b.prompt || "").trim();
        if (!prompt) return json({ error: "empty_prompt" }, 400);
        const text = await aiReply(prompt, env);
        return json({
          text,
          provider: env.AI ? "Cloudflare Workers AI" : "MOOHSIA Cloud",
          model: env.AI_MODEL || null,
        });
      } catch (error) {
        console.error("MOOHSIA chat error:", error);
        return json({ error: "ai_response_error" }, 502);
      }
    }

    if (u.pathname === "/v1/knowledge" && req.method === "GET") {
      const q = (u.searchParams.get("q") || "").trim();
      let r;
      if (q) {
        const like = `%${q}%`;
        r = await env.DB.prepare(
          `SELECT id,title,body,category,source_url,source_type,created_at,updated_at
           FROM knowledge
           WHERE title LIKE ? OR body LIKE ? OR category LIKE ?
           ORDER BY updated_at DESC LIMIT 200`
        ).bind(like, like, like).all();
      } else {
        r = await env.DB.prepare(
          `SELECT id,title,body,category,source_url,source_type,created_at,updated_at
           FROM knowledge ORDER BY updated_at DESC LIMIT 200`
        ).all();
      }
      return json((r.results || []).map(knowledgeRow));
    }

    if (u.pathname === "/v1/knowledge" && req.method === "POST") {
      const b = await req.json();
      const title = String(b.title || "").trim();
      const body = String(b.body || "").trim();
      if (!title || !body) return json({ error: "bad_request" }, 400);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const category = String(b.category || "未分類").trim() || "未分類";
      const sourceURL = b.sourceURL ? String(b.sourceURL) : null;
      const sourceType = String(b.sourceType || "manual");
      await env.DB.prepare(
        `INSERT INTO knowledge(id,title,body,category,source_url,source_type,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?,?)`
      ).bind(id, title, body, category, sourceURL, sourceType, now, now).run();
      return json({
        id,
        title,
        body,
        category,
        sourceURL,
        sourceType,
        createdAt: now,
        updatedAt: now,
      }, 201);
    }

    if (u.pathname === "/v1/tasks" && req.method === "GET") {
      const r = await env.DB.prepare(
        `SELECT id,action,payload,status,result,created_at
         FROM remote_tasks ORDER BY created_at DESC LIMIT 100`
      ).all();
      return json((r.results || []).map(taskRow));
    }

    if (u.pathname === "/v1/tasks" && req.method === "POST") {
      const b = await req.json();
      const action = String(b.action || "").trim();
      if (!action) return json({ error: "bad_request" }, 400);
      const id = crypto.randomUUID();
      const payload = String(b.payload || "");
      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO remote_tasks(id,action,payload,status,result,created_at)
         VALUES(?,?,?,?,?,?)`
      ).bind(id, action, payload, "pending", null, createdAt).run();
      return json({
        id,
        action,
        payload,
        status: "pending",
        result: null,
        createdAt,
      }, 201);
    }

    return json({ error: "not_found" }, 404);
  },
};
