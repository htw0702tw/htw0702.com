# htw0702.com

Wang Hao Ting（筳筳）的個人世界官網。

## Public routes
- /tw /en /jp — multilingual home
- /tw/wiki /en/wiki /jp/wiki — personal wiki & portfolio
- /tw/blog /en/blog /jp/blog — blog
- /tw/works /en/works /jp/works — public works
- /tw/world /en/world /jp/world — Taiwan × Japan inspired imaginary world
- /tw/games/aov /en/games/aov /jp/games/aov — Arena of Valor official-reference catalog, public matches & analysis
- /tw/store /en/store /jp/store — personal merchandise / support
- /tw/plans/animation /en/plans/animation /jp/plans/animation
- /tw/plans/ai /en/plans/ai /jp/plans/ai
- /tw/plans/metaverse /en/plans/metaverse /jp/plans/metaverse

Public short aliases (/wiki, /blog, /games/aov, /store, etc.) redirect to the Traditional Chinese route.

The public website only exposes Notion records explicitly marked Publish=true and Visibility=public. Private planning notes remain in Notion and are never rendered into public pages.

Architecture: Cloudflare Worker + static assets + GitHub + Notion CMS. Slack notifications, Apple Sign in for admin, and payment endpoints are designed to use Cloudflare secrets; credentials/private keys must never be stored in this public repository.
