import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import baked from '../src/data/catalog.generated.json'
import fingerprints from './fixtures/catalog-fingerprints.json'
import { getAllPuzzles, looksLikePuzzle } from '../src/core/catalog'
import { countSolutions, findMurderer } from '../src/core/engine'
import { puzzleFingerprint } from '../src/core/progress'
import type { Puzzle } from '../src/core/types'

// src/data/catalog.generated.json is the canonical source of the 60 cases players
// load. It was produced once by scripts/bake-catalog.mjs; it is NOT regenerated
// or compared against the generator, so generate.ts can change for new cases
// without touching these. What these tests protect is the file itself and the
// saves attached to it: a case's fingerprint (progress.ts) decides whether a
// player's saved progress survives, so any edit to a baked case is a decision.
const BAKED_SHA256 = 'ba6c7d93b2926f7e9d0fb074827e8bfb258d3a1eed06d7ccf03ae5c169b4724d'

const bakedPuzzles = baked as unknown as Puzzle[]

describe('baked catalogue (canonical data)', () => {
  it('is pinned: 60 unique cases whose JSON digest has not moved', () => {
    expect(bakedPuzzles).toHaveLength(60)
    expect(new Set(bakedPuzzles.map(p => p.id)).size).toBe(60)
    expect(createHash('sha256').update(JSON.stringify(bakedPuzzles)).digest('hex')).toBe(BAKED_SHA256)
  })

  it('is exactly what the app serves', () => {
    expect(JSON.stringify(getAllPuzzles())).toBe(JSON.stringify(bakedPuzzles))
  })

  it('keeps every fingerprint equal to the one the shipped build computed, so saves survive', () => {
    // tests/fixtures/catalog-fingerprints.json was captured once from the
    // pre-bake build (the fingerprints a player's saved progress is keyed to).
    // It is deliberately not legacyFingerprints.ts, which holds old v25 values.
    expect(Object.fromEntries(bakedPuzzles.map(p => [p.id, puzzleFingerprint(p)]))).toEqual(fingerprints)
    expect(Object.keys(fingerprints)).toHaveLength(60)
  })

  it('has a unique clue-derived solution and a consistent murderer in every case', () => {
    for (const p of bakedPuzzles) {
      expect(looksLikePuzzle(p), p.id).toBe(true)
      expect(countSolutions(p, 5), p.id).toBe(1)
      expect(findMurderer(p), p.id).toBe(p.murdererId)
    }
  })
})
