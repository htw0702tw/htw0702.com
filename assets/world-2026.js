const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const REJECTED = new RegExp(
  ["\u82b1\u706b", "\u591c\u5e02", "\u796d\u5178", "\u6e2f\u753a", "\u590f\u796d", "fire" + "works", "night " + "market"].join("|"),
  "i",
);
let lang = "tw";
let route = "";
let renderToken = 0;
let searchTimer = 0;
let painting = false;
const t = (tw, en, jp) => ({ tw, en, jp })[lang] || tw;
const link = (p) => `/${lang}${p ? "/" + p : ""}`;
const main = $("#main");
const motionOK = () =>
  document.documentElement.dataset.play !== "off" &&
  document.body.dataset.motion !== "false" &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

function readRoute() {
  const parts = location.pathname.split("/").filter(Boolean);
  lang = ["tw", "en", "jp"].includes(parts[0]) ? parts.shift() : "tw";
  route = parts.join("/");
  if (location.hostname === "admin.htw0702.com" && !route) route = "admin";
}

const languageNames = {
  tw: ["繁體中文", "英文", "日本語"],
  en: ["Traditional Chinese", "English", "Japanese"],
  jp: ["繁体字中国語", "英語", "日本語"],
};

function themeOptions() {
  return [
    ["dusk", t("暮色", "Dusk", "ダスク")],
    ["day", t("晨光", "Day", "昼")],
    ["night", t("深空", "Deep", "深空")],
  ];
}
function navItems() {
  return [
    ["wiki", t("維基", "Wiki", "ウィキ")],
    ["blog", t("手記", "Journal", "手記")],
    ["works", t("作品", "Works", "作品")],
    ["games", t("遊戲", "Games", "ゲーム")],
    ["social", t("社群", "Social", "ソーシャル")],
    ["store", t("小賣所", "Shop", "売店")],
    ["now", t("現在", "Now", "いま")],
    ["search", t("搜尋", "Search", "検索")],
  ];
}
function titles() {
  return {
    works: t("作品", "Works", "作品"),
    games: t("遊戲", "Games", "ゲーム"),
    wiki: t("關於筳筳", "About Ting Ting", "筳筳について"),
    blog: t("手記", "Journal", "手記"),
    me: t("社群", "Social", "ソーシャル"),
    social: t("社群", "Social", "ソーシャル"),
    search: t("搜尋", "Search", "検索"),
    now: t("現在公開的", "Public right now", "いま公開していること"),
    store: t("小賣所", "Shop", "売店"),
  };
}
function ledes() {
  return {
    works: t("完成並公開的作品。", "Work that is finished and public.", "完成して公開している作品。"),
    games: t("這裡只放戰隊入口。對戰資料在戰隊的網站。", "Only the team door lives here. Match records stay on the team site.", "ここにあるのはチームへの入口だけ。対戦記録はチームのサイトにあります。"),
    wiki: t("公開維基。私人筆記不會出現在這裡。", "The public wiki. Private notes stay off this page.", "公開ウィキ。非公開のメモは載せません。"),
    blog: t("寫下來、並公開的文字。", "Writing that has been made public.", "書いて、公開した文章。"),
    now: t("現在願意公開的近況。", "What is public right now.", "いま公開していること。"),
    store: t("個人周邊與支持的入口。有設定的品項才會列在這裡。", "A door for personal goods and support. Items appear here only after they are configured.", "品とサポートの入口。設定した品だけを並べます。"),
  };
}
function collection() {
  return [
    {
      href: "wiki",
      no: "01",
      kicker: "WIKI",
      title: t("關於筳筳", "About Ting Ting", "筳筳について"),
      text: t("公開維基。Notion 裡設為公開的紀錄才會出現。", "The public wiki. Only records marked public in Notion appear.", "公開ウィキ。Notion で公開した記録だけが出ます。"),
      mark: t("維", "W", "維"),
      viz: "#2a1844",
      vizKey: "wiki",
    },
    {
      href: "blog",
      no: "02",
      kicker: "JOURNAL",
      title: t("手記", "Journal", "手記"),
      text: t("寫下來並公開的文字，依更新時間排列。", "Public writing, ordered by update time.", "書いて公開した文章を、更新順に並べます。"),
      mark: t("記", "Aa", "記"),
      viz: "#1a2740",
      vizKey: "journal",
    },
    {
      href: "works",
      no: "03",
      kicker: "WORKS",
      title: t("作品", "Works", "作品"),
      text: t("目前公開的作品是這座網站 htw0702.com。繁體中文為主，並有英文與日文。", "The public work listed now is this site, htw0702.com.", "いま公開している作品は、このサイト htw0702.com。"),
      mark: ".com",
      viz: "#12303a",
      vizKey: "works",
    },
    {
      href: "social",
      no: "04",
      kicker: "SOCIAL",
      title: t("社群", "Social", "ソーシャル"),
      text: t("Instagram htw0702ig、Threads htw0702threads、X htw0702x。", "Instagram htw0702ig, Threads htw0702threads, and X htw0702x.", "Instagram htw0702ig、Threads htw0702threads、X htw0702x。"),
      mark: "@",
      viz: "#32182c",
      vizKey: "social",
    },
    {
      href: "store",
      no: "05",
      kicker: "SHOP",
      title: t("小賣所", "Shop", "売店"),
      text: t("目前沒有上架商品。付款連結只在設定完成後出現。", "Nothing is for sale yet. Payment links appear only after they are configured.", "いま販売している品はありません。決済リンクは設定後だけ表示します。"),
      mark: "—",
      viz: "#241c33",
      vizKey: "shop",
    },
    {
      href: "now",
      no: "06",
      kicker: "NOW",
      title: t("現在", "Now", "いま"),
      text: t("現在公開的是這個網站。繁體中文為主，英文與日文也可以讀。", "What is public right now is this website, in three languages.", "いま公開しているのは、このサイトです。"),
      mark: "Now",
      viz: "#1c2438",
      vizKey: "now",
    },
    {
      href: "search",
      no: "07",
      kicker: "SEARCH",
      title: t("搜尋", "Search", "検索"),
      text: t("在公開頁面、手記、作品與維基裡找一句話。", "Find a line across the public pages, journal, works, and wiki.", "公開ページ、手記、作品、ウィキから一文を探します。"),
      mark: "Aa",
      viz: "#2c2148",
      vizKey: "search",
    },
  ];
}
const emptyCopy = () => t("還沒有公開內容。", "No public entries yet.", "公開記事はまだありません。");
const unavailableCopy = () =>
  t("暫時無法讀取，請稍後重新整理。", "Temporarily unavailable. Please refresh later.", "一時的に読み込めません。後でもう一度お試しください。");

let appearance = {
  theme: "dusk",
  accent: "#c4b5fd",
  motion: true,
  sound: false,
  hero: { tw: "筳筳。", en: "Ting Ting.", jp: "筳筳。" },
};
function heroText() {
  const raw = String(appearance.hero?.[lang] || appearance.hero?.tw || "").trim();
  if (!raw || REJECTED.test(raw)) return t("筳筳。", "Ting Ting.", "筳筳。");
  return raw;
}
function kinetic(text) {
  return [...String(text)].map((ch, i) => (ch === " " ? " " : `<span style="--d:${Math.min(i, 18) * 42}ms">${esc(ch)}</span>`)).join("");
}
function paintHeadline() {
  const h = document.querySelector("[data-headline]");
  if (h) h.innerHTML = kinetic(heroText());
}
function applyAppearance(x) {
  appearance = x;
  document.body.dataset.theme = x.theme || "dusk";
  document.body.dataset.motion = String(x.motion !== false);
  const accent = String(x.accent || "").toLowerCase();
  const legacy = accent === "#234238" || accent === "#e8b495";
  if (accent && !legacy) document.documentElement.style.setProperty("--accent", x.accent);
  else document.documentElement.style.removeProperty("--accent");
  syncField();
  paintHeadline();
}
function syncPauseLabel() {
  const pause = $("#pause-motion");
  if (!pause) return;
  const off = document.documentElement.dataset.play === "off";
  pause.setAttribute("aria-pressed", String(off));
  const num = pause.querySelector("b");
  const label = pause.querySelector("span");
  if (num) num.textContent = off ? "01" : "00";
  if (label) label.textContent = off ? t("播放", "Play", "再生") : t("暫停", "Pause", "停止");
}
function placePause() {
  const btn = $("#pause-motion");
  const dock = document.getElementById("pause-dock");
  const slot = document.getElementById("pause-slot");
  if (!btn || !dock) return;
  (slot || dock).append(btn);
  syncPauseLabel();
}
function paintChrome() {
  painting = true;
  try {
    const navKey = route === "me" || route === "contact" ? "social" : route;
    $("#nav").innerHTML = navItems()
      .map(([p, l]) => {
        const on = navKey === p || (p && navKey.startsWith(p + "/"));
        return `<a href="${link(p)}" ${on ? 'aria-current="page"' : ""}>${l}</a>`;
      })
      .join("");
    $("#nav").classList.remove("open");
    $("#menu").setAttribute("aria-expanded", "false");
    $("#menu").setAttribute("aria-label", t("選單", "Menu", "メニュー"));
    document.body.classList.remove("nav-open");
    $(".brand").href = link("");
    const labels = Object.fromEntries(navItems());
    document.querySelectorAll("[data-route]").forEach((a) => {
      a.href = link(a.dataset.route);
      if (labels[a.dataset.route]) a.textContent = labels[a.dataset.route];
    });
    document.body.dataset.page = route.split("/")[0] || "home";
    if (!document.body.dataset.theme) document.body.dataset.theme = appearance.theme || "dusk";
    $("#language").innerHTML = ["tw", "en", "jp"].map((l, i) => `<option value="${l}">${languageNames[lang][i]}</option>`).join("");
    $("#language").value = lang;
    document.documentElement.lang = { tw: "zh-Hant-TW", en: "en-US", jp: "ja-JP" }[lang];
    $("#peace").textContent = t("來自台灣。", "From Taiwan.", "台湾出身。");
    document.querySelector(".top-social")?.setAttribute("aria-label", t("社群", "Social", "ソーシャル"));
    const write = $("#write");
    if (write) write.innerHTML = `${t("寫信", "Write", "メール")} <i aria-hidden="true">↗</i>`;
    $("#to-top")?.setAttribute("aria-label", t("回到頂端", "Back to top", "上へ戻る"));
    syncPauseLabel();
    clock();
  } finally {
    painting = false;
  }
}
function applySeo() {
  let pack = {};
  try {
    pack = JSON.parse(document.getElementById("seo")?.textContent || "{}");
  } catch {}
  const known = pack.locales?.[lang] || {};
  const key = route === "me" || route === "contact" ? "social" : route || "home";
  const page = known[key] || known["404"];
  const origin = "https://htw0702.com";
  const path = route === "me" || route === "contact" ? `/${lang}/social` : route ? `/${lang}/${route}` : `/${lang}`;
  if (page?.title) document.title = page.title;
  const desc = document.querySelector('meta[name="description"]');
  if (page?.description && desc) desc.setAttribute("content", page.description);
  const canon = document.querySelector('link[rel="canonical"]');
  if (canon) canon.setAttribute("href", origin + path);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogTitle && page?.title) ogTitle.setAttribute("content", page.title);
  if (ogDesc && page?.description) ogDesc.setAttribute("content", page.description);
  if (ogUrl) ogUrl.setAttribute("content", origin + path);
}

async function api(path, options = {}) {
  const r = await fetch("/api/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error(`${r.status}`);
  return r.json();
}
async function content(kind) {
  let a = [],
    b = [];
  const results = await Promise.allSettled([
    api("content?kind=" + kind + "&locale=" + lang),
    api("public?kind=" + kind + "&locale=" + lang),
  ]);
  if (results[0].status === "fulfilled") a = results[0].value.items || [];
  if (results[1].status === "fulfilled")
    b = (results[1].value.entries || []).filter((x) => x.source !== "notion").map((x) => ({ ...x, name: x.title }));
  if (results.every((x) => x.status === "rejected")) throw Error("unavailable");
  const ids = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => !ids.has(x.id))];
}
function posts(items) {
  return items.length
    ? `<div class="stack">${items
        .map(
          (x, i) =>
            `<article class="entry reveal" id="${esc(x.slug || "")}" style="--i:${i % 8}"><small>${String(i + 1).padStart(2, "0")}  ·  ${esc(x.updated || x.updated_at || "")}</small><h2>${esc(x.name)}</h2><p>${esc(x.body)}</p></article>`,
        )
        .join("")}</div>`
    : `<p class="empty">${emptyCopy()}</p>`;
}
function card(item, i) {
  const external = /^https?:/i.test(item.href || "");
  const href = external || String(item.href || "").startsWith("/") ? item.href : link(item.href);
  const media = `<div class="viz viz-${esc(item.vizKey || "sigil")}" style="--viz:${item.viz || "#1b1630"}"><b>${esc(item.mark || "·")}</b><i aria-hidden="true"></i></div>`;
  return `<a class="piece magnetic reveal" href="${esc(href)}" ${external ? 'target="_blank" rel="noopener"' : ""} style="--i:${i}"><div class="piece-top"><span class="num">${esc(item.no)}</span><small>${esc(item.kicker)}</small></div>${media}<h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><em>${external ? "↗" : t("開啟", "Open", "開く") + " →"}</em></a>`;
}
function sub(title, kicker, desc = "") {
  return `<section class="page-hero"><p class="kicker"><span>${esc(kicker)}</span></p><h1>${esc(title)}</h1>${desc ? `<p class="lede">${esc(desc)}</p>` : ""}</section>`;
}

function mosCard() {
  return `<a class="mos magnetic reveal" href="https://moohsia.com" target="_blank" rel="noopener"><span class="num">MOS</span><em>${esc(t("傳說戰隊", "Team", "チーム"))}</em><strong>暮霞｜MOS</strong><p>${esc(t("戰隊的網站。個人站只留這扇門，不放對戰資料。", "The team site. This personal site only keeps the door.", "チームのサイト。この個人サイトは入口だけです。"))}</p><span class="mos-go">${esc(t("前往 moohsia.com", "Open moohsia.com", "moohsia.com を開く"))} ↗</span></a>`;
}
function watchBlock() {
  return `<section class="watch" id="watch" aria-labelledby="watch-title"><div class="watch-copy"><p class="kicker"><span>YOUTUBE</span><span>htw0702yt</span></p><h2 id="watch-title">${esc(t("影像", "Picture", "映像"))}</h2><p class="lede">${esc(t("頻道先放在這裡。畫面是可更換的預覽，靜音，捲到附近才載入。", "The channel sits here. The frame is a replaceable preview: muted, and loaded only when it scrolls near.", "チャンネルはここ。枠は差し替えできるプレビューで、ミュート、近くまで来てから読み込みます。"))}</p><p class="preview-flag" data-yt-flag hidden></p><a class="text-link" data-yt-channel href="https://www.youtube.com/@htw0702yt" target="_blank" rel="noopener">YouTube · htw0702yt ↗</a></div><div class="player" data-yt><button class="poster" type="button" data-yt-play><span class="poster-art" aria-hidden="true"></span><span class="play-disc" aria-hidden="true"></span><span class="poster-label">${esc(t("播放預覽", "Play preview", "プレビューを再生"))}</span></button></div></section>`;
}
function home() {
  const doors = collection();
  const ticker = "HTW0702　·　筳筳　·　WANG HAO TING　·　TAIWAN　·　";
  main.innerHTML = `<section class="stage" id="intro"><div class="scene" aria-hidden="true"><div class="orb orb-a"></div><div class="orb orb-b"></div><div class="orb orb-c"></div><div class="grid-floor"></div></div><div class="hero-copy"><p class="kicker"><span>HTW0702</span><span>TAIWAN</span><span>01</span></p><h1><span class="line-a kinetic" data-headline>${kinetic(heroText())}</span><span class="line-b">${esc(t("公開的頁面。", "The public pages.", "公開しているページ。"))}</span></h1><p class="paper">${esc(t("我是王顥筳（筳筳），來自台灣。公開的維基、手記、作品與社群都從這裡進去。", "I’m Wang Hao Ting — Ting Ting — from Taiwan. The public wiki, journal, works, and social pages start here.", "王顥筳、筳筳です。台湾出身。公開のウィキ、手記、作品、ソーシャルはここから入ります。"))}</p><div class="hero-actions"><span id="pause-slot"></span><a class="goto magnetic" href="#watch"><span>${esc(t("影像", "Picture", "映像"))}</span><i aria-hidden="true">↓</i></a><a class="goto ghost magnetic" href="#collection"><span>${esc(t("往下看", "Scroll", "スクロール"))}</span></a></div></div></section><div class="marquee" aria-hidden="true"><div class="marquee-track"><span>${esc(ticker)}</span><span>${esc(ticker)}</span></div></div>${watchBlock()}<section class="story" data-story id="collection" aria-labelledby="collection-title"><div class="story-pin"><div class="story-head"><p class="index"><span data-story-index>01</span> — <span data-story-end>${String(doors.length).padStart(2, "0")}</span></p><h2 id="collection-title">${esc(t("目錄", "Index", "目次"))}</h2><p>${esc(t("往下捲，卡片會跟著移動。維基、手記、作品、社群、小賣所、現在、搜尋。", "Scroll, and the cards travel with you. Wiki, journal, works, social, shop, now, search.", "スクロールすると、カードが一緒に動きます。ウィキ、手記、作品、ソーシャル、売店、いま、検索。"))}</p><div class="story-bar" aria-hidden="true"><i data-story-bar></i></div></div><div class="rail-window"><div class="rail" data-rail>${doors.map(card).join("")}<div id="live-rail" class="live-rail"></div></div></div></div></section><section class="games" id="games" aria-labelledby="games-title"><p class="kicker"><span>GAMES</span><span>08</span></p><h2 id="games-title">${esc(t("遊戲", "Games", "ゲーム"))}</h2><p class="lede">${esc(t("個人品牌留在這個網站。戰隊是另一扇門。", "The personal brand stays on this site. The team is another door.", "個人のブランドはこのサイト。チームは別の扉です。"))}</p>${mosCard()}</section><div class="sheet"><section class="person" aria-labelledby="person-title"><div class="sigil reveal" aria-hidden="true"><span>筳</span></div><div><p class="kicker"><span>ABOUT</span></p><h2 id="person-title">王顥筳</h2><p class="lede">${esc(t("筳筳，htw0702。來自台灣。公開的頁面從這裡開始。", "Ting Ting, htw0702. From Taiwan. The public pages start here.", "筳筳、htw0702。台湾出身。公開ページはここから始まります。"))}</p><ul class="facts"><li><a href="mailto:taiwan@htw0702.com">taiwan@htw0702.com</a></li><li><a href="mailto:japan@htw0702.com">japan@htw0702.com</a></li><li><a href="https://www.youtube.com/@htw0702yt" target="_blank" rel="noopener">YouTube · htw0702yt</a></li></ul><a class="text-link" href="${link("wiki")}">${esc(t("維基裡的介紹", "Read the wiki", "ウィキを読む"))} →</a></div></section></div>`;
  fillLive();
  sizeStory();
  hydrateWatch();
}

async function fillLive() {
  const mine = renderToken;
  const host = document.getElementById("live-rail");
  if (!host) return;
  const specs = [
    ["works", "WORKS", t("作品", "Works", "作品")],
    ["blog", "JOURNAL", t("手記", "Journal", "手記")],
    ["wiki", "WIKI", t("維基", "Wiki", "ウィキ")],
    ["now", "NOW", t("現在", "Now", "いま")],
  ];
  try {
    const groups = await Promise.all(specs.map(([kind]) => content(kind).catch(() => [])));
    if (mine !== renderToken || !document.getElementById("live-rail")) return;
    const bits = [];
    const base = collection().length;
    groups.forEach((items, i) => {
      items.slice(0, 2).forEach((x) => {
        const n = base + bits.length + 1;
        bits.push({
          href: link(specs[i][0]) + "#" + encodeURIComponent(x.slug || ""),
          no: String(n).padStart(2, "0"),
          kicker: specs[i][1],
          title: x.name || specs[i][2],
          text: String(x.body || "").replace(/\s+/g, " ").slice(0, 96),
          mark: String(x.name || "·").slice(0, 1),
          viz: "#1b1630",
          vizKey: "sigil",
        });
      });
    });
    host.innerHTML = bits.map((item, i) => card(item, i)).join("");
    const end = document.querySelector("[data-story-end]");
    const total = document.querySelectorAll("[data-rail] .piece").length;
    if (end) end.textContent = String(total).padStart(2, "0");
    sizeStory();
    storyFrame();
  } catch {}
}

function storyMotionOff() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(max-width: 800px)").matches;
}
function sizeStory() {
  const story = document.querySelector("[data-story]");
  const rail = document.querySelector("[data-rail]");
  if (!story || !rail) return;
  if (storyMotionOff()) {
    story.style.height = "";
    rail.style.transform = "";
    return;
  }
  const max = Math.max(0, rail.scrollWidth - (rail.parentElement?.clientWidth || 0));
  story.style.height = Math.round(innerHeight + Math.max(max, innerHeight * 0.35)) + "px";
}
function storyFrame() {
  const story = document.querySelector("[data-story]");
  const rail = document.querySelector("[data-rail]");
  if (!story || !rail) return;
  if (storyMotionOff()) {
    rail.style.transform = "";
    return;
  }
  if (document.documentElement.dataset.play === "off") return;
  const total = Math.max(1, story.offsetHeight - innerHeight);
  const passed = Math.min(Math.max(-story.getBoundingClientRect().top, 0), total);
  const p = passed / total;
  const max = Math.max(0, rail.scrollWidth - (rail.parentElement?.clientWidth || 0));
  rail.style.transform = `translate3d(${(-max * p).toFixed(1)}px,0,0)`;
  const cards = Math.max(1, rail.querySelectorAll(".piece").length);
  const n = Math.min(cards, Math.floor(p * (cards - 0.001)) + 1);
  const label = document.querySelector("[data-story-index]");
  if (label) label.textContent = String(n).padStart(2, "0");
  const bar = document.querySelector("[data-story-bar]");
  if (bar) bar.style.transform = `scaleX(${p})`;
  rail.querySelectorAll(".piece").forEach((el, i) => el.classList.toggle("is-focus", i === n - 1));
}

async function cms(kind) {
  const mine = renderToken;
  const loading = t("讀取中…", "Loading…", "読み込み中…");
  const shelf = `<div id="entries">${loading}</div>`;
  const kick = { works: "Works", wiki: "Wiki", blog: "Journal", now: "Now" }[kind] || kind;
  main.innerHTML = sub(titles()[kind] || kind, kick, ledes()[kind] || "") + `<section class="section">${shelf}</section>`;
  try {
    const items = await content(kind);
    if (mine !== renderToken || !$("#entries")) return;
    $("#entries").innerHTML = posts(items);
    if (kind === "blog") {
      const box = $("#entries");
      box.innerHTML = `<div class="blog-layout"><div><input class="blog-search" id="search" aria-label="${esc(t("搜尋手記", "Search the journal", "手記を検索"))}" placeholder="${esc(t("搜尋標題或內文", "Search titles or text", "タイトルか本文を検索"))}"><div id="posts">${posts(items)}</div></div><aside><h3>筳筳</h3><p>${esc(t("願意公開的文字，依更新時間排列。", "Public writing, ordered by update time.", "公開した文章を、更新順に並べます。"))}</p><a class="line-link" href="${link("social")}">${esc(titles().social)} ↗</a></aside></div>`;
      $("#search").oninput = (e) => {
        $("#posts").innerHTML = posts(items.filter((x) => (x.name + " " + x.body).toLowerCase().includes(e.target.value.toLowerCase())));
      };
    }
  } catch {
    if (mine === renderToken && $("#entries")) $("#entries").textContent = unavailableCopy();
  }
}

function me() {
  const social = [
    ["YouTube", "htw0702yt", "https://www.youtube.com/@htw0702yt"],
    ["Instagram", "htw0702ig", "https://instagram.com/htw0702ig"],
    ["Threads", "@htw0702threads", "https://www.threads.net/@htw0702threads"],
    ["X", "@htw0702x", "https://x.com/htw0702x"],
    ["Discord", "@htw0702dc", null],
    ["Telegram · " + t("台灣", "Taiwan", "台湾"), "@htw0702tgtw", "https://t.me/htw0702tgtw"],
    ["Telegram · " + t("日本", "Japan", "日本"), "@htw0702tgjp", "https://t.me/htw0702tgjp"],
  ];
  main.innerHTML =
    sub(titles().social, "Social", t("Instagram、Threads、X。點開就是頁面。", "Instagram, Threads, and X. Each link opens the profile.", "Instagram、Threads、X。開くとプロフィールです。")) +
    `<section class="section"><div class="social-grid">${social
      .map(([n, h, u], i) =>
        u
          ? `<a class="social reveal" style="--i:${i}" href="${u}" target="_blank" rel="me noopener"><b>${n}</b><span>${h}</span><em>↗</em></a>`
          : `<div class="social reveal" style="--i:${i}"><b>${n}</b><span>${h}</span><button class="button" type="button" id="copy-discord">${esc(t("複製帳號", "Copy username", "ユーザー名をコピー"))}</button></div>`,
      )
      .join("")}</div><h2>${esc(t("寫信", "Write", "メール"))}</h2><div class="cta-row"><a class="btn solid" href="mailto:taiwan@htw0702.com">taiwan@htw0702.com</a><a class="btn" href="mailto:japan@htw0702.com">japan@htw0702.com</a></div></section>`;
  $("#copy-discord")?.addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText("htw0702dc");
      e.target.textContent = t("已複製", "Copied", "コピーしました");
    } catch {
      e.target.textContent = "htw0702dc";
    }
  });
}

async function store() {
  const mine = renderToken;
  main.innerHTML =
    sub(titles().store, "Shop", ledes().store) +
    `<section class="section"><div id="shop-intro"></div><div id="products"></div><p id="goods-note" class="goods-empty" hidden></p><div id="payments" class="cta-row"></div></section>`;
  try {
    const items = await content("store");
    if (mine !== renderToken || !$("#products")) return;
    const goods = items.filter((x) => x.source !== "site");
    const seed = items.find((x) => x.source === "site");
    $("#shop-intro").innerHTML = seed ? `<p class="lede">${esc(seed.body)}</p>` : "";
    $("#products").innerHTML = goods.length ? posts(goods) : "";
    const note = $("#goods-note");
    if (!goods.length && note) {
      note.hidden = false;
      note.textContent = t("目前沒有上架商品。", "Nothing is listed for sale.", "販売中の品はありません。");
    }
  } catch {
    if (mine === renderToken && $("#products")) $("#products").textContent = unavailableCopy();
  }
  try {
    const d = await api("payments");
    if (mine !== renderToken || !$("#payments")) return;
    for (const [n, u] of [
      ["Wise", d.wise],
      ["PayPal", d.paypal],
    ]) {
      try {
        if (u && new URL(u).protocol === "https:")
          $("#payments").insertAdjacentHTML("beforeend", `<a class="btn" rel="noopener" href="${esc(u)}">${n} ↗</a>`);
      } catch {}
    }
    if (d.bitcoin) {
      const p = document.createElement("p");
      p.className = "note";
      p.textContent = "Bitcoin: " + d.bitcoin;
      $("#payments").append(p);
    }
  } catch {}
}

const kindLabel = (kind) =>
  ({
    blog: t("手記", "Journal", "手記"),
    works: t("作品", "Works", "作品"),
    wiki: t("維基", "Wiki", "ウィキ"),
    store: t("小賣所", "Shop", "売店"),
    now: t("現在", "Now", "いま"),
    page: t("頁面", "Page", "ページ"),
  })[kind] || kind;

async function searchPage() {
  const mine = renderToken;
  const initial = new URLSearchParams(location.search).get("q") || "";
  main.innerHTML =
    sub(titles().search, "Search") +
    `<section class="section"><form class="search-form" id="search-form" role="search"><input id="q" name="q" value="${esc(initial)}" maxlength="80" autocomplete="off" aria-label="${esc(t("搜尋公開內容", "Search public pages", "公開ページを検索"))}" placeholder="${esc(t("手記、作品、維基、社群…", "Journal, works, wiki, social…", "手記、作品、ウィキ、ソーシャル…"))}"><button class="btn solid" type="submit">${esc(t("搜尋", "Search", "検索"))}</button></form><div id="results"></div></section>`;
  const box = $("#results");
  const input = $("#q");
  async function run(q) {
    const here = renderToken;
    const url = link("search") + (q ? `?q=${encodeURIComponent(q)}` : "");
    history.replaceState(null, "", url);
    box.innerHTML = `<p class="note">${esc(t("讀取中…", "Loading…", "読み込み中…"))}</p>`;
    try {
      const d = await api("search?locale=" + lang + "&q=" + encodeURIComponent(q));
      if (here !== renderToken || !$("#results")) return;
      const items = d.items || [];
      box.innerHTML = items.length
        ? items
            .map(
              (x) =>
                `<a class="result" href="${esc(x.href)}"><small>${esc(kindLabel(x.kind))}</small><strong>${esc(x.name)}</strong><span>${esc(x.snippet || "")}</span></a>`,
            )
            .join("")
        : `<p class="empty">${esc(t("沒有符合的內容。", "Nothing matches.", "一致するものはありません。"))}</p>`;
    } catch {
      if (here === renderToken && box) box.textContent = unavailableCopy();
    }
  }
  $("#search-form").onsubmit = (e) => {
    e.preventDefault();
    run(input.value.trim());
  };
  input.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => run(input.value.trim()), 180);
  };
  if (mine === renderToken) await run(initial.trim());
}

function notFound() {
  main.innerHTML =
    sub(t("這條路還沒有頁面。", "This path has no page.", "この道にはページがありません。"), "404") +
    `<section class="section"><p>${esc(t("回到首頁，或前往社群與搜尋。", "Go home, or open social and search.", "ホームへ戻るか、ソーシャルと検索へ。"))}</p><div class="cta-row"><a class="btn solid" href="${link("")}">${esc(t("回到首頁", "Back home", "ホームへ"))}</a><a class="btn" href="${link("social")}">${esc(t("社群", "Social", "ソーシャル"))}</a><a class="btn" href="${link("search")}">${esc(t("搜尋", "Search", "検索"))}</a></div></section>`;
}

async function admin() {
  const mine = renderToken;
  document.head.insertAdjacentHTML("beforeend", '<meta name="robots" content="noindex,nofollow">');
  main.innerHTML =
    sub(t("內容工作室", "Studio", "スタジオ"), "Studio") +
    `<section class="section" id="studio"><p>${esc(t("確認登入狀態…", "Checking sign-in…", "ログイン状態を確認中…"))}</p></section>`;
  let meData;
  try {
    meData = await api("me");
  } catch {
    if (mine !== renderToken || !$("#studio")) return;
    let h = {};
    try {
      h = await api("health");
    } catch {}
    $("#studio").innerHTML = `<div class="panel"><h2>${esc(t("只有你的 Apple 帳號能進入。", "Your Apple account is the only way in.", "あなたの Apple アカウント専用です。"))}</h2><p>${h.auth ? esc(t("登入後即可管理內容與外觀。", "Sign in to manage content and appearance.", "ログインして内容と外観を管理できます。")) : esc(t("Apple 登入與資料庫尚未完成設定，所有寫入保持鎖定。", "Apple sign-in and database setup are incomplete. All writes remain locked.", "Apple ログインとデータベースの設定が未完了のため、書き込みはロックされています。"))}</p>${h.auth ? `<a class="button primary" href="/api/auth/start?locale=${lang}">Apple · ${esc(t("登入", "Sign in", "ログイン"))}</a>` : ""}</div>`;
    return;
  }
  if (mine !== renderToken || !$("#studio")) return;
  const headers = { "X-CSRF-Token": meData.csrf };
  let records = [];
  const kinds = ["blog", "works", "wiki", "now", "store"];
  $("#studio").innerHTML = `<div class="appearance"><h2>${esc(t("外觀", "Appearance", "外観"))}</h2><form id="appearance-form"><div class="form-grid"><label>${esc(t("佈景", "Theme", "テーマ"))}<select name="theme">${themeOptions()
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("")}</select></label><label>${esc(t("強調色", "Accent", "アクセント"))}<input type="color" name="accent"></label></div>${["tw", "en", "jp"]
    .map(
      (l) =>
        `<label>${languageNames[lang][["tw", "en", "jp"].indexOf(l)]} · ${esc(t("首頁標題", "Home headline", "ホーム見出し"))}<input name="hero-${l}" maxlength="120" required></label>`,
    )
    .join("")}<label><span><input type="checkbox" name="motion"> ${esc(t("啟用動態", "Enable motion", "モーション"))}</span></label><label><span><input type="checkbox" name="sound"> ${esc(t("音效設定（公開頁不自動播放）", "Sound setting (the public site does not autoplay)", "音声設定（公開ページでは自動再生しません）"))}</span></label><button class="button primary" type="submit">${esc(t("儲存並套用", "Save and apply", "保存して適用"))}</button><p id="appearance-status" role="status"></p></form></div><div class="studio-grid"><aside><button class="button" type="button" id="new">＋ ${esc(t("新增內容", "New entry", "新規作成"))}</button><button class="button" type="button" id="notion-sync">Notion ↓ ${esc(t("同步", "Sync", "同期"))}</button><button class="button" type="button" id="slack-test">Slack · ${esc(t("發送測試通知", "Send test notification", "テスト通知を送信"))}</button><button class="button" type="button" id="logout">${esc(t("登出", "Sign out", "ログアウト"))}</button><div id="record-list"></div></aside><form id="editor"><input name="id" type="hidden"><input name="version" type="hidden"><div class="form-grid"><label>${esc(t("內容種類", "Content type", "種類"))}<select name="kind">${kinds.map((k) => `<option>${k}</option>`).join("")}</select></label><label>${esc(t("語言", "Language", "言語"))}<select name="locale">${["tw", "en", "jp"].map((l) => `<option>${l}</option>`).join("")}</select></label><label>${esc(t("可見性", "Visibility", "公開設定"))}<select name="visibility"><option value="private">${esc(t("私人草稿", "Private draft", "非公開下書き"))}</option><option value="public">${esc(t("公開", "Public", "公開"))}</option></select></label><label>Slug<input name="slug" pattern="[a-z0-9-]{1,80}" required></label></div><label>${esc(t("標題", "Title", "タイトル"))}<input name="title" maxlength="200" required></label><label>${esc(t("內容", "Content", "本文"))}<textarea name="body" maxlength="30000" required></textarea></label><button class="button primary" id="save-entry" type="submit">${esc(t("儲存", "Save", "保存"))}</button><p class="status" id="save-status" role="status"></p></form></div>`;
  const af = $("#appearance-form");
  const f = $("#editor");
  const field = (n) => f.elements.namedItem(n);
  let settings = await api("appearance");
  if (mine !== renderToken) return;
  for (const k of ["theme", "accent"]) af.elements[k].value = settings[k];
  for (const k of ["motion", "sound"]) af.elements[k].checked = settings[k];
  for (const l of ["tw", "en", "jp"]) af.elements["hero-" + l].value = settings.hero[l];
  af.onsubmit = async (e) => {
    e.preventDefault();
    const x = {
      theme: af.elements.theme.value,
      accent: af.elements.accent.value,
      motion: af.elements.motion.checked,
      sound: af.elements.sound.checked,
      hero: Object.fromEntries(["tw", "en", "jp"].map((l) => [l, af.elements["hero-" + l].value])),
    };
    const b = af.querySelector("button");
    b.disabled = true;
    try {
      applyAppearance(await api("appearance", { method: "POST", headers, body: JSON.stringify(x) }));
      $("#appearance-status").textContent = t("已儲存，公開網站重新載入後生效。", "Saved. Public pages apply it on reload.", "保存しました。公開ページの再読み込みで反映されます。");
    } catch {
      $("#appearance-status").textContent = unavailableCopy();
    } finally {
      b.disabled = false;
    }
  };
  function clear() {
    f.reset();
    for (const el of f.elements) el.disabled = false;
    field("id").value = "";
    field("version").value = "";
    field("locale").value = lang;
    $("#save-status").textContent = "";
  }
  async function refresh() {
    records = (await api("entries")).entries;
    $("#record-list").replaceChildren();
    for (const x of records) {
      const b = document.createElement("button");
      b.className = "button";
      b.type = "button";
      b.textContent = x.title + " · " + x.locale + " · " + x.visibility;
      b.onclick = () => {
        clear();
        for (const k of ["id", "version", "kind", "locale", "visibility", "slug", "title", "body"]) field(k).value = x[k];
        if (x.source === "notion") {
          for (const el of f.elements) el.disabled = true;
          $("#save-status").textContent = t("此內容由 Notion 管理，請在 Notion 修改後同步。", "This entry is managed in Notion. Edit it there, then sync.", "Notion 管理の記事です。Notion で編集して同期してください。");
        }
      };
      $("#record-list").append(b);
    }
  }
  for (const [id, path, ready] of [["slack-test", "slack/test", meData.connections.slack]]) {
    const b = $("#" + id);
    b.disabled = !ready;
    b.onclick = async () => {
      b.disabled = true;
      try {
        await api(path, { method: "POST", headers, body: "{}" });
        $("#save-status").textContent = t("已完成。", "Completed.", "完了しました。");
      } catch {
        $("#save-status").textContent = unavailableCopy();
      } finally {
        b.disabled = false;
      }
    };
  }
  $("#new").onclick = clear;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const x = Object.fromEntries(new FormData(f));
    x.version = Number(x.version) || 0;
    x.meta = {};
    $("#save-entry").disabled = true;
    try {
      const d = await api("entries", { method: "POST", headers, body: JSON.stringify(x) });
      field("id").value = d.entry.id;
      field("version").value = d.entry.version;
      await refresh();
      $("#save-status").textContent = t("已儲存。", "Saved.", "保存しました。");
    } catch (e) {
      $("#save-status").textContent =
        e.message === "409"
          ? t("內容有衝突，請重新選取紀錄後再編輯。", "Conflict: reload the entry before editing again.", "競合があります。記事を選び直してください。")
          : unavailableCopy();
    } finally {
      $("#save-entry").disabled = false;
    }
  };
  $("#notion-sync").disabled = !meData.connections.notion;
  $("#notion-sync").onclick = async (e) => {
    e.target.disabled = true;
    try {
      await api("notion/sync", { method: "POST", headers, body: "{}" });
      await refresh();
      $("#save-status").textContent = t("Notion 已同步。", "Notion synced.", "Notion を同期しました。");
    } catch {
      $("#save-status").textContent = unavailableCopy();
    } finally {
      e.target.disabled = false;
    }
  };
  $("#logout").onclick = async () => {
    await api("auth/logout", { method: "POST", headers, body: "{}" });
    location.reload();
  };
  clear();
  await refresh();
}

function games() {
  main.innerHTML =
    sub(titles().games, "Games", ledes().games) +
    `<section class="section">${mosCard()}</section>`;
}
async function draw() {
  if (!route) return home();
  if (route === "me" || route === "contact" || route === "social") return me();
  if (route === "games") return games();
  if (route === "search") return searchPage();
  if (route === "admin") return admin();
  if (route === "store") return store();
  if (["works", "wiki", "blog", "now"].includes(route)) return cms(route);
  return notFound();
}

async function render(opts = {}) {
  clearTimeout(searchTimer);
  const mine = ++renderToken;
  readRoute();
  $("#pause-dock")?.append($("#pause-motion"));
  paintChrome();
  applySeo();
  try {
    await draw();
  } catch {
    if (mine === renderToken) main.insertAdjacentHTML("beforeend", `<section class="section"><p>${unavailableCopy()}</p></section>`);
  }
  if (mine !== renderToken) return;
  placePause();
  sizeStory();
  storyFrame();
  if (opts.enter && motionOK()) {
    main.classList.remove("page-enter");
    void main.offsetWidth;
    main.classList.add("page-enter");
  }
  if (opts.focus) {
    const h = main.querySelector("h1");
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }
}

function isLocalePath(pathname) {
  return ["tw", "en", "jp"].includes(pathname.split("/").filter(Boolean)[0]);
}
async function navigate(href, { push = true, focus = true } = {}) {
  const url = new URL(href, location.origin);
  const run = async () => {
    if (push) history.pushState({}, "", url.pathname + url.search + url.hash);
    await render({ enter: false, focus });
  };
  if (motionOK() && document.startViewTransition) {
    try {
      await document.startViewTransition(() => run()).finished;
    } catch {}
  } else {
    await run();
    if (motionOK()) {
      main.classList.remove("page-enter");
      void main.offsetWidth;
      main.classList.add("page-enter");
    }
  }
  const id = decodeURIComponent(url.hash.replace(/^#/, ""));
  if (id && document.getElementById(id)) document.getElementById(id).scrollIntoView({ behavior: motionOK() ? "smooth" : "auto" });
  else window.scrollTo(0, 0);
}

function bindMotion() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          entry.target.classList.remove("pending");
          io.unobserve(entry.target);
        }
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
  );
  const arm = () =>
    document.querySelectorAll(".reveal:not(.in):not(.pending)").forEach((el, i) => {
      if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", String(i % 8));
      const r = el.getBoundingClientRect();
      const seen = r.bottom > 0 && r.top < innerHeight * 0.92;
      if (seen || !motionOK()) el.classList.add("in");
      else {
        el.classList.add("pending");
        io.observe(el);
      }
    });
  new MutationObserver(arm).observe(main, { childList: true, subtree: true });
  arm();
  let ticking = false;
  addEventListener("resize", () => {
    sizeStory();
    storyFrame();
  });
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !motionOK()) return;
    const cursor = document.getElementById("cursor");
    if (cursor) {
      cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cursor.classList.add("on");
      cursor.classList.toggle("hot", Boolean(e.target.closest?.("a,button")));
    }
    document.querySelectorAll(".magnetic.moving").forEach((el) => {
      if (el !== e.target.closest?.(".magnetic")) {
        el.classList.remove("moving");
        el.style.transform = "";
      }
    });
    const el = e.target.closest?.(".magnetic");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add("moving");
    el.style.transform = `translate(${(px * 10).toFixed(1)}px, ${(py * 8).toFixed(1)}px)`;
  });
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const y = scrollY;
        const bar = $("#progress");
        if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        document.body.classList.toggle("is-scrolled", y > 8);
        $("#to-top")?.classList.toggle("show", y > innerHeight * 0.72);
        storyFrame();
        ticking = false;
      });
    },
    { passive: true },
  );
}

function bindChrome() {
  $("#menu").onclick = () => {
    const open = $("#nav").classList.toggle("open");
    $("#menu").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  };
  $("#language").onchange = (e) => {
    if (painting) return;
    navigate(`/${e.target.value}/${route}${location.search}`);
  };
  document.addEventListener("click", (e) => {
    const pause = e.target.closest("#pause-motion");
    if (!pause) return;
    const pausing = document.documentElement.dataset.play !== "off";
    document.documentElement.dataset.play = pausing ? "off" : "on";
    syncPauseLabel();
    syncField();
  });
  $("#to-top").onclick = () => window.scrollTo({ top: 0, behavior: motionOK() ? "smooth" : "auto" });
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    let url;
    try {
      url = new URL(a.href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/images/")) return;
    if (!isLocalePath(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (url.hash) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: motionOK() ? "smooth" : "auto" });
      return;
    }
    e.preventDefault();
    $("#nav").classList.remove("open");
    $("#menu").setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    navigate(url.pathname + url.search + url.hash);
  });
  addEventListener("popstate", () => navigate(location.pathname + location.search + location.hash, { push: false, focus: false }));
}
function clock() {
  const el = $("#clock");
  if (!el) return;
  const locale = { tw: "zh-Hant-TW", en: "en-GB", jp: "ja-JP" }[lang] || "zh-Hant-TW";
  el.textContent =
    new Intl.DateTimeFormat(locale, { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" }).format(new Date()) + " · Taipei";
}

let media = {
  youtube: {
    handle: "htw0702yt",
    channelUrl: "https://www.youtube.com/@htw0702yt",
    videoId: "",
    placeholder: true,
  },
};
async function loadMedia() {
  try {
    const r = await fetch("/assets/media.json");
    if (!r.ok) return;
    const data = await r.json();
    if (data?.youtube && typeof data.youtube === "object") media = { ...media, ...data, youtube: { ...media.youtube, ...data.youtube } };
  } catch {}
}
function hydrateWatch(root = document) {
  const box = root.querySelector("[data-yt]");
  if (!box || box.dataset.ready === "1") return;
  box.dataset.ready = "1";
  const yt = media.youtube || {};
  const id = String(yt.videoId || "");
  const ok = /^[A-Za-z0-9_-]{6,20}$/.test(id);
  const flag = root.querySelector("[data-yt-flag]");
  if (flag) {
    const preview = yt.placeholder !== false;
    flag.hidden = !preview;
    flag.textContent = preview ? t("預覽片段", "Preview clip", "プレビュー") : "";
  }
  const channel = root.querySelector("[data-yt-channel]");
  if (channel && /^https:\/\/(www\.)?youtube\.com\//.test(yt.channelUrl || "")) channel.href = yt.channelUrl;
  let started = false;
  const play = () => {
    if (started || !ok) return;
    started = true;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = t("YouTube 預覽", "YouTube preview", "YouTube プレビュー");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.loading = "lazy";
    iframe.setAttribute("allowfullscreen", "");
    box.classList.add("is-live");
    box.replaceChildren(iframe);
  };
  box.querySelector("[data-yt-play]")?.addEventListener("click", play);
  if (ok && motionOK()) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        play();
        io.disconnect();
      }
    }, { rootMargin: "160px" });
    io.observe(box);
  }
}
function bindField() {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const dots = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.35 + Math.random() * 0.65,
    r: 0.6 + Math.random() * 1.5,
  }));
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = false;
  let px = 0.5;
  let py = 0.35;
  let tx = 0.5;
  let ty = 0.35;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
  };
  const frame = (time) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const dpr = w / Math.max(innerWidth, 1);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const drift = (time * 0.00002 + i * 0.01) * d.z;
      const x = ((d.x + drift) % 1) * w + (px - 0.5) * 36 * d.z * dpr;
      const y = ((d.y + drift * 0.45) % 1) * h + (py - 0.5) * 24 * d.z * dpr;
      ctx.beginPath();
      ctx.fillStyle = d.z > 0.72 ? "rgba(196,181,253,0.55)" : "rgba(122,215,234,0.38)";
      ctx.arc(x, y, d.r * dpr * d.z, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const start = () => {
    if (running) return;
    if (!motionOK() || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    running = true;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  resize();
  addEventListener("resize", () => {
    resize();
    if (!running) ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX / Math.max(innerWidth, 1);
    ty = e.clientY / Math.max(innerHeight, 1);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  window.syncField = () => (motionOK() ? start() : stop());
  start();
}
function syncField() {
  window.syncField?.();
}
readRoute();
bindChrome();
bindMotion();
bindField();
await loadMedia();
await render({ enter: false });
try {
  applyAppearance(await api("appearance"));
} catch {}
clock();
setInterval(clock, 30000);
if (location.hash) {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  document.getElementById(id)?.scrollIntoView();
}
