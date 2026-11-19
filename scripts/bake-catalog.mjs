// One-off: writes src/data/catalog.generated.json from the generator in
// src/core/catalogBuild.ts. That file is the canonical data for the 60 shipped
// cases (the browser never runs the generator), so it is committed and then left
// alone; its digest and fingerprints are pinned by tests/bakedCatalog.test.ts.
// This script exists to document how it was produced and to build future
// catalogue files, not to refresh the existing one, so it will not overwrite
// the file without --force.
//   node scripts/bake-catalog.mjs [--force]
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'src', 'data', 'catalog.generated.json')

if (existsSync(destination) && !process.argv.includes('--force')) {
  console.error('src/data/catalog.generated.json already exists and is canonical. Pass --force to overwrite it.')
  process.exit(1)
}

const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true } })
try {
  const { buildCatalog } = await vite.ssrLoadModule('/src/core/catalogBuild.ts')
  const puzzles = buildCatalog()
  // Compact on purpose: this file ships to players.
  writeFileSync(destination, `${JSON.stringify(puzzles)}\n`, 'utf8')
  console.log(`Wrote ${puzzles.length} cases to ${destination}`)
} finally {
  await vite.close()
}
