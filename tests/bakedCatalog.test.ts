import { describe, expect, it } from 'vitest'
import baked from '../src/data/catalog.generated.json'
import { getAllPuzzles, looksLikePuzzle } from '../src/core/catalog'
import { buildCatalog } from '../src/core/catalogBuild'
import { puzzleFingerprint } from '../src/core/progress'
import type { Puzzle } from '../src/core/types'

// The browser never runs the generator: it loads src/data/catalog.generated.json.
// That file is only safe to ship while it is exactly what the generator makes,
// because ids and fingerprints decide whether a player's saved progress survives.
// If this fails after a deliberate generator or case change, run:
//   npm run bake:catalog
// and treat every fingerprint change as the progress wipe it is.
describe('baked catalogue', () => {
  const live = buildCatalog()
  const bakedPuzzles = baked as unknown as Puzzle[]

  it('is byte-for-byte what the generator produces (JSON.stringify, key order included)', () => {
    expect(live).toHaveLength(60)
    expect(JSON.stringify(bakedPuzzles)).toBe(JSON.stringify(live))
  })

  it('keeps all 60 case ids unique and every fingerprint identical to the generator', () => {
    const ids = live.map(p => p.id)
    expect(new Set(ids).size).toBe(60)
    expect(bakedPuzzles.map(p => p.id)).toEqual(ids)
    for (const [i, p] of live.entries()) {
      expect(puzzleFingerprint(bakedPuzzles[i]), p.id).toBe(puzzleFingerprint(p))
    }
  })

  it('is what the app serves, and every case is structurally sound', () => {
    expect(getAllPuzzles().map(puzzleFingerprint)).toEqual(live.map(puzzleFingerprint))
    for (const p of bakedPuzzles) expect(looksLikePuzzle(p), p.id).toBe(true)
  })
})
