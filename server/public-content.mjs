import fallback from "../data/public-fallback.json" with { type: "json" };

const AOV =
  /傳說對決|arena of valor|htw0702aov|moba\.garena\.tw|(^|[^a-z0-9])aov([^a-z0-9]|$)/i;

export const SEARCH_KINDS = ["blog", "works", "wiki", "store", "now"];

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

const retiredKind = new Set([
  "catalog",
  "match",
  "world",
  "plan-animation",
  "plan-ai",
  "plan-metaverse",
]);

export function normalizePublic(items) {
  return (items || []).filter((x) => x && !retiredKind.has(x.kind) && !isAovText(x));
}

const guides = {
  tw: [
    {
      path: "",
      name: "筳筳",
      body: "首頁。王顥筳，筳筳，來自台灣。維基、手記、作品、遊戲、社群、小賣所、現在、搜尋。",
    },
    {
      path: "social",
      name: "社群頻道",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x YouTube htw0702yt https://www.youtube.com/@htw0702yt Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games",
      name: "遊戲",
      body: "遊戲入口。暮霞 MOS 是戰隊品牌。個人站不放對戰資料。",
    },
  ],
  en: [
    {
      path: "",
      name: "Ting Ting",
      body: "Home. Wang Hao Ting, Ting Ting, from Taiwan. Wiki, journal, works, games, social, shop, now, and search.",
    },
    {
      path: "social",
      name: "Social channels",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x YouTube htw0702yt https://www.youtube.com/@htw0702yt Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games",
      name: "Games",
      body: "Games door. Muohsia MOS is a separate team brand. Match records stay off this personal site.",
    },
  ],
  jp: [
    {
      path: "",
      name: "筳筳",
      body: "ホーム。王顥筳、筳筳、台湾出身。ウィキ、手記、作品、ゲーム、ソーシャル、売店、いま、検索。",
    },
    {
      path: "social",
      name: "ソーシャル",
      body: "Instagram htw0702ig https://instagram.com/htw0702ig Threads htw0702threads https://www.threads.net/@htw0702threads X htw0702x https://x.com/htw0702x YouTube htw0702yt https://www.youtube.com/@htw0702yt Discord htw0702dc Telegram htw0702tgtw htw0702tgjp taiwan@htw0702.com japan@htw0702.com",
    },
    {
      path: "games",
      name: "ゲーム",
      body: "ゲームへの入口。暮霞 MOS は別のチームです。この個人サイトに対戦記録は置きません。",
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
    store: "store",
    now: "now",
  };
  const p = paths[item.kind];
  if (!p) return `/${locale}`;
  return `/${locale}/${p}#${encodeURIComponent(item.slug || "")}`;
}
