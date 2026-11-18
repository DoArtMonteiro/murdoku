import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JavaScript Worker, deliberately outside the TypeScript project
import worker from '../deploy/cloudflare/worker.js'

type Handler = { fetch(request: Request, env: { ASSETS: { fetch(request: Request): Promise<Response> } }): Promise<Response> }
const handler = worker as Handler
const run = (url: string, assets: Response) =>
  handler.fetch(new Request(`https://example.test${url}`), { ASSETS: { fetch: async () => assets } })

// What the asset layer attaches to every response from public/_headers (the "/*" block).
const SECURITY = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=()',
}
const withSecurity = (headers: Record<string, string>) => ({ ...SECURITY, ...headers })

describe('missing-file guard Worker', () => {
  it('turns the app shell served for a missing hashed file into an uncacheable 404', async () => {
    const shell = new Response('<!doctype html><title>Alibi</title>', {
      status: 200,
      headers: withSecurity({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable', ETag: '"shell"', 'Content-Length': '35' }),
    })
    const response = await run('/assets/index-gone.js', shell)
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toMatch(/^text\/plain/)
    expect(response.headers.get('ETag')).toBeNull()
    expect(response.headers.get('Content-Length')).toBeNull()
    expect(await response.text()).not.toContain('<')
  })

  it('gives that 404 the same security headers as every other response', async () => {
    const shell = new Response('<!doctype html>', { status: 200, headers: withSecurity({ 'Content-Type': 'text/html' }) })
    const response = await run('/assets/index-gone.js', shell)
    for (const [name, value] of Object.entries(SECURITY)) expect(response.headers.get(name), name).toBe(value)
  })

  it('forces no-store on a native error answer, so it can never be cached as immutable', async () => {
    for (const status of [404, 410, 500]) {
      const error = new Response('nope', { status, headers: withSecurity({ 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=31536000, immutable' }) })
      const response = await run('/assets/index-abc.js', error)
      expect(response.status).toBe(status)
      expect(response.headers.get('Cache-Control'), String(status)).toBe('no-store')
      expect(response.headers.get('Content-Security-Policy')).toBe(SECURITY['Content-Security-Policy'])
      expect(await response.text()).toBe('nope')
    }
  })

  it('passes an existing file through untouched, headers included', async () => {
    const file = new Response('console.log(1)', {
      status: 200,
      headers: withSecurity({ 'Content-Type': 'text/javascript', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Test': 'kept' }),
    })
    const response = await run('/assets/index-abc.js', file)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('X-Test')).toBe('kept')
    expect(await response.text()).toBe('console.log(1)')
  })

  it('leaves a conditional-request 304 alone, so a stored file stays storable', async () => {
    const notModified = new Response(null, { status: 304, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
    const response = await run('/assets/index-abc.js', notModified)
    expect(response.status).toBe(304)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
  })

  it('takes the security headers from the real _headers file, so the test data cannot drift', () => {
    const block = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8').split(/\r?\n/).filter(line => line.startsWith('  ')).join('\n')
    for (const name of Object.keys(SECURITY)) expect(block, name).toContain(`${name}:`)
  })
})
