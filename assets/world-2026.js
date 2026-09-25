const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
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
    ["dusk", t("暮色", "Dusk", "夕暮れ")],
    ["night", t("夜色", "Night", "夜")],
    ["day", t("晴日", "Day", "昼")],
  ];
}
function navItems() {
  return [
    ["", t("世界", "World", "世界")],
    ["works", t("作品", "Works", "作品")],
    ["blog", t("手記", "Journal", "手記")],
    ["wiki", t("維基", "Wiki", "ウィキ")],
    ["social", t("社群", "Social", "ソーシャル")],
    ["store", t("小賣所", "Shop", "売店")],
    ["search", t("搜尋", "Search", "検索")],
  ];
}
function titles() {
  return {
    works: t("把想像，做成作品。", "Ideas made tangible.", "想像を、作品に。"),
    wiki: t("你好，我是筳筳。", "Hello, I’m Ting Ting.", "こんにちは、筳筳です。"),
    blog: t("沿岸手記", "Letters from the coast", "海辺の日記"),
    world: t("一座還在生長的世界。", "A world still taking shape.", "育ち続ける世界。"),
    me: t("在這裡，找到我。", "Let’s stay connected.", "ここで、つながろう。"),
    social: t("頻道開著，人還是我。", "Channels are open. It’s still just me.", "チャンネルは開いている。まだ、私です。"),
    plans: t("這輩子，想完成的三件事。", "Three dreams for a lifetime.", "一生をかけて叶えたい、三つの夢。"),
    search: t("在公開的句子裡找。", "Search the public pages.", "公開ページを探す。"),
    now: t("現在公開的。", "Public right now.", "いま公開していること。"),
    store: t("把喜歡的，帶進日常。", "A little wonder for everyday life.", "好きな景色を、日常に。"),
  };
}
function planCopy() {
  return [
    {
      slug: "animation",
      name: t("自己的動畫電影", "My animated film", "自分のアニメ映画"),
      desc: t(
        "用光、風景與故事，留下值得記住的相遇。",
        "Light, landscapes, and stories of encounters worth remembering.",
        "光と風景と物語で、忘れられない出会いを。",
      ),
    },
    {
      slug: "ai",
      name: t("自己的 AI 夥伴", "My AI companion", "自分の AI パートナー"),
      desc: t(
        "從能完成一件小事的助理，逐步學會更多。",
        "Begin with an assistant that does one small thing well.",
        "小さなことを一つできるアシスタントから。",
      ),
    },
    {
      slug: "metaverse",
      name: t("自己的虛擬世界", "My virtual world", "自分の仮想世界"),
      desc: t(
        "讓台日的日常與想像，成為可以走進去的地方。",
        "Build a place where Taiwanese and Japanese everyday life meets imagination.",
        "台湾と日本の日常、そして想像の中へ。",
      ),
    },
  ];
}
function districts() {
  return [
    [
      "harbor",
      t("海風港町", "Harbor Quarter", "海風港町"),
      t("港燈 × 潮聲 × 電車", "harbor lights × tide × tram", "港の灯 × 潮騒 × 電車"),
      t(
        "遠處像台灣的港，轉過街角又像日本的小城。潮聲和城市燈火一起呼吸。",
        "A Taiwanese harbor from afar, a small Japanese town around the corner. The tide and the city lights breathe together.",
        "遠くは台湾の港、角を曲がると日本の小さな町。潮騒と街の灯りが一緒に呼吸する。",
      ),
    ],
    [
      "market",
      t("暮霞夜市", "Dusk Night Market", "暮霞夜市"),
      t("台灣攤火 × 昭和商店街", "Taiwan stalls × Showa arcade", "台湾屋台 × 昭和商店街"),
      t(
        "油煙、燈籠、招牌，全部亮到很晚。台灣夜市的熱鬧，混進昭和商店街的木門與紅燈籠。",
        "Steam, lanterns and signs stay bright late. Taiwanese night-market heat meets a Showa shopping street.",
        "湯気、提灯、看板。夜遅くまで明るい。台湾夜市の熱気と昭和商店街が混ざる。",
      ),
    ],
    [
      "festival",
      t("夏祭坂", "Festival Hill", "夏祭坂"),
      t("神社石階 × 夏夜風鈴", "shrine steps × wind chimes", "神社石段 × 夏の風鈴"),
      t(
        "石階盡頭，花火剛好升空。風鈴、神社，和台灣夏夜的潮濕空氣。",
        "At the top of the stone steps, fireworks rise. Wind chimes, a shrine, and humid Taiwanese summer air.",
        "石段の先で、ちょうど花火が上がる。風鈴、神社、台湾の湿った夏夜。",
      ),
    ],
    [
      "city",
      t("霓虹電車線", "Neon Tram Line", "ネオン電車線"),
      t("台北巷弄 × 東京終電", "Taipei alleys × Tokyo last train", "台北路地 × 東京終電"),
      t(
        "最後一班電車，穿過還醒著的城市。霓虹映在雨地上，人聲變得很安靜。",
        "The last tram crosses a city still awake. Neon on wet pavement, and the street goes quiet.",
        "終電が、まだ起きている街を走る。雨のネオン、そして静かな人声。",
      ),
    ],
  ];
}
function stalls() {
  return [
    ["海風深夜麵屋", "Sea-breeze Midnight Noodles", "海風深夜麺屋", "熱氣、海風與深夜燈火。", "Steam, sea air, late lights.", "湯気、海風、深夜の灯り。", "sm"],
    ["花火關東煮", "Fireworks Oden", "花火おでん", "祭典散場前的最後一碗。", "The last bowl before the festival ends.", "祭りが終わる前の最後の一杯。", "sm"],
    ["玉露茶寮", "Gyokuro Tea House", "玉露茶寮", "在燈籠下面慢慢喝一杯。", "Take your time beneath the lanterns.", "提灯の下でゆっくり一杯。", "sm"],
    ["射的遊戲屋", "Festival Shooting Game", "射的遊戯屋", "點我，天空會回應。", "Tap me. The sky answers.", "押してみて。空が応える。", "lg"],
  ];
}
const emptyCopy = () => t("還沒有公開內容。", "No public entries yet.", "公開記事はまだありません。");
const unavailableCopy = () =>
  t("暫時無法讀取，請稍後重新整理。", "Temporarily unavailable. Please refresh later.", "一時的に読み込めません。後でもう一度お試しください。");
const motto = () =>
  t(
    "願我們相遇的世界，只有花火，沒有戰火。",
    "May the skies we share hold fireworks, never war.",
    "出会う世界の空に、戦火ではなく花火が咲きますように。",
  );

function kinetic(text) {
  const raw = String(text ?? "");
  const latin = /^[\u0000-\u007f]*$/.test(raw);
  if (latin) {
    return raw
      .split(/(\s+)/)
      .map((part, i) =>
        part.trim() ? `<span style="--d:${Math.min(i, 14) * 55}ms">${esc(part)}</span>` : part,
      )
      .join("");
  }
  return [...raw]
    .map((ch, i) => (ch === " " ? " " : `<span style="--d:${Math.min(i, 18) * 34}ms">${esc(ch)}</span>`))
    .join("");
}
function sub(title, kicker = "", desc = "") {
  return `<section class="subhero"><div class="subhero-bg" aria-hidden="true"></div><div class="subhero-copy"><small>${esc(kicker)}</small><h1 class="kinetic">${kinetic(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ""}</div></section>`;
}
function plansHTML() {
  return `<div class="plans-grid">${planCopy()
    .map(
      (p, i) =>
        `<a class="plan magnetic reveal" href="${link("plans/" + p.slug)}" style="--i:${i}"><small>0${i + 1}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><em>↗</em></a>`,
    )
    .join("")}</div>`;
}
function sceneCards() {
  return `<div class="scene-cards">${districts()
    .map(
      ([id, name, meta, copy], i) =>
        `<a class="scene-card magnetic reveal" href="${link("")}#scene-${id}" style="--i:${i}"><small>0${i + 1}</small><strong>${esc(name)}</strong><p>${esc(copy)}</p><span>${esc(meta)}</span></a>`,
    )
    .join("")}</div>`;
}

let appearance = {
  theme: "dusk",
  accent: "#e8b495",
  motion: true,
  sound: true,
  hero: {
    tw: "把想像，留在世界裡。",
    en: "Leave a little wonder in the world.",
    jp: "想像を、この世界に残そう。",
  },
};
function paintHeadline() {
  const h = document.querySelector("[data-headline]");
  if (h) h.innerHTML = kinetic(appearance.hero?.[lang] || appearance.hero?.tw || "");
}
function applyAppearance(x) {
  appearance = x;
  document.body.dataset.theme = x.theme || "dusk";
  document.body.dataset.motion = String(x.motion !== false);
  if (x.accent) document.documentElement.style.setProperty("--accent", x.accent);
  const scene = $("#scene");
  if (scene && x.theme) scene.value = x.theme;
  paintHeadline();
}
function setScene(id) {
  if (!id) return;
  document.body.dataset.scene = id;
  document.querySelectorAll("[data-scene-link]").forEach((a) => {
    if (a.dataset.sceneLink === id) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  const chip = $("#hero-scene");
  const label = { harbor: "01  Harbor", market: "02  Market", festival: "03  Festival", city: "04  Tram" };
  if (chip && label[id]) chip.textContent = label[id];
  const meta = document.querySelector('meta[name="theme-color"]');
  const colors = { harbor: "#141820", market: "#2a1814", festival: "#24141c", city: "#101820" };
  if (meta && colors[id]) meta.setAttribute("content", colors[id]);
}
function paintChrome() {
  painting = true;
  try {
  const navKey = route === "me" || route === "contact" ? "social" : route;
  $("#nav").innerHTML = navItems()
    .map(([p, l], i) => {
      const on = p === navKey || (p && (navKey === p || navKey.startsWith(p + "/")));
      return `<a href="${link(p)}" style="--i:${i}" ${on ? 'aria-current="page"' : ""}>${l}</a>`;
    })
    .join("");
  $("#nav").classList.remove("open");
  $("#menu").setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
  $(".brand").href = link("");
  const labels = {
    world: t("暮霞世界", "Twilight world", "暮霞世界"),
    now: t("現在", "Now", "いま"),
    plans: t("人生計畫", "Plans", "計画"),
  };
  document.querySelectorAll("[data-route]").forEach((a) => {
    a.href = link(a.dataset.route);
    if (labels[a.dataset.route]) a.textContent = labels[a.dataset.route];
  });
  document.body.dataset.page = route.split("/")[0] || "home";
  if (!document.body.dataset.scene) document.body.dataset.scene = "harbor";
  if (!document.body.dataset.theme) document.body.dataset.theme = appearance.theme || "dusk";
  const theme = document.body.dataset.theme;
  $("#scene").innerHTML = themeOptions()
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("");
  $("#scene").value = themeOptions().some(([v]) => v === theme) ? theme : "dusk";
  $("#language").innerHTML = ["tw", "en", "jp"]
    .map((l, i) => `<option value="${l}">${languageNames[lang][i]}</option>`)
    .join("");
  $("#language").value = lang;
  document.documentElement.lang = { tw: "zh-Hant-TW", en: "en-US", jp: "ja-JP" }[lang];
  $("#peace").textContent = motto();
  soundLabel();
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

let audio, master, enabled = true;
try {
  enabled = localStorage.getItem("world-sound") !== "off";
} catch {}
function soundLabel() {
  const btn = $("#sound");
  if (!btn) return;
  const running = enabled && audio?.state === "running";
  btn.textContent = running ? t("♫ 海浪", "♫ Waves", "♫ 波音") : enabled ? t("♫ 點一下", "♫ Tap", "♫ タップ") : t("♫ 靜音", "♫ Muted", "♫ 消音");
  btn.setAttribute("aria-pressed", String(enabled));
}
async function startSound() {
  if (!enabled || route === "admin") return;
  try {
    if (!audio) {
      audio = new AudioContext();
      master = audio.createGain();
      master.gain.value = 0.045;
      master.connect(audio.destination);
      const b = audio.createBuffer(1, audio.sampleRate * 12, audio.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = (last + Math.random() * 0.04 - 0.02) / 1.02;
        d[i] = last * 4 * (0.6 + 0.4 * Math.sin((i / audio.sampleRate) * 0.52));
      }
      const source = audio.createBufferSource();
      source.buffer = b;
      source.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      source.connect(filter);
      filter.connect(master);
      source.start();
    }
    await audio.resume();
  } catch {}
  soundLabel();
}
function crackle() {
  if (!audio || audio.state !== "running") return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    const f = audio.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400;
    o.type = "triangle";
    o.frequency.setValueAtTime(520, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(90, audio.currentTime + 0.2);
    g.gain.setValueAtTime(0.03, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);
    o.connect(f);
    f.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.24);
  } catch {}
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
    ? items
        .map(
          (x, i) =>
            `<article class="post card reveal" id="${esc(x.slug || "")}" style="--i:${i % 8}"><small>${String(i + 1).padStart(2, "0")}  ·  ${esc(x.updated || x.updated_at || "")}</small><h2>${esc(x.name)}</h2><p>${esc(x.body)}</p></article>`,
        )
        .join("")
    : `<p class="empty">${emptyCopy()}</p>`;
}

function home() {
  const line = esc(motto()) + "　　·　　筳筳　　·　　HTW0702　　·　　";
  const portals = [
    ["works", "01", t("作品展間", "Work room", "作品の部屋"), t("正在學習，也正在把想法做出來。", "Learning, and making ideas real.", "学びながら、アイデアを形に。")],
    ["blog", "02", titles().blog, t("生活、美食、技術，和沿路的風景。", "Life, food, technology, and the road.", "暮らし、食、技術、道の途中の風景。")],
    ["wiki", "03", t("關於筳筳", "About Ting Ting", "筳筳について"), t("來自台灣，喜歡沒有邊界的想像。", "From Taiwan, with an unbounded imagination.", "台湾から、自由な想像とともに。")],
    ["world", "04", t("世界設定", "World bible", "世界設定"), t("海岸、夜市、電車與花火的設定集。", "Coast, night market, trams, fireworks.", "海岸、夜市、電車、花火。")],
    ["social", "05", t("社群頻道", "Social channels", "ソーシャル"), t("Instagram、Threads、X。", "Instagram, Threads, and X.", "Instagram、Threads、X。")],
    ["store", "06", t("小賣所", "Little shop", "売店"), t("個人周邊與支持的入口。", "Personal goods and support.", "品とサポートの入口。")],
    ["plans", "07", t("人生計畫", "Lifetime plans", "人生の計画"), t("動畫、AI，與可以走進去的世界。", "Animation, AI, and a world you can enter.", "アニメ、AI、歩いて入れる世界。")],
    ["search", "08", t("搜尋", "Search", "検索"), t("在公開頁面、手記與作品裡找一句話。", "Find a line across the public pages.", "公開ページの中から、一文を探す。")],
  ];
  const scenes = districts()
    .map(([id, name, meta, copy], i) => {
      const extra =
        id === "city"
          ? `<div class="tram" aria-hidden="true"><i></i></div>`
          : id === "festival"
            ? `<div class="chimes" aria-hidden="true"><span></span><span></span><span></span></div>`
            : "";
      const burst =
        id === "festival"
          ? `<button class="btn ghost" type="button" data-firework="lg">${t("放一場花火", "Launch fireworks", "花火を上げる")}</button>`
          : "";
      return `<article class="scene" id="scene-${id}" data-scene="${id}" data-watch="${id}"><div class="scene-bg" aria-hidden="true"></div><div class="scene-veil" aria-hidden="true"></div>${extra}<div class="scene-copy"><small>0${i + 1}  /  ${esc(meta)}</small><h2>${esc(name)}</h2><p>${esc(copy)}</p>${burst}</div></article>`;
    })
    .join("");
  main.innerHTML = `<section class="hero" id="intro" data-watch="harbor"><div class="hero-layers" aria-hidden="true"><div class="layer photo"></div><div class="layer haze"></div><div class="layer glow"></div></div><p class="vertical">${t("寫給，尚未相遇的你。", "For someone I have yet to meet.", "まだ出会っていない、あなたへ。")}</p><div class="hero-copy"><p class="kicker"><span>HTW0702</span><span>Taiwan × Japan</span></p><h1 class="kinetic" data-headline>${kinetic(appearance.hero[lang])}</h1><p class="lede">${t("我是筳筳，來自台灣。<br>喜歡海、花火，以及那些還沒成真的夢。<br>這裡，是我慢慢建造、也會對你做出反應的個人世界。", "I’m Ting Ting, from Taiwan.<br>I love the sea, fireworks, and dreams yet to come true.<br>This is the personal world I’m building — and it answers back.", "台湾の筳筳です。<br>海と花火、まだ叶っていない夢が好き。<br>ここは、少しずつ作っていて、触れると応える私の世界。")}</p><div class="cta-row"><a class="btn magnetic" href="#districts">${t("進入街區", "Enter the districts", "街区へ")}</a><button class="btn ghost magnetic" type="button" id="launch" data-firework="lg">${t("放一場花火", "Launch fireworks", "花火を上げる")}</button></div></div><p class="scroll-hint">${t("向下", "Scroll", "スクロール")}</p><div class="hero-meta"><span>Personal world</span><span id="hero-scene">01  Harbor</span></div></section><div class="marquee" aria-hidden="true"><div class="marquee-track"><span>${line}${line}</span><span>${line}${line}</span></div></div><nav class="scene-index" id="districts" aria-label="${t("街區", "Districts", "街区")}">${districts()
    .map(
      ([id, name], i) =>
        `<a class="magnetic" data-scene-link="${id}" href="#scene-${id}" ${id === "harbor" ? 'aria-current="true"' : ""}>0${i + 1}  ${esc(name)}</a>`,
    )
    .join("")}</nav>${scenes}<section class="block" id="market" data-watch="market"><div class="block-head"><div><small class="eyebrow">02</small><h2>${t("夜市沒有打烊。", "The night market stays open.", "夜市は、まだ開いている。")}</h2></div><p>${t("點亮燈籠，或打開射的遊戲屋。天空會回應。", "Light a lantern, or open the shooting stall. The sky answers.", "灯籠を灯すか、射的を押して。空が応える。")}</p></div><div class="lantern-row">${[0, 1, 2, 3, 4].map(() => `<button class="lantern" type="button" aria-pressed="false" aria-label="${t("燈籠", "Lantern", "灯籠")}"><i></i></button>`).join("")}</div><div class="stalls">${stalls()
    .map(
      (row, i) =>
        `<button class="stall magnetic reveal" type="button" data-firework="${row[6]}" style="--i:${i}"><small>0${i + 1}</small><b>${t(row[0], row[1], row[2])}</b><span>${t(row[3], row[4], row[5])}</span></button>`,
    )
    .join("")}</div></section><section class="block" id="portals"><div class="block-head"><div><small class="eyebrow">03</small><h2>${t("從世界裡，走進公開內容。", "Step from the world into the public work.", "世界から、公開コンテンツへ。")}</h2></div><p>${t("維基、作品、手記、社群。都還是這個人的入口。", "Wiki, works, journal, social. Still one person’s doors.", "ウィキ、作品、手記、ソーシャル。入口は、すべて私。")}</p></div><div class="portals">${portals
    .map(
      ([p, n, h, d], i) =>
        `<a class="portal magnetic reveal" href="${link(p)}" style="--i:${i}"><small>${n}</small><h3>${esc(h)}</h3><p>${esc(d)}</p><span>↗</span></a>`,
    )
    .join("")}</div></section><section class="promise" id="promise" data-watch="festival"><div class="promise-bg" aria-hidden="true"></div><div class="veil" aria-hidden="true"></div><div><small class="eyebrow">04</small><h2>${t("讓天空，只為花火亮起。", "Let the sky glow only with fireworks.", "空を照らすのは、花火だけで。")}</h2></div><div><p>${t("我想像的世界，有乾淨的河川、通往海邊的小路，和願意互相理解的人。把台灣的溫度、日本夏日的光，放進自己的故事裡。", "In the world I imagine, rivers run clear, paths lead to the sea, and people choose understanding. Taiwanese warmth and Japanese summer light become part of my own stories.", "澄んだ川、海へ続く小道、理解し合おうとする人たち。台湾の温かさと日本の夏の光を、自分の物語に込めて。")}</p><a class="btn magnetic" href="${link("world")}">${t("世界設定", "World bible", "世界の設定")}</a></div></section><section class="block" id="someday" data-watch="city"><small class="eyebrow">05</small><h2>${titles().plans}</h2>${plansHTML()}</section>`;
  setScene("harbor");
}

async function cms(kind) {
  const mine = renderToken;
  const loading = t("讀取中…", "Loading…", "読み込み中…");
  const shelf =
    kind === "wiki"
      ? `<div class="wiki-layout"><figure class="portrait reveal"><img src="/assets/portrait.jpg" width="960" height="1280" alt="${t("筳筳", "Ting Ting", "筳筳")}"><figcaption>筳筳 · Wang Hao Ting</figcaption></figure><div id="entries">${loading}</div></div>`
      : `<div id="entries">${loading}</div>`;
  const kicker = { works: "Works", wiki: "Wiki", blog: "Journal", world: "World", now: "Now" }[kind] || kind;
  main.innerHTML = sub(titles()[kind] || kind, kicker) + `<section class="section">${shelf}${kind === "world" ? sceneCards() : ""}</section>`;
  try {
    const items = await content(kind);
    if (mine !== renderToken || !$("#entries")) return;
    $("#entries").innerHTML = posts(items);
    if (kind === "blog") {
      const box = $("#entries");
      box.innerHTML = `<div class="blog-layout"><div><input class="blog-search" id="search" aria-label="${t("搜尋手記", "Search journal", "日記を検索")}" placeholder="${t("搜尋文章、食物、城市…", "Search stories, food, places…", "記事、食べ物、街を検索…")}"><div id="posts">${posts(items)}</div></div><aside><h3>筳筳</h3><p>${t("把今天看見的，留給明天的自己。", "Keeping today’s little moments for tomorrow.", "今日の景色を、明日の自分へ。")}</p><a class="line-link" href="${link("social")}">${titles().social} ↗</a><p class="note">${t("個人手記，依更新時間排列。", "A personal journal, ordered by update time.", "更新順の個人日記。")}</p></aside></div>`;
      $("#search").oninput = (e) => {
        $("#posts").innerHTML = posts(
          items.filter((x) => (x.name + " " + x.body).toLowerCase().includes(e.target.value.toLowerCase())),
        );
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
  const heading = route === "me" || route === "contact" ? titles().me : titles().social;
  main.innerHTML =
    sub(heading, "Social") +
    `<section class="section"><p>${t("Instagram、Threads、X。點開就是我的頁面。", "Instagram, Threads, and X. Each one opens my page.", "Instagram、Threads、X。開くと、私のページです。")}</p><div class="social-grid">${social
      .map(([n, h, u], i) =>
        u
          ? `<a class="social magnetic reveal" style="--i:${i}" href="${u}" target="_blank" rel="me noopener"><b>${n}</b><span>${h}</span><em>↗</em></a>`
          : `<div class="social reveal" style="--i:${i}"><b>${n}</b><span>${h}</span><button class="button" type="button" id="copy-discord">${t("複製帳號", "Copy username", "ユーザー名をコピー")}</button></div>`,
      )
      .join("")}</div><h2>${t("寫封信給我", "Send me a letter", "メールを送る")}</h2><div class="cta-row"><a class="btn plain" href="mailto:taiwan@htw0702.com">taiwan@htw0702.com</a><a class="btn ghost plain" href="mailto:japan@htw0702.com">japan@htw0702.com</a></div></section>`;
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
  [x.kills, x.deaths, x.assists].every((v) => typeof v === "number")
    ? (x.kills + x.assists) / Math.max(1, x.deaths)
    : null;
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
  const kp =
    x.teamKills > 0 && x.kills != null && x.assists != null
      ? (((x.kills + x.assists) / x.teamKills) * 100).toFixed(1) + "%"
      : "—";
  return `<p>KDA ${v === null ? "—" : v.toFixed(2)} · ${t("擊殺參與率", "Kill participation", "キル参加率")} ${kp}</p><p>${t("復盤時可以回看每次死亡前 20 秒，記下當時的視野、隊友位置，以及能不能提早撤退。", "When reviewing, look at the 20 seconds before each death: vision, teammate positions, and whether an earlier exit was possible.", "振り返るときは、デスの20秒前を見る。視界、味方の位置、早めに撤退できたか。")}</p><p class="note">${t("這些是依數字整理的檢查方向，沒有解析錄影。", "These prompts come from the numbers. No replay was analyzed.", "数字から整理した確認項目です。動画は解析していません。")}</p>`;
}
async function games() {
  const mine = renderToken;
  main.innerHTML =
    sub(
      "League of Legends",
      "htw0702rg#0702",
      t("公開的對戰紀錄列在這裡。只顯示已經同步的場次。", "Public match records are listed here. Only synced games are shown.", "公開された対戦記録を並べます。同期された試合だけです。"),
    ) + `<section class="section"><div id="game">${t("讀取中…", "Loading…", "読み込み中…")}</div></section>`;
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
            .join("")}</div><div class="game-layout"><div class="panel"><h2>${t("KDA 變化", "KDA over matches", "KDA の推移")}</h2>${chart(a)}</div><div class="panel"><h2>${t("本次樣本", "Selected sample", "選択中のサンプル")}</h2><div class="metrics"><div class="metric"><small>${t("場次", "Matches", "試合数")}</small><b>${a.length}</b></div><div class="metric"><small>${t("勝率", "Win rate", "勝率")}</small><b>${((wins / a.length) * 100).toFixed(1)}%</b></div></div></div></div>${a
            .map(
              (x) =>
                `<details class="match"><summary><span>${esc(x.playedAt || x.updated || "")} · ${esc(x.hero || t("英雄待確認", "Champion unconfirmed", "チャンピオン未確認"))}</span><b class="${x.result === "win" ? "win" : "loss"}">${x.kills ?? "—"} / ${x.deaths ?? "—"} / ${x.assists ?? "—"}</b></summary>${review(x)}${x.gold ? `<p>${t("經濟", "Gold", "ゴールド")}: ${x.gold}</p>` : ""}</details>`,
            )
            .join("")}`
        : `<p class="empty">${t("目前沒有已公開的場次。", "No published matches yet.", "公開された試合はまだありません。")}</p>`);
    document.querySelectorAll("[data-filter]").forEach((b) => (b.onclick = () => draw(b.dataset.filter)));
  }
  draw();
}

async function plans() {
  const slug = route.split("/")[1];
  if (!slug) {
    main.innerHTML = sub(titles().plans, "Plans") + `<section class="section">${plansHTML()}</section>`;
    return;
  }
  const list = planCopy();
  const i = list.findIndex((p) => p.slug === slug);
  if (i < 0) return notFound();
  const mine = renderToken;
  main.innerHTML =
    sub(list[i].name, "0" + (i + 1), list[i].desc) +
    `<section class="section"><div id="plan-feed"></div><h2>${t("其他夢想", "Other dreams", "ほかの夢")}</h2>${plansHTML()}</section>`;
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
  main.innerHTML = sub(titles().store, "Shop") + `<section class="section"><div id="products"></div><div id="payments" class="cta-row"></div></section>`;
  try {
    const items = await content("store");
    if (mine !== renderToken || !$("#products")) return;
    $("#products").innerHTML = posts(items);
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
    world: t("世界", "World", "世界"),
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
    `<section class="section"><form class="search-form" id="search-form" role="search"><input id="q" name="q" value="${esc(initial)}" maxlength="80" autocomplete="off" aria-label="${t("搜尋公開內容", "Search public pages", "公開コンテンツを検索")}" placeholder="${t("手記、作品、花火、社群…", "Journal, works, fireworks, social…", "手記、作品、花火、ソーシャル…")}"><button class="btn" type="submit">${t("搜尋", "Search", "検索")}</button></form><div id="results"></div></section>`;
  const box = $("#results");
  const input = $("#q");
  async function run(q) {
    const here = renderToken;
    const url = link("search") + (q ? `?q=${encodeURIComponent(q)}` : "");
    history.replaceState(null, "", url);
    box.innerHTML = `<p class="note">${t("讀取中…", "Loading…", "読み込み中…")}</p>`;
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
        : `<p class="empty">${t("沒有符合的內容。", "Nothing matches.", "一致するものはありません。")}</p>`;
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
    sub(
      t("這條路還沒有頁面。", "This path has no page.", "この道にはページがありません。"),
      t("還沒走過的小路", "An unexplored path", "まだ歩いていない道"),
    ) +
    `<section class="section lost"><p>${t("花火還在另一邊。你可以回到世界，或是直接去社群與搜尋。", "The fireworks are on another shore. Return to the world, or go straight to social and search.", "花火は、別の岸にあります。世界へ戻るか、ソーシャルと検索へ。")}</p><div class="cta-row"><a class="btn" href="${link("")}">${t("回到首頁", "Back home", "ホームへ")}</a><a class="btn ghost" href="${link("social")}">${t("社群", "Social", "ソーシャル")}</a><a class="btn ghost" href="${link("search")}">${t("搜尋", "Search", "検索")}</a></div></section>`;
}

async function admin() {
  const mine = renderToken;
  document.head.insertAdjacentHTML("beforeend", '<meta name="robots" content="noindex,nofollow">');
  main.innerHTML =
    sub(t("把世界，調成喜歡的樣子。", "Make this world feel like you.", "世界を、自分らしく。"), "Studio") +
    `<section class="section" id="studio"><p>${t("確認登入狀態…", "Checking sign-in…", "ログイン状態を確認中…")}</p></section>`;
  let meData;
  try {
    meData = await api("me");
  } catch {
    if (mine !== renderToken || !$("#studio")) return;
    let h = {};
    try {
      h = await api("health");
    } catch {}
    $("#studio").innerHTML = `<div class="panel"><h2>${t("只有你的 Apple 帳號能進入。", "Your Apple account is the only way in.", "あなたの Apple アカウント専用です。")}</h2><p>${h.auth ? t("登入後即可管理內容與外觀。", "Sign in to manage content and appearance.", "ログインして内容と外観を管理できます。") : t("Apple 登入與資料庫尚未完成設定，所有寫入保持鎖定。", "Apple sign-in and database setup are incomplete. All writes remain locked.", "Apple ログインとデータベースの設定が未完了のため、書き込みはロックされています。")}</p>${h.auth ? `<a class="button primary" href="/api/auth/start?locale=${lang}">Apple · ${t("登入", "Sign in", "ログイン")}</a>` : ""}</div>`;
    return;
  }
  if (mine !== renderToken || !$("#studio")) return;
  const headers = { "X-CSRF-Token": meData.csrf };
  let records = [];
  const kinds = ["blog", "works", "wiki", "world", "now", "match", "catalog", "store", "plan-animation", "plan-ai", "plan-metaverse"];
  $("#studio").innerHTML = `<div class="appearance"><h2>${t("外觀工作室", "Appearance studio", "外観スタジオ")}</h2><form id="appearance-form"><div class="form-grid"><label>${t("佈景主題", "Theme", "テーマ")}<select name="theme">${themeOptions()
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("")}</select></label><label>${t("主色", "Accent color", "アクセントカラー")}<input type="color" name="accent"></label></div>${["tw", "en", "jp"]
    .map(
      (l) =>
        `<label>${languageNames[lang][["tw", "en", "jp"].indexOf(l)]} · ${t("首頁標題", "Home headline", "ホーム見出し")}<input name="hero-${l}" maxlength="120" required></label>`,
    )
    .join("")}<label><span><input type="checkbox" name="motion"> ${t("啟用動態", "Enable motion", "アニメーション")}</span></label><label><span><input type="checkbox" name="sound"> ${t("環境音預設開啟", "Sound enabled by default", "環境音を既定で有効に")}</span></label><button class="button primary" type="submit">${t("儲存並套用", "Save and apply", "保存して適用")}</button><p id="appearance-status" role="status"></p></form></div><div class="studio-grid"><aside><button class="button" type="button" id="new">＋ ${t("新增內容", "New entry", "新規作成")}</button><button class="button" type="button" id="notion-sync">Notion ↓ ${t("同步", "Sync", "同期")}</button><button class="button" type="button" id="riot-sync">Riot ↓ ${t("更新戰績", "Update matches", "戦績を更新")}</button><button class="button" type="button" id="slack-test">Slack · ${t("發送測試通知", "Send test notification", "テスト通知を送信")}</button><button class="button" type="button" id="logout">${t("登出", "Sign out", "ログアウト")}</button><div id="record-list"></div></aside><form id="editor"><input name="id" type="hidden"><input name="version" type="hidden"><div class="form-grid"><label>${t("內容種類", "Content type", "種類")}<select name="kind">${kinds.map((k) => `<option>${k}</option>`).join("")}</select></label><label>${t("語言", "Language", "言語")}<select name="locale">${["tw", "en", "jp"].map((l) => `<option>${l}</option>`).join("")}</select></label><label>${t("可見性", "Visibility", "公開設定")}<select name="visibility"><option value="private">${t("私人草稿", "Private draft", "非公開下書き")}</option><option value="public">${t("公開", "Public", "公開")}</option></select></label><label>Slug<input name="slug" pattern="[a-z0-9-]{1,80}" required></label></div><label>${t("標題", "Title", "タイトル")}<input name="title" maxlength="200" required></label><label>${t("內容", "Content", "本文")}<textarea name="body" maxlength="30000" required></textarea></label><fieldset id="match-fields" hidden><legend>${t("對戰紀錄", "Match record", "対戦記録")}</legend><div class="form-grid">${["hero", "mode", "rank", "evidence"].map((k) => `<label>${k}<input name="${k}"></label>`).join("")}<label>result<select name="result"><option>win</option><option>loss</option></select></label>${["minutes", "kills", "deaths", "assists", "teamKills"].map((k) => `<label>${k}<input name="${k}" type="number" min="0" max="1000" step="${k === "minutes" ? "0.01" : "1"}"></label>`).join("")}</div></fieldset><button class="button primary" id="save-entry" type="submit">${t("儲存", "Save", "保存")}</button><p class="status" id="save-status" role="status"></p></form></div>`;
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
  paintChrome();
  applySeo();
  try {
    await draw();
  } catch {
    if (mine === renderToken)
      main.insertAdjacentHTML("beforeend", `<section class="section"><p>${unavailableCopy()}</p></section>`);
  }
  if (mine !== renderToken) return;
  if (opts.enter && motionOK()) {
    main.classList.remove("page-enter");
    void main.offsetWidth;
    main.classList.add("page-enter");
  }
  watchStory();
  if (opts.focus) {
    const h = main.querySelector("h1");
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }
}

let sceneIO;
function watchStory() {
  sceneIO?.disconnect();
  const nodes = [...document.querySelectorAll("[data-watch]")];
  if (!nodes.length) return;
  sceneIO = new IntersectionObserver(
    (entries) => {
      const vis = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setScene(vis.target.dataset.watch);
    },
    { threshold: [0.45, 0.62] },
  );
  nodes.forEach((n) => sceneIO.observe(n));
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

const canvas = $("#fx");
const ctx = canvas?.getContext("2d");
const rockets = [];
const sparks = [];
let raf = 0;
const dprCap = () => Math.min(2, devicePixelRatio || 1);
function fitCanvas() {
  if (!canvas) return;
  const dpr = dprCap();
  canvas.width = Math.max(1, innerWidth * dpr);
  canvas.height = Math.max(1, innerHeight * dpr);
}
function armLoop() {
  if (!raf && motionOK()) raf = requestAnimationFrame(loop);
}
function explode(x, y, color, power) {
  const n = Math.round(62 * power);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.22;
    const speed = (0.7 + Math.random() * 3.3) * power;
    const willow = Math.random() > 0.8;
    sparks.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1,
      decay: willow ? 0.0065 : 0.011 + Math.random() * 0.008,
      gravity: willow ? 0.042 : 0.015,
      size: willow ? 1.4 : 1.8 + Math.random() * 1.5,
      color: willow ? "#ffd7a1" : color,
    });
  }
  armLoop();
}
function launchRocket(tx, ty, color, power) {
  rockets.push({
    sx: tx + (Math.random() - 0.5) * 110,
    sy: innerHeight + 16,
    tx,
    ty,
    color,
    power,
    start: performance.now(),
    dur: 700 + Math.random() * 260,
    prev: [],
  });
  armLoop();
}
function bouquet(x, y, power = 1) {
  if (!motionOK()) {
    document.body.classList.add("still-glow");
    return;
  }
  const colors = ["#ffd7a1", "#ff6b8a", "#8ec9c4", "#fff6ea", "#ff9a4a", "#e7c4ff"];
  const count = power > 1 ? 3 : 1;
  for (let i = 0; i < count; i++) {
    launchRocket(x + (i - (count - 1) / 2) * 86, y + (i === 1 ? -40 : 18), colors[i % colors.length], power);
  }
  crackle();
}
function loop(now) {
  raf = 0;
  if (!ctx) return;
  const dpr = dprCap();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (!motionOK()) {
    rockets.length = 0;
    sparks.length = 0;
    return;
  }
  ctx.globalCompositeOperation = "lighter";
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    const t = Math.min(1, (now - r.start) / r.dur);
    const e = 1 - Math.pow(1 - t, 3);
    const x = r.sx + (r.tx - r.sx) * e;
    const y = r.sy + (r.ty - r.sy) * e;
    r.prev.push({ x, y });
    if (r.prev.length > 12) r.prev.shift();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2;
    ctx.beginPath();
    r.prev.forEach((p, idx) => (idx ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.fillStyle = "#fff8ee";
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (t >= 1) {
      explode(r.tx, r.ty, r.color, r.power);
      if (r.power > 1) setTimeout(() => motionOK() && explode(r.tx + 18, r.ty + 8, "#fff6ea", 0.62), 260);
      rockets.splice(i, 1);
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.vx *= 0.992;
    p.vy = p.vy * 0.992 + p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.45 + p.life), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = p.life * 0.28;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 4.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (rockets.length || sparks.length) raf = requestAnimationFrame(loop);
}

function bindMotion() {
  const boot = $("#boot");
  const finishBoot = () => {
    boot?.classList.add("done");
    document.documentElement.classList.add("booted");
    try {
      sessionStorage.setItem("world-boot", "1");
    } catch {}
  };
  if (!motionOK() || document.documentElement.classList.contains("booted")) finishBoot();
  else {
    boot?.addEventListener("pointerdown", finishBoot, { once: true });
    setTimeout(finishBoot, 880);
  }
  fitCanvas();
  addEventListener("resize", fitCanvas);
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
  );
  const arm = () =>
    document.querySelectorAll(".reveal:not(.in)").forEach((el, i) => {
      if (!el.style.getPropertyValue("--i")) el.style.setProperty("--i", String(i % 8));
      io.observe(el);
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
        ticking = false;
      });
    },
    { passive: true },
  );
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !motionOK()) return;
    document.documentElement.style.setProperty("--sx", e.clientX + "px");
    document.documentElement.style.setProperty("--sy", e.clientY + "px");
    $("#spot")?.classList.add("on");
    const cursor = $("#cursor");
    if (cursor) {
      cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cursor.classList.add("on");
      cursor.classList.toggle("hot", Boolean(e.target.closest?.("a,button")));
    }
    const el = e.target.closest?.(".magnetic");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add("moving");
    el.style.transform = `translate(${(px * 12).toFixed(1)}px, ${(py * 10).toFixed(1)}px) scale(1.018)`;
    el.style.setProperty("--mx", e.clientX - r.left + "px");
    el.style.setProperty("--my", e.clientY - r.top + "px");
  });
  addEventListener("pointerout", (e) => {
    const el = e.target.closest?.(".magnetic");
    if (!el || el.contains(e.relatedTarget)) return;
    el.classList.remove("moving");
    el.style.transform = "";
  });
  addEventListener("click", (e) => {
    const lantern = e.target.closest?.(".lantern");
    if (lantern) {
      const on = lantern.getAttribute("aria-pressed") !== "true";
      lantern.setAttribute("aria-pressed", String(on));
      if (on) bouquet(e.clientX, Math.min(e.clientY, innerHeight * 0.38), 0.72);
      return;
    }
    const fw = e.target.closest?.("[data-firework]");
    if (fw) {
      const power = fw.dataset.firework === "lg" ? 1.45 : 0.8;
      bouquet(e.clientX || innerWidth * 0.66, Math.min(e.clientY || innerHeight * 0.28, innerHeight * 0.36), power);
      return;
    }
    if (e.pointerType === "touch") return;
    if (e.target.closest?.("a,button,input,select,textarea,summary,label")) return;
    if (!e.target.closest?.(".hero, .scene, .promise")) return;
    bouquet(e.clientX, Math.min(e.clientY, innerHeight * 0.38), 0.95);
  });
  setInterval(() => {
    if (document.hidden || !motionOK() || route) return;
    if (sparks.length > 90) return;
    launchRocket(innerWidth * (0.56 + Math.random() * 0.3), innerHeight * (0.16 + Math.random() * 0.16), "#ffd7a1", 0.82);
  }, 9000);
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
  $("#scene").onchange = (e) => {
    if (painting) return;
    document.body.dataset.theme = e.target.value;
  };
  $("#sound").onclick = async () => {
    if (enabled && audio?.state === "running") {
      enabled = false;
      await audio.suspend();
    } else {
      enabled = true;
      await startSound();
    }
    try {
      localStorage.setItem("world-sound", enabled ? "on" : "off");
    } catch {}
    soundLabel();
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!e.target.closest("#sound")) startSound();
    },
    { once: true },
  );
  document.addEventListener("keydown", () => startSound(), { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio?.suspend();
    else if (enabled) audio?.resume().then(soundLabel).catch(() => {});
  });
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
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/assets/")) return;
    if (!isLocalePath(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (url.hash) return;
      if (url.pathname === location.pathname) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: motionOK() ? "smooth" : "auto" });
      }
      return;
    }
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
  addEventListener("popstate", () => navigate(location.pathname + location.search + location.hash, { push: false, focus: false }));
  const clock = () => {
    const el = $("#clock");
    if (!el) return;
    el.textContent =
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" }).format(new Date()) +
      " TW";
  };
  clock();
  setInterval(clock, 30000);
}

readRoute();
bindChrome();
bindMotion();
soundLabel();
await render({ enter: false });
try {
  applyAppearance(await api("appearance"));
  let saved = null;
  try {
    saved = localStorage.getItem("world-sound");
  } catch {}
  if (saved === null) enabled = appearance.sound !== false;
  soundLabel();
  paintHeadline();
} catch {}
if (location.hash) {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  document.getElementById(id)?.scrollIntoView();
}
