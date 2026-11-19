import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import baked from '../src/data/casebook.generated.json'
import fingerprints from './fixtures/casebook-fingerprints.json'
import { looksLikePuzzle } from '../src/core/catalog'
import { countSolutions, findMurderer } from '../src/core/engine'
import { puzzleFingerprint } from '../src/core/progress'
import { leadCases } from '../src/casebook/deep'
import type { Puzzle } from '../src/core/types'

// src/data/casebook.generated.json (pt-01 .. pt-12) is the canonical source of the 12 deep cases. It was
// produced by scripts/bake-casebook.mjs and is not compared against the generator: src/casebook/stories.ts
// keys authored stories, display names and titles by these ids, so a re-bake that changed a puzzle would
// silently put the wrong story on it. Re-baking is a decision: it needs --force, and it needs these pins
// (the digest and the fingerprint table) updated in the same change. A case's fingerprint (core/progress.ts)
// is also what decides whether a player's saved plan survives.
const BAKED_SHA256 = '4ab20e7983c1831ade5ef7e0db092f910f51523a12c9fdecfb780fc965917be9'

const bakedPuzzles = baked as unknown as Puzzle[]

describe('baked casebook (canonical data)', () => {
  it('is pinned: 12 cases pt-01 .. pt-12 whose JSON digest has not moved', () => {
    expect(bakedPuzzles.map(p => p.id)).toEqual(Array.from({ length: 12 }, (_, i) => `pt-${String(i + 1).padStart(2, '0')}`))
    expect(createHash('sha256').update(JSON.stringify(bakedPuzzles)).digest('hex')).toBe(BAKED_SHA256)
  })

  it('keeps every case fingerprint equal to the pinned one, so authored stories and saves stay attached', () => {
    expect(Object.fromEntries(bakedPuzzles.map(p => [p.id, puzzleFingerprint(p)]))).toEqual(fingerprints)
    expect(Object.keys(fingerprints)).toHaveLength(12)
  })

  it('is what the casebook leads with, in this order', () => {
    expect(JSON.stringify(leadCases())).toBe(JSON.stringify(bakedPuzzles))
  })

  it('has a unique clue-derived solution and a consistent murderer in every case', () => {
    for (const p of bakedPuzzles) {
      expect(looksLikePuzzle(p), p.id).toBe(true)
      expect(countSolutions(p, 5), p.id).toBe(1)
      expect(findMurderer(p), p.id).toBe(p.murdererId)
    }
  })
})
