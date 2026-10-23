import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAllPuzzles, initCatalog } from '../src/core/catalog'
import { buildPuzzleCatalogReport, serializePuzzleCatalogReport } from '../src/core/catalogReport'

describe('puzzle catalogue report', () => {
  it('summarises every shipped case without hiding hard failures', () => {
    initCatalog()
    const report = buildPuzzleCatalogReport(getAllPuzzles())

    expect(report.schemaVersion).toBe(1)
    expect(report.catalogSize).toBe(60)
    expect(report.cases).toHaveLength(60)
    expect(report.summary.hardErrors).toBe(0)
    expect(report.unclassifiedFailures).toEqual([])
    expect(Object.values(report.byDifficulty).reduce((sum, tier) => sum + tier.cases, 0)).toBe(60)
  })

  it('publishes observed ranges rather than a synthetic difficulty score', () => {
    initCatalog()
    const report = buildPuzzleCatalogReport(getAllPuzzles())
    const hard = report.byDifficulty.Hard

    expect(hard.metrics.startingCandidateEntropy.min).toBeLessThanOrEqual(hard.metrics.startingCandidateEntropy.max)
    expect(hard.metrics.crossFloorClues.max).toBeGreaterThan(0)
    expect('score' in hard).toBe(false)
  })

  it('keeps the committed machine-readable report in sync', () => {
    initCatalog()
    const expected = serializePuzzleCatalogReport(buildPuzzleCatalogReport(getAllPuzzles()))
    const committed = readFileSync(join(process.cwd(), 'docs', 'reports', 'puzzle-catalog.json'), 'utf8')

    expect(committed).toBe(expected)
  })
})
