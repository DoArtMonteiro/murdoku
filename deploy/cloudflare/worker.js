// Runs first only for /assets/* and /workbox-* (see run_worker_first in wrangler.jsonc):
// the files that are fingerprinted and cached as immutable, plus the service worker's
// helper. Everything is answered by the static-assets layer, so existing files keep
// their headers from public/_headers.
//
// The single-page-application fallback answers an unknown path with index.html and
// status 200. For a page that is right. For /assets/<hash>.js it is wrong: a stale
// tab would get HTML as a script, and the browser would cache it under that name
// for a year (the hashed-asset rule is "immutable"). If the build is later rolled
// back so that the name exists again, that cached HTML would still be served. So
// when one of these paths comes back as the HTML shell, answer 404 and tell every
// cache not to keep it.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const type = response.headers.get('Content-Type') || ''
    if (response.status === 200 && type.startsWith('text/html')) {
      return new Response('Not found\n', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    return response
  },
}
