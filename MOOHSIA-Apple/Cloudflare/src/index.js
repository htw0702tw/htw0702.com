const json = (value, status=200, headers={}) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const iso = d => new Date(d).toISOString();
function auth(req, env) {
  if (!env.MOOHSIA_TOKEN) return true;
  return req.headers.get('authorization') === `Bearer ${env.MOOHSIA_TOKEN}`;
}
async function aiReply(prompt, env) {
  if (!env.AI) return `MOOHSIA Cloud 已上線，但 Workers AI binding 尚未啟用。你說的是：「${prompt.slice(0,300)}」`;
  const model = env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  const out = await env.AI.run(model, {messages:[{role:'system',content:'你是暮霞 MOOHSIA。請使用繁體中文（台灣），誠實、精簡，不得虛構已執行的外部動作。'},{role:'user',content:prompt}], max_tokens:900});
  return out.response || out.result?.response || JSON.stringify(out);
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/health') return json({ok:true, service:'MOOHSIA Cloud', version:'0.2.0'});
    if (!auth(req, env)) return json({error:'unauthorized'},401);
    if (u.pathname === '/v1/messages' && req.method === 'GET') {
      const r = await env.DB.prepare('SELECT id,role,text,created_at FROM messages ORDER BY created_at ASC LIMIT 500').all();
      return json((r.results||[]).map(x=>({id:x.id,role:x.role,text:x.text,createdAt:iso(x.created_at)})));
    }
    if (u.pathname === '/v1/messages' && req.method === 'POST') {
      const m = await req.json();
      if (!m.id || !['user','assistant'].includes(m.role) || typeof m.text !== 'string') return json({error:'bad_request'},400);
      const created = m.createdAt || new Date().toISOString();
      await env.DB.prepare('INSERT OR REPLACE INTO messages(id,role,text,created_at) VALUES(?,?,?,?)').bind(m.id,m.role,m.text,created).run();
      return json({id:m.id,role:m.role,text:m.text,createdAt:created},201);
    }
    if (u.pathname === '/v1/chat' && req.method === 'POST') {
      const b = await req.json();
      const prompt = String(b.prompt||'').trim(); if (!prompt) return json({error:'empty_prompt'},400);
      const text = await aiReply(prompt, env);
      return json({text, provider: env.AI ? 'Cloudflare Workers AI' : 'MOOHSIA Cloud'});
    }
    return json({error:'not_found'},404);
  }
};
