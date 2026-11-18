import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JavaScript Worker, deliberately outside the TypeScript project
import worker from '../deploy/cloudflare/worker.js'

type Handler = { fetch(request: Request, env: { ASSETS: { fetch(request: Request): Promise<Response> } }): Promise<Response> }
const handler = worker as Handler
const run = (url: string, assets: Response) =>
  handler.fetch(new Request(`https://example.test${url}`), { ASSETS: { fetch: async () => assets } })

describe('missing-file guard Worker', () => {
  it('turns the app shell served for a missing hashed file into an uncacheable 404', async () => {
    const shell = new Response('<!doctype html><title>Alibi</title>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
    const response = await run('/assets/index-gone.js', shell)
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toMatch(/^text\/plain/)
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(await response.text()).not.toContain('<')
  })

  it('passes an existing file through untouched, headers included', async () => {
    const file = new Response('console.log(1)', {
      status: 200,
      headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Test': 'kept' },
    })
    const response = await run('/assets/index-abc.js', file)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('X-Test')).toBe('kept')
    expect(await response.text()).toBe('console.log(1)')
  })

  it('leaves a conditional-request 304 and a model alone', async () => {
    expect((await run('/assets/index-abc.js', new Response(null, { status: 304 }))).status).toBe(304)
    const model = new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'Content-Type': 'model/gltf-binary' } })
    expect((await run('/kenney3d/x.glb', model)).status).toBe(200)
  })
})
