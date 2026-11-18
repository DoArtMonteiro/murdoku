import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Builds the game the way it is deployed (`vite build`, NODE_ENV=production, as in
// `npm run build`) into a temporary folder and checks what players would receive.
// The build is real, Vite and the service-worker plugin included, so these checks
// cannot pass on source that the build then changes. It runs in a child process
// because the test runner itself sets NODE_ENV=test, which would build the
// development flavour of the app.
const root = process.cwd()
let outDir = ''
const files = new Map<string, string>()

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}
const textOf = (names: string[]) => names.map(name => files.get(name) ?? '').join('\n')
const textFiles = () => [...files.keys()].filter(name => /\.(js|css|html|webmanifest|svg)$/.test(name))

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'alibi-dist-'))
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: root, env: { ...process.env, NODE_ENV: 'production' }, stdio: 'pipe' },
  )
  for (const path of walk(outDir)) {
    const name = relative(outDir, path).replaceAll('\\', '/')
    files.set(name, /\.(woff2|glb|png)$/.test(name) ? '' : readFileSync(path, 'utf8'))
  }
}, 240_000)

afterAll(() => { if (outDir) rmSync(outDir, { recursive: true, force: true }) })

describe('production build', () => {
  it('ships none of the photographic images, as files or in the precache', () => {
    const banned = /contact-sheet|reconstruction-board|evidence-paper|graphite-desk/
    expect([...files.keys()].filter(name => banned.test(name) || name.endsWith('.jpg'))).toEqual([])
    expect(files.get('sw.js')).not.toMatch(banned)
    expect(files.get('sw.js')).not.toMatch(/\.jpg/)
    expect(textOf(textFiles())).not.toMatch(banned)
  })

  it('makes no request to a font or avatar service', () => {
    const text = textOf(textFiles())
    expect(text).not.toMatch(/fonts\.googleapis|fonts\.gstatic|api\.dicebear\.com/)
    expect([...files.keys()].filter(name => name.endsWith('.woff2')).length).toBeGreaterThanOrEqual(10)
    expect(files.get('index.html')).not.toMatch(/<link[^>]+(?:preconnect|stylesheet)[^>]+https?:/)
  })

  it('leaves the reference routes out', () => {
    const text = textOf(textFiles())
    expect(text).not.toMatch(/ref-shell|Livro de casos|rs-portrait/)
    expect([...files.keys()].filter(name => /plan3d|nightplan|illustrated|CityMap|ReferenceGame/i.test(name))).toEqual([])
  })

  it('shows the name Murdoku only inside the credit, and keeps the storage keys', () => {
    const all = textOf(textFiles()).replace(/murdoku_/g, '')
    const hits = all.match(/murdoku/gi) ?? []
    // The credit sentence names it three times and nothing else does.
    expect(hits).toHaveLength(3)
    expect(all).toContain('created by Manuel Garand')
    expect(files.get('index.html')).not.toMatch(/murdoku/i)
    expect(files.get('manifest.webmanifest')).not.toMatch(/murdoku/i)
    expect(textOf(textFiles())).toContain('murdoku_catalog_v')
    expect(textOf(textFiles())).toContain('murdoku_solved_v2')
    expect(files.get('theme-init.js')).toContain('murdoku_theme')
  })

  it('has no inline script, so the page can run without script-src unsafe-inline', () => {
    expect(files.get('index.html')).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>\s*\S/)
  })
})

describe('deployment files', () => {
  const headers = () => readFileSync(join(root, 'public/_headers'), 'utf8')
  const blockFor = (path: string) => {
    const lines = headers().split(/\r?\n/)
    const start = lines.findIndex(line => line === path)
    expect(start, `no rule for ${path}`).toBeGreaterThanOrEqual(0)
    const block: string[] = []
    for (const line of lines.slice(start + 1)) {
      if (!line.startsWith('  ')) break
      block.push(line.trim())
    }
    return block
  }

  it('ships the headers file and the licence notices with the site', () => {
    expect(files.has('_headers')).toBe(true)
    expect(files.has('THIRD-PARTY-NOTICES.txt')).toBe(true)
    const notices = readFileSync(join(outDir, 'THIRD-PARTY-NOTICES.txt'), 'utf8')
    for (const name of ['react 19', 'three 0', 'framer-motion', 'lucide-react', '@dicebear/core', 'workbox-core', '@fontsource/barlow-condensed', '@fontsource/courier-prime', '@fontsource/hanken-grotesk']) {
      expect(notices, name).toContain(name)
    }
    expect(notices).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('sets a strict Content-Security-Policy: no inline code, no eval, no outside host', () => {
    const csp = blockFor('/*').find(line => line.startsWith('Content-Security-Policy:'))!
    expect(csp).toBeDefined()
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*|https?:/)
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("img-src 'self' data:;")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'none'")
  })

  it('sets the other protective headers', () => {
    const block = blockFor('/*').join('\n')
    expect(block).toMatch(/Strict-Transport-Security: max-age=\d{7,}/)
    expect(block).toContain('X-Content-Type-Options: nosniff')
    expect(block).toContain('Referrer-Policy: no-referrer')
    expect(block).toContain('X-Frame-Options: DENY')
    expect(block).toMatch(/Permissions-Policy: .*camera=\(\)/)
  })

  it('caches hashed assets for good and makes everything that names them revalidate', () => {
    expect(blockFor('/assets/*')).toEqual(['Cache-Control: public, max-age=31536000, immutable'])
    const sw = [...files.keys()].find(name => /^workbox-[0-9a-f]+\.js$/.test(name))
    expect(sw, 'the build emits a workbox file').toBeDefined()
    for (const path of ['/', '/index.html', '/sw.js', '/workbox-*.js', '/registerSW.js', '/theme-init.js', '/manifest.webmanifest']) {
      expect(blockFor(path)).toEqual(['Cache-Control: public, max-age=0, must-revalidate'])
    }
    expect(blockFor('/*').join('\n')).not.toMatch(/Cache-Control/i)
    // Only files under /assets are fingerprinted, so only they may be immutable.
    const unhashed = [...files.keys()]
      .filter(name => !name.startsWith('assets/') && /\.(js|html|webmanifest)$/.test(name))
      .map(name => (name === sw ? 'workbox-*.js' : name))
    expect(unhashed.sort()).toEqual(['index.html', 'manifest.webmanifest', 'registerSW.js', 'sw.js', 'theme-init.js', 'workbox-*.js'])
  })

  it('keeps the Worker config out of the repository root and names the right Worker', () => {
    expect(readdirSync(root).filter(name => /^wrangler\./.test(name))).toEqual([])
    const config = readFileSync(join(root, 'deploy/cloudflare/wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const parsed = JSON.parse(config)
    expect(parsed).toMatchObject({
      name: 'alibi-game',
      account_id: 'e7051a1583673d9caec0521af5104117',
      workers_dev: true,
      main: './worker.js',
      assets: {
        directory: '../../dist',
        binding: 'ASSETS',
        not_found_handling: 'single-page-application',
        run_worker_first: ['/assets/*', '/workbox-*'],
      },
    })
    expect(parsed.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(parsed).not.toHaveProperty('routes')
    expect(parsed).not.toHaveProperty('route')
    const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts
    expect(scripts['deploy:cloudflare']).toContain('--config deploy/cloudflare/wrangler.jsonc')
    expect(scripts['deploy:cloudflare:dry-run']).toContain('--dry-run --config deploy/cloudflare/wrangler.jsonc')
  })

  it('runs the guard Worker for every path that the headers cache as immutable, and only those', () => {
    const lines = readFileSync(join(root, 'public/_headers'), 'utf8').split(/\r?\n/)
    const immutable: string[] = []
    lines.forEach((line, index) => {
      if (!/^\S/.test(line) || line.startsWith('#')) return
      const rules: string[] = []
      for (const next of lines.slice(index + 1)) {
        if (!next.startsWith('  ')) break
        rules.push(next)
      }
      if (rules.some(rule => /Cache-Control:.*immutable/i.test(rule))) immutable.push(line.trim())
    })
    expect(immutable).toEqual(['/assets/*'])
    const config = JSON.parse(readFileSync(join(root, 'deploy/cloudflare/wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''))
    // /workbox-* is the service worker's helper, guarded because a missing one would break installation.
    expect(config.assets.run_worker_first).toEqual([...immutable, '/workbox-*'])
    // Everything else in the build is revalidated, so a stale answer cannot stick. A new directory
    // with an immutable rule must be added to run_worker_first (the check above fails until it is).
    const dirs = [...new Set([...files.keys()].filter(name => name.includes('/')).map(name => name.split('/')[0]))].sort()
    expect(dirs).toEqual(['assets', 'kenney', 'kenney3d'])
  })

  it('precaches the models and sprites, so a case never opened still draws offline', () => {
    const sw = files.get('sw.js')!
    const models = [...files.keys()].filter(name => name.endsWith('.glb'))
    const sprites = [...files.keys()].filter(name => name.startsWith('kenney/') && name.endsWith('.png'))
    expect(models.length).toBe(161)
    expect(sprites.length).toBe(150)
    for (const name of [...models, ...sprites]) expect(sw, name).toContain(`url:"${name}"`)
    expect(sw).toContain('url:"THIRD-PARTY-NOTICES.txt"')
  })
})
