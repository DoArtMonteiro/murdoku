// Writes src/data/casebook.generated.json from the plan in src/core/depth/casebook.ts,
// the same way scripts/bake-catalog.mjs writes the catalogue. The file is canonical
// data (the generator never ships to the browser): src/casebook/stories.ts keys authored
// stories, names and titles by case id, and saves are keyed to each case's fingerprint, so
// a re-bake can silently change a puzzle under its story. Its digest and fingerprints are
// pinned by tests/bakedCasebook.test.ts. This script will not overwrite the file without
// --force (a --stats run alone writes only the stats file); after a forced bake, update those pins and review every story in the same change.
//   node scripts/bake-casebook.mjs [--force] [--stats <file.json>]
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'src', 'data', 'casebook.generated.json')

// The canonical file is only written with --force. Without it a run may still write --stats.
const writeData = !existsSync(destination) || process.argv.includes('--force')
const statsIdx = process.argv.indexOf('--stats')
const statsFile = statsIdx >= 0 ? process.argv[statsIdx + 1] : null

if (!writeData && !statsFile) {
  console.error('src/data/casebook.generated.json already exists and is canonical. Pass --force to overwrite it.')
  process.exit(1)
}

const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { buildCasebook, CASEBOOK_PLAN } = await vite.ssrLoadModule('/src/core/depth/casebook.ts')
  const { analyzePuzzle } = await vite.ssrLoadModule('/src/core/depth/index.ts')
  const puzzles = buildCasebook()
  if (writeData) {
    writeFileSync(destination, `${JSON.stringify(puzzles)}\n`, 'utf8')
    console.log(`Wrote ${puzzles.length} cases to ${destination}`)
  } else {
    console.log('src/data/casebook.generated.json is canonical and was left alone (pass --force to overwrite it).')
  }
  if (statsFile) {
    const stats = puzzles.map((p, i) => ({ id: p.id, config: CASEBOOK_PLAN[i].config, seed: CASEBOOK_PLAN[i].seed, analysis: analyzePuzzle(p) }))
    writeFileSync(statsFile, JSON.stringify(stats, null, 1), 'utf8')
    console.log(`Wrote mix statistics to ${statsFile}`)
  }
} finally {
  await vite.close()
}
