import site from '../src/worker.js';
export async function onRequest(context) {
  // Pages supplies static assets via next(); no Worker ASSETS binding is needed.
  return site.fetch(context.request, {...context.env, ASSETS: {fetch: () => context.next()}});
}
