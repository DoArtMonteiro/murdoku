// Writes src/data/casebook.generated.json from the plan in src/core/depth/casebook.ts,
// the same way scripts/bake-catalog.mjs writes the catalogue. The file is canonical
// data; the generator never ships to the browser. Regeneration is deterministic per
// stored seed and tests/depth/casebook.test.ts proves the file still equals it.
//   node scripts/bake-casebook.mjs [--stats <file.json>]
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'src', 'data', 'casebook.generated.json')
const statsIdx = process.argv.indexOf('--stats')
const statsFile = statsIdx >= 0 ? process.argv[statsIdx + 1] : null

const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { buildCasebook, CASEBOOK_PLAN } = await vite.ssrLoadModule('/src/core/depth/casebook.ts')
  const { analyzePuzzle } = await vite.ssrLoadModule('/src/core/depth/index.ts')
  const puzzles = buildCasebook()
  writeFileSync(destination, `${JSON.stringify(puzzles)}\n`, 'utf8')
  console.log(`Wrote ${puzzles.length} cases to ${destination}`)
  if (statsFile) {
    const stats = puzzles.map((p, i) => ({ id: p.id, config: CASEBOOK_PLAN[i].config, seed: CASEBOOK_PLAN[i].seed, analysis: analyzePuzzle(p) }))
    writeFileSync(statsFile, JSON.stringify(stats, null, 1), 'utf8')
    console.log(`Wrote mix statistics to ${statsFile}`)
  }
} finally {
  await vite.close()
}
