import { describe, expect, it } from 'vitest'
import { getPuzzleById } from '../../src/core/catalog'
import { easy, hard } from './fixtures'
import type { Puzzle } from '../../src/core/types'
import { FURNITURE_WORDS } from '../../src/reference/story/schema'
import { PICKER_CASES } from '../../src/casebook/cases'
import { STORIES, storyFor, visibleStory } from '../../src/casebook/stories'
import type { CaseStory } from '../../src/casebook/stories'

// Words that place someone in space or point at the grid.
const POSITIONAL = [
  'north', 'south', 'east', 'west', 'left', 'right', 'above', 'below', 'beside', 'behind', 'front', 'back', 'top', 'bottom',
  'upstairs', 'downstairs', 'ground', 'floor', 'floors', 'storey', 'row', 'rows', 'column', 'columns', 'corner', 'wall', 'walls',
  'side', 'near', 'next', 'across', 'between', 'inside', 'outside', 'up', 'down', 'room', 'rooms', 'house',
]
// Generic room names, on top of the puzzle's own.
const ROOMS = [
  'kitchen', 'bedroom', 'bathroom', 'hallway', 'porch', 'garden', 'pantry', 'study', 'dining', 'living', 'yard', 'attic', 'cellar',
  'garage', 'office', 'library', 'lounge', 'balcony', 'landing', 'terrace', 'nursery', 'conservatory', 'foyer', 'lobby', 'parlour', 'parlor',
]
// Tells that would separate victim from murderer before the solve.
const TELLS = ['kill', 'killer', 'murder', 'dead', 'death', 'dies', 'died', 'body', 'corpse', 'victim', 'guilty', 'knife', 'poison', 'blood']

const words = (s: string) => s.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []

/** Every offence in one text: returns the offending words/phrases. */
export function leaks(p: Puzzle, text: string, banned: { cast: boolean } = { cast: true }): string[] {
  const ws = words(text)
  const set = new Set(ws)
  const lower = text.toLowerCase()
  const bad: string[] = []
  const hasWord = (w: string) => set.has(w) || set.has(`${w}s`) || ws.some(x => x.replace(/'s$/, '') === w)
  for (const w of [...POSITIONAL, ...ROOMS, ...TELLS]) if (hasWord(w)) bad.push(w)
  for (const r of p.rooms) {
    if (lower.includes(r.name.toLowerCase())) bad.push(r.name)
    for (const w of words(r.name)) if (w !== 'the' && hasWord(w)) bad.push(w)
  }
  for (const list of Object.values(FURNITURE_WORDS)) for (const w of list) if (hasWord(w)) bad.push(w)
  if (banned.cast) for (const x of p.people) if (hasWord(x.name.toLowerCase())) bad.push(x.name)
  return [...new Set(bad)]
}

function slots(s: CaseStory): Array<[string, string]> {
  const out: Array<[string, string]> = [['premise', s.premise]]
  for (const [id, c] of Object.entries(s.cast)) out.push([`${id}.role`, c.role], [`${id}.oneLiner`, c.oneLiner], [`${id}.motive`, c.motive])
  return out
}

const FIXTURE: Record<string, Puzzle> = { 'hard-2': hard, 'very-easy-3': easy }

describe('story slots', () => {
  for (const { id } of PICKER_CASES) {
    describe(id, () => {
      const p = FIXTURE[id]
      const s = STORIES[id]

      it('matches the live cast, victim and murderer', () => {
        expect(storyFor(p)).not.toBeNull()
        expect(Object.keys(s.cast).sort()).toEqual(p.people.map(x => x.id).sort())
        expect(s.murderer).toBe(p.murdererId)
      })

      it('has a two-sentence premise', () => {
        expect(s.premise.split(/(?<=[.!?])\s+/)).toHaveLength(2)
      })

      it('mentions no place, furniture, direction, grid word, cast name or tell', () => {
        for (const [slot, text] of slots(s)) expect({ slot, leaks: leaks(p, text) }).toEqual({ slot, leaks: [] })
      })

      it('writes victim and murderer to the same shape, with the motive withheld before the solve', () => {
        const v = s.cast[p.victimId], m = s.cast[p.murdererId]
        expect(Object.keys(v).sort()).toEqual(Object.keys(m).sort())
        for (const key of ['role', 'oneLiner'] as const) {
          expect(v[key].length).toBeGreaterThan(8)
          expect(m[key].length).toBeGreaterThan(8)
        }
        const before = visibleStory(s, false)
        expect(before.motive).toBeNull()
        expect(JSON.stringify(before)).not.toContain(m.motive)
        expect(before.roleOf(p.murdererId)).toEqual({ role: m.role, oneLiner: m.oneLiner })
        expect(visibleStory(s, true).motive).toBe(m.motive)
      })
    })
  }

  it('the validator catches seeded leaks', () => {
    const p = hard
    expect(leaks(p, 'Was seen near the Kitchen at nine.')).toEqual(expect.arrayContaining(['near', 'Kitchen']))
    expect(leaks(p, 'Sat on the sofa all evening.')).toContain('sofa')
    expect(leaks(p, 'Stood in row 3.')).toContain('row')
    expect(leaks(p, 'Argued with Marco.')).toContain('Marco')
    expect(leaks(p, 'Went upstairs alone.')).toContain('upstairs')
    expect(leaks(p, 'A quiet clerk with a taste for ledgers.')).toEqual([])
  })

  it('the live catalogue still matches the authored cast (re-author the story if this fails)', () => {
    for (const { id } of PICKER_CASES) expect(storyFor(getPuzzleById(id) as Puzzle)).not.toBeNull()
  })

  it('discards a story whose cast no longer matches the puzzle', () => {
    const p = structuredClone(hard)
    p.people[1].name = 'Someone Else'
    expect(storyFor(p)).toBeNull()
  })
})
