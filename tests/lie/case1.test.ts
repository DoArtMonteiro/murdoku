import { describe, expect, it } from 'vitest'
import { clueHolds, countSolutions, findMurderer, unaryClueHolds } from '../../src/core/engine'
import { validatePuzzle, validatePuzzleSceneCompatibility } from '../../src/core/puzzleValidate'
import type { Cell } from '../../src/core/types'
import { FURNITURE_WORDS } from '../../src/reference/story/schema'
import { LIE_CASE_1 } from '../../src/lie/case1'
import { otherOf, verifyLieCase } from '../../src/lie/verify'
import { buildModel, checkMapsAgree, judge, otherOf as litOther, ownCellOk, parseSentence, relationOk } from '../truth/literal'

const c = LIE_CASE_1
const p = c.puzzle
const lie = c.statements.find(s => s.id === c.lieId)!

/** FNV-1a over the JSON of the case's data. Pinned below: a silent edit to the puzzle or any statement fails. */
function fingerprint(x: unknown): string {
  const s = JSON.stringify(x)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}
const PINNED_FINGERPRINT = '97db910f'

describe('ofa-01: the verifier', () => {
  const result = verifyLieCase(c)

  it('passes every check', () => {
    expect(result.failures).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('is legible by hand: a collision by singles, the true plan with no supposing', () => {
    expect(result.report.legibilityLevel).toBe(0)
    expect(result.report.reconstructionSupposes).toBe(0)
  })

  it('has the stored collisions the player is meant to find', () => {
    expect(c.collisions).toEqual([['s3', 's9'], ['s3', 's1', 's7']])
  })
})

describe('ofa-01: the puzzle is a valid Murdoku case without the lie', () => {
  it('is 6x6, one floor, 4 rooms, 5 suspects and the victim', () => {
    expect(p.size).toBe(6)
    expect(p.floors ?? 1).toBe(1)
    expect(p.rooms).toHaveLength(4)
    expect(p.people).toHaveLength(6)
    expect(p.people.filter(x => x.isVictim).map(x => x.id)).toEqual([p.victimId])
  })

  it('passes validatePuzzle with zero errors and the scene recipe knows every room and piece', () => {
    expect(validatePuzzle(p)).toEqual([])
    expect(validatePuzzleSceneCompatibility(p).filter(i => i.severity === 'error')).toEqual([])
  })

  it('has exactly one solution and the engine names the liar as the murderer', () => {
    expect(countSolutions(p, 2)).toBe(1)
    expect(findMurderer(p)).toBe(p.murdererId)
    expect(p.murdererId).toBe(lie.author)
  })

  it('keeps ids stable: s1..sN in reading order, grouped by author', () => {
    expect(c.statements.map(s => s.id)).toEqual(c.statements.map((_, i) => `s${i + 1}`))
    const authors = c.statements.map(s => s.author)
    expect(authors).toEqual([...authors].sort())
    expect(c.lieId).toBe('s3')
    expect(c.statements.filter(s => s.scene).map(s => s.author)).toEqual([p.victimId])
  })

  it('pins the case data', () => {
    expect(fingerprint({ puzzle: p, statements: c.statements })).toBe(PINNED_FINGERPRINT)
  })
})

describe('ofa-01: every statement text means the same to the independent literal interpreter', () => {
  const m = buildModel(p)

  it('agrees with the room maps', () => {
    expect(checkMapsAgree(p, m)).toEqual([])
  })

  const cells: Cell[] = []
  for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) cells.push({ row, col })
  const pos = (x: Cell) => ({ f: 0, r: x.row, c: x.col })

  for (const s of c.statements) {
    it(`${s.id} "${s.text}" parses to the clue's own rule, on every square (and pair of squares)`, () => {
      const parsed = parseSentence(m, s.author, s.text)
      expect(parsed.person).toBe(s.clue.person)
      expect(litOther(parsed.rule) ?? undefined).toBe(otherOf(s.clue))
      const other = otherOf(s.clue)
      for (const a of cells) {
        if (!other) expect(ownCellOk(m, parsed.rule, pos(a))).toBe(unaryClueHolds(p, s.clue, a))
        else {
          for (const b of cells) {
            const literal = ownCellOk(m, parsed.rule, pos(a)) && relationOk(m, parsed.rule, pos(a), pos(b))
            expect(literal).toBe(clueHolds(p, s.clue, { [s.author]: a, [other]: b }))
          }
        }
      }
    })
  }

  it('reads the puzzle (lie removed) as one solution, no false clue, the liar the murderer', () => {
    const v = judge(p)
    expect(v.sentenceErrors).toEqual([])
    expect(v.falseClues).toEqual([])
    expect(v.count).toBe(1)
    expect(v.storedIsSolution).toBe(true)
    expect(v.murderers).toEqual([p.murdererId])
  })

  it('reads all statements together, the lie included, as having no solution', () => {
    const v = judge(p, c.statements.map(s => ({ person: s.author, text: s.text })))
    expect(v.sentenceErrors).toEqual([])
    expect(v.count).toBe(0)
  })

  it('reads the lie as false in the true plan and every other statement as true', () => {
    const v = judge(p, c.statements.map(s => ({ person: s.author, text: s.text })))
    expect(v.falseClues).toEqual([`${lie.author}: ${lie.text}`])
  })
})

// The hard rules of tests/tutorial/case0.test.ts, restated for the words that are not a statement.
const POSITIONAL = ['north', 'south', 'east', 'west', 'left', 'right', 'above', 'below', 'beside', 'behind', 'front', 'back', 'top', 'bottom', 'upstairs', 'downstairs', 'ground', 'floor', 'floors', 'storey', 'row', 'rows', 'column', 'columns', 'corner', 'wall', 'walls', 'side', 'near', 'next', 'across', 'between', 'inside', 'outside', 'up', 'down', 'room', 'rooms', 'house']
const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'hallway', 'hall', 'porch', 'garden', 'pantry', 'study', 'dining', 'living', 'yard', 'courtyard', 'workshop', 'attic', 'cellar', 'garage', 'office', 'library', 'lounge', 'balcony', 'landing', 'terrace']
const TELLS = ['kill', 'killer', 'murder', 'dead', 'death', 'dies', 'died', 'body', 'corpse', 'victim', 'guilty', 'knife', 'poison', 'blood', 'lie', 'lies', 'lied', 'false', 'liar']
const words = (s: string) => s.toLowerCase().match(/[a-zà-ÿ]+(?:'[a-z]+)?/g) ?? []

function leaks(text: string): string[] {
  const ws = words(text)
  const has = (w: string) => ws.some(x => x === w || x === `${w}s` || x.replace(/'s$/, '') === w)
  const bad = [...POSITIONAL, ...ROOMS, ...TELLS].filter(has)
  for (const r of p.rooms) for (const w of words(r.name)) if (has(w)) bad.push(w)
  for (const list of Object.values(FURNITURE_WORDS)) for (const w of list) if (has(w)) bad.push(w)
  for (const x of p.people) if (has(x.name.toLowerCase())) bad.push(x.name)
  return [...new Set(bad)]
}

describe('ofa-01: voices and story carry no positional information and no tell', () => {
  for (const s of c.statements) {
    it(`${s.id} voice is present and clean`, () => {
      expect(s.voice && s.voice.length > 0).toBe(true)
      expect(leaks(s.voice!)).toEqual([])
    })
  }

  it('gives every voice a different line', () => {
    const lines = c.statements.map(s => s.voice)
    expect(new Set(lines).size).toBe(lines.length)
  })

  const story = c.story
  const slots: Array<[string, string]> = [
    ['title', story.title], ['premise', story.premise],
    ...Object.entries(story.cast).flatMap(([id, x]): Array<[string, string]> => [[`${id}.role`, x.role], [`${id}.motive`, x.motive]]),
  ]
  for (const [name, text] of slots) {
    it(`${name} names no room, furniture, direction, cast member or tell`, () => {
      expect(text.length).toBeGreaterThan(0)
      expect(leaks(text)).toEqual([])
    })
  }

  it('the closing uses {M} and {V} and adds no position', () => {
    expect(story.closing).toContain('{M}')
    expect(story.closing).toContain('{V}')
    expect(leaks(story.closing.replace(/\{[MV]\}/g, ''))).toEqual([])
  })

  it('the premise is two or three sentences', () => {
    const n = story.premise.split(/(?<=[.!?])\s+/).length
    expect(n).toBeGreaterThanOrEqual(2)
    expect(n).toBeLessThanOrEqual(3)
  })

  it('the cast matches the people, with distinct initials and distinct emblems', () => {
    for (const x of p.people) expect(story.cast[x.id].name).toBe(x.name)
    expect(Object.keys(story.cast).sort()).toEqual(p.people.map(x => x.id).sort())
    const initials = p.people.map(x => x.name.normalize('NFD').replace(/[̀-ͯ]/g, '')[0].toUpperCase())
    expect(new Set(initials).size).toBe(initials.length)
    const emblems = Object.values(story.cast).map(x => x.emblem)
    expect(new Set(emblems).size).toBe(emblems.length)
  })
})
