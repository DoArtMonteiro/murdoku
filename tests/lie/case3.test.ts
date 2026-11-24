import { describe, expect, it } from 'vitest'
import { OFA_03 } from '../../src/lie/cases/ofa-03'
import { exposure, findMinimalCores, impliedStatements, isMinimalContradiction, laneFree, satisfiable, verifyLieCase } from '../../src/lie/verify'

const c = OFA_03
const byId = (id: string) => c.statements.find(s => s.id === id)!
const inter = (a: string[], b: string[]) => a.filter(id => b.includes(id))

describe('ofa-03 "The Bell Ringer"', () => {
  const result = verifyLieCase(c, { laneFreeAtLeast: 1, supposesAtLeast: 1, firstTwoShare: 2 })

  it('is a 6x6 house with five suspects and the victim, two statements each', () => {
    expect(c.puzzle.size).toBe(6)
    const suspects = c.puzzle.people.filter(x => x.id !== c.puzzle.victimId)
    expect(suspects).toHaveLength(5)
    for (const x of suspects) expect(c.statements.filter(s => s.author === x.id)).toHaveLength(2)
    expect(c.statements.filter(s => s.scene)).toHaveLength(1)
    expect(result.failures).toEqual([])
  })

  it('has a room three rows tall, so a third person can share it', () => {
    const kitchen = c.puzzle.rooms.find(r => r.name === 'Kitchen')!
    expect(new Set(kitchen.cells.map(x => x.row)).size).toBe(3)
    expect(new Set(kitchen.cells.map(x => x.col)).size).toBe(3)
  })

  it('lies with a witness: the lie is relational and has no square of its own', () => {
    expect(byId(c.lieId).clue).toEqual({ kind: 'sameRoomAs', person: 'p0', other: 'p1' })
    expect(c.puzzle.murdererId).toBe('p0')
    expect(satisfiable(c, [c.lieId])).toBe(true)
    // others use that kind too (no surface tell)
    expect(c.statements.filter(s => s.clue.kind === 'sameRoomAs' && s.id !== c.lieId).length).toBeGreaterThan(0)
  })

  it('says something new in every statement: no speaker restates themself', () => {
    expect(impliedStatements(c)).toEqual([])
  })

  it('stores three collisions: the first two share the lie and one more statement, all three share only the lie', () => {
    expect(c.collisions).toEqual([['s2', 's3', 's7', 's8'], ['s2', 's3', 's9', 's10'], ['s2', 's6', 's10']])
    const [a, b, d] = c.collisions
    expect(inter(a, b)).toEqual(['s2', 's3'])
    expect(inter(inter(a, b), d)).toEqual(['s2'])
    // the two obvious collisions share Joana's s3, which is just as guilty; the third does not use it
    expect(d).not.toContain('s3')
  })

  it('has two lane-free collisions (read off the words and the plan) and one that leans on the row rule', () => {
    expect(result.report.laneFree).toEqual([true, true, false])
    expect(laneFree(c, ['s2', 's3', 's7', 's8'])).toBe(true)
    expect(satisfiable(c, ['s2', 's6', 's10'], { lanes: false })).toBe(true)
  })

  it('has exactly these minimal contradictions, all through the lie', () => {
    const cores = findMinimalCores(c, 4)
    for (const core of cores) expect(core).toContain(c.lieId)
    expect(cores).toHaveLength(15)
    for (const core of c.collisions) {
      expect(cores.some(k => k.length === core.length && core.every(id => k.includes(id)))).toBe(true)
      expect(isMinimalContradiction(c, core)).toBe(true)
      expect(exposure(c, core).ok).toBe(true)
    }
  })

  it('needs supposing to rebuild the true plan, and the liar is not placed by singles', () => {
    expect(result.report.reconstructionSupposes).toBe(1)
    expect(result.report.reconstructionLaneSteps).toBe(1)
    expect(result.report.liarPlacedBySingles).toBe(false)
    expect(result.report.legibilityLevel).toBe(0)
  })
})
