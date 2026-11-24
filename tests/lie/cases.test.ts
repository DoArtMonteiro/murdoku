import { describe, expect, it } from 'vitest'
import { clueHolds, countSolutions, findMurderer, unaryClueHolds } from '../../src/core/engine'
import { validatePuzzle, validatePuzzleSceneCompatibility } from '../../src/core/puzzleValidate'
import type { Cell } from '../../src/core/types'
import { FURNITURE_WORDS } from '../../src/reference/story/schema'
import { CASES_IN_ORDER } from '../../src/lie/cases'
import type { LieCase, Statement } from '../../src/lie/model'
import { otherOf, verifyLieCase } from '../../src/lie/verify'
import type { CaseExpectations } from '../../src/lie/verify'
import { buildModel, checkMapsAgree, judge, otherOf as litOther, ownCellOk, parseSentence, relationOk } from '../truth/literal'

/** FNV-1a over the JSON of the case's data. A silent edit to the puzzle or any statement fails the pin. */
function fingerprint(x: unknown): string {
  const s = JSON.stringify(x)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

const PINS: Record<string, string> = {
  'ofa-01': 'e9e2d8d5',
  'ofa-02': '7ac74f73',
  'ofa-03': 'dbfff2e6',
}

/** What each case promises beyond the shared checks (see the case files). */
const EXPECT: Record<string, CaseExpectations> = {
  'ofa-01': { laneFreeAtLeast: 1, proofCoresAtMost: 2, cheapestLegibleAtLeast: 2, allCoresLegible: true },
  'ofa-02': { laneFreeAtLeast: 1, liarBeyondSingles: true, noPairPairProof: true, cheapestLegibleAtLeast: 1 },
  'ofa-03': { laneFreeAtLeast: 1, supposesAtLeast: 1, firstTwoShare: 2, cheapestLegibleAtLeast: 2 },
}

const LOADED: LieCase[] = await Promise.all(CASES_IN_ORDER.map(e => e.load()))

describe('the case index', () => {
  it('lists the three cases in play order, ids matching the cases', () => {
    expect(CASES_IN_ORDER.map(e => e.id)).toEqual(['ofa-01', 'ofa-02', 'ofa-03'])
    LOADED.forEach((c, i) => {
      expect(c.id).toBe(CASES_IN_ORDER[i].id)
      expect(c.story.title).toBe(CASES_IN_ORDER[i].title)
    })
  })

  it('titles fit a phone header', () => {
    for (const c of LOADED) expect(c.story.title.length).toBeLessThanOrEqual(28)
  })
})

// The words the player must never read in a statement or in the story around it.
const POSITIONAL = ['north', 'south', 'east', 'west', 'left', 'right', 'above', 'below', 'beside', 'behind', 'front', 'back', 'top', 'bottom', 'upstairs', 'downstairs', 'ground', 'floor', 'floors', 'storey', 'row', 'rows', 'column', 'columns', 'corner', 'wall', 'walls', 'side', 'near', 'next', 'across', 'between', 'inside', 'outside', 'up', 'down', 'room', 'rooms', 'house']
const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'hallway', 'hall', 'porch', 'garden', 'pantry', 'study', 'dining', 'living', 'yard', 'courtyard', 'workshop', 'attic', 'cellar', 'garage', 'office', 'library', 'lounge', 'balcony', 'landing', 'terrace']
const TELLS = ['kill', 'killer', 'murder', 'dead', 'death', 'dies', 'died', 'body', 'corpse', 'victim', 'guilty', 'knife', 'poison', 'blood', 'lie', 'lies', 'lied', 'false', 'liar']
/** Words a testimony must not use: they name the board, not the house. */
const DISPLAY_BANNED = ['board', 'cell', 'cells', 'square', 'squares', 'row', 'rows', 'column', 'columns', 'corner', 'upstairs', 'downstairs', 'above', 'below', 'behind', 'left', 'floor', 'floors', 'tile', 'tiles', 'grid']
const COMPASS: Record<string, string> = { N: 'north', S: 'south', E: 'east', W: 'west' }
const words = (s: string): string[] => s.toLowerCase().match(/[a-zà-ÿ]+(?:'[a-z]+)?/g) ?? []
const hasWord = (ws: string[], w: string) => ws.some(x => x === w || x === `${w}s` || x.replace(/'s$/, '') === w)

/** Everything in `text` that the statement's own clue does not entitle it to say. */
function displayProblems(c: LieCase, s: Statement): string[] {
  const d = s.display ?? ''
  const ws = words(d)
  const p = c.puzzle
  const cl = s.clue
  const out: string[] = []
  if (!d) return ['no display']
  if (d.length > 90) out.push(`${d.length} characters`)
  for (const w of DISPLAY_BANNED) if (hasWord(ws, w)) out.push(`banned word "${w}"`)
  for (const w of TELLS) if (hasWord(ws, w)) out.push(`tell "${w}"`)
  // the one thing it must say
  const ownRoom = cl.kind === 'room' || cl.kind === 'notRoom' ? p.rooms.find(r => r.id === cl.roomId)!.name : null
  const ownFurniture = cl.kind === 'onFurniture' || cl.kind === 'besideFurniture' ? FURNITURE_WORDS[cl.furniture] : []
  const ownOther = otherOf(cl)
  const ownOtherName = ownOther ? p.people.find(x => x.id === ownOther)!.name : null
  if (ownRoom && !ws.includes(ownRoom.toLowerCase())) out.push(`does not name the ${ownRoom}`)
  if (ownFurniture.length && !ownFurniture.some(w => hasWord(ws, w))) out.push('does not name its furniture')
  if (ownOtherName && !ws.includes(ownOtherName.toLowerCase())) out.push(`does not name ${ownOtherName}`)
  if (cl.kind === 'direction' && !hasWord(ws, COMPASS[cl.dir])) out.push(`does not say ${COMPASS[cl.dir]}`)
  if (cl.kind === 'edge' && !hasWord(ws, 'wall')) out.push('does not mention a wall')
  if (cl.kind === 'besideFurniture' && !(hasWord(ws, 'beside') || hasWord(ws, 'next') || hasWord(ws, 'by') || hasWord(ws, 'near'))) out.push('does not say beside')
  // nothing else
  for (const r of p.rooms) if (r.name !== ownRoom && ws.includes(r.name.toLowerCase())) out.push(`names the ${r.name}`)
  const ownType = cl.kind === 'onFurniture' || cl.kind === 'besideFurniture' ? cl.furniture : null
  for (const [type, list] of Object.entries(FURNITURE_WORDS)) {
    if (type === ownType) continue
    for (const w of list) if (hasWord(ws, w)) out.push(`names a ${w}`)
  }
  for (const x of p.people) if (x.name !== ownOtherName && ws.includes(x.name.toLowerCase())) out.push(`names ${x.name}`)
  for (const [k, w] of Object.entries(COMPASS)) if (!(cl.kind === 'direction' && cl.dir === k) && hasWord(ws, w)) out.push(`says ${w}`)
  for (const w of ['wall', 'walls']) if (cl.kind !== 'edge' && hasWord(ws, w)) out.push(`says ${w}`)
  return out
}

function storyLeaks(c: LieCase, text: string): string[] {
  const ws = words(text)
  const has = (w: string) => hasWord(ws, w)
  const bad = [...POSITIONAL, ...ROOMS, ...TELLS].filter(has)
  for (const r of c.puzzle.rooms) for (const w of words(r.name)) if (has(w)) bad.push(w)
  for (const list of Object.values(FURNITURE_WORDS)) for (const w of list) if (has(w)) bad.push(w)
  for (const x of c.puzzle.people) if (has(x.name.toLowerCase())) bad.push(x.name)
  return [...new Set(bad)]
}

const initial = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '')[0].toUpperCase()

for (const c of LOADED) {
  const p = c.puzzle
  const lie = c.statements.find(s => s.id === c.lieId)!

  describe(`${c.id}: the verifier`, () => {
    const result = verifyLieCase(c, EXPECT[c.id])
    it('passes every check and keeps its promises', () => {
      expect(result.failures).toEqual([])
      expect(result.ok).toBe(true)
    })
  })

  describe(`${c.id}: a valid Murdoku case without the lie`, () => {
    it('has one floor, one victim, and the right number of people for the board', () => {
      expect(p.floors ?? 1).toBe(1)
      expect(p.people.filter(x => x.isVictim).map(x => x.id)).toEqual([p.victimId])
      expect(p.people).toHaveLength(p.size)
    })

    it('passes validatePuzzle with zero errors, and the scene recipe knows every piece', () => {
      expect(validatePuzzle(p)).toEqual([])
      expect(validatePuzzleSceneCompatibility(p).filter(i => i.severity === 'error')).toEqual([])
    })

    it('has exactly one solution and the engine names the liar as the murderer', () => {
      expect(countSolutions(p, 2)).toBe(1)
      expect(findMurderer(p)).toBe(p.murdererId)
      expect(p.murdererId).toBe(lie.author)
    })

    it('keeps ids stable: s1..sN in reading order, grouped by author, scene facts last', () => {
      expect(c.statements.map(s => s.id)).toEqual(c.statements.map((_, i) => `s${i + 1}`))
      const order = p.people.map(x => x.id)
      const authors = c.statements.map(s => order.indexOf(s.author))
      expect(authors).toEqual([...authors].sort((a, b) => a - b))
      expect(c.statements.filter(s => s.scene).map(s => s.author)).toEqual(c.statements.filter(s => s.scene).map(() => p.victimId))
    })

    it('gives the victim one or two scene facts', () => {
      const n = c.statements.filter(s => s.scene).length
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(2)
    })

    it('pins the case data', () => {
      expect(fingerprint({ puzzle: p, statements: c.statements, collisions: c.collisions, lieId: c.lieId })).toBe(PINS[c.id])
    })
  })

  describe(`${c.id}: every statement text means the same to the independent literal interpreter`, () => {
    const m = buildModel(p)
    it('agrees with the room maps', () => {
      expect(checkMapsAgree(p, m)).toEqual([])
    })

    const cells: Cell[] = []
    for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) cells.push({ row, col })
    const pos = (x: Cell) => ({ f: 0, r: x.row, c: x.col })

    for (const s of c.statements) {
      it(`${s.id} "${s.text}" parses to the clue's own rule`, () => {
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

    it('reads all statements together, the lie included, as having no solution, and only the lie false', () => {
      const v = judge(p, c.statements.map(s => ({ person: s.author, text: s.text })))
      expect(v.sentenceErrors).toEqual([])
      expect(v.count).toBe(0)
      expect(v.falseClues).toEqual([`${lie.author}: ${lie.text}`])
    })
  })

  describe(`${c.id}: testimony reads as testimony`, () => {
    for (const s of c.statements) {
      it(`${s.id} display carries exactly its own claim`, () => {
        expect(displayProblems(c, s)).toEqual([])
      })
    }

    it('has no display written twice, and no voice left over', () => {
      const lines = c.statements.map(s => s.display)
      expect(new Set(lines).size).toBe(lines.length)
      for (const s of c.statements) expect(s.voice ?? '').toBe('')
    })

    it('says "beside" only about squares next to the piece in the same room', () => {
      // the engine's "beside" is orthogonally adjacent AND in the same room; no display may suggest more
      for (const s of c.statements) if (s.clue.kind === 'besideFurniture') expect(words(s.display ?? '')).not.toContain('across')
    })
  })

  describe(`${c.id}: the story`, () => {
    const story = c.story
    const slots: Array<[string, string]> = [
      ['premise', story.premise],
      ...Object.entries(story.cast).flatMap(([id, x]): Array<[string, string]> => [[`${id}.role`, x.role], [`${id}.motive`, x.motive]]),
    ]
    for (const [name, text] of slots) {
      it(`${name} names no room, furniture, direction, cast member or tell`, () => {
        expect(text.length).toBeGreaterThan(0)
        expect(storyLeaks(c, text)).toEqual([])
      })
    }

    it('the title is short, clean, and the puzzle carries it', () => {
      expect(storyLeaks(c, story.title)).toEqual([])
      expect(p.title).toBe(story.title)
    })

    it('the closing uses {M} and {V} and adds no position', () => {
      expect(story.closing).toContain('{M}')
      expect(story.closing).toContain('{V}')
      expect(storyLeaks(c, story.closing.replace(/\{[MV]\}/g, ''))).toEqual([])
    })

    it('the premise is two sentences at most', () => {
      const n = story.premise.split(/(?<=[.!?])\s+/).length
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(2)
    })

    it('has a complete cast: every person, distinct initials, distinct emblems', () => {
      expect(Object.keys(story.cast).sort()).toEqual(p.people.map(x => x.id).sort())
      for (const x of p.people) {
        expect(story.cast[x.id].name).toBe(x.name)
        expect(story.cast[x.id].role.length).toBeGreaterThan(0)
        expect(story.cast[x.id].motive.length).toBeGreaterThan(0)
      }
      const initials = p.people.map(x => initial(x.name))
      expect(new Set(initials).size).toBe(initials.length)
      const emblems = Object.values(story.cast).map(x => x.emblem)
      expect(new Set(emblems).size).toBe(emblems.length)
    })
  })
}
