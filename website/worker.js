/**
 * Canonical-URL redirect in front of the static assets.
 *
 * One canonical address: https://thereadiness.app, with page paths ending in
 * a slash. Plain http, the www host, the workers.dev deploy address and a page
 * path without its trailing slash (/privacy, /blog/x) all 301 there in a
 * single hop (path and query preserved), so Google never finds duplicate
 * copies of a page. Left to the asset handler, a slash-less path would get a
 * temporary 307, which Search Console keeps re-checking. Paths with a file
 * extension (robots.txt, og.png) are never rewritten. Everything else falls
 * through to the built Astro site via the ASSETS binding. run_worker_first in
 * wrangler.jsonc is what routes asset requests through here at all; without
 * it, Cloudflare serves matching assets before the worker runs.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let redirect = false;

    if (url.hostname === 'www.thereadiness.app' || url.hostname.endsWith('.workers.dev') || url.protocol === 'http:') {
      url.protocol = 'https:';
      url.hostname = 'thereadiness.app';
      url.port = '';
      redirect = true;
    }

    const last = url.pathname.split('/').pop();
    if (url.pathname !== '/' && !url.pathname.endsWith('/') && !last.includes('.')) {
      url.pathname += '/';
      redirect = true;
    }

    return redirect ? Response.redirect(url.toString(), 301) : env.ASSETS.fetch(request);
  },
};
