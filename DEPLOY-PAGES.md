# Active deployment: existing Cloudflare Worker

The default `wrangler.jsonc` now targets the existing `htw0702-com` Worker to deploy through its already-connected GitHub build. It builds public assets into `dist` and keeps existing remote variables. The Pages configuration below is retained as `wrangler.pages.jsonc` for a future migration; it is not the active deployment.

# htw0702.com — Cloudflare Pages

This branch is for **Pages**, not the existing Workers Builds project. Do not run `wrangler versions upload` against this configuration. The existing live Worker must remain until a Pages deployment passes checks.

## Git integration

Connect `htw0702tw/htw0702.com` to a new Cloudflare **Pages** project (suggested name `htw0702-com`). Select the refresh branch for the initial deployment, then use `main` after merge.

- Framework preset: None
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`
- Node.js: 24 (set `NODE_VERSION=24`)
- Pages Functions: root `functions/` is compiled by Pages Git builds

The site is hosted by Cloudflare; no user's computer or local server must remain running. Availability remains subject to Cloudflare service status and plan limits.

## Domains and database

First verify the assigned Pages preview URL. Then add `htw0702.com` and `admin.htw0702.com` under Pages custom domains and follow the DNS instructions. Remove conflicting old Worker custom-domain routes only as part of this confirmed cutover. Do not change MX records or email routing.

Create a D1 database, apply `migrations/0001.sql`, and bind it as `DB` for production. Add its actual ID to `d1_databases` in `wrangler.jsonc`; no invented database ID is included. Keep preview database and secrets separate from production.

## Server-side configuration

Use Cloudflare secrets, never repository files or browser storage, for:

- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_OWNER_SUB`
- `NOTION_TOKEN`
- `RIOT_API_KEY`, plus `RIOT_REGION` after confirming the League of Legends account region
- optional `SLACK_WEBHOOK_URL` for the owner's chosen channel

Configured variables:

- `ADMIN_ORIGIN=https://admin.htw0702.com`
- `NOTION_DATA_SOURCE_ID=95498a7d-a777-4c54-9755-eeea21933331`

Apple web sign-in callback: `https://admin.htw0702.com/api/auth/callback`. The owner allowlist checks Apple's stable subject, not the displayed email. Apple requires an appropriately configured developer app and Services ID. Authentication and all writes fail closed before configuration is complete.

## What works in code

- Taiwan Chinese, US English, Japanese; same-page language switching
- Original coast hero, gentle motion, responsive styles, day/dusk/night, browser-compatible ambient sound controls
- `/me`, `/plans` with 3 dedicated project pages, `/blog`, `/works`, `/wiki`, `/world`, `/store`, `/games/aov`, `/games/lol`
- Server-side owner Apple session, CSRF, content drafts/publication, optimistic conflict detection
- D1 appearance settings: theme, accent, motion, default sound, localized home headlines
- Notion public reads and explicit owner import; Notion-owned rows are edited in Notion
- AOV real screenshot snapshot with dated KDA chart, winner/loser filters and review prompts
- Riot server adapter: resolves `htw0702rg#0702`, reads last 10 matches, stores snapshot on explicit admin refresh, never leaks API key or other players' IDs
- Slack explicit test notification only; no automatic messages or two-way Slack sync

## Not complete until provider setup / additional work

Cloudflare deployment/domain cutover, Apple live login, database provisioning, Riot account/region and production key verification, full AOV automatic match API, numeric radar dimensions, replay/LLM analysis, live Instagram/Threads/X feeds, automatic Notion/Riot scheduling, two-way Slack sync, a product/order/payment checkout, and separate domains for the plans.

AOV screenshots are reference snapshots dated 2026-09-12, not an API feed. The four visible matches are a partial sample. Unknown hero/time fields are not invented. Current season, ranked, and lifetime totals remain separate. Audio is synthesized wave ambience, not a field recording and not narration. Browser autoplay policies can require the first interaction.

## Validation

`npm run build` and `npm test` pass. Tests cover Pages host routing, source exclusion, Apple signature/owner verification, private record filtering, CSRF, write conflicts, unpublish, Notion snapshot failure, appearance validation/persistence, and Riot match extraction.

Cloud browser cannot reach this workspace's local preview URL. Browser visual/device QA and real provider integration tests remain outstanding; no claim of live deployment is made.

## References

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developer.riotgames.com/apis
- https://developer.riotgames.com/docs/portal
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
