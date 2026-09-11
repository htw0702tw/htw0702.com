export const kinds=['blog','works','wiki','world','now','match','catalog','store','plan-animation','plan-ai','plan-metaverse'];
export function normalize(x){
 if(!kinds.includes(x.kind)||!['tw','en','jp'].includes(x.locale)||!['public','private'].includes(x.visibility))throw new Error('invalid entry');
 if(typeof x.slug!=='string'||!/^[a-z0-9-]{1,80}$/.test(x.slug)||typeof x.title!=='string'||!x.title.trim()||x.title.length>200||typeof x.body!=='string'||!x.body.trim()||x.body.length>30000)throw new Error('invalid content');
 const meta={};if(x.kind==='match'){for(const k of ['hero','mode','rank','result','evidence']){if(typeof x.meta?.[k]!=='string'||x.meta[k].length>(k==='evidence'?5000:80))throw new Error('invalid match');meta[k]=x.meta[k];}if(!['win','loss'].includes(meta.result))throw new Error('invalid result');for(const k of ['minutes','kills','deaths','assists','teamKills']){const v=x.meta[k];if(v!==null&&(!Number.isFinite(v)||v<0||v>1000||(k!=='minutes'&&!Number.isInteger(v))))throw new Error('invalid statistics');meta[k]=v;}if(meta.teamKills!==null&&meta.kills!==null&&meta.teamKills<meta.kills)throw new Error('invalid team kills');if(meta.teamKills!==null&&meta.kills!==null&&meta.assists!==null&&meta.kills+meta.assists>meta.teamKills)throw new Error('invalid participation');}
 return {kind:x.kind,locale:x.locale,slug:x.slug,title:x.title.trim(),body:x.body,visibility:x.visibility,meta};
}
export function analysis(m){
 const r={tw:[],en:[],jp:[]};const add=(tw,en,jp)=>{r.tw.push(tw);r.en.push(en);r.jp.push(jp);};
 if(m.kills!=null&&m.deaths!=null&&m.assists!=null){const k=((m.kills+m.assists)/Math.max(1,m.deaths)).toFixed(2);add(`KDA 為 ${k}，計算方式是（擊殺＋助攻）÷ max(1, 死亡)。`,`KDA is ${k}: (kills + assists) ÷ max(1, deaths).`,`KDA は ${k}：（キル＋アシスト）÷ max(1, デス)。`);}
 if(m.teamKills>0&&m.kills!=null&&m.assists!=null){const p=Math.round((m.kills+m.assists)/m.teamKills*100);add(`擊殺參與率為 ${p}%。需结合位置與戰況解讀，不單憑比例判定表現。`,`Kill participation is ${p}%. Interpret it with role and match context.`,`キル参加率は ${p}%。役割や試合状況と合わせて確認してください。`);}
 if(m.deaths>0)add('下一場練習：回看每次死亡前 20 秒，記錄原因與可替代的選擇。這是復盤建議，並非已確認弱點。','Next practice: review the 20 seconds before each death, noting causes and alternatives. This is a review prompt, not a confirmed weakness.','次の練習：各デスの前 20 秒を見直し、原因と別の選択肢を記録します。確認済みの弱点ではなく、振り返りの提案です。');
 add('目前沒有解析影片，無法判定走位、視野、出裝與團戰決策。','No replay was analyzed; positioning, vision, builds, and teamfight decisions cannot be determined.','動画は解析していないため、位置取り・視界・ビルド・集団戦の判断は評価できません。');return r;
}
export function decodeEntry(row){const out={...row,meta:JSON.parse(row.meta||'{}')};if(row.kind==='match')out.analysis=analysis(out.meta);return out;}
