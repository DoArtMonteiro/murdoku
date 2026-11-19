// Run the scene-compatibility validator (room names, furniture visuals, stair space) over accepted cases.
//   node scripts/depth-scene-check.mjs <sweepDir> <suffix>
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [dir, suffix] = process.argv.slice(2)
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const val = await vite.ssrLoadModule('/src/core/puzzleValidate.ts')
for (const cfg of ['A', 'B', 'C', 'D', 'E']) {
  let rows
  try { rows = readFileSync(resolve(dir, `accepted-${cfg}${suffix}.jsonl`), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) } catch { continue }
  const counts = {}
  for (const r of rows) for (const i of val.validatePuzzleSceneCompatibility(r.puzzle)) {
    const k = `${i.severity}:${i.code}`
    counts[k] = (counts[k] ?? 0) + 1
  }
  console.log(cfg, suffix, `${rows.length} cases`, JSON.stringify(counts))
}
await vite.close()
