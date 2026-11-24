import { describe, expect, it } from 'vitest'
import { citable, contradictionKey, crackTiles, inReadingOrder, keepConsistent, proofGate, rule } from '../../src/lie/collide'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { findMinimalCores } from '../../src/lie/verify'

const at = (row: number, col: number) => ({ row, col })
const doubtable = C.statements.filter(s => !s.scene).map(s => s.id)

describe('rule: the engine decides, and never says which statement is false', () => {
  it('a minimal contradiction: every cited statement is needed', () => {
    expect(rule(C, ['s2', 's1', 's3'])).toBe('minimal')
    expect(rule(C, ['s2', 's8', 's9'])).toBe('minimal')
  })

  it('unsatisfiable but not minimal: one statement is along for the ride', () => {
    expect(rule(C, ['s2', 's1', 's3', 's5'])).toBe('redundant')
  })

  it('satisfiable: they can all be true', () => {
    expect(rule(C, ['s1', 's3'])).toBe('satisfiable')
    expect(rule(C, ['s5', 's6', 's7'])).toBe('satisfiable')
    // the lie with a harmless neighbour is still satisfiable
    expect(rule(C, ['s2', 's5'])).toBe('satisfiable')
  })

  it('ignores scene facts and unknown ids in the citation (scene facts are always implicit)', () => {
    expect(citable(C, ['s10', 'nope', 's1', 's1'])).toEqual(['s1'])
    expect(rule(C, ['s2', 's1', 's3', 's10'])).toBe('minimal')
  })

  it('reading order and a stable key', () => {
    expect(inReadingOrder(C, ['s9', 's2', 's1'])).toEqual(['s1', 's2', 's9'])
    expect(contradictionKey(['s3', 's1'])).toBe(contradictionKey(['s1', 's3']))
  })
})

describe('proofGate: reads the ledger only', () => {
  const A = ['s1', 's2', 's3'], B = ['s2', 's8', 's9']
  it('a single contradiction is not proof', () => {
    expect(proofGate([A], 's2')).toBe(false)
    expect(proofGate([], 's2')).toBe(false)
  })
  it('two contradictions that meet in exactly that statement are proof', () => {
    expect(proofGate([A, B], 's2')).toBe(true)
  })
  it('a statement in only one of the two is not proof', () => {
    expect(proofGate([A, B], 's1')).toBe(false)
    expect(proofGate([A, B], 's9')).toBe(false)
  })
  it('two contradictions that meet in two statements are not proof of either', () => {
    const X = ['s1', 's2', 's3'], Y = ['s1', 's2', 's8']
    expect(proofGate([X, Y], 's2')).toBe(false)
    expect(proofGate([X, Y], 's1')).toBe(false)
  })
  it('only the rows holding the statement count: a third, unrelated row does not spoil it', () => {
    expect(proofGate([A, B, ['s5', 's6']], 's2')).toBe(true)
  })

  it('by construction: any statement that passes the gate over minimal contradictions is the lie', () => {
    // every minimal contradiction of the fixture, any size up to four; the lie is in all of them
    const cores = findMinimalCores(C, 4)
    expect(cores.length).toBeGreaterThanOrEqual(2)
    for (const core of cores) expect(core).toContain(C.lieId)
    for (const a of cores) {
      for (const b of cores) {
        for (const id of doubtable) if (proofGate([a, b], id)) expect(id).toBe(C.lieId)
      }
    }
    for (const id of doubtable) if (proofGate(cores, id)) expect(id).toBe(C.lieId)
    // and the case's own two collisions do pass it
    expect(proofGate(C.collisions, C.lieId)).toBe(true)
  })
})

describe('crack overlay', () => {
  it('only the tiles of speakers who are already placed', () => {
    const placed = { b: at(0, 0) }
    // s1 is Ana's (unplaced), s3 is Bruno's (placed)
    expect([...crackTiles(C, ['s1', 's2', 's3'], placed)]).toEqual(['0,0'])
    expect(crackTiles(C, ['s1', 's2'], placed).size).toBe(0)
  })
})

describe('keepConsistent: a guess never locks the true plan out of reach', () => {
  const sol = C.puzzle.solution
  it('keeps tokens the true statements put there, drops the rest', () => {
    const placed = { b: at(sol.b.row, sol.b.col), c: at(3, 3), d: at(sol.d.row, sol.d.col) }
    expect(keepConsistent(C, placed, ['b', 'c', 'd'])).toEqual(['b', 'd'])
  })
  it('keeps nobody when the first guess is wrong and the second only fits with it', () => {
    expect(keepConsistent(C, { b: at(1, 1) }, ['b'])).toEqual([])
  })
})
