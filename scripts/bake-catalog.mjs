// Bakes the puzzle catalogue into src/data/catalog.generated.json so the browser
// never runs the generator.
// Usage:
//   node scripts/bake-catalog.mjs          # write the file
//   node scripts/bake-catalog.mjs --check  # fail when the committed file is stale
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'src', 'data', 'catalog.generated.json')
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true } })
try {
  const { buildCatalog } = await vite.ssrLoadModule('/src/core/catalogBuild.ts')
  const puzzles = buildCatalog()
  // Compact on purpose: this file ships to players. Trailing newline keeps git quiet.
  const output = `${JSON.stringify(puzzles)}\n`

  if (process.argv.includes('--check')) {
    const current = existsSync(destination) ? readFileSync(destination, 'utf8').replaceAll('\r\n', '\n') : ''
    if (current !== output) {
      console.error('Baked catalogue is stale. Run: npm run bake:catalog')
      process.exitCode = 1
    } else {
      console.log(`Baked catalogue is current (${puzzles.length} cases).`)
    }
  } else {
    writeFileSync(destination, output, 'utf8')
    console.log(`Wrote ${puzzles.length} cases to ${destination}`)
  }
} finally {
  await vite.close()
}
