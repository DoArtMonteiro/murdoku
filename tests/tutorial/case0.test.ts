import { describe, expect, it } from 'vitest'
import { countSolutions, findMurderer, isSolution } from '../../src/core/engine'
import { validatePuzzle } from '../../src/core/puzzleValidate'
import { allCells, cellKey, sameCell } from '../../src/casebook/cells'
import { lensCells, statementsOf } from '../../src/casebook/lens'
import { suppose } from '../../src/casebook/suppose'
import { buildRollCall } from '../../src/casebook/rollcall'
import { FURNITURE_WORDS } from '../../src/reference/story/schema'
import { case0, case0Story, CASE0_ID, INVESTIGATOR_LINE, ROLE, WRONG_SQUARE } from '../../src/tutorial/case0'
import { judge } from '../truth/literal'

const p = case0
const sol = p.solution
const all = (id: string) => statementsOf(p, id).map(s => s.index)

describe('Case 0: the puzzle', () => {
  it('is a 4x4, one-floor house with three suspects and the victim in 2-3 rooms', () => {
    expect(p.size).toBe(4)
    expect(p.floors ?? 1).toBe(1)
    expect(p.people).toHaveLength(4)
    expect(p.people.filter(x => x.isVictim).map(x => x.id)).toEqual([p.victimId])
    expect(p.rooms.length).toBeGreaterThanOrEqual(2)
    expect(p.rooms.length).toBeLessThanOrEqual(3)
    expect(p.id).toBe(CASE0_ID)
  })

  it('has exactly one solution, and every clue is true in it', () => {
    expect(countSolutions(p, 2)).toBe(1)
    expect(isSolution(p, sol)).toBe(true)
  })

  it('has the engine name the stored murderer, and nobody else', () => {
    expect(findMurderer(p)).toBe(p.murdererId)
    expect(p.murdererId).not.toBe(p.victimId)
  })

  it('passes validatePuzzle with zero errors', () => {
    expect(validatePuzzle(p)).toEqual([])
  })

  it('reads the same to the independent literal interpreter: parses, true, unique, same murderer', () => {
    const v = judge(p)
    expect(v.sentenceErrors).toEqual([])
    expect(v.falseClues).toEqual([])
    expect(v.count).toBe(1)
    expect(v.storedIsSolution).toBe(true)
    expect(v.murderers).toEqual([p.murdererId])
  })
})

describe('Case 0: every beat is the real logical path', () => {
  it('pins Lena by her own statement: the lens lights exactly her square', () => {
    const lens = lensCells(p, ROLE.pinned, all(ROLE.pinned), {})!
    expect([...lens]).toEqual([cellKey(sol.p0)])
  })

  it("gives Tomas a relational statement that waits for Lena, and that lights one square with his other statement", () => {
    const sts = statementsOf(p, ROLE.measured)
    const rel = sts.find(s => s.needs)!
    expect(rel.needs).toBe(ROLE.pinned)
    expect(rel.clue.kind).toBe('direction')
    expect(sts.indexOf(rel)).toBe(0)
    // nothing to light until Lena stands somewhere
    expect(lensCells(p, ROLE.measured, [rel.index], {})).toBeNull()
    const withLena = { [ROLE.pinned]: sol.p0 }
    // the relational statement alone lights a whole row; both lit leave one square
    expect(lensCells(p, ROLE.measured, [rel.index], withLena)!.size).toBe(4)
    const both = lensCells(p, ROLE.measured, all(ROLE.measured), withLena)!
    expect([...both]).toEqual([cellKey(sol.p1)])
  })

  it('leaves Greta two squares, one right and one wrong', () => {
    const lens = lensCells(p, ROLE.supposed, all(ROLE.supposed), {})!
    expect(lens.size).toBe(2)
    expect(lens.has(cellKey(sol.p2))).toBe(true)
    expect(lens.has(cellKey(WRONG_SQUARE))).toBe(true)
    expect(sameCell(WRONG_SQUARE, sol.p2)).toBe(false)
  })

  it('Supposing Greta on the wrong square leaves the victim no square; on the right one it leaves nobody stranded', () => {
    const wrong = suppose(p, { person: ROLE.supposed, cell: WRONG_SQUARE })
    expect(wrong.ghostLegal).toBe(true)
    expect(wrong.contradictions).toEqual([ROLE.victim])
    const right = suppose(p, { person: ROLE.supposed, cell: sol.p2 })
    expect(right.contradictions).toEqual([])
  })

  it('the contradiction is a real deduction: with Lena and Tomas placed, the wrong square is NOT already a taken row or column', () => {
    for (const id of [ROLE.pinned, ROLE.measured]) {
      expect(sol[id].row).not.toBe(WRONG_SQUARE.row)
      expect(sol[id].col).not.toBe(WRONG_SQUARE.col)
    }
    // ...and it only fails because of the victim, who is still unplaced at that point
    expect(sol[ROLE.victim].col).toBe(WRONG_SQUARE.col)
  })

  it('Greta has exactly one solution square once the contradiction is known', () => {
    const lens = [...lensCells(p, ROLE.supposed, all(ROLE.supposed), {})!]
    const survivors = lens.filter(k => !suppose(p, { person: ROLE.supposed, cell: { row: Number(k.split(':')[1]), col: Number(k.split(':')[2]), floor: 0 } }).contradictions.length)
    expect(survivors).toEqual([cellKey(sol.p2)])
  })

  it('pins the victim to the one square left', () => {
    const lens = lensCells(p, ROLE.victim, all(ROLE.victim), {})!
    expect([...lens]).toEqual([cellKey(sol.p3)])
    const free = allCells(p).filter(c => ![ROLE.pinned, ROLE.measured, ROLE.supposed].some(id => sol[id].row === c.row || sol[id].col === c.col))
    expect(free.map(cellKey)).toEqual([cellKey(sol.p3)])
  })

  it('leaves the murderer alone with the victim: the other two are cleared by their alibis', () => {
    const roll = buildRollCall(p)
    expect(roll.last.person).toBe(p.murdererId)
    expect(roll.cleared.map(c => c.person).sort()).toEqual(['p1', 'p2'])
  })
})

// The hard rules of tests/casebook/stories.test.ts, restated for a case that is not in STORIES.
const POSITIONAL = ['north', 'south', 'east', 'west', 'left', 'right', 'above', 'below', 'beside', 'behind', 'front', 'back', 'top', 'bottom', 'upstairs', 'downstairs', 'ground', 'floor', 'floors', 'storey', 'row', 'rows', 'column', 'columns', 'corner', 'wall', 'walls', 'side', 'near', 'next', 'across', 'between', 'inside', 'outside', 'up', 'down', 'room', 'rooms', 'house']
const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'hallway', 'hall', 'porch', 'garden', 'pantry', 'study', 'dining', 'living', 'yard', 'attic', 'cellar', 'garage', 'office', 'library', 'lounge', 'balcony', 'landing', 'terrace']
const TELLS = ['kill', 'killer', 'murder', 'dead', 'death', 'dies', 'died', 'body', 'corpse', 'victim', 'guilty', 'knife', 'poison', 'blood']
const words = (s: string) => s.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []

function leaks(text: string): string[] {
  const ws = words(text)
  const has = (w: string) => ws.some(x => x === w || x === `${w}s` || x.replace(/'s$/, '') === w)
  const bad = [...POSITIONAL, ...ROOMS, ...TELLS].filter(has)
  for (const r of p.rooms) for (const w of words(r.name)) if (has(w)) bad.push(w)
  for (const list of Object.values(FURNITURE_WORDS)) for (const w of list) if (has(w)) bad.push(w)
  for (const x of p.people) if (has(x.name.toLowerCase())) bad.push(x.name)
  return [...new Set(bad)]
}

describe('Case 0: story text is non-positional', () => {
  const slots: Array<[string, string]> = [
    ['premise', case0Story.premise], ['closing', case0Story.closing ?? ''], ['investigator', INVESTIGATOR_LINE], ['title', case0Story.title ?? ''],
    ...Object.entries(case0Story.cast).flatMap(([id, c]): Array<[string, string]> => [[`${id}.role`, c.role], [`${id}.oneLiner`, c.oneLiner], [`${id}.motive`, c.motive]]),
  ]
  for (const [name, text] of slots) {
    it(`${name} names no room, furniture, direction, cast member or tell`, () => {
      expect(text.length).toBeGreaterThan(0)
      expect(leaks(text)).toEqual([])
    })
  }

  it('the premise is two sentences and matches the live cast', () => {
    expect(case0Story.premise.split(/(?<=[.!?])\s+/)).toHaveLength(2)
    expect(case0Story.murderer).toBe(p.murdererId)
    for (const x of p.people) expect(case0Story.cast[x.id].name).toBe(x.name)
  })
})
