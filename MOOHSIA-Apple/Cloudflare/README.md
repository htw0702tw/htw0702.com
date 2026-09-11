# MOOHSIA Cloud

Cloud-first backend. The Mac is not the server. When deployed, iPhone can use MOOHSIA while every Mac is off.

Required Cloudflare resources: Worker, D1 (`moohsia-db`), optional Workers AI binding. Keep `MOOHSIA_TOKEN` in a Worker secret; never commit it.

Prepared production hostname: `https://api.moohsia.com`.
