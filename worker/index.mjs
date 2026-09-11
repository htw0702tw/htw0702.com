import {onRequest as api} from '../functions/api/[[path]].js';
import {onRequest as middleware} from '../functions/_middleware.js';

// Adapt the shared Pages handlers to the existing Cloudflare Workers project.
// Static files are only served from generated dist/, never repository source.
export default {
  async fetch(request, env, ctx) {
    return middleware({
      request,
      env,
      next: async () => {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
          return api({request, env, waitUntil: promise => ctx.waitUntil(promise)});
        }
        return env.ASSETS.fetch(request);
      },
    });
  },
};
