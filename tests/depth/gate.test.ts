import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { difficultyMetrics } from '../../src/core/puzzleValidate'
import { deduceChain } from '../../src/reference/story/deduce'
import { roomIdAt } from '../../src/core/engine'
import { DEPTH_SPECS, analyzePuzzle, depthGate } from '../../src/core/depth'
import type { DepthTier } from '../../src/core/depth'
import { loadFixtures } from './fixtures'

const catalog = getAllPuzzles()

/** The most forgiving bar: any depth at all. */
const LOOSE: DepthTier = {
  name: 'loose', minNeedsSearch: 1, minCrossSteps: 1, minChainDepth: 0, maxForcedAtStart: 1, maxStatementsMean: 2.5,
  maxStatementsPerPerson: 3, maxCoordinateShare: 0.25, maxDirectionShare: 1, minLiveSuspects: 3, requireAnchored: false,
}

describe('depth gate on a shallow shipped case', () => {
  const p = catalog.find(x => x.id === 'very-easy-3')!

  it('rejects very-easy-3 even at the loosest bar, and says why', () => {
    const g = depthGate(p, LOOSE, { engine: 'always' })
    expect(g.pass).toBe(false)
    const codes = g.failures.map(f => f.code)
    // three people are pinned by their own clues, nobody needs a search, no relational clue exists
    expect(codes).toContain('forcedAtStart')
    expect(codes).toContain('needsSearch')
    expect(codes).toContain('cross')
    expect(g.analysis.forcedAtStart).toBe(3)
    expect(g.analysis.needsSearch).toBe(0)
    expect(g.analysis.crossDirect).toBe(0)
    expect(g.analysis.relationalClues).toBe(0)
  })

  it('still reports it as unique and chain-pure: shallow is not the same as broken', () => {
    const g = depthGate(p, LOOSE, { engine: 'always' })
    expect(g.engine?.solutions).toBe(1)
    expect(g.engine?.chainPure).toBe(true)
    expect(g.engine?.murdererOk).toBe(true)
  })
})

describe('depth gate on the saved depth cases', () => {
  const fixtures = loadFixtures()
  it('has fixtures to test', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(5)
  })
  for (const fx of fixtures) {
    it(`${fx.name} passes its configuration's gate, with the engine's own solver`, () => {
      const tier = { ...DEPTH_SPECS[fx.config].tier, requireAnchored: true }
      const g = depthGate(fx.puzzle, tier, { engine: 'always' })
      expect(g.failures).toEqual([])
      expect(g.pass).toBe(true)
      expect(g.engine?.solutions).toBe(1)
      expect(g.engine?.chainPure).toBe(true)
    }, 180_000)
  }
})

describe('the gate rejects a murderer leak and a direction-heavy mix', () => {
  const fx = loadFixtures()[1]
  const tier = { ...DEPTH_SPECS[fx.config].tier }

  it('rejects a case where a suspect card names the victim room', () => {
    const p = fx.puzzle
    const victimRoom = roomIdAt(p, p.solution[p.victimId])
    // A suspect whose own card names the victim's room: even a true clue about the murderer is the leak
    const leaky = { ...p, clues: [...p.clues, { clue: { kind: 'room' as const, person: p.murdererId, roomId: victimRoom }, text: 'In the room.' }] }
    const g = depthGate(leaky, tier, { engine: 'never' })
    expect(g.failures.map(f => f.code)).toContain('leak-confined')
  })

  it('rejects a case whose clues are mostly direction clues', () => {
    const p = fx.puzzle
    const g = depthGate(p, { ...tier, maxDirectionShare: 0.05 }, { engine: 'never' })
    expect(g.failures.map(f => f.code)).toContain('direction-share')
  })
})

describe('depth analysis agrees with the code it re-implements, on all 60 shipped cases', () => {
  for (const p of catalog) {
    it(`${p.id}: pure equals deduceChain.pure, singles metrics equal difficultyMetrics`, () => {
      const a = analyzePuzzle(p)
      expect(a.pure).toBe(deduceChain(p).pure)
      const m = difficultyMetrics(p)
      expect(a.forcedAtStart).toBe(m.forcedAtStart)
      expect(a.forcedBySingles).toBe(m.forcedBySingles)
      expect(a.needsSearch).toBe(m.needsSearch)
      expect(a.relationalClues).toBe(m.relationalClues)
    })
  }
})
