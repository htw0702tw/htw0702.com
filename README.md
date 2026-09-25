# htw0702.com

王顥筳（筳筳，Wang Hao Ting）的個人網站。來自台灣。公開頁面使用繁體中文、英文與日文。

## Public routes

- `/tw` `/en` `/jp` — home
- `/tw/games` `/en/games` `/jp/games` — games door. 暮霞｜MOS links out to https://moohsia.com
- `/tw/wiki` `/en/wiki` `/jp/wiki` — public wiki
- `/tw/blog` `/en/blog` `/jp/blog` — journal
- `/tw/works` `/en/works` `/jp/works` — public works
- `/tw/store` `/en/store` `/jp/store` — personal goods and support
- `/tw/social` `/en/social` `/jp/social` — Instagram, Threads, and X. `/me` stays as an alias of the same page.
- `/tw/search` `/en/search` `/jp/search` — search over public pages
- `/tw/now` `/en/now` `/jp/now` — what is public right now

Short aliases (`/wiki`, `/blog`, `/social`, `/store`, `/search`, `/now`, `/games`, `/me`) redirect to the Traditional Chinese route.

YouTube preview: change `youtube.videoId` in `data/media.json` (copied to `/assets/media.json` at build). While `placeholder` is true, the home player is labeled as a preview clip. The channel handle is `htw0702yt`.

These old paths redirect home with `301`, the same way old Arena of Valor URLs do:

- `/plans`, `/plans/animation`, `/plans/ai`, `/plans/metaverse` (and the `/tw`, `/en`, `/jp` copies)
- `/games/lol` (and the locale copies)
- `/world` (and the locale copies)
- `/api/aov/*`, `/api/lol/*`, and `/api/riot/*` return `404`

Seeded public copy lives in `data/public-fallback.json`. It is minimal and factual. A published Notion or studio row for that kind replaces the seed.

## Notion is the content source of truth

The owner fills public copy in Notion. The site does not invent a second CMS. Studio can still hold private drafts, but anything the owner maintains as the public record is the Notion database already bound as `NOTION_DATA_SOURCE_ID`.

Only rows with **Publish** checked and **Visibility** set to `public` are shown. Any other visibility, an unchecked Publish box, an archived page, or a kind this site no longer serves stays off the public pages.

### Database

One Notion data source, already configured:

- Data source ID: `95498a7d-a777-4c54-9755-eeea21933331` (`NOTION_DATA_SOURCE_ID` in `wrangler.jsonc`)
- Secret: `NOTION_TOKEN` (Cloudflare secret, never committed)
- Optional sync secret: `NOTION_SYNC_SECRET`, at least 32 characters, for the unattended pull endpoint

### Properties

| Property | Notion type | Values |
| --- | --- | --- |
| Name | Title | Public title, 1–200 characters |
| Body | Text | Public body, required when the row should publish |
| Slug | Text | `a-z`, `0-9`, and `-`, 1–80 characters |
| Kind | Select | `blog`, `works`, `wiki`, `now`, `store` |
| Locale | Select | `tw`, `en`, `jp` |
| Publish | Checkbox | Must be checked |
| Visibility | Select | Must be `public` |

`Kind` values `plan-animation`, `plan-ai`, `plan-metaverse`, `match`, `world`, and `catalog` are ignored. They are not public pages.

### How sync runs

1. **Live read.** Each public page asks Notion for that locale and kind, filtered to `Publish = true` and `Visibility = public`, newest edit first. If Notion returns at least one row, those rows replace the seed for that kind. If the token is missing, the query fails, or the kind is empty, the site shows the seed in `data/public-fallback.json`.
2. **Studio import.** A signed-in owner can press **Notion sync** in `/tw/admin`. That calls `POST /api/notion/sync` and writes a full snapshot into D1. Rows that are no longer published or are archived are removed from the previous Notion snapshot. Notion-owned rows are edited in Notion, then synced again.
3. **Unattended pull.** `POST /api/notion/pull` with header `Authorization: Bearer <NOTION_SYNC_SECRET>` runs the same snapshot. The secret is a Cloudflare secret, not a file in git.

Private planning notes stay in Notion and are stored, when synced, with visibility `private`. The public query never returns them.

## Architecture

Cloudflare Worker + static assets + GitHub + Notion. Slack notifications, Apple sign-in for admin, and payment endpoints use Cloudflare secrets. Credentials and private keys must never be stored in this repository. This repository does not deploy itself; production deploy happens after merge.
