// Deterministic catalogue measurement and validation report.
// Usage:
//   node scripts/measure-puzzles.mjs          # JSON on stdout
//   node scripts/measure-puzzles.mjs --write  # refresh docs/reports/puzzle-catalog.json
//   node scripts/measure-puzzles.mjs --check  # fail when the committed report is stale
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'docs', 'reports', 'puzzle-catalog.json')
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true } })
const { getAllPuzzles } = await vite.ssrLoadModule('/src/core/catalog.ts')
const { buildPuzzleCatalogReport, serializePuzzleCatalogReport } = await vite.ssrLoadModule('/src/core/catalogReport.ts')
const report = buildPuzzleCatalogReport(getAllPuzzles())
const output = serializePuzzleCatalogReport(report)

if (process.argv.includes('--write')) {
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, output, 'utf8')
  console.log(`Wrote ${report.catalogSize} cases to ${destination}`)
} else if (process.argv.includes('--check')) {
  const current = existsSync(destination) ? readFileSync(destination, 'utf8') : ''
  if (current !== output) {
    console.error('Puzzle catalogue report is stale. Run: npm run report:puzzles')
    process.exitCode = 1
  } else {
    console.log(`Puzzle catalogue report is current (${report.catalogSize} cases).`)
  }
} else {
  process.stdout.write(output)
}

if (report.summary.hardErrors > 0 || report.unclassifiedFailures.length > 0) process.exitCode = 1
await vite.close()
