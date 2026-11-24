import { describe, expect, it } from 'vitest'
import { LIE_CASE_1, LIE_CASE_1_ID } from '../../src/lie/case1'
import { OFA_01 } from '../../src/lie/cases/ofa-01'
import { cheapestProofs, exposure, findMinimalCores, impliedStatements, isMinimalContradiction, laneFree, legible, proofPaths, verifyLieCase } from '../../src/lie/verify'

const c = OFA_01
const authorOf = (id: string) => c.statements.find(s => s.id === id)!.author

describe('ofa-01 "The Silent Bell": the first case', () => {
  const result = verifyLieCase(c, { laneFreeAtLeast: 1, proofCoresAtMost: 2, cheapestLegibleAtLeast: 2, allCoresLegible: true })

  it('is still importable as LIE_CASE_1 from ./case1', () => {
    expect(LIE_CASE_1).toBe(c)
    expect(LIE_CASE_1_ID).toBe('ofa-01')
  })

  it('is a 5x5 house with four rooms, four suspects and the victim', () => {
    expect(c.puzzle.size).toBe(5)
    expect(c.puzzle.rooms).toHaveLength(4)
    expect(c.puzzle.people.filter(x => x.id !== c.puzzle.victimId)).toHaveLength(4)
  })

  it('gives each suspect two statements and the victim one scene fact', () => {
    for (const x of c.puzzle.people.filter(p => p.id !== c.puzzle.victimId)) expect(c.statements.filter(s => s.author === x.id)).toHaveLength(2)
    expect(c.statements.filter(s => s.scene)).toHaveLength(2)
  })

  it('lies with the alibi a baker would give, and the lie is the only false statement', () => {
    expect(c.lieId).toBe('s4')
    expect(c.statements.find(s => s.id === 's4')).toMatchObject({ author: 'p1', text: 'On the counter.' })
    expect(result.failures).toEqual([])
  })

  it('stores a pair and a triple, both of which need no row or column rule', () => {
    expect(c.collisions).toEqual([['s1', 's4'], ['s4', 's5', 's6']])
    expect(result.report.laneFree).toEqual([true, true])
    expect(authorOf('s1')).not.toBe(authorOf('s5'))
  })

  it('has exactly these minimal contradictions, all through the lie', () => {
    expect(findMinimalCores(c, 4)).toEqual([['s1', 's4'], ['s2', 's4', 's6'], ['s3', 's4', 's6'], ['s4', 's5', 's6']])
    for (const core of c.collisions) {
      expect(isMinimalContradiction(c, core)).toBe(true)
      expect(laneFree(c, core)).toBe(true)
      expect(exposure(c, core).ok).toBe(true)
    }
  })

  it('is the easy case: the lie is visible by singles, and the true plan needs no supposing at all', () => {
    expect(result.report.legibilityLevel).toBe(0)
    expect(result.report.reconstructionSupposes).toBe(0)
    expect(result.report.reconstructionLaneSteps).toBe(0)
    expect(result.report.liarPlacedBySingles).toBe(true)
  })

  it('every minimal contradiction is legible, and the lie is proved by two of them, both legible', () => {
    const cores = findMinimalCores(c, 4)
    for (const core of cores) expect(legible(c, core)).toBe(true)
    const paths = proofPaths(c)
    const best = cheapestProofs(paths)
    expect(best.every(p => p.cores.length === 2 && p.legible.every(Boolean))).toBe(true)
    expect(best.map(p => p.cores)).toEqual([[['s1', 's4'], ['s2', 's4', 's6']], [['s1', 's4'], ['s3', 's4', 's6']], [['s1', 's4'], ['s4', 's5', 's6']]])
  })

  it('says something new in every statement', () => {
    expect(impliedStatements(c)).toEqual([])
  })

  it('is a short case: ten statements in all', () => {
    expect(c.statements).toHaveLength(10)
  })
})
