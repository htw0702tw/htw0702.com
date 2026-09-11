const enc=new TextEncoder();
export const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export const unb64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
export const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export const hash=async s=>b64(await crypto.subtle.digest('SHA-256',enc.encode(s)));
export const now=()=>Math.floor(Date.now()/1000);
export function cookie(req,key){const match=req.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(key+'='));return match?.slice(key.length+1)||'';}
export function authReady(env){return !!(env.DB&&env.APPLE_CLIENT_ID&&env.APPLE_TEAM_ID&&env.APPLE_KEY_ID&&env.APPLE_PRIVATE_KEY&&env.APPLE_OWNER_SUB&&env.ADMIN_ORIGIN?.startsWith('https://'));}
export function authOrigin(req,env){return new URL(req.url).origin===env.ADMIN_ORIGIN;}
export async function session(req,env){if(!authReady(env)||!authOrigin(req,env))return null;const token=cookie(req,'__Host-studio');if(!token)return null;return await env.DB.prepare('SELECT subject,csrf,expires FROM sessions WHERE token_hash=? AND subject=? AND expires>?').bind(await hash(token),env.APPLE_OWNER_SUB,now()).first();}
export async function verifyAppleToken(token,env,nonce,keys){
 const parts=token.split('.');if(parts.length!==3)throw new Error('invalid token');const header=JSON.parse(new TextDecoder().decode(unb64(parts[0]))),p=JSON.parse(new TextDecoder().decode(unb64(parts[1])));
 if(header.alg!=='RS256'||p.iss!=='https://appleid.apple.com'||p.aud!==env.APPLE_CLIENT_ID||typeof p.exp!=='number'||p.exp<=now()||typeof p.iat!=='number'||p.iat>now()+60||p.nonce!==nonce||p.sub!==env.APPLE_OWNER_SUB)throw new Error('invalid identity');
 const key=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256');if(!key)throw new Error('unknown key');const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,unb64(parts[2]),enc.encode(parts[0]+'.'+parts[1])))throw new Error('invalid signature');return p;
}
async function clientSecret(env){const encode=o=>b64(enc.encode(JSON.stringify(o)));const data=encode({alg:'ES256',kid:env.APPLE_KEY_ID})+'.'+encode({iss:env.APPLE_TEAM_ID,iat:now(),exp:now()+300,aud:'https://appleid.apple.com',sub:env.APPLE_CLIENT_ID});const pem=env.APPLE_PRIVATE_KEY.replaceAll('\\n','\n').replace(/-----[^-]+-----|\s/g,'');const key=await crypto.subtle.importKey('pkcs8',unb64(pem),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);return data+'.'+b64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(data)));}
export async function start(req,env){
 const locale=['tw','en','jp'].includes(new URL(req.url).searchParams.get('locale'))?new URL(req.url).searchParams.get('locale'):'tw';
 if(!authReady(env))return new Response('Apple sign-in is not configured.',{status:503});
 if(!authOrigin(req,env))return Response.redirect(env.ADMIN_ORIGIN+'/api/auth/start?locale='+locale,302);
 const state=random(),nonce=random(),flow=random();await env.DB.batch([env.DB.prepare('DELETE FROM auth_flows WHERE expires<?').bind(now()),env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(now()),env.DB.prepare('INSERT INTO auth_flows(state_hash,nonce,cookie_hash,locale,expires) VALUES(?,?,?,?,?)').bind(await hash(state),nonce,await hash(flow),locale,now()+600)]);
 const q=new URLSearchParams({client_id:env.APPLE_CLIENT_ID,redirect_uri:env.ADMIN_ORIGIN+'/api/auth/callback',response_type:'code',response_mode:'form_post',state,nonce});return new Response(null,{status:302,headers:{Location:'https://appleid.apple.com/auth/authorize?'+q,'Set-Cookie':`__Host-flow=${flow}; Path=/; Secure; HttpOnly; SameSite=None; Max-Age=600`,'Cache-Control':'no-store'}});
}
export async function callback(req,env){
 let locale='tw';try{
 if(!authReady(env)||!authOrigin(req,env))throw new Error('not configured');const form=await req.formData(),state=form.get('state'),code=form.get('code');if(typeof state!=='string'||typeof code!=='string'||state.length>200||code.length>3000)throw new Error('invalid callback');
 const flow=await env.DB.prepare('DELETE FROM auth_flows WHERE state_hash=? AND cookie_hash=? AND expires>? RETURNING nonce,locale').bind(await hash(state),await hash(cookie(req,'__Host-flow')),now()).first();if(!flow)throw new Error('invalid state');locale=flow.locale;
 const r=await fetch('https://appleid.apple.com/auth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.APPLE_CLIENT_ID,client_secret:await clientSecret(env),code,grant_type:'authorization_code',redirect_uri:env.ADMIN_ORIGIN+'/api/auth/callback'}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('token exchange');const data=await r.json();
 const kr=await fetch('https://appleid.apple.com/auth/keys',{signal:AbortSignal.timeout(15000)});if(!kr.ok)throw new Error('keys');const keys=(await kr.json()).keys;const identity=await verifyAppleToken(data.id_token,env,flow.nonce,keys);
 const token=random(),csrf=random();await env.DB.prepare('INSERT INTO sessions(token_hash,subject,csrf,expires) VALUES(?,?,?,?)').bind(await hash(token),identity.sub,csrf,now()+3600).run();const headers=new Headers({Location:env.ADMIN_ORIGIN+'/'+locale+'/admin','Cache-Control':'no-store'});headers.append('Set-Cookie',`__Host-studio=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600`);headers.append('Set-Cookie','__Host-flow=; Path=/; Secure; HttpOnly; SameSite=None; Max-Age=0');return new Response(null,{status:303,headers});
 }catch{return new Response(null,{status:303,headers:{Location:`/${locale}/admin?error=signin`,'Cache-Control':'no-store','Set-Cookie':'__Host-flow=; Path=/; Secure; HttpOnly; SameSite=None; Max-Age=0'}});}
}
