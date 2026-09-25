const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const REJECTED = new RegExp(
  ["\u82b1\u706b", "\u591c\u5e02", "\u796d\u5178", "\u66ae\u971e", "\u6e2f\u753a", "\u590f\u796d", "fire" + "works", "night " + "market"].join("|"),
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
    ["dusk", t("紙色", "Paper", "紙")],
    ["day", t("亮紙", "Bright", "明るい紙")],
    ["night", t("夜讀", "Night", "夜")],
  ];
}
function navItems() {
  return [
    ["wiki", t("維基", "Wiki", "ウィキ")],
    ["blog", t("手記", "Journal", "手記")],
    ["works", t("作品", "Works", "作品")],
    ["social", t("社群", "Social", "ソーシャル")],
    ["store", t("小賣所", "Shop", "売店")],
    ["plans", t("計畫", "Plans", "計画")],
    ["now", t("現在", "Now", "いま")],
    ["search", t("搜尋", "Search", "検索")],
    ["games/lol", "LoL"],
  ];
}
function titles() {
  return {
    works: t("作品", "Works", "作品"),
    wiki: t("關於筳筳", "About Ting Ting", "筳筳について"),
    blog: t("手記", "Journal", "手記"),
    world: t("一個尚未存在的計畫", "A plan, not a place", "まだ存在しない計画"),
    me: t("社群", "Social", "ソーシャル"),
    social: t("社群", "Social", "ソーシャル"),
    plans: t("三個長期的希望", "Three long-term hopes", "三つの長期の希望"),
    search: t("搜尋", "Search", "検索"),
    now: t("現在公開的", "Public right now", "いま公開していること"),
    store: t("小賣所", "Shop", "売店"),
  };
}
function ledes() {
  return {
    works: t("完成並公開的作品。", "Work that is finished and public.", "完成して公開している作品。"),
    wiki: t("公開維基。私人筆記不會出現在這裡。", "The public wiki. Private notes stay off this page.", "公開ウィキ。非公開のメモは載せません。"),
    blog: t("寫下來、並公開的文字。", "Writing that has been made public.", "書いて、公開した文章。"),
    world: t("可以走進去的世界仍是長期希望。這一頁不是場景介紹。", "A world you can step into is still a long-term hope. This page is not a tour.", "歩いて入れる世界は、まだ長期の希望です。見学ページではありません。"),
    now: t("現在願意公開的近況。", "What is public right now.", "いま公開していること。"),
    store: t("個人周邊與支持的入口。有設定的品項才會列在這裡。", "A door for personal goods and support. Items appear here only after they are configured.", "品とサポートの入口。設定した品だけを並べます。"),
  };
}
function planCopy() {
  return [
    {
      slug: "animation",
      name: t("一部自己的動畫電影", "My own animated film", "自分のアニメ映画"),
      desc: t(
        "希望有一天用光、風景、人物與音樂，完成一部自己的動畫。這裡只放公開進度。",
        "A hope to one day finish an animated film. Only public progress is shown.",
        "いつか自分のアニメ映画を完成させたい。公開できる進捗だけを載せます。",
      ),
    },
    {
      slug: "ai",
      name: t("一位自己的 AI 助理", "My own AI assistant", "自分のAIアシスタント"),
      desc: t(
        "希望做成能協助生活、也尊重權限與隱私的個人助理。這裡只放公開進度。",
        "A hope to build a personal assistant that respects permissions and privacy.",
        "暮らしを助け、権限とプライバシーを大切にする個人アシスタントを作りたい。",
      ),
    },
    {
      slug: "metaverse",
      name: t("一個可以走進去的世界", "A world you can step into", "歩いて入れる世界"),
      desc: t(
        "希望將來有一個可以走進去的虛擬世界。它還不存在。",
        "A hope for a virtual world people can enter. It does not exist yet.",
        "歩いて入れる仮想世界を、いつか作りたい。いまは存在しません。",
      ),
    },
  ];
}
function collection() {
  return [
    {
      href: "wiki",
      no: "01",
      kicker: "WIKI",
      title: t("關於筳筳", "About Ting Ting", "筳筳について"),
      text: t("個人維基。公開的介紹在這一頁，私人筆記不會出現。", "The personal wiki. Public notes live here.", "個人ウィキ。公開している紹介だけを置きます。"),
      photo: true,
    },
    {
      href: "blog",
      no: "02",
      kicker: "JOURNAL",
      title: t("手記", "Journal", "手記"),
      text: t("Hello。生活、科技、學習、旅行與作品，有寫下來的才會出現。", "Hello. Life, technology, study, travel, and projects — only what is written down.", "Hello。暮らし、技術、学び、旅、作品。書いたものだけ。"),
      mark: t("記", "Hi", "記"),
      viz: "#e4ddd2",
    },
    {
      href: "works",
      no: "03",
      kicker: "WORKS",
      title: t("作品", "Works", "作品"),
      text: t("目前公開的作品是這座網站 htw0702.com。繁體中文為主，並有英文與日文。", "The public work listed now is this site, htw0702.com.", "いま公開している作品は、このサイト htw0702.com。"),
      mark: ".com",
      viz: "#d9e0db",
    },
    {
      href: "social",
      no: "04",
      kicker: "SOCIAL",
      title: t("社群", "Social", "ソーシャル"),
      text: t("Instagram htw0702ig、Threads htw0702threads、X htw0702x。", "Instagram htw0702ig, Threads htw0702threads, and X htw0702x.", "Instagram htw0702ig、Threads htw0702threads、X htw0702x。"),
      mark: "@",
      viz: "#e7e0d6",
    },
    {
      href: "store",
      no: "05",
      kicker: "SHOP",
      title: t("小賣所", "Shop", "売店"),
      text: t("目前沒有上架商品。付款連結只在設定完成後出現。", "Nothing is for sale yet. Payment links appear only after they are configured.", "いま販売している品はありません。決済リンクは設定後だけ表示します。"),
      mark: "—",
      viz: "#ece7df",
    },
    {
      href: "plans",
      no: "06",
      kicker: "PLANS",
      title: t("計畫", "Plans", "計画"),
      text: t("動畫電影、個人 AI 助理、可以走進去的世界。三件都還是長期的希望。", "An animated film, a personal AI assistant, and a world you can step into.", "アニメ映画、個人のAIアシスタント、歩いて入れる世界。まだ希望です。"),
      mark: "03",
      viz: "#ddd6cc",
    },
    {
      href: "now",
      no: "07",
      kicker: "NOW",
      title: t("現在", "Now", "いま"),
      text: t("現在公開的是這個網站。繁體中文為主，英文與日文也可以讀。", "What is public right now is this website, in three languages.", "いま公開しているのは、このサイトです。"),
      mark: "Now",
      viz: "#e5ebe4",
    },
    {
      href: "search",
      no: "08",
      kicker: "SEARCH",
      title: t("搜尋", "Search", "検索"),
      text: t("在公開頁面、手記、作品與維基裡找一句話。", "Find a line across the public pages, journal, works, and wiki.", "公開ページ、手記、作品、ウィキから一文を探します。"),
      mark: "Aa",
      viz: "#e6e2da",
    },
    {
      href: "games/lol",
      no: "09",
      kicker: "LOL",
      title: "League of Legends",
      text: t("帳號 htw0702rg#0702。只在同步之後顯示已公開的場次。", "Account htw0702rg#0702. Published matches appear only after an admin sync.", "アカウント htw0702rg#0702。同期した公開試合だけを表示します。"),
      mark: "0702",
      viz: "#d5ddd8",
    },
  ];
}
const emptyCopy = () => t("還沒有公開內容。", "No public entries yet.", "公開記事はまだありません。");
const unavailableCopy = () =>
  t("暫時無法讀取，請稍後重新整理。", "Temporarily unavailable. Please refresh later.", "一時的に読み込めません。後でもう一度お試しください。");

let appearance = {
  theme: "dusk",
  accent: "#234238",
  motion: true,
  sound: false,
  hero: { tw: "筳筳。", en: "Ting Ting.", jp: "筳筳。" },
};
function heroText() {
  const raw = String(appearance.hero?.[lang] || appearance.hero?.tw || "").trim();
  if (!raw || REJECTED.test(raw)) return t("筳筳。", "Ting Ting.", "筳筳。");
  return raw;
}
function paintHeadline() {
  const h = document.querySelector("[data-headline]");
  if (h) h.textContent = heroText();
}
function applyAppearance(x) {
  appearance = x;
  document.body.dataset.theme = x.theme || "dusk";
  document.body.dataset.motion = String(x.motion !== false);
  const accent = /^#e8b495$/i.test(x.accent || "") ? "#234238" : x.accent;
  if (accent) document.documentElement.style.setProperty("--accent", accent);
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
  const media = item.photo
    ? `<div class="viz"><img src="/images/IMG_5309.jpeg" alt=""></div>`
    : `<div class="viz" style="--viz:${item.viz}"><b>${esc(item.mark)}</b></div>`;
  return `<a class="piece reveal" href="${link(item.href)}" style="--i:${i}"><div class="piece-top"><span class="num">${item.no}</span><small>${esc(item.kicker)}</small></div>${media}<h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><em>${t("開啟", "Open", "開く")} →</em></a>`;
}
function plansHTML() {
  return `<div class="plans">${planCopy()
    .map(
      (p, i) =>
        `<a class="plan reveal" href="${link("plans/" + p.slug)}" style="--i:${i}"><div class="plan-top"><span class="num">0${i + 1}</span><small>PLAN</small></div><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><em>${t("開啟", "Open", "開く")} →</em></a>`,
    )
    .join("")}</div>`;
}
function sub(title, kicker, desc = "") {
  return `<section class="page-hero"><p class="kicker"><span>${esc(kicker)}</span></p><h1>${esc(title)}</h1>${desc ? `<p class="lede">${esc(desc)}</p>` : ""}</section>`;
}

function home() {
  main.innerHTML = `<section class="stage" id="intro"><div class="frame"><div class="frame-media"><img class="hero-photo" src="/images/IMG_5309.jpeg" width="1500" height="2000" alt="${esc(t("王顥筳", "Wang Hao Ting", "王顥筳"))}"><div class="sweep" aria-hidden="true"></div><div class="veil" aria-hidden="true"></div></div><div class="frame-tools" id="pause-slot"></div><div class="hero-copy"><p class="kicker"><span>HTW0702</span><span>TAIWAN</span></p><h1><span class="line-a" data-headline>${esc(heroText())}</span><span class="line-b">${esc(t("公開的頁面。", "The public pages.", "公開しているページ。"))}</span></h1><div class="captions"><p class="paper">${esc(t("我是王顥筳（筳筳），來自台灣。這個網站是一件作品，也是維基、手記與社群的入口。", "I’m Wang Hao Ting — Ting Ting — from Taiwan. This website is a work, and the door to the wiki, journal, and social pages.", "王顥筳、筳筳です。台湾出身。このサイト自体が作品で、ウィキ、手記、ソーシャルへの入口です。"))}</p><p class="paper">${esc(t("長期的希望有三件：一部動畫電影、一位個人 AI 助理，以及一個可以走進去的世界。它們還是計畫。", "Three long-term hopes: an animated film, a personal AI assistant, and a world you can step into. They are still plans.", "長く続けたいことは三つ。アニメ映画、個人のAIアシスタント、歩いて入れる世界。どれも、まだ計画です。"))}</p></div><a class="goto" href="#collection"><span>${esc(t("看公開頁面", "See the pages", "ページを見る"))}</span><i aria-hidden="true">↓</i></a></div></div></section><div class="sheet"><section id="collection" aria-labelledby="collection-title"><div class="block-head"><p class="index">01 — 09</p><h2 id="collection-title">${esc(t("公開頁面", "Public pages", "公開ページ"))}</h2><p>${esc(t("維基、手記、作品、社群、小賣所、計畫、現在、搜尋，以及 League of Legends。", "Wiki, journal, works, social, shop, plans, now, search, and League of Legends.", "ウィキ、手記、作品、ソーシャル、売店、計画、いま、検索、そして League of Legends。"))}</p></div><div class="cards">${collection().map(card).join("")}</div></section><section class="hopes" id="hopes" aria-labelledby="hopes-title"><div class="block-head"><p class="index">10 — 12</p><h2 id="hopes-title">${esc(titles().plans)}</h2><p>${esc(t("還沒有完成。這裡只放公開的方向。", "None of these are finished. Only the public direction is here.", "まだ完成していません。公開している方向だけを置きます。"))}</p></div>${plansHTML()}</section><section class="person" aria-labelledby="person-title"><figure class="reveal"><img src="/images/IMG_5309.jpeg" width="1500" height="2000" alt="${esc(t("王顥筳", "Wang Hao Ting", "王顥筳"))}"><figcaption>筳筳 · Wang Hao Ting</figcaption></figure><div><p class="kicker"><span>ABOUT</span></p><h2 id="person-title">王顥筳</h2><p class="lede">${esc(t("筳筳，htw0702。來自台灣。公開的頁面從這裡開始。", "Ting Ting, htw0702. From Taiwan. The public pages start here.", "筳筳、htw0702。台湾出身。公開ページはここから始まります。"))}</p><ul class="facts"><li><a href="mailto:taiwan@htw0702.com">taiwan@htw0702.com</a></li><li><a href="mailto:japan@htw0702.com">japan@htw0702.com</a></li><li><a href="https://instagram.com/htw0702ig" target="_blank" rel="me noopener">Instagram · htw0702ig</a></li><li><a href="https://www.threads.net/@htw0702threads" target="_blank" rel="me noopener">Threads · htw0702threads</a></li><li><a href="https://x.com/htw0702x" target="_blank" rel="me noopener">X · htw0702x</a></li></ul><a class="text-link" href="${link("wiki")}">${esc(t("維基裡的介紹", "Read the wiki", "ウィキを読む"))} →</a></div></section></div>`;
}

async function cms(kind) {
  const mine = renderToken;
  const loading = t("讀取中…", "Loading…", "読み込み中…");
  const shelf =
    kind === "wiki"
      ? `<div class="wiki-layout"><figure class="portrait reveal"><img src="/images/IMG_5309.jpeg" width="1500" height="2000" alt="${esc(t("王顥筳", "Wang Hao Ting", "王顥筳"))}"><figcaption>筳筳 · Wang Hao Ting</figcaption></figure><div id="entries">${loading}</div></div>`
      : `<div id="entries">${loading}</div>`;
  const kick = { works: "Works", wiki: "Wiki", blog: "Journal", world: "Plan", now: "Now" }[kind] || kind;
  const extra =
    kind === "world"
      ? `<p class="note">${esc(t("這不是一個已經存在的地方。詳細的方向在計畫頁。", "This is not a place that exists. The direction lives on the plans page.", "これは、すでに存在する場所ではありません。方向は計画のページにあります。"))}</p><p><a class="text-link" href="${link("plans/metaverse")}">${esc(t("閱讀這個計畫", "Read the plan", "計画を読む"))} →</a></p>`
      : "";
  main.innerHTML = sub(titles()[kind] || kind, kick, ledes()[kind] || "") + `<section class="section">${shelf}${extra}</section>`;
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

const kda = (x) =>
  [x.kills, x.deaths, x.assists].every((v) => typeof v === "number") ? (x.kills + x.assists) / Math.max(1, x.deaths) : null;
function chart(items) {
  const vals = items.map(kda);
  const max = Math.max(5, ...vals.filter((v) => v !== null));
  return `<svg class="chart" viewBox="0 0 520 220" role="img" aria-label="KDA"><path class="grid" d="M40 20V180H500 M40 100H500 M40 20H500"/><text x="5" y="24">${max.toFixed(1)}</text><text x="15" y="184">0</text>${items
    .map((x, i) => {
      const v = vals[i];
      const px = 50 + (i * 440) / Math.max(1, items.length - 1);
      const py = 180 - ((v || 0) / max) * 160;
      return v === null
        ? ""
        : `<circle cx="${px}" cy="${py}" r="5"><title>${esc(x.playedAt || "")} · KDA ${v.toFixed(2)}</title></circle><text x="${px}" y="${py - 12}" text-anchor="middle">${v.toFixed(2)}</text><text x="${px}" y="210" text-anchor="middle">${i + 1}</text>`;
    })
    .join("")}${vals
    .map((v, i) =>
      i && v !== null && vals[i - 1] !== null
        ? `<path class="series" d="M${50 + ((i - 1) * 440) / Math.max(1, items.length - 1)} ${180 - (vals[i - 1] / max) * 160} L${50 + (i * 440) / Math.max(1, items.length - 1)} ${180 - (v / max) * 160}"/>`
        : "",
    )
    .join("")}</svg>`;
}
function review(x) {
  const v = kda(x);
  const kp = x.teamKills > 0 && x.kills != null && x.assists != null ? (((x.kills + x.assists) / x.teamKills) * 100).toFixed(1) + "%" : "—";
  return `<p>KDA ${v === null ? "—" : v.toFixed(2)} · ${esc(t("擊殺參與率", "Kill participation", "キル参加率"))} ${kp}</p><p>${esc(t("復盤時可以回看每次死亡前 20 秒，記下當時的視野、隊友位置，以及能不能提早撤退。", "When reviewing, look at the 20 seconds before each death: vision, teammate positions, and whether an earlier exit was possible.", "振り返るときは、デスの20秒前を見る。視界、味方の位置、早めに撤退できたか。"))}</p><p class="note">${esc(t("這些是依數字整理的檢查方向，沒有解析錄影。", "These prompts come from the numbers. No replay was analyzed.", "数字から整理した確認項目です。動画は解析していません。"))}</p>`;
}
async function games() {
  const mine = renderToken;
  main.innerHTML =
    sub(
      "League of Legends",
      "htw0702rg#0702",
      t("公開的對戰紀錄列在這裡。只顯示已經同步的場次。", "Public match records are listed here. Only synced games are shown.", "公開された対戦記録を並べます。同期された試合だけです。"),
    ) + `<section class="section"><div id="game">${esc(t("讀取中…", "Loading…", "読み込み中…"))}</div></section>`;
  let items = [];
  let source = t("公開紀錄", "Public records", "公開記録");
  try {
    const d = await api("lol/matches?locale=" + lang);
    if (mine !== renderToken) return;
    items = d.items || [];
    if (!d.configured && !items.length)
      source = t("帳號 htw0702rg#0702。目前沒有已公開的場次。", "Account htw0702rg#0702. No published matches are available.", "アカウント htw0702rg#0702。公開された試合はまだありません。");
  } catch {
    source = t("帳號 htw0702rg#0702。這一頁暫時讀不到紀錄。", "Account htw0702rg#0702. Records can’t be read right now.", "アカウント htw0702rg#0702。いま記録を読み込めません。");
  }
  if (mine !== renderToken || !$("#game")) return;
  const original = items;
  function draw(filter = "all") {
    const a = original.filter((x) => filter === "all" || x.result === filter);
    const wins = a.filter((x) => x.result === "win").length;
    $("#game").innerHTML =
      `<p class="note">${esc(source)}</p>` +
      (a.length
        ? `<div class="filters">${[
            ["all", t("全部", "All", "すべて")],
            ["win", t("勝利", "Wins", "勝利")],
            ["loss", t("敗北", "Losses", "敗北")],
          ]
            .map(([v, l]) => `<button type="button" data-filter="${v}" aria-pressed="${v === filter}">${l}</button>`)
            .join("")}</div><div class="game-layout"><div class="panel"><h2>${esc(t("KDA 變化", "KDA over matches", "KDA の推移"))}</h2>${chart(a)}</div><div class="panel"><h2>${esc(t("本次樣本", "Selected sample", "選択中のサンプル"))}</h2><div class="metrics"><div class="metric"><small>${esc(t("場次", "Matches", "試合数"))}</small><b>${a.length}</b></div><div class="metric"><small>${esc(t("勝率", "Win rate", "勝率"))}</small><b>${((wins / a.length) * 100).toFixed(1)}%</b></div></div></div></div>${a
            .map(
              (x) =>
                `<details class="match"><summary><span>${esc(x.playedAt || x.updated || "")} · ${esc(x.hero || t("英雄待確認", "Champion unconfirmed", "チャンピオン未確認"))}</span><b class="${x.result === "win" ? "win" : "loss"}">${x.kills ?? "—"} / ${x.deaths ?? "—"} / ${x.assists ?? "—"}</b></summary>${review(x)}${x.gold ? `<p>${esc(t("經濟", "Gold", "ゴールド"))}: ${x.gold}</p>` : ""}</details>`,
            )
            .join("")}`
        : `<p class="empty">${esc(t("目前沒有已公開的場次。", "No published matches yet.", "公開された試合はまだありません。"))}</p>`);
    document.querySelectorAll("[data-filter]").forEach((b) => (b.onclick = () => draw(b.dataset.filter)));
  }
  draw();
}

async function plans() {
  const slug = route.split("/")[1];
  if (!slug) {
    main.innerHTML =
      sub(titles().plans, "Plans", t("三件都還是長期的希望，不是已經完成的作品。", "All three are still long-term hopes, not finished works.", "三つとも、まだ長期の希望です。完成した作品ではありません。")) +
      `<section class="section">${plansHTML()}</section>`;
    return;
  }
  const list = planCopy();
  const i = list.findIndex((p) => p.slug === slug);
  if (i < 0) return notFound();
  const mine = renderToken;
  main.innerHTML =
    sub(list[i].name, "0" + (i + 1), list[i].desc) +
    `<section class="section"><div id="plan-feed"></div><h2>${esc(t("其他希望", "Other hopes", "ほかの希望"))}</h2>${plansHTML()}</section>`;
  try {
    const items = await content("plan-" + slug);
    if (mine !== renderToken || !$("#plan-feed")) return;
    $("#plan-feed").innerHTML = posts(items);
  } catch {
    if (mine === renderToken && $("#plan-feed")) $("#plan-feed").textContent = unavailableCopy();
  }
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
    world: t("計畫", "Plan", "計画"),
    store: t("小賣所", "Shop", "売店"),
    now: t("現在", "Now", "いま"),
    "plan-animation": planCopy()[0].name,
    "plan-ai": planCopy()[1].name,
    "plan-metaverse": planCopy()[2].name,
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
  const kinds = ["blog", "works", "wiki", "world", "now", "match", "catalog", "store", "plan-animation", "plan-ai", "plan-metaverse"];
  $("#studio").innerHTML = `<div class="appearance"><h2>${esc(t("外觀", "Appearance", "外観"))}</h2><form id="appearance-form"><div class="form-grid"><label>${esc(t("佈景", "Theme", "テーマ"))}<select name="theme">${themeOptions()
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("")}</select></label><label>${esc(t("強調色", "Accent", "アクセント"))}<input type="color" name="accent"></label></div>${["tw", "en", "jp"]
    .map(
      (l) =>
        `<label>${languageNames[lang][["tw", "en", "jp"].indexOf(l)]} · ${esc(t("首頁標題", "Home headline", "ホーム見出し"))}<input name="hero-${l}" maxlength="120" required></label>`,
    )
    .join("")}<label><span><input type="checkbox" name="motion"> ${esc(t("啟用動態", "Enable motion", "モーション"))}</span></label><label><span><input type="checkbox" name="sound"> ${esc(t("音效設定（公開頁不自動播放）", "Sound setting (the public site does not autoplay)", "音声設定（公開ページでは自動再生しません）"))}</span></label><button class="button primary" type="submit">${esc(t("儲存並套用", "Save and apply", "保存して適用"))}</button><p id="appearance-status" role="status"></p></form></div><div class="studio-grid"><aside><button class="button" type="button" id="new">＋ ${esc(t("新增內容", "New entry", "新規作成"))}</button><button class="button" type="button" id="notion-sync">Notion ↓ ${esc(t("同步", "Sync", "同期"))}</button><button class="button" type="button" id="riot-sync">Riot ↓ ${esc(t("更新戰績", "Update matches", "戦績を更新"))}</button><button class="button" type="button" id="slack-test">Slack · ${esc(t("發送測試通知", "Send test notification", "テスト通知を送信"))}</button><button class="button" type="button" id="logout">${esc(t("登出", "Sign out", "ログアウト"))}</button><div id="record-list"></div></aside><form id="editor"><input name="id" type="hidden"><input name="version" type="hidden"><div class="form-grid"><label>${esc(t("內容種類", "Content type", "種類"))}<select name="kind">${kinds.map((k) => `<option>${k}</option>`).join("")}</select></label><label>${esc(t("語言", "Language", "言語"))}<select name="locale">${["tw", "en", "jp"].map((l) => `<option>${l}</option>`).join("")}</select></label><label>${esc(t("可見性", "Visibility", "公開設定"))}<select name="visibility"><option value="private">${esc(t("私人草稿", "Private draft", "非公開下書き"))}</option><option value="public">${esc(t("公開", "Public", "公開"))}</option></select></label><label>Slug<input name="slug" pattern="[a-z0-9-]{1,80}" required></label></div><label>${esc(t("標題", "Title", "タイトル"))}<input name="title" maxlength="200" required></label><label>${esc(t("內容", "Content", "本文"))}<textarea name="body" maxlength="30000" required></textarea></label><fieldset id="match-fields" hidden><legend>${esc(t("對戰紀錄", "Match record", "対戦記録"))}</legend><div class="form-grid">${["hero", "mode", "rank", "evidence"].map((k) => `<label>${k}<input name="${k}"></label>`).join("")}<label>result<select name="result"><option>win</option><option>loss</option></select></label>${["minutes", "kills", "deaths", "assists", "teamKills"].map((k) => `<label>${k}<input name="${k}" type="number" min="0" max="1000" step="${k === "minutes" ? "0.01" : "1"}"></label>`).join("")}</div></fieldset><button class="button primary" id="save-entry" type="submit">${esc(t("儲存", "Save", "保存"))}</button><p class="status" id="save-status" role="status"></p></form></div>`;
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
    $("#match-fields").hidden = true;
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
        for (const [k, v] of Object.entries(x.meta || {})) if (field(k)) field(k).value = v ?? "";
        $("#match-fields").hidden = x.kind !== "match";
        if (x.source === "notion") {
          for (const el of f.elements) el.disabled = true;
          $("#save-status").textContent = t("此內容由 Notion 管理，請在 Notion 修改後同步。", "This entry is managed in Notion. Edit it there, then sync.", "Notion 管理の記事です。Notion で編集して同期してください。");
        }
      };
      $("#record-list").append(b);
    }
  }
  for (const [id, path, ready] of [
    ["riot-sync", "riot/sync", meData.connections.riot],
    ["slack-test", "slack/test", meData.connections.slack],
  ]) {
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
  field("kind").onchange = () => ($("#match-fields").hidden = field("kind").value !== "match");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const x = Object.fromEntries(new FormData(f));
    x.version = Number(x.version) || 0;
    x.meta = {};
    if (x.kind === "match") {
      for (const k of ["hero", "mode", "rank", "evidence", "result"]) x.meta[k] = x[k];
      for (const k of ["minutes", "kills", "deaths", "assists", "teamKills"]) x.meta[k] = x[k] === "" ? null : Number(x[k]);
    }
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

async function draw() {
  if (!route) return home();
  if (route === "me" || route === "contact" || route === "social") return me();
  if (route === "plans" || route.startsWith("plans/")) return plans();
  if (route === "games/lol") return games();
  if (route === "search") return searchPage();
  if (route === "admin") return admin();
  if (route === "store") return store();
  if (["works", "wiki", "blog", "world", "now"].includes(route)) return cms(route);
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

readRoute();
bindChrome();
bindMotion();
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
