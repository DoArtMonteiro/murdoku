import { describe, expect, it } from 'vitest'
import { collisionKey, commonPeople, findCollisions, recordable } from '../../src/lie/collide'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import type { Placed } from '../../src/lie/lens'
import type { Statement } from '../../src/lie/model'

const all: Statement[] = C.statements
const noLie: Statement[] = C.statements.filter(s => s.id !== C.lieId)
const at = (row: number, col: number) => ({ row, col })
const peopleOf = (p: Placed, act: Statement[] = all) => findCollisions(C, act, p).map(k => k.people)

describe('findCollisions: unplaced subject', () => {
  it('finds nothing on an empty plan', () => {
    expect(findCollisions(C, all, {})).toEqual([])
  })

  it('finds nothing while everyone could still be somewhere', () => {
    expect(findCollisions(C, all, { c: at(1, 4), v: at(2, 3) })).toEqual([])
  })

  it('names the subject first, then the one person who takes the last tile away', () => {
    const ks = findCollisions(C, all, { b: at(0, 0) })
    expect(ks).toHaveLength(1)
    expect(ks[0].subject).toBe('a')
    expect(ks[0].people).toEqual(['a', 'b'])
    // a: against a wall AND in the Net Loft -> (0,0) (0,1) (0,2) (1,0)
    expect([...ks[0].tiles].sort()).toEqual(['0,0', '0,1', '0,2', '1,0'])
    // every active statement of both people, and nobody else's
    expect(ks[0].statementIds.sort()).toEqual(['s1', 's2', 's3', 's4'].sort())
  })

  it('uses a relation written by the placed person about the subject', () => {
    // d: "I was north of Ana". With d on row 3, Ana (Net Loft) has nowhere to stand.
    const ks = findCollisions(C, all, { d: at(3, 1) })
    expect(ks.map(k => k.people)).toEqual([['a', 'd']])
  })

  it('uses a relation written by the subject about the placed person', () => {
    // c: "not in the same room as Bruno". Bruno in the Chandlery leaves Cleo (Chandlery) no tile.
    const ks = findCollisions(C, all, { b: at(0, 3) })
    expect(ks.some(k => k.subject === 'c' && k.people.includes('b'))).toBe(true)
  })

  it('reports each different blocker as its own collision, not one big pile', () => {
    const ks = findCollisions(C, all, { b: at(0, 0), d: at(3, 1) })
    expect(ks.map(k => k.people)).toEqual([['a', 'b'], ['a', 'd']])
  })

  it('never lists a placed person who takes no tile from the subject', () => {
    const ks = findCollisions(C, all, { b: at(0, 0), c: at(1, 4), v: at(2, 3) })
    expect(ks.map(k => k.people)).toEqual([['a', 'b']])
  })

  it('a blocked row alone is enough: someone on the row the subject needs', () => {
    // v (scene: at the desk) is unplaced; c on row 2 leaves the desk tile (2,3) no free row.
    const ks = findCollisions(C, all, { c: at(2, 0) })
    expect(ks.some(k => k.subject === 'v' && k.people.includes('c'))).toBe(true)
  })

  it('has no collision once the lie is struck', () => {
    expect(findCollisions(C, noLie, { b: at(0, 0), d: at(3, 1) })).toEqual([])
  })

  it('a subject with no tile at all collides alone', () => {
    const impossible: Statement[] = [
      { id: 'x1', author: 'a', clue: { kind: 'room', person: 'a', roomId: 'loft' }, text: '' },
      { id: 'x2', author: 'a', clue: { kind: 'room', person: 'a', roomId: 'quay' }, text: '' },
    ]
    const ks = findCollisions(C, impossible, {})
    expect(ks).toEqual([{ subject: 'a', people: ['a'], statementIds: ['x1', 'x2'], tiles: [] }])
    expect(recordable(ks)).toEqual([])
  })

  it('does not read the solution: moving it changes nothing', () => {
    const moved = { ...C, puzzle: { ...C.puzzle, solution: {} } }
    expect(findCollisions(moved, all, { b: at(0, 0), d: at(3, 1) }).map(k => k.people))
      .toEqual(findCollisions(C, all, { b: at(0, 0), d: at(3, 1) }).map(k => k.people))
  })
})

describe('findCollisions: placed subject', () => {
  it('a relational statement broken by two placed people names both', () => {
    // Ana in the Net Loft against a wall, Davi on row 3: "north of Ana" is false
    const ks = findCollisions(C, all, { a: at(0, 2), d: at(3, 1) })
    const d = ks.find(k => k.subject === 'd')!
    expect(d.people).toEqual(['d', 'a'])
    expect(d.statementIds).toContain('s9')
    expect(d.statementIds).toContain('s1')
    expect(d.tiles.length).toBeGreaterThan(0)
  })

  it('a person set against their own account collides alone (and is not recordable)', () => {
    const ks = findCollisions(C, all, { c: at(4, 4) })
    expect(ks.find(k => k.subject === 'c')?.people).toEqual(['c'])
    expect(recordable(ks).filter(k => k.subject === 'c')).toEqual([])
  })

  it('holds still when the placement is the true one and the lie is struck', () => {
    expect(findCollisions(C, noLie, C.puzzle.solution)).toEqual([])
  })

  it('with the lie still standing, the true plan breaks exactly the lie', () => {
    const ks = findCollisions(C, all, C.puzzle.solution)
    expect(ks.map(k => k.subject)).toEqual(['a'])
    expect(ks[0].people).toEqual(['a'])
  })

  it('unplaced people do not count against a relation yet', () => {
    expect(findCollisions(C, all, { d: at(3, 1) }).some(k => k.subject === 'd')).toBe(false)
  })
})

describe('the ledger payoff', () => {
  it('two natural placements leave the murderer as the only common person', () => {
    const rows = [
      ...peopleOf({ b: at(0, 0) }),
      ...peopleOf({ b: at(0, 0), d: at(3, 1) }).filter(p => p.includes('d')),
    ]
    expect(rows).toEqual([['a', 'b'], ['a', 'd']])
    expect(commonPeople(rows)).toEqual([C.puzzle.murdererId])
  })

  it('collisionKey ignores order', () => {
    expect(collisionKey(['a', 'd'])).toBe(collisionKey(['d', 'a']))
  })

  it('commonPeople of nothing is nothing', () => {
    expect(commonPeople([])).toEqual([])
  })
})
