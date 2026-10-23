import { describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { checkMapsAgree, judge, murdererIn, sameAssignment, storedSolution } from './literal'

// Every case, judged ONLY by the independent literal interpreter in literal.ts
// (it reads the sentences the player sees; no src/core predicate is consulted).
const puzzles = getAllPuzzles()
const verdicts = new Map(puzzles.map(p => [p.id, judge(p)]))

describe('catalog under the independent literal interpreter', () => {
  it('has the 60 cases', () => {
    expect(puzzles).toHaveLength(60)
  })

  for (const p of puzzles) {
    describe(`${p.id} (${p.difficulty}) ${p.title}`, () => {
      const v = verdicts.get(p.id)!

      it('every clue sentence is a form the interpreter knows (none skipped)', () => {
        expect(v.sentenceErrors).toEqual([])
        expect(v.parsed).toHaveLength(p.clues.length)
      })

      it('room maps agree with the room records', () => {
        expect(checkMapsAgree(p, v.model)).toEqual([])
      })

      it('every clue sentence is literally true of the stored solution', () => {
        expect(v.falseClues).toEqual([])
      })

      it('has exactly one solution and it is the stored one', () => {
        expect(v.capped).toBe(false)
        expect(v.count).toBe(1)
        expect(sameAssignment(storedSolution(p), v.solutions[0])).toBe(true)
      })

      it('the murderer is determined: the one other person in the victim\'s room', () => {
        expect(v.murderers).toEqual([p.murdererId])
        expect(murdererIn(v.model, storedSolution(p))).toBe(p.murdererId)
      })
    })
  }
})
