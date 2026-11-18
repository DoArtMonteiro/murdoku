import { afterAll, describe, expect, it } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import { dailyPuzzle, todayStamp } from '../../src/core/daily'
import type { Difficulty } from '../../src/core/types'
import { judge } from './literal'

// Every date of a whole year (and a leap year), as seen from time zones on both
// sides of the date line, must map to a case that is solvable by the stated rules.

const puzzles = getAllPuzzles()
const sound = new Map(puzzles.map(p => {
  const v = judge(p)
  return [p.id, v.sentenceErrors.length === 0 && v.falseClues.length === 0 && v.count === 1 && v.murderers[0] === p.murdererId]
}))

const ZONES = [
  'UTC', 'Pacific/Pago_Pago', 'Pacific/Kiritimati', 'Asia/Tokyo', 'Asia/Kolkata',
  'Europe/London', 'America/Los_Angeles', 'America/St_Johns', 'Australia/Lord_Howe',
]
const originalTz = process.env.TZ
afterAll(() => { if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz })

const pad = (n: number) => String(n).padStart(2, '0')
function stampsOfYear(year: number): string[] {
  const out: string[] = []
  const days = (year % 4 === 0 ? 366 : 365)
  const mdays = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let m = 0; m < 12; m++) for (let d = 1; d <= mdays[m]; d++) out.push(`${year}-${pad(m + 1)}-${pad(d)}`)
  expect(out).toHaveLength(days)
  return out
}

describe('the daily case, every day of 2026 and 2028', () => {
  it('has a sound catalog to pick from (all 60 cases pass the independent interpreter)', () => {
    expect(puzzles).toHaveLength(60)
    expect([...sound.values()].every(Boolean)).toBe(true)
  })

  for (const year of [2026, 2028]) {
    it(`maps all ${year % 4 === 0 ? 366 : 365} days of ${year} to cases that pass the independent interpreter`, () => {
      const served = new Map<Difficulty, Set<string>>()
      for (const stamp of stampsOfYear(year)) {
        const p = dailyPuzzle(puzzles, stamp)
        expect(p, stamp).not.toBeNull()
        expect(sound.get(p!.id), `${stamp} -> ${p!.id}`).toBe(true)
        if (!served.has(p!.difficulty)) served.set(p!.difficulty, new Set())
        served.get(p!.difficulty)!.add(p!.id)
      }
      // all six tiers are served; the daily is no longer always Hard+
      expect([...served.keys()].sort()).toEqual(['Easy', 'Expert', 'Hard', 'Master', 'Medium', 'Very Easy'])
      // a year walks through every case of the tiers that come up weekly
      expect(served.get('Very Easy')!.size).toBe(8)
      expect(served.get('Easy')!.size).toBe(10)
      expect(served.get('Medium')!.size).toBe(12)
      expect(served.get('Hard')!.size).toBe(12)
      expect(served.get('Expert')!.size).toBe(10)
      expect(served.get('Master')!.size).toBe(8)
    })
  }

  it('gives each weekday its tier, the same one for everybody', () => {
    const tierOf = ['Medium', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']
    for (const stamp of stampsOfYear(2026)) {
      const [y, m, d] = stamp.split('-').map(Number)
      const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      expect(dailyPuzzle(puzzles, stamp)!.difficulty, `${stamp} (weekday ${weekday})`).toBe(tierOf[weekday])
    }
  })

  it('does not serve the same case two days running, and cycles a tier before repeating it', () => {
    const days = stampsOfYear(2026)
    for (let i = 1; i < days.length; i++) {
      expect(dailyPuzzle(puzzles, days[i])!.id).not.toBe(dailyPuzzle(puzzles, days[i - 1])!.id)
    }
    // the first 8 Mondays are 8 different Very Easy cases
    const mondays = days.filter(s => dailyPuzzle(puzzles, s)!.difficulty === 'Very Easy').slice(0, 8)
    expect(new Set(mondays.map(s => dailyPuzzle(puzzles, s)!.id)).size).toBe(8)
  })

  for (const zone of ZONES) {
    it(`is decided by the local calendar date in ${zone}, whatever the clock says`, () => {
      process.env.TZ = zone
      const reference = new Map(stampsOfYear(2026).map(s => [s, dailyPuzzle(puzzles, s)!.id]))
      let checked = 0
      for (let i = 0; i < 365; i++) {
        for (const [h, mi] of [[0, 0], [12, 0], [23, 59]]) {
          const when = new Date(2026, 0, 1 + i, h, mi, 30)
          const stamp = todayStamp(when)
          // the local date of that moment, built without going through todayStamp
          const expected = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`
          expect(stamp).toBe(expected)
          expect(dailyPuzzle(puzzles, stamp)!.id, `${zone} ${stamp} ${h}:${mi}`).toBe(reference.get(stamp))
          expect(sound.get(reference.get(stamp)!)).toBe(true)
          checked++
        }
      }
      expect(checked).toBe(365 * 3)
    })
  }

  it('survives malformed stamps without throwing', () => {
    for (const bad of ['', 'nope', '2026-02-31', '2026-13-01', '99999-01-01']) {
      expect(dailyPuzzle(puzzles, bad), bad).not.toBeNull()
    }
  })
})
