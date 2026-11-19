import { describe, expect, it } from 'vitest'
import { getPuzzleById } from '../../src/core/catalog'
import { easy, hard } from './fixtures'
import type { Puzzle } from '../../src/core/types'
import { FURNITURE_WORDS } from '../../src/reference/story/schema'
import { deep, leadCases } from '../../src/casebook/deep'
import { STORIES, displayName, storyFor, titleFor, visibleStory } from '../../src/casebook/stories'
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
  if (banned.cast) for (const x of p.people) for (const n of [x.name, displayName(p, x.id)]) if (hasWord(n.toLowerCase())) bad.push(n)
  return [...new Set(bad)]
}

function slots(s: CaseStory): Array<[string, string]> {
  const out: Array<[string, string]> = [['premise', s.premise]]
  if (s.title) out.push(['title', s.title])
  if (s.closing) out.push(['closing', s.closing])
  for (const [id, c] of Object.entries(s.cast)) {
    out.push([`${id}.role`, c.role], [`${id}.oneLiner`, c.oneLiner], [`${id}.motive`, c.motive])
    if (c.alibi) out.push([`${id}.alibi`, c.alibi])
  }
  return out
}

const FIXTURE: Record<string, Puzzle> = { 'hard-2': hard, 'very-easy-3': easy, ...Object.fromEntries([...deep(), ...leadCases()].map(p => [p.id, p])) }

describe('story slots', () => {
  for (const id of Object.keys(STORIES)) {
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
        if (s.closing) {
          expect(before.closing).toBeNull()
          expect(JSON.stringify(before)).not.toContain(s.closing)
          expect(visibleStory(s, true).closing).toBe(s.closing)
        }
      })

      it('gives every person a one-line alibi in their own voice, the same shape for all, and visible from the start', () => {
        const withAlibi = Object.values(s.cast).filter(c => c.alibi)
        if (!withAlibi.length) return
        expect(withAlibi).toHaveLength(Object.keys(s.cast).length)
        for (const [pid, c] of Object.entries(s.cast)) {
          expect(c.alibi!.length, c.alibi).toBeLessThanOrEqual(46)
          expect(c.alibi!, pid).toMatch(/\b(I|my|me|we)\b/i)
        }
        expect(new Set(withAlibi.map(c => c.alibi)).size).toBe(withAlibi.length)
        expect(visibleStory(s, false).alibiOf(p.murdererId)).toBe(s.cast[p.murdererId].alibi)
      })

      it('gives every person a distinct role', () => {
        const roles = Object.values(s.cast).map(c => c.role)
        expect(new Set(roles).size).toBe(roles.length)
      })
    })
  }

  describe('the season thread (pt-01 to pt-12)', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `pt-${String(i + 1).padStart(2, '0')}`)
    const MONEY = /\b(money|debts?|ledgers?|loans?|owed|owing|cheques?|prices?|duties|weights|accounts?|fees?|paid|pay|payments?|coins?|fortune|bribes?|salary|wages?|savings|worthless|bargain|quote)\b/i

    it('has a story for every lead case, each with its own unique title and a closing line', () => {
      expect(Object.keys(STORIES).filter(k => k.startsWith('pt-')).sort()).toEqual(ids)
      const titles = ids.map(id => STORIES[id].title)
      expect(titles.every(t => !!t && t.length > 3)).toBe(true)
      expect(new Set(titles).size).toBe(12)
      for (const id of ids) expect(STORIES[id].closing!.length).toBeGreaterThan(20)
    })

    it('every case reads its title from the story; with none, the header and picker keep the generator title', () => {
      for (const p of leadCases().filter(x => ids.includes(x.id))) expect(titleFor(p)).toBe(STORIES[p.id].title)
      expect(titleFor(hard)).toBe(hard.title)
    })

    it('runs the harbour bell through every premise, and pt-12 resolves it', () => {
      for (const id of ids) expect(STORIES[id].premise.toLowerCase()).toMatch(/\bbell\b/)
      // the resolution is a closing line, so it is never visible before the solve
      expect(STORIES['pt-12'].premise).not.toMatch(/crack|bound|tongue|foundry/)
      expect(STORIES['pt-12'].closing).toMatch(/bound the tongue/)
      expect(STORIES['pt-12'].closing).toMatch(/foundry/)
      expect(STORIES['pt-12'].closing).toMatch(/new bell/)
    })

    it('uses money, debts and ledgers as the motive in at most 3 of 12 cases', () => {
      const money = ids.filter(id => MONEY.test(STORIES[id].cast[STORIES[id].murderer].motive))
      expect(money.length, money.join(',')).toBeLessThanOrEqual(3)
    })

    it('varies the motives: no two murderers share one', () => {
      const motives = ids.map(id => STORIES[id].cast[STORIES[id].murderer].motive)
      expect(new Set(motives).size).toBe(12)
    })
  })

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
    for (const id of ['hard-2', 'very-easy-3']) expect(storyFor(getPuzzleById(id) as Puzzle)).not.toBeNull()
  })

  it('discards a story whose cast no longer matches the puzzle', () => {
    const p = structuredClone(hard)
    p.people[1].name = 'Someone Else'
    expect(storyFor(p)).toBeNull()
  })
})
