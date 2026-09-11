import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { render, routes, copy } from '../src/render.mjs';
await rm('dist', {recursive:true,force:true});
await mkdir('dist', {recursive:true});
for (const dir of ['assets','images','css','js','posts','data']) await cp(dir,`dist/${dir}`,{recursive:true});
await writeFile('dist/assets/translations.json',JSON.stringify(copy));
for (const file of ['gallery.html','photos.html','videos.html','socials.html','x.html','instagram.html','youtube.html']) await cp(file,`dist/${file}`);
for (const lang of ['tw','en','jp']) for (const route of routes) {
 const dir=`dist/${lang}${route}`; await mkdir(dir,{recursive:true});
 await writeFile(`${dir}/index.html`,render(lang,route));
}
await mkdir('dist/admin',{recursive:true});
await writeFile('dist/admin/index.html',render('tw','/admin'));
await writeFile('dist/index.html',render('tw',''));
await writeFile('dist/404.html',render('tw','/404'));
await writeFile('dist/_redirects',`/ /tw 302\n/index.html /tw 301\n/about.html /tw/wiki 301\n/blog.html /tw/blog 301\n${routes.filter(Boolean).map(r=>`${r} /tw${r} 302`).join('\n')}\n`);
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: https://htw0702.com/sitemap.xml\n');
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['tw','en','jp'].flatMap(l=>routes.filter(r=>r!='/admin').map(r=>`<url><loc>https://htw0702.com/${l}${r}</loc></url>`)).join('')}</urlset>`);
await writeFile('dist/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://appleid.apple.com\n/admin*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n`);
console.log(`Built ${routes.length*3+3} pages to dist, with language alternates and legacy content.`);
