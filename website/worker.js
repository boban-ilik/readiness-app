/**
 * Canonical-host redirect in front of the static assets.
 *
 * One canonical address: https://thereadiness.app. Plain http, the www host
 * and the workers.dev deploy address all 301 there (path and query
 * preserved), so Google never finds duplicate copies of a page;
 * everything else falls through to the built Astro site via the ASSETS
 * binding. run_worker_first in wrangler.jsonc is what routes asset requests
 * through here at all — without it, Cloudflare serves matching assets before
 * the worker runs and www would never redirect.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const offHost = url.hostname === 'www.thereadiness.app' || url.hostname.endsWith('.workers.dev');
    if (offHost || url.protocol === 'http:') {
      url.protocol = 'https:';
      url.hostname = 'thereadiness.app';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
