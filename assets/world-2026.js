const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const parts = location.pathname.split("/").filter(Boolean);
const lang = ["tw", "en", "jp"].includes(parts[0]) ? parts.shift() : "tw";
let route = parts.join("/");
if (location.hostname === "admin.htw0702.com" && !route) route = "admin";
const t = (tw, en, jp) => ({ tw, en, jp })[lang];
const link = (p) => `/${lang}${p ? "/" + p : ""}`;
const main = $("#main");
const nav = [
  ["", t("世界", "World", "世界")],
  ["works", t("作品", "Works", "作品")],
  ["blog", t("手記", "Journal", "手記")],
  ["wiki", t("維基", "Wiki", "ウィキ")],
  ["social", t("社群", "Social", "ソーシャル")],
  ["store", t("小賣所", "Shop", "売店")],
  ["search", t("搜尋", "Search", "検索")],
];
const navKey = route === "me" || route === "contact" ? "social" : route;
$("#nav").innerHTML = nav
  .map(([p, l]) => {
    const on = p === navKey || (p && (navKey === p || navKey.startsWith(p + "/")));
    return `<a href="${link(p)}" ${on ? 'aria-current="page"' : ""}>${l}</a>`;
  })
  .join("");
$(".brand").href = link("");
document.querySelectorAll("[data-route]").forEach((a) => {
  a.href = link(a.dataset.route);
});
document.body.dataset.page = route.split("/")[0] || "home";
document.body.dataset.scene = "harbor";
const languageNames = {
  tw: ["🇹🇼 繁體中文", "🇺🇸 英文", "🇯🇵 日本語"],
  en: ["🇹🇼 Traditional Chinese", "🇺🇸 English", "🇯🇵 Japanese"],
  jp: ["🇹🇼 繁体字中国語", "🇺🇸 英語", "🇯🇵 日本語"],
};
$("#language").innerHTML = ["tw", "en", "jp"]
  .map(
    (l, i) =>
      `<option value="${l}" ${l === lang ? "selected" : ""}>${languageNames[lang][i]}</option>`,
  )
  .join("");
$("#language").onchange = (e) =>
  (location.href = `/${e.target.value}/${route}${location.search}`);
document.documentElement.lang = { tw: "zh-Hant-TW", en: "en-US", jp: "ja-JP" }[
  lang
];
$("#menu").onclick = () =>
  $("#menu").setAttribute(
    "aria-expanded",
    String($("#nav").classList.toggle("open")),
  );
$("#peace").textContent = t(
  "願我們相遇的世界，只有花火，沒有戰火。",
  "May the skies we share hold fireworks, never war.",
  "出会う世界の空に、戦火ではなく花火が咲きますように。",
);
const themes = [
  ["dusk", t("暮色", "Dusk", "夕暮れ")],
  ["night", t("夜色", "Night", "夜")],
  ["day", t("晴日", "Day", "昼")],
];
$("#scene").innerHTML = themes
  .map(([v, l]) => `<option value="${v}">${l}</option>`)
  .join("");
$("#scene").onchange = (e) => (document.body.dataset.theme = e.target.value);
const clock = () =>
  ($("#clock").textContent =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()) + " TW");
clock();
setInterval(clock, 60000);
async function api(path, options = {}) {
  const r = await fetch("/api/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error(`${r.status}`);
  return r.json();
}
const empty = t(
    "還沒有公開內容。",
    "No public entries yet.",
    "公開記事はまだありません。",
  ),
  unavailable = t(
    "暫時無法讀取，請稍後重新整理。",
    "Temporarily unavailable. Please refresh later.",
    "一時的に読み込めません。後でもう一度お試しください。",
  );
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
function applyAppearance(x) {
  appearance = x;
  document.body.dataset.theme = x.theme;
  document.body.dataset.motion = x.motion;
  document.documentElement.style.setProperty("--accent", x.accent);
  $("#scene").value = x.theme;
  const h = $("[data-headline]");
  if (h) h.textContent = x.hero[lang];
}
// Synthesized coastal ambience: filtered noise with slow tide modulation; no speech.
let audio,
  master,
  enabled = true;
try {
  enabled = localStorage.getItem("world-sound") !== "off";
} catch {}
function soundLabel() {
  const running = enabled && audio?.state === "running";
  $("#sound").textContent = running
    ? t("♫ 海浪", "♫ Waves", "♫ 波音")
    : enabled
      ? t("♫ 點一下啟動", "♫ Tap for sound", "♫ タップで音")
      : t("♫ 靜音", "♫ Muted", "♫ 消音");
  $("#sound").setAttribute("aria-pressed", String(enabled));
}
async function startSound() {
  if (!enabled || route === "admin") return;
  try {
    if (!audio) {
      audio = new AudioContext();
      master = audio.createGain();
      master.gain.value = 0.045;
      master.connect(audio.destination);
      const b = audio.createBuffer(1, audio.sampleRate * 12, audio.sampleRate),
        d = b.getChannelData(0);
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
  else if (enabled)
    audio
      ?.resume()
      .then(soundLabel)
      .catch(() => {});
});
soundLabel();
const titles = {
  works: t("把想像，做成作品。", "Ideas made tangible.", "想像を、作品に。"),
  wiki: t(
    "你好，我是筳筳。",
    "Hello, I’m Ting Ting.",
    "こんにちは、筳筳です。",
  ),
  blog: t("沿岸手記", "Letters from the coast", "海辺の日記"),
  world: t(
    "一座還在生長的世界。",
    "A world still taking shape.",
    "育ち続ける世界。",
  ),
  me: t("在這裡，找到我。", "Let’s stay connected.", "ここで、つながろう。"),
  social: t(
    "頻道開著，人還是我。",
    "Channels are open. It’s still just me.",
    "チャンネルは開いている。まだ、私です。",
  ),
  plans: t(
    "這輩子，想完成的三件事。",
    "Three dreams for a lifetime.",
    "一生をかけて叶えたい、三つの夢。",
  ),
  search: t("在公開的句子裡找。", "Search the public pages.", "公開ページを探す。"),
  now: t("現在公開的。", "Public right now.", "いま公開していること。"),
  store: t("把喜歡的，帶進日常。", "A little wonder for everyday life.", "好きな景色を、日常に。"),
};
const planNames = [
  t("自己的動畫電影", "My animated film", "自分のアニメ映画"),
  t("自己的 AI 夥伴", "My AI companion", "自分の AI パートナー"),
  t("自己的虛擬世界", "My virtual world", "自分の仮想世界"),
];
const planDesc = [
  t(
    "用光、風景與故事，留下值得記住的相遇。",
    "Light, landscapes, and stories of encounters worth remembering.",
    "光と風景と物語で、忘れられない出会いを。",
  ),
  t(
    "從能完成一件小事的助理，逐步學會更多。",
    "Begin with an assistant that does one small thing well.",
    "小さなことを一つできるアシスタントから。",
  ),
  t(
    "讓台日的日常與想像，成為可以走進去的地方。",
    "Build a place where Taiwanese and Japanese everyday life meets imagination.",
    "台湾と日本の日常、そして想像の中へ。",
  ),
];
const plansHTML = () =>
  `<div class="plans-grid">${["animation", "ai", "metaverse"].map((p, i) => `<a class="plan tilt reveal" href="${link("plans/" + p)}"><small>0${i + 1}</small><h3>${planNames[i]}</h3><p>${planDesc[i]}</p><span>↗</span></a>`).join("")}</div>`;
function sub(title, kicker = "", desc = "") {
  return `<section class="subhero"><small>${esc(kicker)}</small><h1>${esc(title)}</h1><p>${esc(desc)}</p></section>`;
}
const districts = [
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
const stalls = [
  ["海風深夜麵屋", "Sea-breeze Midnight Noodles", "海風深夜麺屋", "熱氣、海風與深夜燈火。", "Steam, sea air, late lights.", "湯気、海風、深夜の灯り。"],
  ["花火關東煮", "Fireworks Oden", "花火おでん", "祭典散場前的最後一碗。", "The last bowl before the festival ends.", "祭りが終わる前の最後の一杯。"],
  ["玉露茶寮", "Gyokuro Tea House", "玉露茶寮", "在燈籠下面慢慢喝一杯。", "Take your time beneath the lanterns.", "提灯の下でゆっくり一杯。"],
  ["射的遊戲屋", "Festival Shooting Game", "射的遊戯屋", "點我，天空會回應。", "Tap me. The sky answers.", "押してみて。空が応える。"],
];
function home() {
  const portals = [
    ["works", "01", t("作品展間", "Work room", "作品の部屋"), t("正在學習，也正在把想法做出來。", "Learning, and making ideas real.", "学びながら、アイデアを形に。")],
    ["blog", "02", titles.blog, t("生活、美食、技術，和沿路的風景。", "Life, food, technology, and the road.", "暮らし、食、技術、道の途中の風景。")],
    ["wiki", "03", t("關於筳筳", "About Ting Ting", "筳筳について"), t("來自台灣，喜歡沒有邊界的想像。", "From Taiwan, with an unbounded imagination.", "台湾から、自由な想像とともに。")],
    ["world", "04", t("世界設定", "World bible", "世界設定"), t("海岸、夜市、電車與花火的設定集。", "Coast, night market, trams, fireworks.", "海岸、夜市、電車、花火。")],
    ["social", "05", t("社群頻道", "Social channels", "ソーシャル"), t("Instagram、Threads、X。", "Instagram, Threads, and X.", "Instagram、Threads、X。")],
    ["store", "06", t("小賣所", "Little shop", "売店"), t("個人周邊與支持的入口。", "Personal goods and support.", "品とサポートの入口。")],
    ["plans", "07", t("人生計畫", "Lifetime plans", "人生の計画"), t("動畫、AI，與可以走進去的世界。", "Animation, AI, and a world you can enter.", "アニメ、AI、歩いて入れる世界。")],
    ["search", "08", t("搜尋", "Search", "検索"), t("在公開頁面、手記與作品裡找一句話。", "Find a line across the public pages.", "公開ページの中から、一文を探す。")],
  ];
  const motto = t(
    "願我們相遇的世界，只有花火，沒有戰火。",
    "May the skies we share hold fireworks, never war.",
    "出会う世界の空に、戦火ではなく花火が咲きますように。",
  );
  main.innerHTML = `<section class="hero"><div class="hero-media"></div><div class="hud-frame"></div><div class="hero-content"><span class="eyebrow">HTW0702 // TAIWAN × JAPAN</span><h1 class="kinetic" data-headline>${esc(appearance.hero[lang])}</h1><p>${t("我是筳筳，來自台灣。<br>喜歡海、花火，以及那些還沒成真的夢。<br>這裡，是我慢慢建造、也會對你做出反應的個人世界。", "I’m Ting Ting, from Taiwan.<br>I love the sea, fireworks, and dreams yet to come true.<br>This is the personal world I’m building — and it answers back.", "台湾の筳筳です。<br>海と花火、まだ叶っていない夢が好き。<br>ここは、少しずつ作っていて、触れると応える私の世界。")}</p><div class="cta-row"><a class="hud-btn" href="#districts">${t("進入街區", "Enter the districts", "街区へ")}</a><button class="hud-btn ghost" type="button" id="launch">${t("放一場花火", "Launch fireworks", "花火を上げる")}</button></div></div><span class="vertical">${t("寫給，尚未相遇的你。", "For someone I have yet to meet.", "まだ出会っていない、あなたへ。")}</span><div class="hero-bottom"><span>PERSONAL WORLD · TAIWAN × JAPAN</span><span id="hero-scene">01 — HARBOR</span></div></section><div class="ticker" aria-hidden="true"><span>${esc(motto)}　　／　　HTW0702 · 筳筳　　／　　${esc(motto)}　　／　　HTW0702 · 筳筳　　／　　</span></div><section class="section" id="districts"><div class="section-title"><div><small class="eyebrow">01 / DISTRICTS</small><h2>${t("今晚想去哪裡？", "Where to tonight?", "今夜はどこへ？")}</h2></div><p>${t("每個街區換一層光。點下去，海岸的色調會跟著走。", "Each district shifts the light. Tap one and the coast changes grade.", "街ごとに光が変わる。押すと、海岸の色がついてくる。")}</p></div><div class="districts" role="tablist">${districts
    .map(
      ([id, name, meta], i) =>
        `<button class="district tilt reveal" type="button" role="tab" data-scene="${id}" aria-selected="${id === "harbor"}"><small>0${i + 1}</small><strong>${name}</strong><span>${meta}</span></button>`,
    )
    .join("")}</div><div class="scene-stage reveal" id="scene-stage"><small id="scene-kicker">HARBOR</small><h2 id="scene-title"></h2><p id="scene-copy"></p></div></section><section class="section"><div class="section-title"><div><small class="eyebrow">02 / FESTIVAL STALLS</small><h2>${t("夜市沒有打烊。", "The night market stays open.", "夜市は、まだ開いている。")}</h2></div><p>${t("滑過攤位，或點開射的遊戲屋。", "Hover a stall, or tap the shooting game.", "屋台に触れて、射的を押してみて。")}</p></div><div class="stalls">${stalls
    .map(
      (row, i) =>
        `<button class="stall tilt reveal" type="button" data-burst="${i === 3 ? "lg" : "sm"}"><b>${t(row[0], row[1], row[2])}</b><span>${t(row[3], row[4], row[5])}</span></button>`,
    )
    .join("")}</div></section><section class="section" id="portals"><div class="section-title"><div><small class="eyebrow">03 / PORTALS</small><h2>${t("從世界裡，走進公開內容。", "Step from the world into the public work.", "世界から、公開コンテンツへ。")}</h2></div><p>${t("維基、作品、手記、社群。都還是這個人的入口。", "Wiki, works, journal, social. Still one person’s doors.", "ウィキ、作品、手記、ソーシャル。入口は、すべて私。")}</p></div><div class="portals">${portals
    .map(
      ([p, n, h, d]) =>
        `<a class="portal tilt reveal" href="${link(p)}"><small>${n}</small><h3>${h}</h3><p>${d}</p></a>`,
    )
    .join("")}</div></section><section class="promise"><div><small class="eyebrow">04 / A GENTLER WORLD</small><h2>${t("讓天空，只為花火亮起。", "Let the sky glow only with fireworks.", "空を照らすのは、花火だけで。")}</h2></div><div><p>${t("我想像的世界，有乾淨的河川、通往海邊的小路，和願意互相理解的人。把台灣的溫度、日本夏日的光，放進自己的故事裡。", "In the world I imagine, rivers run clear, paths lead to the sea, and people choose understanding. Taiwanese warmth and Japanese summer light become part of my own stories.", "澄んだ川、海へ続く小道、理解し合おうとする人たち。台湾の温かさと日本の夏の光を、自分の物語に込めて。")}</p><a class="hud-btn" href="${link("world")}">${t("世界設定", "World bible", "世界の設定")}</a></div></section><section class="section"><small class="eyebrow">05 / SOMEDAY</small><h2>${titles.plans}</h2>${plansHTML()}</section>`;
  const stage = $("#scene-stage");
  const showScene = (id) => {
    const row = districts.find((d) => d[0] === id) || districts[0];
    document.body.dataset.scene = row[0];
    document.querySelectorAll(".district").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.scene === row[0])));
    $("#scene-kicker").textContent = row[0].toUpperCase();
    $("#scene-title").textContent = row[1];
    $("#scene-copy").textContent = row[3];
    const chip = $("#hero-scene");
    if (chip) chip.textContent = `0${districts.indexOf(row) + 1} — ${row[0].toUpperCase()}`;
    stage.classList.remove("swap");
    void stage.offsetWidth;
    stage.classList.add("swap");
  };
  showScene("harbor");
  document.querySelectorAll(".district").forEach((b) => (b.onclick = () => showScene(b.dataset.scene)));
  const burstAt = (x, y, power) => window.__hudBurst?.(x, y, power);
  $("#launch").onclick = (e) => burstAt(e.clientX, e.clientY, 1);
  document.querySelectorAll(".stall").forEach((b) => (b.onclick = (e) => burstAt(e.clientX, e.clientY, b.dataset.burst === "lg" ? 1.4 : 0.55)));
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
    b = (results[1].value.entries || [])
      .filter((x) => x.source !== "notion")
      .map((x) => ({ ...x, name: x.title }));
  if (results.every((x) => x.status === "rejected")) throw Error("unavailable");
  const ids = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => !ids.has(x.id))];
}
function posts(items) {
  return items.length
    ? items
        .map(
          (x, i) =>
            `<article class="post reveal" id="${esc(x.slug || "")}"><small>${String(i + 1).padStart(3, "0")} / ${esc(x.updated || x.updated_at || "")}</small><h2>${esc(x.name)}</h2><p>${esc(x.body)}</p></article>`,
        )
        .join("")
    : `<p class="empty">${empty}</p>`;
}
async function cms(kind) {
  const loading = t("讀取中…", "Loading…", "読み込み中…");
  const shelf =
    kind === "wiki"
      ? `<div class="wiki-layout"><figure class="portrait reveal"><img src="/assets/portrait.jpg" width="960" height="1280" alt="${t("筳筳", "Ting Ting", "筳筳")}"><figcaption>筳筳 · Wang Hao Ting</figcaption></figure><div id="entries">${loading}</div></div>`
      : `<div id="entries">${loading}</div>`;
  main.innerHTML =
    sub(titles[kind] || kind, kind.toUpperCase()) +
    `<section class="section">${shelf}</section>`;
  try {
    const items = await content(kind);
    $("#entries").innerHTML = posts(items);
    if (kind === "blog") {
      const box = $("#entries");
      box.innerHTML = `<div class="blog-layout"><div><input class="blog-search" id="search" aria-label="${t("搜尋手記", "Search journal", "日記を検索")}" placeholder="${t("搜尋文章、食物、城市…", "Search stories, food, places…", "記事、食べ物、街を検索…")}"><div id="posts">${posts(items)}</div></div><aside><h3>筳筳</h3><p>${t("把今天看見的，留給明天的自己。", "Keeping today’s little moments for tomorrow.", "今日の景色を、明日の自分へ。")}</p><a class="line-link" href="${link("social")}">${titles.social} ↗</a><p class="note">${t("個人手記，依更新時間排列。", "A personal journal, ordered by update time.", "更新順の個人日記。")}</p></aside></div>`;
      $("#search").oninput = (e) =>
        ($("#posts").innerHTML = posts(
          items.filter((x) =>
            (x.name + " " + x.body)
              .toLowerCase()
              .includes(e.target.value.toLowerCase()),
          ),
        ));
    }
  } catch {
    $("#entries").textContent = unavailable;
  }
}
function me() {
  const social = [
    ["Instagram", "htw0702ig", "https://instagram.com/htw0702ig"],
    ["Threads", "@htw0702threads", "https://www.threads.net/@htw0702threads"],
    ["X", "@htw0702x", "https://x.com/htw0702x"],
    ["Discord", "@htw0702dc", null],
    [
      "Telegram · " + t("台灣", "Taiwan", "台湾"),
      "@htw0702tgtw",
      "https://t.me/htw0702tgtw",
    ],
    [
      "Telegram · " + t("日本", "Japan", "日本"),
      "@htw0702tgjp",
      "https://t.me/htw0702tgjp",
    ],
  ];
  const heading = route === "me" || route === "contact" ? titles.me : titles.social;
  main.innerHTML =
    sub(heading, "SOCIAL / HTW0702") +
    `<section class="section"><p>${t("Instagram、Threads、X。點開就是我的頁面。", "Instagram, Threads, and X. Each one opens my page.", "Instagram、Threads、X。開くと、私のページです。")}</p><div class="social-grid">${social.map(([n, h, u]) => (u ? `<a class="social tilt reveal" href="${u}" target="_blank" rel="me noopener"><b>${n} ↗</b><span>${h}</span></a>` : `<div class="social tilt reveal"><b>${n}</b><span>${h}</span><button class="button" id="copy-discord">${t("複製帳號", "Copy username", "ユーザー名をコピー")}</button></div>`)).join("")}</div><h2>${t("寫封信給我", "Send me a letter", "メールを送る")}</h2><a class="hud-btn plain" href="mailto:taiwan@htw0702.com">Taiwan · taiwan@htw0702.com</a><a class="hud-btn ghost plain" href="mailto:japan@htw0702.com">Japan · japan@htw0702.com</a></section>`;
  $("#copy-discord").onclick = async (e) => {
    try {
      await navigator.clipboard.writeText("htw0702dc");
      e.target.textContent = t("已複製", "Copied", "コピーしました");
    } catch {
      e.target.textContent = "htw0702dc";
    }
  };
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
      const v = vals[i],
        px = 50 + (i * 440) / Math.max(1, items.length - 1),
        py = 180 - ((v || 0) / max) * 160;
      return v === null
        ? ""
        : `<circle cx="${px}" cy="${py}" r="5"><title>${esc(x.playedAt || "")} · KDA ${v.toFixed(2)}</title></circle><text x="${px}" y="${py - 12}" text-anchor="middle">${v.toFixed(2)}</text><text x="${px}" y="210" text-anchor="middle">${i + 1}</text>`;
    })
    .join(
      "",
    )}${vals.map((v, i) => (i && v !== null && vals[i - 1] !== null ? `<path class="series" d="M${50 + ((i - 1) * 440) / Math.max(1, items.length - 1)} ${180 - (vals[i - 1] / max) * 160} L${50 + (i * 440) / Math.max(1, items.length - 1)} ${180 - (v / max) * 160}"/>` : "")).join("")}</svg>`;
}
function review(x) {
  const v = kda(x),
    kp =
      x.teamKills > 0 && x.kills != null && x.assists != null
        ? (((x.kills + x.assists) / x.teamKills) * 100).toFixed(1) + "%"
        : "—";
  return `<p>KDA ${v === null ? "—" : v.toFixed(2)} · ${t("擊殺參與率", "Kill participation", "キル参加率")} ${kp}</p><p>${t("復盤時可以回看每次死亡前 20 秒，記下當時的視野、隊友位置，以及能不能提早撤退。", "When reviewing, look at the 20 seconds before each death: vision, teammate positions, and whether an earlier exit was possible.", "振り返るときは、デスの20秒前を見る。視界、味方の位置、早めに撤退できたか。")}</p><p class="note">${t("這些是依數字整理的檢查方向，沒有解析錄影。", "These prompts come from the numbers. No replay was analyzed.", "数字から整理した確認項目です。動画は解析していません。")}</p>`;
}
async function games() {
  main.innerHTML =
    sub(
      "League of Legends",
      "htw0702rg#0702",
      t(
        "公開的對戰紀錄列在這裡。只顯示已經同步的場次。",
        "Public match records are listed here. Only synced games are shown.",
        "公開された対戦記録を並べます。同期された試合だけです。",
      ),
    ) +
    `<section class="section"><div id="game">${t("讀取中…", "Loading…", "読み込み中…")}</div></section>`;
  let items = [],
    source = t("公開紀錄", "Public records", "公開記録");
  try {
    const d = await api("lol/matches?locale=" + lang);
    items = d.items || [];
    if (!d.configured && !items.length)
      source = t(
        "帳號 htw0702rg#0702。目前沒有已公開的場次。",
        "Account htw0702rg#0702. No published matches are available.",
        "アカウント htw0702rg#0702。公開された試合はまだありません。",
      );
  } catch {
    source = t(
      "帳號 htw0702rg#0702。這一頁暫時讀不到紀錄。",
      "Account htw0702rg#0702. Records can’t be read right now.",
      "アカウント htw0702rg#0702。いま記録を読み込めません。",
    );
  }
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
            .map(
              ([v, l]) =>
                `<button data-filter="${v}" aria-pressed="${v === filter}">${l}</button>`,
            )
            .join("")}</div><div class="game-layout"><div class="panel"><h2>${t("KDA 變化", "KDA over matches", "KDA の推移")}</h2>${chart(a)}</div><div class="panel"><h2>${t("本次樣本", "Selected sample", "選択中のサンプル")}</h2><div class="metrics"><div class="metric"><small>${t("場次", "Matches", "試合数")}</small><b>${a.length}</b></div><div class="metric"><small>${t("勝率", "Win rate", "勝率")}</small><b>${((wins / a.length) * 100).toFixed(1)}%</b></div></div></div></div>${a
            .map(
              (x) =>
                `<details class="match"><summary><span>${esc(x.playedAt || x.updated || "")} · ${esc(x.hero || t("英雄待確認", "Champion unconfirmed", "チャンピオン未確認"))}</span><b class="${x.result === "win" ? "win" : "loss"}">${x.kills ?? "—"} / ${x.deaths ?? "—"} / ${x.assists ?? "—"} ↘</b></summary>${review(x)}${x.gold ? `<p>${t("經濟", "Gold", "ゴールド")}: ${x.gold}</p>` : ""}</details>`,
            )
            .join("")}`
        : `<p class="empty">${t("目前沒有已公開的場次。", "No published matches yet.", "公開された試合はまだありません。")}</p>`);
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => (b.onclick = () => draw(b.dataset.filter)));
  }
  draw();
}
async function plans() {
  const slug = route.split("/")[1];
  if (!slug) {
    main.innerHTML =
      sub(titles.plans, "PLANS / A LIFETIME OF MAKING") +
      `<section class="section">${plansHTML()}</section>`;
    return;
  }
  const i = ["animation", "ai", "metaverse"].indexOf(slug);
  if (i < 0) {
    notFound();
    return;
  }
  main.innerHTML =
    sub(planNames[i], "PLAN / 0" + (i + 1), planDesc[i]) +
    `<section class="section"><div id="plan-feed"></div><h2>${t("其他夢想", "Other dreams", "ほかの夢")}</h2>${plansHTML()}</section>`;
  try {
    $("#plan-feed").innerHTML = posts(await content("plan-" + slug));
  } catch {
    $("#plan-feed").textContent = unavailable;
  }
}
async function store() {
  main.innerHTML =
    sub(
      t(
        "把喜歡的，帶進日常。",
        "A little wonder for everyday life.",
        "好きな景色を、日常に。",
      ),
      "STORE",
    ) +
    `<section class="section"><div id="products"></div><div id="payments"></div></section>`;
  try {
    $("#products").innerHTML = posts(await content("store"));
    const d = await api("payments");
    for (const [n, u] of [
      ["Wise", d.wise],
      ["PayPal", d.paypal],
    ])
      if (u && new URL(u).protocol === "https:")
        $("#payments").insertAdjacentHTML(
          "beforeend",
          `<a class="line-link" rel="noopener" href="${esc(u)}">${n} ↗</a>`,
        );
    if (d.bitcoin) {
      const p = document.createElement("p");
      p.textContent = "Bitcoin: " + d.bitcoin;
      $("#payments").append(p);
    }
  } catch {
    $("#products").textContent = unavailable;
  }
}
const kindLabel = (kind) =>
  ({
    blog: t("手記", "Journal", "手記"),
    works: t("作品", "Works", "作品"),
    wiki: t("維基", "Wiki", "ウィキ"),
    world: t("世界", "World", "世界"),
    store: t("小賣所", "Shop", "売店"),
    now: t("現在", "Now", "いま"),
    "plan-animation": planNames[0],
    "plan-ai": planNames[1],
    "plan-metaverse": planNames[2],
    page: t("頁面", "Page", "ページ"),
  })[kind] || kind;
async function searchPage() {
  const initial = new URLSearchParams(location.search).get("q") || "";
  main.innerHTML =
    sub(titles.search, "SEARCH") +
    `<section class="section"><form class="search-form" id="search-form" role="search"><input id="q" name="q" value="${esc(initial)}" maxlength="80" autocomplete="off" aria-label="${t("搜尋公開內容", "Search public pages", "公開コンテンツを検索")}" placeholder="${t("手記、作品、花火、社群…", "Journal, works, fireworks, social…", "手記、作品、花火、ソーシャル…")}"><button class="hud-btn" type="submit">${t("搜尋", "Search", "検索")}</button></form><div id="results"></div></section>`;
  const box = $("#results");
  const input = $("#q");
  let timer = 0;
  async function run(q) {
    const url = link("search") + (q ? `?q=${encodeURIComponent(q)}` : "");
    history.replaceState(null, "", url);
    box.innerHTML = `<p class="note">${t("讀取中…", "Loading…", "読み込み中…")}</p>`;
    try {
      const d = await api("search?locale=" + lang + "&q=" + encodeURIComponent(q));
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
      box.textContent = unavailable;
    }
  }
  $("#search-form").onsubmit = (e) => {
    e.preventDefault();
    run(input.value.trim());
  };
  input.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(input.value.trim()), 180);
  };
  await run(initial.trim());
}
function notFound() {
  main.innerHTML =
    sub(
      t("這條路還沒有頁面。", "This path has no page.", "この道にはページがありません。"),
      t("還沒走過的小路", "An unexplored path", "まだ歩いていない道"),
    ) +
    `<section class="section lost"><p>${t("花火還在另一邊。你可以回到世界，或是直接去社群與搜尋。", "The fireworks are on another shore. Return to the world, or go straight to social and search.", "花火は、別の岸にあります。世界へ戻るか、ソーシャルと検索へ。")}</p><div class="cta-row"><a class="hud-btn" href="${link("")}">${t("回到首頁", "Back home", "ホームへ")}</a><a class="hud-btn ghost" href="${link("social")}">${t("社群", "Social", "ソーシャル")}</a><a class="hud-btn ghost" href="${link("search")}">${t("搜尋", "Search", "検索")}</a></div></section>`;
}
async function admin() {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<meta name="robots" content="noindex,nofollow">',
  );
  main.innerHTML =
    sub(
      t(
        "把世界，調成喜歡的樣子。",
        "Make this world feel like you.",
        "世界を、自分らしく。",
      ),
      "PRIVATE STUDIO",
    ) +
    `<section class="section" id="studio"><p>${t("確認登入狀態…", "Checking sign-in…", "ログイン状態を確認中…")}</p></section>`;
  let me;
  try {
    me = await api("me");
  } catch {
    let h = {};
    try {
      h = await api("health");
    } catch {}
    $("#studio").innerHTML =
      `<div class="panel"><h2>${t("只有你的 Apple 帳號能進入。", "Your Apple account is the only way in.", "あなたの Apple アカウント専用です。")}</h2><p>${h.auth ? t("登入後即可管理內容與外觀。", "Sign in to manage content and appearance.", "ログインして内容と外観を管理できます。") : t("Apple 登入與資料庫尚未完成設定，所有寫入保持鎖定。", "Apple sign-in and database setup are incomplete. All writes remain locked.", "Apple ログインとデータベースの設定が未完了のため、書き込みはロックされています。")}</p>${h.auth ? `<a class="button primary" href="/api/auth/start?locale=${lang}">Apple · ${t("登入", "Sign in", "ログイン")}</a>` : ""}</div>`;
    return;
  }
  const headers = { "X-CSRF-Token": me.csrf };
  let records = [];
  const kinds = [
    "blog",
    "works",
    "wiki",
    "world",
    "now",
    "match",
    "catalog",
    "store",
    "plan-animation",
    "plan-ai",
    "plan-metaverse",
  ];
  $("#studio").innerHTML =
    `<div class="appearance"><h2>${t("外觀工作室", "Appearance studio", "外観スタジオ")}</h2><form id="appearance-form"><div class="form-grid"><label>${t("佈景主題", "Theme", "テーマ")}<select name="theme">${themes.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label><label>${t("主色", "Accent color", "アクセントカラー")}<input type="color" name="accent"></label></div>${["tw", "en", "jp"].map((l) => `<label>${languageNames[lang][["tw", "en", "jp"].indexOf(l)]} · ${t("首頁標題", "Home headline", "ホーム見出し")}<input name="hero-${l}" maxlength="120" required></label>`).join("")}<label><span><input type="checkbox" name="motion"> ${t("啟用動態", "Enable motion", "アニメーション")}</span></label><label><span><input type="checkbox" name="sound"> ${t("環境音預設開啟", "Sound enabled by default", "環境音を既定で有効に")}</span></label><button class="button primary">${t("儲存並套用", "Save and apply", "保存して適用")}</button><p id="appearance-status" role="status"></p></form></div><div class="studio-grid"><aside><button class="button" id="new">＋ ${t("新增內容", "New entry", "新規作成")}</button><button class="button" id="notion-sync">Notion ↓ ${t("同步", "Sync", "同期")}</button><button class="button" id="riot-sync">Riot ↓ ${t("更新戰績", "Update matches", "戦績を更新")}</button><button class="button" id="slack-test">Slack · ${t("發送測試通知", "Send test notification", "テスト通知を送信")}</button><button class="button" id="logout">${t("登出", "Sign out", "ログアウト")}</button><div id="record-list"></div></aside><form id="editor"><input name="id" type="hidden"><input name="version" type="hidden"><div class="form-grid"><label>${t("內容種類", "Content type", "種類")}<select name="kind">${kinds.map((k) => `<option>${k}</option>`).join("")}</select></label><label>${t("語言", "Language", "言語")}<select name="locale">${["tw", "en", "jp"].map((l) => `<option>${l}</option>`).join("")}</select></label><label>${t("可見性", "Visibility", "公開設定")}<select name="visibility"><option value="private">${t("私人草稿", "Private draft", "非公開下書き")}</option><option value="public">${t("公開", "Public", "公開")}</option></select></label><label>Slug<input name="slug" pattern="[a-z0-9-]{1,80}" required></label></div><label>${t("標題", "Title", "タイトル")}<input name="title" maxlength="200" required></label><label>${t("內容", "Content", "本文")}<textarea name="body" maxlength="30000" required></textarea></label><fieldset id="match-fields" hidden><legend>${t("對戰紀錄", "Match record", "対戦記録")}</legend><div class="form-grid">${["hero", "mode", "rank", "evidence"].map((k) => `<label>${k}<input name="${k}"></label>`).join("")}<label>result<select name="result"><option>win</option><option>loss</option></select></label>${["minutes", "kills", "deaths", "assists", "teamKills"].map((k) => `<label>${k}<input name="${k}" type="number" min="0" max="1000" step="${k === "minutes" ? "0.01" : "1"}"></label>`).join("")}</div></fieldset><button class="button primary" id="save-entry">${t("儲存", "Save", "保存")}</button><p class="status" id="save-status" role="status"></p></form></div>`;
  const af = $("#appearance-form"),
    f = $("#editor"),
    field = (n) => f.elements.namedItem(n);
  let settings = await api("appearance");
  for (const k of ["theme", "accent"]) af.elements[k].value = settings[k];
  for (const k of ["motion", "sound"]) af.elements[k].checked = settings[k];
  for (const l of ["tw", "en", "jp"])
    af.elements["hero-" + l].value = settings.hero[l];
  af.onsubmit = async (e) => {
    e.preventDefault();
    const x = {
      theme: af.elements.theme.value,
      accent: af.elements.accent.value,
      motion: af.elements.motion.checked,
      sound: af.elements.sound.checked,
      hero: Object.fromEntries(
        ["tw", "en", "jp"].map((l) => [l, af.elements["hero-" + l].value]),
      ),
    };
    const b = af.querySelector("button");
    b.disabled = true;
    try {
      applyAppearance(
        await api("appearance", {
          method: "POST",
          headers,
          body: JSON.stringify(x),
        }),
      );
      $("#appearance-status").textContent = t(
        "已儲存，公開網站重新載入後生效。",
        "Saved. Public pages apply it on reload.",
        "保存しました。公開ページの再読み込みで反映されます。",
      );
    } catch {
      $("#appearance-status").textContent = unavailable;
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
      b.textContent = x.title + " · " + x.locale + " · " + x.visibility;
      b.onclick = () => {
        clear();
        for (const k of [
          "id",
          "version",
          "kind",
          "locale",
          "visibility",
          "slug",
          "title",
          "body",
        ])
          field(k).value = x[k];
        for (const [k, v] of Object.entries(x.meta || {}))
          if (field(k)) field(k).value = v ?? "";
        $("#match-fields").hidden = x.kind !== "match";
        if (x.source === "notion") {
          for (const el of f.elements) el.disabled = true;
          $("#save-status").textContent = t(
            "此內容由 Notion 管理，請在 Notion 修改後同步。",
            "This entry is managed in Notion. Edit it there, then sync.",
            "Notion 管理の記事です。Notion で編集して同期してください。",
          );
        }
      };
      $("#record-list").append(b);
    }
  }
  for (const [id, path, ready] of [
    ["riot-sync", "riot/sync", me.connections.riot],
    ["slack-test", "slack/test", me.connections.slack],
  ]) {
    const b = $("#" + id);
    b.disabled = !ready;
    b.onclick = async () => {
      b.disabled = true;
      try {
        await api(path, { method: "POST", headers, body: "{}" });
        $("#save-status").textContent = t(
          "已完成。",
          "Completed.",
          "完了しました。",
        );
      } catch {
        $("#save-status").textContent = unavailable;
      } finally {
        b.disabled = false;
      }
    };
  }
  $("#new").onclick = clear;
  field("kind").onchange = () =>
    ($("#match-fields").hidden = field("kind").value !== "match");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const x = Object.fromEntries(new FormData(f));
    x.version = Number(x.version) || 0;
    x.meta = {};
    if (x.kind === "match") {
      for (const k of ["hero", "mode", "rank", "evidence", "result"])
        x.meta[k] = x[k];
      for (const k of ["minutes", "kills", "deaths", "assists", "teamKills"])
        x.meta[k] = x[k] === "" ? null : Number(x[k]);
    }
    $("#save-entry").disabled = true;
    try {
      const d = await api("entries", {
        method: "POST",
        headers,
        body: JSON.stringify(x),
      });
      field("id").value = d.entry.id;
      field("version").value = d.entry.version;
      await refresh();
      $("#save-status").textContent = t("已儲存。", "Saved.", "保存しました。");
    } catch (e) {
      $("#save-status").textContent =
        e.message === "409"
          ? t(
              "內容有衝突，請重新選取紀錄後再編輯。",
              "Conflict: reload the entry before editing again.",
              "競合があります。記事を選び直してください。",
            )
          : unavailable;
    } finally {
      $("#save-entry").disabled = false;
    }
  };
  $("#notion-sync").disabled = !me.connections.notion;
  $("#notion-sync").onclick = async (e) => {
    e.target.disabled = true;
    try {
      await api("notion/sync", { method: "POST", headers, body: "{}" });
      await refresh();
      $("#save-status").textContent = t(
        "Notion 已同步。",
        "Notion synced.",
        "Notion を同期しました。",
      );
    } catch {
      $("#save-status").textContent = unavailable;
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
const motionOK = () =>
  document.body.dataset.motion !== "false" &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;
function replayPage() {
  main.classList.remove("page-enter");
  void main.offsetWidth;
  if (motionOK()) main.classList.add("page-enter");
  setTimeout(() => document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in")), 900);
}
function mountMotion() {
  const boot = $("#boot");
  const finishBoot = () => {
    boot?.classList.add("done");
    document.documentElement.classList.add("booted");
    try {
      sessionStorage.setItem("hud-boot", "1");
    } catch {}
  };
  if (!motionOK() || document.documentElement.classList.contains("booted")) finishBoot();
  else {
    boot?.addEventListener("pointerdown", finishBoot, { once: true });
    setTimeout(finishBoot, 1650);
  }
  const cursor = $("#cursor");
  addEventListener("pointermove", (e) => {
    if (!cursor || e.pointerType !== "mouse" || !motionOK()) return;
    cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    cursor.classList.add("on");
    cursor.classList.toggle("hot", Boolean(e.target.closest("a,button")));
  });
  main.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".tilt");
    if (!card || !motionOK()) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + "deg");
    card.style.setProperty("--rx", ((0.5 - (e.clientY - r.top) / r.height) * 6).toFixed(2) + "deg");
  });
  main.addEventListener("pointerout", (e) => {
    const card = e.target.closest?.(".tilt");
    if (!card || card.contains(e.relatedTarget)) return;
    card.style.removeProperty("--rx");
    card.style.removeProperty("--ry");
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
    },
    { threshold: 0.14 },
  );
  const watch = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
  new MutationObserver(watch).observe(main, { childList: true, subtree: true });
  watch();
  const canvas = $("#fx");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  let parts = [];
  const fit = () => {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  };
  fit();
  addEventListener("resize", fit);
  const colors = ["#f0b27a", "#7ee7ff", "#ff4d6d", "#fff1d6", "#ffd0a8"];
  let raf = 0;
  const loop = () => {
    raf = 0;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!motionOK()) {
      parts = [];
      return;
    }
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += 0.034;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(loop);
  };
  const arm = () => {
    if (!raf && motionOK()) raf = requestAnimationFrame(loop);
  };
  window.__hudBurst = (x, y, power = 1) => {
    if (!motionOK()) return;
    const n = Math.round(34 * power);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.25;
      const s = (1.3 + Math.random() * 3.1) * power;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.1, life: 1, color: colors[i % colors.length] });
    }
    arm();
  };
  if (!route) {
    setInterval(() => {
      if (document.hidden || !motionOK() || route) return;
      window.__hudBurst(innerWidth * (0.58 + Math.random() * 0.28), innerHeight * (0.18 + Math.random() * 0.22), 0.65);
    }, 5400);
  }
}
mountMotion();
if (!route) home();
try {
  applyAppearance(await api("appearance"));
  let saved = null;
  try {
    saved = localStorage.getItem("world-sound");
  } catch {}
  if (saved === null) enabled = appearance.sound;
} catch {}
function applySeo() {
  let pack = {};
  try {
    pack = JSON.parse(document.getElementById("seo")?.textContent || "{}");
  } catch {}
  const known = pack.locales?.[lang] || {};
  const key = route === "me" || route === "contact" ? "social" : route || "home";
  const page = known[key] || known["404"];
  if (page?.title) document.title = page.title;
  else document.title = (titles[route] || "筳筳") + "｜htw0702";
  const desc = document.querySelector('meta[name="description"]');
  if (page?.description && desc) desc.setAttribute("content", page.description);
}
applySeo();
try {
  if (!route) home();
  else if (route === "me" || route === "contact" || route === "social") me();
  else if (route === "plans" || route.startsWith("plans/")) await plans();
  else if (route === "games/lol") await games();
  else if (route === "search") await searchPage();
  else if (route === "admin") await admin();
  else if (route === "store") await store();
  else if (["works", "wiki", "blog", "world", "now"].includes(route))
    await cms(route);
  else notFound();
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hash) document.getElementById(hash)?.scrollIntoView();
} catch {
  main.insertAdjacentHTML(
    "beforeend",
    `<section class="section"><p>${unavailable}</p></section>`,
  );
}
replayPage();
startSound();
