const NOTION_VERSION="2026-03-11";
const allowedLocales=new Set(["tw","en","jp"]),allowedKinds=new Set(["blog","works","wiki","world","now","match","catalog","store","plan-animation","plan-ai","plan-metaverse"]);
function json(data,status=200,cache="no-store"){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":cache}})}
function textProp(p){return(p?.title||p?.rich_text||[]).map(x=>x?.plain_text||x?.text?.content||"").join("")}
function selectProp(p){return p?.select?.name||null}
function numberProp(p){return typeof p?.number==="number"?p.number:null}
function dateProp(p){return p?.date?.start||null}
function itemFromPage(page){const p=page.properties||{};return{
  id:page.id,name:textProp(p.Name),body:textProp(p.Body),slug:textProp(p.Slug),kind:selectProp(p.Kind),locale:selectProp(p.Locale),updated:p.Updated?.last_edited_time||page.last_edited_time||null,
  hero:textProp(p.hero)||textProp(p.Hero),mode:textProp(p.mode)||textProp(p.Mode),rank:textProp(p.rank)||textProp(p.Rank),lane:selectProp(p.lane)||selectProp(p.Lane),result:selectProp(p.result)||selectProp(p.Result),
  kills:numberProp(p.kills)||numberProp(p.Kills),deaths:numberProp(p.deaths)||numberProp(p.Deaths),assists:numberProp(p.assists)||numberProp(p.Assists),minutes:numberProp(p.minutes)||numberProp(p.Minutes),
  gold:numberProp(p.gold)||numberProp(p.Gold),damage:numberProp(p.damage)||numberProp(p.Damage),damageTaken:numberProp(p.damageTaken)||numberProp(p.DamageTaken),teamfight:numberProp(p.teamfight)||numberProp(p.Teamfight),rating:numberProp(p.rating)||numberProp(p.Rating),
  evidence:textProp(p.evidence)||textProp(p.Evidence),teamKills:numberProp(p.teamKills)||numberProp(p.TeamKills),playedAt:dateProp(p.playedAt)||dateProp(p.PlayedAt)||dateProp(p.Date)
}}
async function notionQuery(env,{locale,kind,pageSize=100}){if(!env.NOTION_TOKEN)return{items:[],configured:false};const filters=[{property:"Visibility",select:{equals:"public"}},{property:"Publish",checkbox:{equals:true}},{property:"Locale",select:{equals:locale}},{property:"Kind",select:{equals:kind}}];const r=await fetch(`https://api.notion.com/v1/data_sources/${env.NOTION_DATA_SOURCE_ID}/query`,{method:"POST",headers:{authorization:`Bearer ${env.NOTION_TOKEN}`,"content-type":"application/json","Notion-Version":NOTION_VERSION},body:JSON.stringify({filter:{and:filters},sorts:[{timestamp:"last_edited_time",direction:"descending"}],page_size:pageSize})});if(!r.ok)throw new Error(`Notion ${r.status}`);const d=await r.json();return{items:(d.results||[]).map(itemFromPage),configured:true}}
function analyzeMatch(m,locale){const T={tw:{death:"死亡次數偏高：優先檢查站位、探草與退場時機",part:"參團率偏低：加強小地圖判讀與轉線節奏",kda:"KDA 偏低：先降低無收益換血與單人冒進",ok:"資料未顯示明顯單一弱點；可再搭配錄影判斷決策品質"},en:{death:"Deaths are high: review positioning, face-checks and disengage timing",part:"Team participation is low: improve map reads and rotation timing",kda:"KDA is low: reduce low-value trades and isolated engages",ok:"No single weakness stands out from stats alone; replay review would add context"},jp:{death:"デスが多め：立ち位置、草むら確認、撤退タイミングを見直す",part:"集団戦参加率が低め：ミニマップ確認とローテーションを改善",kda:"KDAが低め：リターンの少ない交換や単独突入を減らす",ok:"数値だけでは大きな弱点は見えません。リプレイ確認で判断精度を上げられます"}}[locale]||{};const out=[],d=m.deaths||0,k=m.kills||0,a=m.assists||0;if(d>=6)out.push(T.death);if(m.teamKills&&m.teamKills>0&&(k+a)/m.teamKills<.45)out.push(T.part);if(d>0&&(k+a)/d<1.5)out.push(T.kda);if(!out.length)out.push(T.ok);return out}
function safeUrl(v){if(!v)return null;try{const u=new URL(v);return u.protocol==="https:"?u.href:null}catch{return null}}
function alias(path){return({"/":"/tw","/wiki":"/tw/wiki","/blog":"/tw/blog","/works":"/tw/works","/world":"/tw/world","/games/aov":"/tw/games/aov","/store":"/tw/store","/plans/animation":"/tw/plans/animation","/plans/ai":"/tw/plans/ai","/plans/metaverse":"/tw/plans/metaverse","/admin":"/tw/admin"})[path]||null}
function decodeEntities(s){return s.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;/g,"'").replace(/&quot;/g,'"')}
async function officialHeroes(){
  const source="https://moba.garena.tw/game/heroes/master";
  const r=await fetch(source,{headers:{"user-agent":"Mozilla/5.0 (compatible; htw0702.com public hero index)"},cf:{cacheTtl:21600,cacheEverything:true}});
  if(!r.ok)throw new Error(`Garena ${r.status}`);
  const html=await r.text(),items=[],seen=new Set();
  const re=/<a\b[^>]*href=["'](?:https?:\/\/moba\.garena\.tw)?(\/game\/hero\/(\d+))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=re.exec(html))){
    const name=decodeEntities(m[3].replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
    if(!name||seen.has(m[2]))continue;
    const cleaned=name.split(/\s+/).filter(Boolean).pop();
    if(!cleaned||cleaned.length>12)continue;
    seen.add(m[2]);items.push({name:cleaned,id:Number(m[2]),url:`https://moba.garena.tw${m[1]}`});
  }
  if(!items.some(x=>x.name==="勇"))items.unshift({name:"勇",id:5,url:"https://moba.garena.tw/game/hero/5"});
  return{source,checked_at:new Date().toISOString(),heroes:items};
}
function cinematic(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  return new HTMLRewriter()
    .on("head",{element(el){el.append('<link rel="stylesheet" href="/assets/cinematic-v4.css?v=20260912-4">',{html:true})}})
    .on("body",{element(el){el.append('<script src="/assets/cinematic-v4.js?v=20260912-4" defer></script>',{html:true})}})
    .transform(response)
}
export default{async fetch(request,env){const u=new URL(request.url),path=u.pathname.replace(/\/+$/,"")||"/";
  if(request.method==="GET"){const r=alias(path);if(r)return Response.redirect(new URL(r,u.origin),302)}
  if(path==="/api/health")return json({ok:true,notionConfigured:Boolean(env.NOTION_TOKEN),appleConfigured:Boolean(env.APPLE_CLIENT_ID&&env.APPLE_TEAM_ID&&env.APPLE_KEY_ID&&env.APPLE_PRIVATE_KEY&&env.SESSION_SECRET)});
  if(path==="/api/content"){const locale=u.searchParams.get("locale")||"tw",kind=u.searchParams.get("kind")||"blog";if(!allowedLocales.has(locale)||!allowedKinds.has(kind))return json({error:"invalid query"},400);try{return json(await notionQuery(env,{locale,kind}))}catch{return json({items:[],configured:Boolean(env.NOTION_TOKEN),error:"cms_unavailable"},502)}}
  if(path==="/api/aov/heroes"){try{return json(await officialHeroes(),200,"public, max-age=21600, stale-while-revalidate=86400")}catch{return json({source:"https://moba.garena.tw/game/heroes/master",heroes:[{name:"勇",id:5,url:"https://moba.garena.tw/game/hero/5"}],error:"official_index_unavailable"},200,"public, max-age=300")}}
  if(path==="/api/aov/matches"){const locale=u.searchParams.get("locale")||"tw";if(!allowedLocales.has(locale))return json({error:"invalid locale"},400);try{const d=await notionQuery(env,{locale,kind:"match"});d.items=d.items.map(m=>({...m,analysis:analyzeMatch(m,locale)}));return json(d)}catch{return json({items:[],configured:Boolean(env.NOTION_TOKEN),error:"matches_unavailable"},502)}}
  if(path==="/api/payments")return json({wise:safeUrl(env.WISE_PAYMENT_URL),paypal:safeUrl(env.PAYPAL_PAYMENT_URL),bitcoin:(env.BTC_ADDRESS||"").trim()||null});
  if(path==="/api/admin/status")return json({appleConfigured:Boolean(env.APPLE_CLIENT_ID&&env.APPLE_TEAM_ID&&env.APPLE_KEY_ID&&env.APPLE_PRIVATE_KEY&&env.SESSION_SECRET),locked:true});
  if(path.startsWith("/api/"))return json({error:"not_found"},404);
  return cinematic(await env.ASSETS.fetch(request))
}};