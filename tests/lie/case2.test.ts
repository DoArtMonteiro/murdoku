import { describe, expect, it } from 'vitest'
import { OFA_02 } from '../../src/lie/cases/ofa-02'
import { exposure, findMinimalCores, isMinimalContradiction, laneFree, satisfiable, verifyLieCase } from '../../src/lie/verify'

const c = OFA_02
const byId = (id: string) => c.statements.find(s => s.id === id)!

describe('ofa-02 "The Notary\'s Last Page"', () => {
  const result = verifyLieCase(c, { laneFreeAtLeast: 1, liarBeyondSingles: true })

  it('is a 6x6 house with four rooms, five suspects and the victim, two statements each', () => {
    expect(c.puzzle.size).toBe(6)
    expect(c.puzzle.rooms).toHaveLength(4)
    const suspects = c.puzzle.people.filter(x => x.id !== c.puzzle.victimId)
    expect(suspects).toHaveLength(5)
    for (const x of suspects) expect(c.statements.filter(s => s.author === x.id)).toHaveLength(2)
    expect(c.statements.filter(s => s.scene)).toHaveLength(2)
    expect(result.failures).toEqual([])
  })

  it('lies with the chandler\'s own stock: Dinis says he sat on the box', () => {
    expect(byId(c.lieId)).toMatchObject({ author: 'p4', text: 'On the box.' })
    expect(c.puzzle.murdererId).toBe('p4')
  })

  it('stores a pair and a chain through a third person', () => {
    expect(c.collisions).toEqual([['s3', 's10'], ['s1', 's7', 's10']])
    const [pair, chain] = c.collisions
    expect(pair).toHaveLength(2)
    expect(chain).toHaveLength(3)
    // Rui speaks of Marta, and Marta of Dinis: the chain runs through Marta
    expect(byId('s1').clue).toMatchObject({ kind: 'direction', person: 'p0', other: 'p3' })
    expect(byId('s7').clue).toMatchObject({ kind: 'direction', person: 'p3', other: 'p4' })
    expect(new Set(chain.filter(id => id !== c.lieId).map(id => byId(id).author)).size).toBe(2)
  })

  it('has one lane-free collision (the chain) and one that leans on the row rule (the pair)', () => {
    expect(result.report.laneFree).toEqual([false, true])
    expect(laneFree(c, ['s1', 's7', 's10'])).toBe(true)
    expect(satisfiable(c, ['s3', 's10'], { lanes: false })).toBe(true)
  })

  it('has exactly these minimal contradictions, all through the lie', () => {
    expect(findMinimalCores(c, 4)).toEqual([
      ['s2', 's10'], ['s3', 's10'], ['s1', 's7', 's10'], ['s7', 's8', 's10'], ['s1', 's5', 's8', 's10'], ['s1', 's6', 's8', 's10'],
    ])
    for (const core of c.collisions) {
      expect(isMinimalContradiction(c, core)).toBe(true)
      expect(exposure(c, core).ok).toBe(true)
    }
  })

  it('needs a step beyond singles to find the liar\'s true square once the lie is struck', () => {
    expect(result.report.liarPlacedBySingles).toBe(false)
    expect(result.report.reconstructionSupposes).toBe(1)
    expect(result.report.reconstructionLaneSteps).toBe(0)
  })

  it('a collision is visible by singles in all twelve statements', () => {
    expect(result.report.legibilityLevel).toBe(0)
  })
})
