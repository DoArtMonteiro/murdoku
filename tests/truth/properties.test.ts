import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import type { Puzzle } from '../../src/core/types'
import {
  buildModel, checkMapsAgree, holdsIn, judge, parseAll, parseSentence, sameAssignment,
  solveAll, storedSolution,
} from './literal'
import type { Assignment, SentenceClue } from './literal'
import { permutePeople, transposePuzzle } from './helpers'

// Metamorphic and property tests, all decided by the independent interpreter.

const puzzles = getAllPuzzles()
const sentencesOf = (p: Puzzle): SentenceClue[] => p.clues.map(c => ({ person: c.clue.person, text: c.text }))

/** The stored solution, re-keyed/re-shaped by `fn`, for comparing against a transformed puzzle's solutions. */
function mapAssignment(a: Assignment, fn: (id: string, pos: Assignment[string]) => [string, Assignment[string]]): Assignment {
  return Object.fromEntries(Object.entries(a).map(([id, pos]) => fn(id, pos)))
}

describe('every clue is true of the solution', () => {
  for (const p of puzzles) {
    it(`${p.id}: each sentence, taken alone, holds at the stored solution`, () => {
      const m = buildModel(p)
      const solution = storedSolution(p)
      for (const c of sentencesOf(p)) {
        const pc = parseSentence(m, c.person, c.text)
        expect(holdsIn(m, pc, solution), `${p.id} ${c.person}: ${c.text}`).toBe(true)
      }
    })
  }
})

describe('metamorphic: relabelling people leaves the solution set unchanged', () => {
  for (const p of puzzles) {
    it(`${p.id}: new ids, new names, reversed order`, () => {
      const q = permutePeople(p, 1 + (p.id.length % 3))
      const before = judge(p)
      const after = judge(q)
      expect(after.sentenceErrors).toEqual([])
      expect(after.count).toBe(before.count)
      expect(after.count).toBe(1)
      // the unique solution is the old one under the id renaming
      const idMap = new Map(p.people.map((x, i) => [x.id, q.people.find(y => y.id === `q${(i + (1 + (p.id.length % 3))) % p.people.length}`)!.id]))
      const expected = mapAssignment(before.solutions[0], (id, pos) => [idMap.get(id)!, pos])
      expect(sameAssignment(after.solutions[0], expected)).toBe(true)
      expect(after.murderers).toEqual([idMap.get(p.murdererId)])
    })
  }
})

describe('metamorphic: transposing the board (rows <-> columns) preserves uniqueness', () => {
  for (const p of puzzles) {
    it(`${p.id}: sentences rewritten, same single solution transposed`, () => {
      const q = transposePuzzle(p)
      expect(checkMapsAgree(q, buildModel(q))).toEqual([])
      const after = judge(q)
      expect(after.sentenceErrors).toEqual([])
      expect(after.count).toBe(1)
      const expected = mapAssignment(judge(p).solutions[0], (id, pos) => [id, { f: pos.f, r: pos.c, c: pos.r }])
      expect(sameAssignment(after.solutions[0], expected)).toBe(true)
    })
  }
})

describe('metamorphic: clues already implied by the solution never add solutions', () => {
  for (const p of puzzles) {
    it(`${p.id}: adding true facts keeps exactly one solution`, () => {
      const m = buildModel(p)
      const sol = storedSolution(p)
      const base = sentencesOf(p)
      const implied: SentenceClue[] = []
      for (const person of p.people) {
        const pos = sol[person.id]
        const roomName = p.rooms.find(r => r.id === m.roomAt[pos.f][pos.r][pos.c])!.name
        implied.push(
          { person: person.id, text: `In row ${pos.r + 1}.` },
          { person: person.id, text: `In column ${pos.c + 1}.` },
          { person: person.id, text: `In the ${roomName}.` },
        )
        const other = p.rooms.find(r => r.id !== m.roomAt[pos.f][pos.r][pos.c])
        if (other) implied.push({ person: person.id, text: `Never set foot in the ${other.name}.` })
        if (m.F > 1) implied.push({ person: person.id, text: pos.f === 0 ? 'On the ground floor.' : 'Upstairs.' })
      }
      const baseCount = solveAll(m, parseAll(m, base)).count
      expect(baseCount).toBe(1)
      for (const extra of implied) {
        const n = solveAll(m, parseAll(m, [...base, extra])).count
        expect(n, `adding "${extra.text}" for ${extra.person}`).toBeLessThanOrEqual(baseCount)
        expect(n).toBe(1)
      }
      expect(solveAll(m, parseAll(m, [...base, ...implied])).count).toBe(1)
    })
  }
})

describe('metamorphic: removing a clue never removes solutions, and a needed clue is really needed', () => {
  // A clue may be redundant only when it was added on purpose AFTER pruning:
  //  - the one negation clue Expert/Master append so the kind is exercised, or
  //  - very-easy-1's kept-on-purpose "In the Living Room." card.
  // Everything else was kept by the pruner because dropping it broke uniqueness.
  const allowedRedundant = (p: Puzzle, text: string) =>
    ((p.difficulty === 'Expert' || p.difficulty === 'Master') && /^(Never set foot in|Was not in the same room as)/.test(text))
    || (p.id === 'very-easy-1' && text === 'In the Living Room.')

  for (const p of puzzles) {
    it(`${p.id}: every clue is needed unless it is a documented extra`, () => {
      const m = buildModel(p)
      const all = parseAll(m, sentencesOf(p))
      const perPerson = new Map<string, number>()
      for (const pc of all) if (pc.rule.t !== 'victimMark') perPerson.set(pc.person, (perPerson.get(pc.person) ?? 0) + 1)
      all.forEach((pc, i) => {
        if (pc.rule.t === 'victimMark') return
        const without = solveAll(m, all.filter((_, j) => j !== i), 200).count
        expect(without, `dropping "${pc.sentence}" must not lose the real solution`).toBeGreaterThanOrEqual(1)
        if (without === 1) {
          expect(allowedRedundant(p, pc.sentence), `${p.id}: "${pc.sentence}" (${pc.person}) is redundant but not a documented extra`).toBe(true)
        } else {
          expect(without).toBeGreaterThan(1)
        }
      })
    })
  }

  it('dropping every clue of one suspect leaves more than one solution (clues are not decorative)', () => {
    for (const p of puzzles.filter((_, i) => i % 4 === 0)) {
      const m = buildModel(p)
      const all = parseAll(m, sentencesOf(p))
      const person = p.people.find(x => x.id !== p.victimId)!.id
      const rest = all.filter(pc => pc.person !== person)
      expect(solveAll(m, rest, 200).count, p.id).toBeGreaterThan(1)
    }
  })
})
