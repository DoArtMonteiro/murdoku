// Run the shipped production validator (structure, quality, scene) over saved depth cases.
//   node scripts/depth-validate.mjs <dir with {config,seed,puzzle}.json or example json files...>
// It does one engine solve per clue (redundancy check), so allow a few seconds per case.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = resolve(process.argv[2])
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const val = await vite.ssrLoadModule('/src/core/puzzleValidate.ts')
for (const f of readdirSync(dir).filter(x => x.endsWith('.json') && x !== 'index.json').sort()) {
  const d = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
  const t0 = performance.now()
  const { issues } = val.validatePuzzleForProduction(d.puzzle)
  const ms = Math.round(performance.now() - t0)
  const by = {}
  for (const i of issues) by[`${i.severity}:${i.code}`] = (by[`${i.severity}:${i.code}`] ?? 0) + 1
  console.log(f, `${ms}ms`, JSON.stringify(by))
  for (const i of issues) console.log('   ', i.severity, i.code, i.message)
}
await vite.close()
