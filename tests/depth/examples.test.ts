import { describe, expect, it } from 'vitest'
import { clueToText } from '../../src/core/generate'
import { countSolutions, findMurderer, isSolution, roomIdAt } from '../../src/core/engine'
import { validatePuzzle } from '../../src/core/puzzleValidate'
import { deduceChain } from '../../src/reference/story/deduce'
import { DEPTH_KINDS, analyzePuzzle } from '../../src/core/depth'
import { countSolutionsFast } from '../../src/core/depth/fastCount'
import { judge, murdererIn, sameAssignment, storedSolution } from '../truth/literal'
import { permutePeople, transposePuzzle } from '../truth/helpers'
import { loadFixtures } from './fixtures'

describe.each(loadFixtures())('accepted depth case $name (config $config, seed $seed)', ({ puzzle: p }) => {
  it('is solver-unique under the engine, and the fast solver agrees', () => {
    expect(countSolutions(p, 2)).toBe(1)
    expect(countSolutionsFast(p, 2)).toBe(1)
  }, 180_000)

  it('has no structural errors (validatePuzzle) and its stored solution satisfies every clue', () => {
    expect(validatePuzzle(p).filter(i => i.severity === 'error')).toEqual([])
    expect(isSolution(p, p.solution)).toBe(true)
  }, 180_000)

  it('names the murderer the engine finds: the one suspect alone with the victim', () => {
    expect(findMurderer(p, p.solution)).toBe(p.murdererId)
    expect(p.murdererId).not.toBe(p.victimId)
  })

  it('is decided the same way by the independent literal interpreter, reading only the sentences', () => {
    const v = judge(p)
    expect(v.sentenceErrors).toEqual([])
    expect(v.parsed).toHaveLength(p.clues.length)
    expect(v.falseClues).toEqual([])
    expect(v.count).toBe(1)
    expect(v.capped).toBe(false)
    expect(sameAssignment(storedSolution(p), v.solutions[0])).toBe(true)
    expect(v.murderers).toEqual([p.murdererId])
    expect(murdererIn(v.model, storedSolution(p))).toBe(p.murdererId)
  })

  it('keeps its meaning when the board is transposed or the cast renamed (direction sentences flip north/south with west/east)', () => {
    for (const variant of [transposePuzzle(p), permutePeople(p, 2)]) {
      const v = judge(variant)
      expect(v.sentenceErrors).toEqual([])
      expect(v.falseClues).toEqual([])
      expect(v.count).toBe(1)
      expect(v.murderers).toEqual([variant.murdererId])
    }
  })

  it('words every clue exactly as generate.ts does', () => {
    for (const ct of p.clues) expect(ct.text).toBe(clueToText(p, ct.clue))
  })

  it('uses only the allowed clue kinds, and no besidePerson', () => {
    for (const ct of p.clues) {
      expect(DEPTH_KINDS.has(ct.clue.kind)).toBe(true)
      expect(ct.clue.kind).not.toBe('besidePerson')
    }
  })

  it('does not leak the murderer through the victim or the victim room', () => {
    const victimRoom = roomIdAt(p, p.solution[p.victimId])
    for (const { clue } of p.clues) {
      if (clue.kind === 'sameRoomAs' || clue.kind === 'notSameRoomAs') {
        expect(clue.other).not.toBe(p.victimId)
        expect(clue.person).not.toBe(p.victimId)
      }
      if (clue.person === p.victimId) continue
      if (clue.kind === 'room' || clue.kind === 'notRoom') expect(clue.roomId).not.toBe(victimRoom)
    }
    expect(analyzePuzzle(p).confinedSuspects).toBe(0)
  })

  it('is solved by forward chaining from one entry pin: every other suspect is placed relative to someone already placed', () => {
    const a = analyzePuzzle(p)
    expect(a.anchored).toBe(true)
    expect(a.forcedAtStart).toBe(1)
    expect(a.anchoredSteps).toHaveLength(p.people.length)
    expect(a.anchoredSteps[0].via).toBe('own')
    expect(new Set(a.anchoredSteps.map(s => s.person)).size).toBe(p.people.length)
    expect(a.anchoredCross).toBeGreaterThanOrEqual(p.people.length - 2)
  })

  it('is solved by deduceChain with no trial step and ends on the stored solution', () => {
    const chain = deduceChain(p)
    expect(chain.pure).toBe(true)
    for (const person of p.people) {
      expect(chain.placement[person.id]).toMatchObject({ row: p.solution[person.id].row, col: p.solution[person.id].col })
    }
  })
})
