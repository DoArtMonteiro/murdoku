import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { clueHolds, roomIdAt } from '../../src/core/engine'
import { buildModel, holdsIn, judge, parseSentence, solveAll, parseAll, storedSolution } from './literal'
import type { SentenceClue } from './literal'

// ----------------------------------------------------------------------------
// D1 regression: "Directly below the <ground-floor room>." printed on the card of
// someone standing UPSTAIRS. The engine asked for the room one storey above the
// top storey, and a lookup that fell back to the ground-floor map answered with
// whatever ground-floor room sat at the same row and column. The generator, the
// solver and the validator all shared that answer, so 557 green tests agreed with
// a sentence no player could satisfy.
//
// One test block per formerly broken case. `old` is the exact card the shipped
// catalog (v25) printed.
// ----------------------------------------------------------------------------

const puzzles = getAllPuzzles()

const FORMERLY_BROKEN: { id: string; old: SentenceClue }[] = [
  { id: 'hard-9', old: { person: 'p1', text: 'Directly below the Dining Room.' } },
  { id: 'hard-10', old: { person: 'p1', text: 'Directly below the Porch.' } },
  { id: 'hard-12', old: { person: 'p4', text: 'Directly below the Front Yard.' } },
  { id: 'expert-5', old: { person: 'p4', text: 'Directly below the Office.' } },
  { id: 'master-1', old: { person: 'p3', text: 'Directly below the Living Room.' } },
  { id: 'master-2', old: { person: 'p3', text: 'Directly below the Kitchen.' } },
  { id: 'master-4', old: { person: 'p5', text: 'Directly below the Garden.' } },
]

describe('formerly broken cases (D1: "Directly below" for an upstairs suspect)', () => {
  for (const { id, old } of FORMERLY_BROKEN) {
    describe(id, () => {
      const p = puzzles.find(x => x.id === id)!
      const m = buildModel(p)
      const sol = storedSolution(p)

      it('the suspect who used to carry the false card really stands upstairs', () => {
        expect(sol[old.person].f).toBe(1)
      })

      it('the old sentence is literally false of the stored solution, and unsatisfiable with the case', () => {
        const pc = parseSentence(m, old.person, old.text)
        expect(pc.rule.t).toBe('belowRoom')
        expect(holdsIn(m, pc, sol)).toBe(false)
        const withOld = parseAll(m, [...p.clues.map(c => ({ person: c.clue.person, text: c.text })), old])
        expect(solveAll(m, withOld).count).toBe(0)
      })

      it('the engine no longer accepts it either', () => {
        const room = p.rooms.find(r => r.name === old.text.replace('Directly below the ', '').replace('.', ''))!
        const clue = { kind: 'below' as const, person: old.person, target: room.id, targetKind: 'room' as const }
        expect(clueHolds(p, clue, p.solution)).toBe(false)
      })

      it('what the card means now is literally true: every above/below sentence holds, and none puts "below" on the top storey', () => {
        const stairs = p.clues.filter(c => c.clue.kind === 'above' || c.clue.kind === 'below')
        for (const ct of stairs) {
          const pc = parseSentence(m, ct.clue.person, ct.text)
          expect(holdsIn(m, pc, sol), `${id}: ${ct.text}`).toBe(true)
          const at = sol[ct.clue.person]
          if (pc.rule.t === 'belowRoom') expect(at.f + 1, `${id}: "${ct.text}" on the top storey`).toBeLessThan(m.F)
          if (pc.rule.t === 'aboveRoom') expect(at.f, `${id}: "${ct.text}" on the ground floor`).toBeGreaterThanOrEqual(1)
        }
      })

      it('the corrected case has one solution and a determined murderer', () => {
        const v = judge(p)
        expect(v.sentenceErrors).toEqual([])
        expect(v.count).toBe(1)
        expect(v.falseClues).toEqual([])
        expect(v.murderers).toEqual([p.murdererId])
      })
    })
  }

  it('the intended truth behind each old card was "above": the same room, read from upstairs', () => {
    for (const { id, old } of FORMERLY_BROKEN) {
      const p = puzzles.find(x => x.id === id)!
      const m = buildModel(p)
      const above = { person: old.person, text: old.text.replace('below', 'above') }
      expect(holdsIn(m, parseSentence(m, above.person, above.text), storedSolution(p)), `${id}: ${above.text}`).toBe(true)
    }
  })
})

describe('engine: a storey that does not exist has no rooms', () => {
  const twoStorey = puzzles.filter(p => (p.floors ?? 1) === 2)

  it('roomIdAt is empty past the top storey and below the ground', () => {
    for (const p of twoStorey) {
      expect(roomIdAt(p, { row: 0, col: 0, floor: 2 }), p.id).toBe('')
      expect(roomIdAt(p, { row: 0, col: 0, floor: -1 }), p.id).toBe('')
      expect(roomIdAt(p, { row: 0, col: 0, floor: 1 }), p.id).not.toBe('')
    }
  })

  it('nobody on the top storey is ever "below" a room, for every cell of every two-storey case', () => {
    for (const p of twoStorey) {
      for (const room of p.rooms) {
        const clue = { kind: 'below' as const, person: p.people[0].id, target: room.id, targetKind: 'room' as const }
        for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) {
          const place = { ...p.solution, [p.people[0].id]: { row: r, col: c, floor: 1 } }
          expect(clueHolds(p, clue, place), `${p.id} ${room.name} (${r},${c})`).toBe(false)
        }
      }
    }
  })
})
