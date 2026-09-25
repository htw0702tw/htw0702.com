export const kinds=['blog','works','wiki','now','store'];
export function normalize(x){
 if(!kinds.includes(x.kind)||!['tw','en','jp'].includes(x.locale)||!['public','private'].includes(x.visibility))throw new Error('invalid entry');
 if(typeof x.slug!=='string'||!/^[a-z0-9-]{1,80}$/.test(x.slug)||typeof x.title!=='string'||!x.title.trim()||x.title.length>200||typeof x.body!=='string'||!x.body.trim()||x.body.length>30000)throw new Error('invalid content');
 return {kind:x.kind,locale:x.locale,slug:x.slug,title:x.title.trim(),body:x.body,visibility:x.visibility,meta:{}};
}
export function decodeEntry(row){return {...row,meta:JSON.parse(row.meta||'{}')};}
