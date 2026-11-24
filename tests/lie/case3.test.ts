import { describe, expect, it } from 'vitest'
import { OFA_03 } from '../../src/lie/cases/ofa-03'
import { exposure, findMinimalCores, isMinimalContradiction, satisfiable, verifyLieCase } from '../../src/lie/verify'

const c = OFA_03
const byId = (id: string) => c.statements.find(s => s.id === id)!
const inter = (a: string[], b: string[]) => a.filter(id => b.includes(id))

describe('ofa-03 "The Bell Ringer"', () => {
  const result = verifyLieCase(c, { supposesAtLeast: 1, firstTwoShare: 2 })

  it('is a 6x6 house with five suspects and the victim, two statements each', () => {
    expect(c.puzzle.size).toBe(6)
    const suspects = c.puzzle.people.filter(x => x.id !== c.puzzle.victimId)
    expect(suspects).toHaveLength(5)
    for (const x of suspects) expect(c.statements.filter(s => s.author === x.id)).toHaveLength(2)
    expect(c.statements.filter(s => s.scene)).toHaveLength(1)
    expect(result.failures).toEqual([])
  })

  it('lies with a witness: the lie is relational and has no square of its own', () => {
    expect(byId(c.lieId).clue).toEqual({ kind: 'sameRoomAs', person: 'p0', other: 'p1' })
    expect(c.puzzle.murdererId).toBe('p0')
    // alone, with the scene fact, the lie is satisfiable in every room: it names no place
    expect(satisfiable(c, [c.lieId])).toBe(true)
    // the other statements of the case use that kind too (no surface tell)
    expect(c.statements.filter(s => s.clue.kind === 'sameRoomAs' && s.id !== c.lieId).length).toBeGreaterThan(0)
  })

  it('stores three collisions: the first two share the lie and one more statement, all three share only the lie', () => {
    expect(c.collisions).toEqual([['s1', 's3', 's5'], ['s1', 's3', 's6'], ['s1', 's4', 's5']])
    const [a, b, d] = c.collisions
    expect(inter(a, b)).toEqual(['s1', 's3'])
    expect(inter(inter(a, b), d)).toEqual(['s1'])
    // the two obvious collisions do not prove anything: the shared s3 (Joana in the Kitchen) is just as guilty
    expect(inter(a, b)).toContain('s3')
    expect(d).not.toContain('s3')
  })

  it('has exactly these minimal contradictions, all through the lie, all through the full Kitchen', () => {
    expect(findMinimalCores(c, 4)).toEqual([['s1', 's3', 's5'], ['s1', 's3', 's6'], ['s1', 's4', 's5'], ['s1', 's4', 's6']])
    for (const core of c.collisions) {
      expect(isMinimalContradiction(c, core)).toBe(true)
      expect(exposure(c, core).ok).toBe(true)
    }
  })

  it('has no pair of statements that convicts the lie by itself', () => {
    expect(findMinimalCores(c, 2)).toEqual([])
  })

  it('leans on the one-per-row rule, so no collision is lane-free (not required of this case)', () => {
    expect(result.report.laneFree).toEqual([false, false, false])
  })

  it('needs supposing to rebuild the true plan, and the liar is not placed by singles', () => {
    expect(result.report.reconstructionSupposes).toBe(2)
    expect(result.report.reconstructionLaneSteps).toBe(1)
    expect(result.report.liarPlacedBySingles).toBe(false)
    expect(result.report.legibilityLevel).toBe(0)
  })
})
