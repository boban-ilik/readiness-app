/**
 * Canonical-host redirect in front of the static assets.
 *
 * www.thereadiness.app 301s to thereadiness.app (path and query preserved);
 * everything else falls through to the built Astro site via the ASSETS
 * binding. run_worker_first in wrangler.jsonc is what routes asset requests
 * through here at all — without it, Cloudflare serves matching assets before
 * the worker runs and www would never redirect.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.thereadiness.app') {
      url.hostname = 'thereadiness.app';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
