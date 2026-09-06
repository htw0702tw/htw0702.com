async function loadContent() {
  const res = await fetch("data/content.json", { cache: "no-store" });
  if (!res.ok) return { posts: [], media: [] };
  return res.json();
}

function formatTaipei(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(d).replace(/\//g, ".");
}

async function renderBlogList(target) {
  const el = document.querySelector(target);
  if (!el) return;
  const data = await loadContent();
  const posts = (data.posts || []).slice().sort((a, b) => String(b.published).localeCompare(String(a.published)));
  if (!posts.length) {
    el.innerHTML = "<p class=\"lede\">還沒有文章。</p>";
    return;
  }
  el.innerHTML = posts.map((p) => `
    <article class="post">
      <time datetime="${p.published}">${formatTaipei(p.published)}</time>
      <div>
        <h3><a href="${p.path}">${p.title}</a></h3>
        <p>${p.excerpt || ""}</p>
      </div>
    </article>`).join("");
}

async function renderGallery(target) {
  const el = document.querySelector(target);
  if (!el) return;
  const data = await loadContent();
  const items = data.media || [];
  if (!items.length) {
    el.innerHTML = "<p class=\"lede\">還沒有上傳的照片或影片。</p>";
    return;
  }
  el.innerHTML = items.map((m) => {
    if (m.type === "video") {
      return `<figure class="tile media-tile"><video src="${m.path}" controls playsinline></video><figcaption>${m.name}</figcaption></figure>`;
    }
    return `<figure class="tile media-tile"><img src="${m.path}" alt="${m.name}" /><figcaption>${m.name}</figcaption></figure>`;
  }).join("");
}
