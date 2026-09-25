# htw0702.com

Wang Hao Ting（筳筳）的個人世界官網。

## Public routes
- /tw /en /jp — multilingual home
- /tw/wiki /en/wiki /jp/wiki — personal wiki & portfolio
- /tw/blog /en/blog /jp/blog — blog
- /tw/works /en/works /jp/works — public works
- /tw/world /en/world /jp/world — Taiwan × Japan inspired imaginary world
- /tw/store /en/store /jp/store — personal goods and support
- /tw/social /en/social /jp/social — Instagram, Threads, and X. `/me` stays as an alias of the same page.
- /tw/search /en/search /jp/search — site search over public pages
- /tw/now /en/now /jp/now — what is public right now
- /tw/games/lol /en/games/lol /jp/games/lol — published League of Legends records for htw0702rg#0702
- /tw/plans/animation /en/plans/animation /jp/plans/animation
- /tw/plans/ai /en/plans/ai /jp/plans/ai
- /tw/plans/metaverse /en/plans/metaverse /jp/plans/metaverse

Public short aliases (/wiki, /blog, /social, /store, /search, etc.) redirect to the Traditional Chinese route. Old Arena of Valor URLs redirect home. Seeded public copy lives in `data/public-fallback.json` and is shown when a kind has no public CMS rows; a published Notion or studio row for that kind replaces the seed.

The public website only exposes Notion records explicitly marked Publish=true and Visibility=public. Private planning notes remain in Notion and are never rendered into public pages.

Architecture: Cloudflare Worker + static assets + GitHub + Notion CMS. Slack notifications, Apple Sign in for admin, and payment endpoints are designed to use Cloudflare secrets; credentials/private keys must never be stored in this public repository.
