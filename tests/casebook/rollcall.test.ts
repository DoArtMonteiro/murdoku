import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import type { Puzzle } from '../../src/core/types'
import { cellFloor } from '../../src/core/types'
import { findMurderer, roomIdAt } from '../../src/core/engine'
import { deep, leadCases } from '../../src/casebook/deep'
import { buildRollCall, computedClosing, distanceFrom, roomsShareWall, wrongAccusationLine } from '../../src/casebook/rollcall'

const ALL: Puzzle[] = [hard, easy, ...deep(), ...leadCases()]

/** An independent "shares a wall" from the rooms' own cell lists, not from the grid lookup the code uses. */
function touches(p: Puzzle, a: string, b: string): boolean {
  const ra = p.rooms.find(r => r.id === a), rb = p.rooms.find(r => r.id === b)
  if (!ra || !rb || a === b || (ra.floor ?? 0) !== (rb.floor ?? 0)) return false
  return ra.cells.some(x => rb.cells.some(y => Math.abs(x.row - y.row) + Math.abs(x.col - y.col) === 1))
}
const roomOf = (p: Puzzle, id: string) => roomIdAt(p, p.solution[id])

describe('roll-call order', () => {
  it('clears every suspect but the murderer, once each, and leaves the murderer last, in the victim\'s room', () => {
    for (const p of ALL) {
      const r = buildRollCall(p)
      const suspects = p.people.filter(x => x.id !== p.victimId && x.id !== p.murdererId).map(x => x.id)
      expect(r.cleared.map(c => c.person).sort(), p.id).toEqual(suspects.sort())
      expect(r.last.person).toBe(p.murdererId)
      expect(r.victim.person).toBe(p.victimId)
      expect(findMurderer(p)).toBe(p.murdererId)
      expect(roomOf(p, r.last.person)).toBe(roomOf(p, p.victimId))
      expect(cellFloor(r.last.cell)).toBe(cellFloor(r.victim.cell))
      // nobody cleared shares the victim's room
      for (const c of r.cleared) expect(roomOf(p, c.person), `${p.id} ${c.person}`).not.toBe(roomOf(p, p.victimId))
    }
  })

  it('runs far to near: other floor, then the same floor, then a wall away; ties keep the cast order', () => {
    const rank = { otherFloor: 0, sameFloor: 1, wallAway: 2 } as const
    for (const p of ALL) {
      const r = buildRollCall(p)
      const ranks = r.cleared.map(c => rank[c.distance])
      expect(ranks, p.id).toEqual([...ranks].sort((a, b) => a - b))
      const castIndex = (id: string) => p.people.findIndex(x => x.id === id)
      for (let i = 1; i < r.cleared.length; i++) {
        if (ranks[i] === ranks[i - 1]) expect(castIndex(r.cleared[i].person)).toBeGreaterThan(castIndex(r.cleared[i - 1].person))
      }
    }
  })

  it('is the same every time, and reads only the solution', () => {
    for (const p of ALL) expect(buildRollCall(p)).toEqual(buildRollCall(structuredClone(p)))
  })
})

describe('roll-call wording', () => {
  it('names the room, and says "a wall away" exactly when the rooms share a wall on the same floor', () => {
    for (const p of ALL) {
      const r = buildRollCall(p)
      const vRoom = roomOf(p, p.victimId)
      for (const c of r.cleared) {
        const name = p.people.find(x => x.id === c.person)!.name
        const room = p.rooms.find(x => x.id === roomOf(p, c.person))!
        const sameFloor = cellFloor(c.cell) === cellFloor(p.solution[p.victimId])
        const adjacent = sameFloor && touches(p, roomOf(p, c.person), vRoom)
        expect(c.line.startsWith(`${name}: `), c.line).toBe(true)
        expect(c.line.endsWith('Cleared.'), c.line).toBe(true)
        expect(c.line, c.line).toContain(`in the ${room.name}`)
        expect(c.line.includes('a wall away from the'), `${p.id}: ${c.line}`).toBe(adjacent)
        expect(c.distance).toBe(!sameFloor ? 'otherFloor' : adjacent ? 'wallAway' : 'sameFloor')
        if (adjacent) expect(c.line).toContain(`a wall away from the ${p.rooms.find(x => x.id === vRoom)!.name}`)
        // floor words only on a two-floor case, and only for the other floor
        if (!sameFloor) expect(c.line).toMatch(/: (upstairs|downstairs), in the /)
        else expect(c.line).not.toMatch(/upstairs|downstairs/)
      }
    }
  })

  it('says upstairs or downstairs relative to the victim, never on a one-floor case', () => {
    for (const p of ALL) {
      const lines = buildRollCall(p).cleared.map(c => c.line).join(' ')
      if ((p.floors ?? 1) < 2) expect(lines, p.id).not.toMatch(/upstairs|downstairs/)
    }
    const up = buildRollCall(hard)
    const vFloor = cellFloor(hard.solution[hard.victimId])
    for (const c of up.cleared.filter(x => x.distance === 'otherFloor')) {
      expect(c.line).toContain(cellFloor(c.cell) > vFloor ? 'upstairs' : 'downstairs')
    }
  })

  it('the one left has no alibi, is in the victim\'s room with the victim, and the closing is computed from the facts', () => {
    for (const p of ALL) {
      const r = buildRollCall(p)
      const m = p.people.find(x => x.id === p.murdererId)!.name
      const v = p.people.find(x => x.id === p.victimId)!.name
      expect(r.last.line).toBe(`${m}: in the ${p.rooms.find(x => x.id === roomOf(p, p.victimId))!.name}, with ${v} and no one else. No alibi.`)
      expect(r.victim.line.startsWith(`${v} was found in the `)).toBe(true)
      expect(computedClosing(p)).toBe(`Everyone told the truth. Only ${m}'s account leaves them alone with ${v}.`)
    }
  })
})

describe('"a wall away"', () => {
  // floor 0: A A B B / A A B B / C C D D / C C D D     floor 1: one room, U
  const grid = [['A', 'A', 'B', 'B'], ['A', 'A', 'B', 'B'], ['C', 'C', 'D', 'D'], ['C', 'C', 'D', 'D']]
  const up = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 'U'))
  const cellsOf = (id: string, floor: number) => grid.flatMap((row, r) => row.flatMap((v, c) => (v === id ? [{ row: r, col: c, floor }] : [])))
  const p = {
    id: 'synthetic', size: 4, floors: 2, roomOf: grid, roomOfByFloor: [grid, up],
    rooms: [
      ...['A', 'B', 'C', 'D'].map(id => ({ id, name: `Room ${id}`, hue: 0, cells: cellsOf(id, 0), floor: 0 })),
      { id: 'U', name: 'Attic', hue: 0, cells: up.flatMap((row, r) => row.map((_, c) => ({ row: r, col: c, floor: 1 }))), floor: 1 },
    ],
    people: [], clues: [], furniture: [], solution: {},
  } as unknown as Puzzle

  it('needs an orthogonally adjacent pair of cells in the two rooms', () => {
    expect(roomsShareWall(p, 'A', 'B', 0)).toBe(true)
    expect(roomsShareWall(p, 'A', 'C', 0)).toBe(true)
    expect(roomsShareWall(p, 'B', 'D', 0)).toBe(true)
  })

  it('a diagonal-only touch is not a shared wall', () => {
    expect(roomsShareWall(p, 'A', 'D', 0)).toBe(false)
    expect(roomsShareWall(p, 'B', 'C', 0)).toBe(false)
  })

  it('a room is not a wall away from itself, nor from an unknown room', () => {
    expect(roomsShareWall(p, 'A', 'A', 0)).toBe(false)
    expect(roomsShareWall(p, 'A', 'nope', 0)).toBe(false)
  })

  it('the other floor is never "a wall away", even on the same row and column', () => {
    const victim = { row: 0, col: 0, floor: 0 }
    expect(distanceFrom(p, victim, { row: 0, col: 0, floor: 1 })).toBe('otherFloor')
    expect(distanceFrom(p, victim, { row: 1, col: 3, floor: 1 })).toBe('otherFloor')
    expect(distanceFrom(p, victim, { row: 0, col: 2, floor: 0 })).toBe('wallAway')
    expect(distanceFrom(p, victim, { row: 3, col: 3, floor: 0 })).toBe('sameFloor')
  })
})

describe('a wrong accusation', () => {
  it('says only that they have an alibi', () => {
    expect(wrongAccusationLine('Yuki')).toBe('Yuki has an alibi.')
  })

  it('leaks no room, floor, furniture or number for any suspect of any case', () => {
    for (const p of ALL) {
      for (const x of p.people.filter(y => y.id !== p.victimId)) {
        const line = wrongAccusationLine(x.name)
        expect(line).toBe(`${x.name} has an alibi.`)
        expect(line).not.toMatch(/\d/)
        expect(line).not.toMatch(/upstairs|downstairs|floor|row|column|wall/i)
        for (const room of p.rooms) expect(line.toLowerCase()).not.toContain(room.name.toLowerCase())
      }
    }
  })
})
