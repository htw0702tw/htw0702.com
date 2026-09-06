# Deploy (do this once in Cloudflare)

Grok cannot log into your Cloudflare account. Do these 6 clicks.

## 1. Pages
1. https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Authorize GitHub, pick `htw0702tw/htw0702.com`
3. Production branch: `main`
4. Framework preset: None
5. Build command: (empty)
6. Output directory: `/`
7. Save and Deploy

## 2. Custom domain
Pages project → Custom domains → Add `htw0702.com` and `www.htw0702.com`

## 3. Do NOT touch email DNS
Leave MX / SPF / DKIM / Apple TXT alone.

## 4. R2 for photos (free large space)
1. R2 → Create bucket `htw0702-media`
2. Settings → Public access → Custom domain `media.htw0702.com`
3. Upload photos. URL becomes `https://media.htw0702.com/filename.jpg`
4. Put that URL into photos.html / homepage carousel

R2 free: 10 GB storage, 10 million Class A, 1 million Class B / month.
Do not use AWS S3 — egress fees. R2 has no egress fee.
