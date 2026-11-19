// Time engine.countSolutions against countSolutionsFast on accepted cases from a sweep, and
// check they agree. Samples the first N accepted cases of each file.
//   node scripts/depth-engine-time.mjs <sweepDir> <config> <suffix> <N> <out.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [dir, cfg, suffix, nArg, outFile] = process.argv.slice(2)
const n = Number(nArg)
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const eng = await vite.ssrLoadModule('/src/core/engine.ts')
const fast = await vite.ssrLoadModule('/src/core/depth/fastCount.ts')
const rows = readFileSync(resolve(dir, `accepted-${cfg}${suffix}.jsonl`), 'utf8').trim().split('\n').filter(Boolean).slice(0, n).map(l => JSON.parse(l))
const out = []
for (const r of rows) {
  const t0 = performance.now()
  const f = fast.countSolutionsFast(r.puzzle, 2)
  const t1 = performance.now()
  const e = eng.countSolutions(r.puzzle, 2)
  const t2 = performance.now()
  out.push({ seed: r.seed, fast: f, engine: e, fastMs: Math.round((t1 - t0) * 10) / 10, engineMs: Math.round(t2 - t1) })
  console.log(cfg, suffix, JSON.stringify(out[out.length - 1]))
  writeFileSync(outFile, JSON.stringify(out, null, 1))
}
await vite.close()
