import { describe, expect, it } from 'vitest'
import type { Clue, Puzzle } from '../../src/core/types'
import { analyzePuzzle } from '../../src/core/depth'

// A 4x4 house of one room, four people, hand-built so every step of the solution
// is known in advance and the classifier's labels can be checked exactly.
function tiny(clues: Clue[], solution: Record<string, { row: number; col: number }>): Puzzle {
  const ids = Object.keys(solution)
  const cells = [0, 1, 2, 3].flatMap(row => [0, 1, 2, 3].map(col => ({ row, col })))
  return {
    id: 'tiny', title: 't', caseNumber: 't', difficulty: 'Hard', size: 4,
    rooms: [{ id: 'r0', name: 'Hall', hue: 0, cells }],
    roomOf: [0, 1, 2, 3].map(() => ['r0', 'r0', 'r0', 'r0']),
    furniture: [],
    people: ids.map((id, i) => ({ id, name: `P${i}`, avatarSeed: id, accent: '#000', ...(i === 0 ? { isVictim: true } : {}) })),
    clues: clues.map(clue => ({ clue, text: '' })),
    solution, victimId: ids[0], murdererId: ids[1], flavor: '',
  }
}

describe('step classification', () => {
  const solution = { a: { row: 0, col: 0 }, b: { row: 1, col: 2 }, c: { row: 3, col: 1 } }
  const p = tiny([
    { kind: 'row', person: 'a', row: 0 },
    { kind: 'col', person: 'a', col: 0 },
    { kind: 'direction', person: 'b', other: 'a', dir: 'E', steps: 2 },
    { kind: 'direction', person: 'b', other: 'a', dir: 'S', steps: 1 },
    { kind: 'direction', person: 'c', other: 'b', dir: 'S', steps: 2 },
    { kind: 'direction', person: 'c', other: 'b', dir: 'W' },
  ], solution)

  it('pins the first person by their own clues and the rest through relational clues', () => {
    const a = analyzePuzzle(p)
    expect(a.pure).toBe(true)
    expect(a.matchesSolution).toBe(true)
    expect(a.steps.map(s => `${s.person}:${s.via}`)).toEqual(['a:own', 'b:cross', 'c:cross'])
    expect(a.crossDirect).toBe(2)
    expect(a.forcedAtStart).toBe(1)
    expect(a.anchored).toBe(true)
  })

  it('does not call row/column elimination against a pinned person a cross step', () => {
    // b has row 1 and "edge": cells (1,0) and (1,3). a stands in column 0, so (1,0) is
    // gone by the lane rule alone, and b is pinned to (1,3) without any clue about a.
    const lane = tiny([
      { kind: 'row', person: 'a', row: 0 },
      { kind: 'col', person: 'a', col: 0 },
      { kind: 'row', person: 'b', row: 1 },
      { kind: 'edge', person: 'b' },
    ], { a: { row: 0, col: 0 }, b: { row: 1, col: 3 } })
    const a = analyzePuzzle(lane)
    expect(a.steps.map(s => `${s.person}:${s.via}`)).toEqual(['a:own', 'b:lane'])
    expect(a.crossDirect).toBe(0)
  })

  it('stalls (not pure) when two people are interchangeable', () => {
    const stuck = tiny([
      { kind: 'row', person: 'a', row: 0 },
      { kind: 'col', person: 'a', col: 0 },
      { kind: 'direction', person: 'b', other: 'a', dir: 'S' },
      { kind: 'direction', person: 'c', other: 'a', dir: 'S' },
    ], solution)
    const a = analyzePuzzle(stuck)
    expect(a.pure).toBe(false)
    expect(a.anchored).toBe(false)
  })

  it('a set-based elimination is pure but not anchored', () => {
    // b is one column east of a, c two columns east, and b is exactly two rows north of c.
    // Neither b nor c is pinned by anything alone: b's other squares die only because c has
    // no square two rows south of them. That is reasoning about c's options as a set.
    const sol = { a: { row: 0, col: 0 }, b: { row: 1, col: 1 }, c: { row: 3, col: 2 } }
    const q = tiny([
      { kind: 'row', person: 'a', row: 0 },
      { kind: 'col', person: 'a', col: 0 },
      { kind: 'direction', person: 'b', other: 'a', dir: 'E', steps: 1 },
      { kind: 'direction', person: 'c', other: 'a', dir: 'E', steps: 2 },
      { kind: 'direction', person: 'b', other: 'c', dir: 'N', steps: 2 },
    ], sol)
    const a = analyzePuzzle(q)
    expect(a.pure).toBe(true)
    expect(a.matchesSolution).toBe(true)
    expect(a.anchored).toBe(false)
    expect(a.crossDirect).toBeGreaterThanOrEqual(1)
  })
})
