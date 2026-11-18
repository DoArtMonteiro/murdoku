import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { clueHolds, isSolution } from '../../src/core/engine'
import type { Placement } from '../../src/core/engine'
import { buildModel, holdsIn, parseSentence, storedSolution } from './literal'
import type { Assignment } from './literal'
import { prng } from './helpers'

// The game's engine (which the generator, solver and validator all share) and the
// independent interpreter must agree, clue by clue, on MANY arrangements: random
// ones, and one-person / two-person perturbations of the real solution (which
// are the arrangements where near-miss semantics differences show up).

const puzzles = getAllPuzzles()

const toPlacement = (a: Assignment): Placement =>
  Object.fromEntries(Object.entries(a).map(([id, pos]) => [id, { row: pos.r, col: pos.c, floor: pos.f }]))

describe('engine and independent interpreter agree on every clue sentence', () => {
  for (const p of puzzles) {
    it(`${p.id}: identical verdicts on solution, mutants and random placements`, () => {
      const m = buildModel(p)
      const rand = prng(p.id.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7))
      const int = (n: number) => Math.floor(rand() * n)
      const clues = p.clues.map(ct => ({ ct, parsed: parseSentence(m, ct.clue.person, ct.text) }))
      const sol = storedSolution(p)
      const samples: Assignment[] = [sol]
      for (let k = 0; k < 140; k++) {
        const a: Assignment = { ...sol }
        const who = p.people[int(p.people.length)].id
        a[who] = { f: int(m.F), r: int(m.N), c: int(m.N) }
        if (k % 3 === 0) { // swap two people
          const other = p.people[int(p.people.length)].id
          const tmp = a[who]; a[who] = a[other]; a[other] = tmp
        }
        samples.push(a)
      }
      for (let k = 0; k < 160; k++) {
        const rows = [...Array(m.N).keys()].sort(() => rand() - 0.5)
        const cols = [...Array(m.N).keys()].sort(() => rand() - 0.5)
        const a: Assignment = {}
        p.people.forEach((x, i) => { a[x.id] = { f: int(m.F), r: rows[i], c: cols[i] } })
        samples.push(a)
      }
      let agreeTrue = 0, agreeFalse = 0
      for (const a of samples) {
        const place = toPlacement(a)
        for (const { ct, parsed } of clues) {
          const mine = holdsIn(m, parsed, a)
          const theirs = clueHolds(p, ct.clue, place)
          expect(theirs, `${p.id} "${ct.text}" (${ct.clue.person}) at ${JSON.stringify(a[ct.clue.person])}: engine ${theirs}, interpreter ${mine}`).toBe(mine)
          if (mine) agreeTrue++; else agreeFalse++
        }
        // whole-puzzle verdict too
        const interpreterAll = clues.every(({ parsed }) => holdsIn(m, parsed, a))
        expect(isSolution(p, place)).toBe(interpreterAll)
      }
      // the comparison must have exercised both outcomes, or it proves nothing
      expect(agreeTrue).toBeGreaterThan(10)
      expect(agreeFalse).toBeGreaterThan(10)
    })
  }
})
