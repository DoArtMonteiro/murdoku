// Runs first only for /assets/* and /workbox-* (see run_worker_first in wrangler.jsonc):
// the files that are fingerprinted and cached as immutable, plus the service worker's
// helper. Everything is answered by the static-assets layer, so existing files keep
// their headers from public/_headers.
//
// The single-page-application fallback answers an unknown path with index.html and
// status 200. For a page that is right. For /assets/<hash>.js it is wrong: a stale
// tab would get HTML as a script, and the browser would cache it under that name
// for a year (the hashed-asset rule is "immutable"). If the build is later rolled
// back so that the name exists again, that cached HTML would still be served. So:
//
//  - when one of these paths comes back as the HTML shell, answer 404 instead;
//  - on any error answer (including a native 404 from the asset layer), force
//    Cache-Control: no-store, because the "immutable" rule is attached to the path,
//    not to the outcome.
//
// The replacement 404 is built from the response it replaces, so it carries the same
// security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame
// protection) as every other response, with their values kept in public/_headers only.
const REPRESENTATION_HEADERS = ['content-length', 'content-encoding', 'content-type', 'content-range', 'etag', 'last-modified', 'accept-ranges', 'transfer-encoding']

function uncacheable(response, status, body, contentType) {
  const headers = new Headers(response.headers)
  if (contentType) {
    for (const name of REPRESENTATION_HEADERS) headers.delete(name)
    headers.set('Content-Type', contentType)
  }
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(body, { status, statusText: status === 404 ? 'Not Found' : response.statusText, headers })
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const type = response.headers.get('Content-Type') || ''
    if (response.status === 200 && type.startsWith('text/html')) {
      return uncacheable(response, 404, 'Not found\n', 'text/plain; charset=utf-8')
    }
    // 304 is a successful revalidation of a stored file: leave it alone.
    if (!response.ok && response.status !== 304) {
      return uncacheable(response, response.status, response.body)
    }
    return response
  },
}
