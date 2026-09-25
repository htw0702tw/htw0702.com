import fallback from "../data/public-fallback.json" with { type: "json" };

const AOV =
  /傳說對決|arena of valor|htw0702aov|moba\.garena\.tw|(^|[^a-z0-9])aov([^a-z0-9]|$)/i;

export const SEARCH_KINDS = [
  "blog",
  "works",
  "wiki",
  "world",
  "store",
  "now",
  "plan-animation",
  "plan-ai",
  "plan-metaverse",
];

export function isAovText(item) {
  const s = `${item?.name || item?.title || ""} ${item?.body || ""} ${item?.slug || ""} ${item?.kind || ""}`;
  return AOV.test(s);
}

export function fallbackItems(locale, kind) {
  return fallback.items
    .filter((x) => x.locale === locale && x.kind === kind && !isAovText(x))
    .map((x) => ({
      id: `site:${x.kind}:${x.slug}`,
      name: x.name,
      body: x.body,
      slug: x.slug,
      kind: x.kind,
      locale: x.locale,
      updated: x.updated || "2026-09-12",
      source: "site",
    }));
}

export function normalizePublic(items) {
  return (items || []).filter(
    (x) => x && x.kind !== "catalog" && x.kind !== "match" && !isAovText(x),
  );
}

const guides = {
  tw: [
    {
      path: "",
      name: "筳筳的世界",
      body: "首頁。海風港町、暮霞夜市、夏祭坂、霓虹電車線、花火。願我們相遇的世界，只有花火，沒有戰火。",
    },
    {
      path: "social",
      name: "社群頻道",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games/lol",
      name: "League of Legends",
      body: "公開對戰紀錄。帳號 htw0702rg#0702。只顯示已同步的場次。",
    },
  ],
  en: [
    {
      path: "",
      name: "Ting Ting’s world",
      body: "Home. Harbor quarter, dusk night market, festival hill, neon tram, fireworks. May the skies we share hold fireworks, never war.",
    },
    {
      path: "social",
      name: "Social channels",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games/lol",
      name: "League of Legends",
      body: "Public match journal. Account htw0702rg#0702. Only synced games are shown.",
    },
  ],
  jp: [
    {
      path: "",
      name: "筳筳の世界",
      body: "ホーム。海風港町、暮霞夜市、夏祭坂、ネオン電車線、花火。出会う世界の空に、戦火ではなく花火を。",
    },
    {
      path: "social",
      name: "ソーシャル",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games/lol",
      name: "League of Legends",
      body: "公開対戦記録。アカウント htw0702rg#0702。同期された試合だけを表示します。",
    },
  ],
};

export function guideItems(locale) {
  return (guides[locale] || guides.tw).map((x) => ({
    id: `page:${x.path || "home"}`,
    name: x.name,
    body: x.body,
    slug: x.path || "home",
    path: x.path,
    kind: "page",
    locale,
    source: "site",
  }));
}

export function hrefFor(locale, item) {
  if (item.kind === "page") {
    const p = item.path || "";
    return `/${locale}${p ? "/" + p : ""}`;
  }
  const paths = {
    blog: "blog",
    works: "works",
    wiki: "wiki",
    world: "world",
    store: "store",
    now: "now",
    "plan-animation": "plans/animation",
    "plan-ai": "plans/ai",
    "plan-metaverse": "plans/metaverse",
  };
  const p = paths[item.kind];
  if (!p) return `/${locale}`;
  return `/${locale}/${p}#${encodeURIComponent(item.slug || "")}`;
}
