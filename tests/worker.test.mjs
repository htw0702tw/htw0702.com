import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';
import {readFileSync,existsSync} from 'node:fs';

test('Workers config builds dist and dispatches Worker before static assets',()=>{
 const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(config.name,'htw0702-com');
 assert.equal(config.build.command,'node scripts/build.mjs');
 assert.equal(config.assets.directory,'./dist');
 assert.equal(config.assets.run_worker_first,true);
 assert.ok(existsSync(new URL('../'+config.main,import.meta.url)));
});
test('Workers entry serves assets and protects API instead of static fallback',async()=>{
 let staticCalls=0;
 const env={ASSETS:{fetch:async()=>{staticCalls++;return new Response('page');}}};
 const ctx={waitUntil(){}};
 const req=p=>new Request('https://htw0702-com.example.workers.dev'+p);
 assert.equal(await (await worker.fetch(req('/tw'),env,ctx)).text(),'page');
 assert.equal((await worker.fetch(req('/api/entries'),env,ctx)).status,401);
 assert.deepEqual(await (await worker.fetch(req('/api/health'),env,ctx)).json(),{auth:false});
 assert.equal(staticCalls,1);
});
test('Workers entry applies admin host redirects before assets',async()=>{
 const env={ADMIN_ORIGIN:'https://admin.htw0702.com',ASSETS:{fetch:async()=>{throw new Error('must not serve assets');}}};
 const r=await worker.fetch(new Request('https://htw0702.com/en/admin'),env,{});
 assert.equal(r.status,302);
 assert.equal(r.headers.get('Location'),'https://admin.htw0702.com/en/admin');
});
