import { describe, expect, it } from 'vitest'
import casebookData from '../../src/data/casebook.generated.json'
import { countSolutions, findMurderer, roomIdAt } from '../../src/core/engine'
import { depthGate } from '../../src/core/depth'
import { CASEBOOK_PLAN, buildCasebookCase, casebookSpec } from '../../src/core/depth/casebook'
import type { Puzzle } from '../../src/core/types'
import { judge, sameAssignment, storedSolution } from '../truth/literal'

const baked = casebookData as unknown as Puzzle[]

describe('casebook batch', () => {
  it('is 12 cases with ids pt-01 .. pt-12, 4 each in configs B, C and D', () => {
    expect(baked.map(p => p.id)).toEqual(Array.from({ length: 12 }, (_, i) => `pt-${String(i + 1).padStart(2, '0')}`))
    expect(CASEBOOK_PLAN.map(e => e.id)).toEqual(baked.map(p => p.id))
    for (const cfg of ['B', 'C', 'D'] as const) expect(CASEBOOK_PLAN.filter(e => e.config === cfg)).toHaveLength(4)
    expect(baked.filter(p => (p.floors ?? 1) === 2)).toHaveLength(4)
  })

  it('ramps: the longest inference chain never shortens along the batch', () => {
    const depths = baked.map(p => {
      const g = depthGate(p, casebookSpec(CASEBOOK_PLAN[baked.indexOf(p)]).tier, { engine: 'never' })
      return g.analysis.chainDepth
    })
    for (let i = 1; i < depths.length; i++) expect(depths[i], `pt-${i + 1}`).toBeGreaterThanOrEqual(depths[i - 1])
    expect(depths[0]).toBeLessThan(depths[depths.length - 1])
  })

  describe.each(CASEBOOK_PLAN.map((entry, i) => ({ entry, i })))('$entry.id ($entry.config, seed $entry.seed)', ({ entry, i }) => {
    const p = baked[i]

    it('is deterministic: regenerating from the stored seed reproduces the baked case exactly', () => {
      expect(buildCasebookCase(entry, i + 1)).toEqual(p)
    }, 120_000)

    it('has exactly one solution under the engine, and it is the stored one (independent interpreter)', () => {
      expect(countSolutions(p, 2)).toBe(1)
      const v = judge(p)
      expect(v.sentenceErrors).toEqual([])
      expect(v.count).toBe(1)
      expect(sameAssignment(storedSolution(p), v.solutions[0])).toBe(true)
    }, 120_000)

    it('names the right murderer: the one suspect alone with the victim', () => {
      expect(findMurderer(p)).toBe(p.murdererId)
      expect(judge(p).murderers).toEqual([p.murdererId])
      const room = roomIdAt(p, p.solution[p.victimId])
      const inRoom = p.people.filter(x => x.id !== p.victimId && roomIdAt(p, p.solution[x.id]) === room)
      expect(inRoom.map(x => x.id)).toEqual([p.murdererId])
    })

    it('passes the depth gate, engine checks included, with the casebook mix limits', () => {
      const g = depthGate(p, casebookSpec(entry).tier, { engine: 'always' })
      expect(g.failures).toEqual([])
      expect(g.pass).toBe(true)
      expect(g.analysis.directionShare).toBeLessThanOrEqual(0.35)
      expect(g.analysis.coordinateShare).toBeLessThanOrEqual(0.15)
      expect(g.analysis.confinedSuspects).toBe(0)
      expect(g.analysis.anchored).toBe(true)
      expect(g.analysis.forcedAtStart).toBe(1)
    }, 120_000)
  })
})
