import { describe, expect, it } from 'vitest'
import { countSolutions, findMurderer } from '../../src/core/engine'
import { reseed } from '../../src/core/generate'
import { deduceChain } from '../../src/reference/story/deduce'
import { DEFAULT_RECIPE, DEPTH_SPECS, analyzePuzzle, generateDepthCase } from '../../src/core/depth'
import { countSolutionsFast } from '../../src/core/depth/fastCount'
import type { Puzzle } from '../../src/core/types'

const ANCHORED = { ...DEFAULT_RECIPE, mode: 'anchored' as const }

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
    it(`${name}: engine and fast solver both find exactly one solution; the murderer is right; deduceChain is pure`, () => {
      expect(countSolutions(p, 2)).toBe(1)
      expect(countSolutionsFast(p, 2)).toBe(1)
      expect(findMurderer(p)).toBe(p.murdererId)
      expect(deduceChain(p).pure).toBe(true)
      expect(analyzePuzzle(p).pure).toBe(true)
    })
  }
})

describe('countSolutionsFast is the engine solver with earlier pruning, not a different solver', () => {
  it('returns the same count (capped at 2) on clue sets that are too small, exactly right, and over-constrained', () => {
    const c = generateDepthCase(DEPTH_SPECS.A, 7, { recipe: ANCHORED })
    const p = c.puzzle!
    expect(p).toBeTruthy()
    const real = p.clues.filter(x => x.clue.kind !== 'victim')
    for (let n = 0; n <= real.length; n++) {
      const sub: Puzzle = { ...p, clues: real.slice(0, n) }
      expect(countSolutionsFast(sub, 2)).toBe(countSolutions(sub, 2))
    }
    for (let i = 0; i < real.length; i++) {
      const sub: Puzzle = { ...p, clues: real.filter((_, j) => j !== i) }
      expect(countSolutionsFast(sub, 2)).toBe(countSolutions(sub, 2))
    }
    // a clue that is false of the solution drives the count to 0 in both
    const other = p.people.find(x => x.id !== real[0].clue.person)!.id
    const wrong: Puzzle = {
      ...p,
      clues: [...real, { clue: { kind: 'direction', person: real[0].clue.person, other, dir: 'N', steps: 99 }, text: '' }],
    }
    expect(countSolutionsFast(wrong, 2)).toBe(0)
    expect(countSolutions(wrong, 2)).toBe(0)
  })
})
