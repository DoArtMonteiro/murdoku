import { describe, expect, it } from 'vitest'
import { countSolutions, findMurderer } from '../../src/core/engine'
import { reseed } from '../../src/core/generate'
import { deduceChain } from '../../src/reference/story/deduce'
import { DEFAULT_RECIPE, DEPTH_SPECS, analyzePuzzle, generateDepthCase } from '../../src/core/depth'
import type { Puzzle } from '../../src/core/types'

const ANCHORED = { ...DEFAULT_RECIPE }

describe('determinism', () => {
  const cases: ['A' | 'B' | 'C' | 'D' | 'E', number][] = [['A', 1], ['A', 2], ['B', 3], ['C', 4], ['E', 5], ['D', 6]]
  for (const [cfg, seed] of cases) {
    it(`config ${cfg} seed ${seed}: the same seed gives the same case, even if generate.ts's own generator was disturbed in between`, () => {
      const first = generateDepthCase(DEPTH_SPECS[cfg], seed)
      reseed(987654321) // generate.ts keeps a module-level generator; the depth generator must not depend on its prior state
      const second = generateDepthCase(DEPTH_SPECS[cfg], seed)
      expect(second.rejected).toEqual(first.rejected)
      expect(second.puzzle).toEqual(first.puzzle)
      expect(second.draft).toEqual(first.draft)
    }, 120_000)
  }

  it('different seeds give different cases', () => {
    const a = generateDepthCase(DEPTH_SPECS.A, 11).draft
    const b = generateDepthCase(DEPTH_SPECS.A, 12).draft
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(JSON.stringify(a!.clues)).not.toBe(JSON.stringify(b!.clues))
  })
})

describe('generated cases are what the gate says they are', () => {
  const accepted: { name: string; p: Puzzle }[] = []
  for (const [cfg, seeds] of [['A', [1, 2, 3, 4, 5, 6]], ['B', [1, 2, 3, 4]]] as const) {
    for (const seed of seeds) {
      const c = generateDepthCase(DEPTH_SPECS[cfg], seed, { recipe: ANCHORED })
      if (c.puzzle) accepted.push({ name: `${cfg}${seed}`, p: c.puzzle })
    }
  }

  it('most small-board candidates are accepted (this is not a one-in-a-thousand search)', () => {
    expect(accepted.length).toBeGreaterThanOrEqual(7)
  })

  for (const { name, p } of accepted) {
    it(`${name}: the engine finds exactly one solution; the murderer is right; deduceChain is pure`, () => {
      expect(countSolutions(p, 2)).toBe(1)
      expect(findMurderer(p)).toBe(p.murdererId)
      expect(deduceChain(p).pure).toBe(true)
      expect(analyzePuzzle(p).pure).toBe(true)
    })
  }
})
