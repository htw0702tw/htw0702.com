export async function onRequest({request,env,next}){
 const u=new URL(request.url);if(env.ADMIN_ORIGIN){
  if(u.origin===env.ADMIN_ORIGIN&&u.pathname==='/')return Response.redirect(env.ADMIN_ORIGIN+'/tw/admin',302);
  if((/^\/(tw|en|jp)\/admin\/?$/.test(u.pathname)||/^\/admin(?:\/index\.html|\/)?$/.test(u.pathname))&&u.origin!==env.ADMIN_ORIGIN)return Response.redirect(env.ADMIN_ORIGIN+(/^\/(tw|en|jp)\//.test(u.pathname)?u.pathname:'/tw/admin'),302);
 }
 return next();
}
