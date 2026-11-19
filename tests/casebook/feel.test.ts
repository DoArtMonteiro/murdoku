import { describe, expect, it } from 'vitest'
import { easy, hard } from './fixtures'
import { initState, reduce } from '../../src/casebook/game'
import type { Action } from '../../src/casebook/game'
import { emptySave } from '../../src/casebook/save'
import { satisfiedIds } from '../../src/casebook/lens'
import { cueFor, loadSoundPref, saveSoundPref, SOUND_KEY } from '../../src/casebook/sound'
import { deep } from '../../src/casebook/deep'

const at = (row: number, col: number, floor = 0) => ({ row, col, floor })

describe('statements-hold cue', () => {
  it('lists a person only when every statement holds where they stand', () => {
    expect([...satisfiedIds(easy, { p0: at(5, 0) })]).toEqual(['p0'])
    expect(satisfiedIds(easy, { p0: at(4, 0) }).size).toBe(0)
    expect(satisfiedIds(easy, {}).size).toBe(0)
  })

  it('holds for everyone on the true plan, and says nothing about a wrong plan that merely satisfies someone', () => {
    for (const p of [easy, hard, ...deep()]) {
      expect(satisfiedIds(p, p.solution).size, p.id).toBe(p.people.filter(x => p.clues.some(c => c.clue.person === x.id && c.clue.kind !== 'victim')).length)
    }
  })

  it('a person with a statement about someone unplaced is not listed', () => {
    // Carol (hard-2) has "not in Lena's room": nothing can be said until Lena is placed.
    expect(satisfiedIds(hard, { p2: hard.solution.p2 }).has('p2')).toBe(false)
    expect(satisfiedIds(hard, { p2: hard.solution.p2, p0: hard.solution.p0 }).has('p2')).toBe(true)
  })
})

describe('sound', () => {
  const run = (s: ReturnType<typeof initState>, ...as: Action[]) => as.reduce((st, a) => reduce(easy, st, a), s)
  const s0 = initState(easy, emptySave())

  it('is off by default and the choice is kept under the slice key', () => {
    localStorage.clear()
    expect(loadSoundPref()).toBe(false)
    saveSoundPref(true)
    expect(localStorage.getItem(SOUND_KEY)).toBe('1')
    expect(loadSoundPref()).toBe(true)
  })

  it('picks a cue for place, lift, lens, strike and the two verdicts, and none for a quiet change', () => {
    const placed = run(s0, { t: 'cell', cell: at(5, 0) })
    expect(cueFor(s0, placed)).toBe('place')
    const lifted = run(placed, { t: 'select', id: 'p0' }, { t: 'cell', cell: at(5, 0) })
    expect(cueFor(run(placed, { t: 'select', id: 'p0' }), lifted)).toBe('lift')
    expect(cueFor(s0, run(s0, { t: 'lit', index: easy.clues.findIndex(c => c.clue.person === 'p0') }))).toBe('lens')
    expect(cueFor(s0, run(s0, { t: 'pencil' }))).toBeNull()
    expect(cueFor(s0, run(s0, { t: 'floor', floor: 0 }))).toBeNull()
    expect(cueFor(s0, run(s0, { t: 'accuse', id: 'p1' }))).toBe('strike')
    expect(cueFor(s0, run(s0, { t: 'accuse', id: 'p0' }))).toBe('called')
    const full = initState(easy, { ...emptySave(), placement: Object.fromEntries(easy.people.map(x => [x.id, { ...easy.solution[x.id], floor: 0 }])) })
    expect(cueFor(full, run(full, { t: 'accuse', id: 'p0' }))).toBe('proved')
  })
})
