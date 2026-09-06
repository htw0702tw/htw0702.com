const OWNER = "htw0702tw";
const REPO = "htw0702.com";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;
const $ = (id) => document.getElementById(id);
function nowTaipeiInput() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
function inputToIso(v) { if (!v) return new Date().toISOString(); return `${v}:00+08:00`; }
function slugify(title) {
  const base = title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fff-]+/g, "").slice(0, 40);
  const t = nowTaipeiInput().replace(/[-:T]/g, "").slice(0, 12);
  return base || `post-${t}`;
}
function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ""; bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function token() { return localStorage.getItem("htw_gh_token") || ""; }
function setStatus(msg, ok) {
  const el = $("status");
  el.textContent = msg;
  el.style.color = ok === false ? "#c44536" : ok ? "#8fbc8f" : "#9a958c";
}
async function ghGet(path) {
  const res = await fetch(`${API}/${path}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function ghPut(path, contentB64, message, sha) {
  const body = { message, content: contentB64, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/${path}`, { method: "PUT", headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function loadManifest() {
  const file = await ghGet("data/content.json");
  if (!file) return { posts: [], media: [], sha: null };
  return { ...JSON.parse(b64ToUtf8(file.content)), sha: file.sha };
}
function navHtml() {
  return `<nav class="nav"><div class="wrap nav-inner"><a class="brand" href="../index.html">HTW<span>0702</span></a><div class="links"><a href="../index.html">首頁</a><a href="../blog.html" class="active">文章</a><a href="../gallery.html">圖庫</a><a href="../about.html">關於</a></div></div></nav>`;
}
function postHtml(title, iso, body) {
  const when = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).replace(/\//g, ".");
  return `<!doctype html>\n<html lang="zh-Hant">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>${title} — htw0702</title>\n  <link rel="stylesheet" href="../css/style.css" />\n</head>\n<body>\n${navHtml()}\n  <article class="wrap article-body">\n    <p class="kicker">${when}</p>\n    <h1>${title}</h1>\n    <div class="prose">${body}</div>\n  </article>\n  <footer class="wrap footer"><span>© 2026 htw0702.com</span><a href="../blog.html">回文章列表</a></footer>\n</body>\n</html>\n`;
}
function excerptOf(html) { return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80); }
$("when").value = nowTaipeiInput();
$("save-token").onclick = () => {
  const t = $("token").value.trim();
  if (!t) { setStatus("請貼上 GitHub token", false); return; }
  localStorage.setItem("htw_gh_token", t);
  $("token").value = "";
  setStatus("已存在這個瀏覽器。", true);
};
$("new-time").onclick = () => { $("when").value = nowTaipeiInput(); };
$("publish").onclick = async () => {
  if (!token()) { setStatus("先存 token", false); return; }
  const title = $("title").value.trim();
  const body = $("body").value.trim();
  if (!title || !body) { setStatus("標題和本文都要填", false); return; }
  const iso = inputToIso($("when").value);
  const slug = slugify(title);
  const path = `posts/${slug}.html`;
  setStatus("發布中…");
  try {
    const html = postHtml(title, iso, body);
    const existing = await ghGet(path);
    await ghPut(path, utf8ToB64(html), existing ? `Update post ${slug}` : `Add post ${slug}`, existing && existing.sha);
    const man = await loadManifest();
    const posts = (man.posts || []).filter((p) => p.slug !== slug);
    posts.unshift({ slug, title, excerpt: excerptOf(body), published: iso, path });
    await ghPut("data/content.json", utf8ToB64(JSON.stringify({ posts, media: man.media || [] }, null, 2) + "\n"), `Update index for ${slug}`, man.sha);
    setStatus(`已發布 ${path}`, true);
    await refreshLists();
  } catch (err) { setStatus(String(err.message || err).slice(0, 240), false); }
};
$("upload").onclick = async () => {
  if (!token()) { setStatus("先存 token", false); return; }
  const file = $("file").files[0];
  if (!file) { setStatus("選一個檔案", false); return; }
  if (file.size > 25 * 1024 * 1024) { setStatus("檔案請小於 25MB。長影片請放 YouTube／Bilibili。", false); return; }
  setStatus("上傳中…");
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = ""; const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    const safe = file.name.replace([^\w.\-()\u4e00-\u9fff]+/g, "_");
    const dest = `media/${Date.now()}-${safe}`;
    await ghPut(dest, btoa(bin), `Upload ${safe}`);
    const man = await loadManifest();
    const type = file.type.startsWith("video") ? "video" : "image";
    const media = man.media || [];
    media.unshift({ name: file.name, type, path: dest, added: inputToIso(nowTaipeiInput()) });
    await ghPut("data/content.json", utf8ToB64(JSON.stringify({ posts: man.posts || [], media }, null, 2) + "\n"), `Index media ${safe}`, man.sha);
    const tag = type === "video" ? `<p><video src="../${dest}" controls playsinline></video></p>` : `<p><img src="../${dest}" alt="${file.name}" /></p>`;
    $("body").value = ($("body").value + "\n" + tag).trim();
    setStatus(`已上傳 ${dest}`, true);
    await refreshLists();
  } catch (err) { setStatus(String(err.message || err).slice(0, 240), false); }
};
async function refreshLists() {
  try {
    const man = token() ? await loadManifest() : { posts: [], media: [] };
    $("post-list").innerHTML = (man.posts || []).map((p) => `<li><a href="../${p.path}" target="_blank">${p.title}</a> · ${p.published}</li>`).join("") || "<li>尚無文章</li>";
    $("media-list").innerHTML = (man.media || []).map((m) => `<li>${m.type} · <a href="../${m.path}" target="_blank">${m.name}</a></li>`).join("") || "<li>尚無檔案</li>";
  } catch { $("post-list").innerHTML = "<li>讀不到清單</li>"; }
}
refreshLists();
