import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import Casebook from '../../src/casebook/Casebook'
import { deep, leadCases } from '../../src/casebook/deep'
import { reserveHeightFor, statementsOf } from '../../src/casebook/lens'
import type { Metrics } from '../../src/casebook/measure'
import type { Puzzle } from '../../src/core/types'

afterEach(() => cleanup())

const css = readFileSync('src/casebook/casebook.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
/** [selector, body] of every rule, flattened (media queries included). */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]] as const)
const CASES: Puzzle[] = [...leadCases(), ...deep()]

describe('every statement is always reachable: chips wrap, they never hide and never scroll sideways', () => {
  it('has no chip rule that scrolls sideways, snaps or refuses to wrap, in any mode', () => {
    for (const [sel, body] of rules.filter(([s]) => /\.cb-chip/.test(s))) {
      expect(body, sel).not.toMatch(/nowrap|overflow-x|overflow:\s*(auto|scroll)|scroll-snap|scroll-padding/)
    }
    // the box may scroll up and down inside itself on a short phone, and says so (the fade and the count)
    const box = rules.filter(([s]) => s === '.cb-chips').map(([, b]) => b).join(' ')
    expect(box).toMatch(/overflow-y:\s*auto/)
    expect(box).toMatch(/max-height/)
    expect(css).toMatch(/\.cb-chips\[data-more\]/)
    // and the old compact override that fixed the chip row to one line is gone
    expect(css).not.toMatch(/--cb-chips-h:\s*58px/)
  })

  it('keeps the statement type at 15 px or more, wherever it is set', () => {
    for (const [sel, body] of rules.filter(([s]) => /\.cb-chip(\s|,|$)/.test(s) && !/cb-chip-/.test(s))) {
      const m = body.match(/font-size:\s*(\d+(?:\.\d+)?)px/)
      if (m) expect(+m[1], sel).toBeGreaterThanOrEqual(15)
      const f = body.match(/font:\s*[^;]*?(\d+(?:\.\d+)?)px/)
      if (f) expect(+f[1], sel).toBeGreaterThanOrEqual(15)
    }
  })

  it('renders every statement of every suspect of every case', () => {
    for (const p of CASES) {
      const { unmount } = render(<Casebook puzzle={p} />)
      const buttons = within(screen.getByRole('list', { name: 'Suspects' })).getAllByRole('button')
      p.people.forEach((x, i) => {
        fireEvent.click(buttons[i])
        const list = screen.getByRole('list', { name: /statements/ })
        const chips = list.querySelectorAll('.cb-chip')
        const want = statementsOf(p, x.id)
        expect(chips, `${p.id} ${x.id}`).toHaveLength(want.length)
        want.forEach((s, k) => expect(chips[k].textContent!.startsWith(s.text), `${p.id} ${s.text}`).toBe(true))
      })
      unmount()
    }
  })
})

describe('the reserved height', () => {
  // A measuring stub: every character is 7 px in the statement face, 6 in the interface face.
  const stub: Metrics = { serif: (t, px) => t.length * px * 0.46, sans: (t, px) => t.length * px * 0.5 }

  it('is never less than one chip row, and never shrinks as the panel narrows', () => {
    for (const p of CASES) for (const compact of [false, true]) {
      let last = 0
      for (const w of [358, 344, 328, 312, 296, 288]) {
        const h = reserveHeightFor(p, w, compact, stub)
        expect(h, `${p.id} ${w}`).toBeGreaterThanOrEqual(compact ? 40 : 44)
        expect(h, `${p.id} ${w}`).toBeGreaterThanOrEqual(last)
        last = h
      }
    }
  })

  it('holds the busiest suspect: at least one row for every statement that cannot share a line', () => {
    for (const p of CASES) {
      const most = Math.max(...p.people.map(x => statementsOf(p, x.id).length))
      // three full-width chips cannot sit on fewer than three rows at 288 px
      const wide = Math.max(...p.people.map(x => statementsOf(p, x.id).filter(s => s.text.length * 7.1 + 27 > 144).length))
      const h = reserveHeightFor(p, 288, true, stub)
      expect(h, p.id).toBeGreaterThanOrEqual(Math.min(most, Math.max(1, wide)) * 40 - 1)
    }
  })

  it('falls back to a generous estimate when the browser cannot measure', () => {
    const p = CASES.find(x => x.id === 'pt-03') as Puzzle
    expect(reserveHeightFor(p, 288, true)).toBeGreaterThanOrEqual(reserveHeightFor(p, 288, true, stub) - 12)
  })
})

describe('red pencil is for the accusation and the murderer only', () => {
  it('appears in no rule but the verdict, the accusation marks, the circle and the roll-call climax', () => {
    const ALLOWED = /cb-(strikes|verdict|accuse|roll-tier|roll-faces|roll-list|circle)|^:root|cb-root\[data-theme='dark'\]$/
    for (const [sel, body] of rules) {
      if (!/--cb-red|#C6362C|#E0564B/i.test(body)) continue
      expect(sel, `red in "${sel}"`).toMatch(ALLOWED)
    }
  })

  it('has its own ink marks for a lane held twice: the notch and the struck badge', () => {
    const notch = rules.filter(([s]) => /cb-notch/.test(s)).map(([, b]) => b).join(' ')
    expect(notch).toMatch(/#1B2230/)
    expect(notch).not.toMatch(/--cb-red/)
    const struck = rules.filter(([s]) => /cb-num\[data-clash\]/.test(s)).map(([, b]) => b).join(' ')
    expect(struck).toMatch(/dashed/)
    expect(struck).toMatch(/#1b2230/)
  })

  it('reads in both themes: ink on the cream badge, and the cream rim on the ink notch', () => {
    const lum = (hex: string) => {
      const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
    }
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
    // the numeral badge and the notch use fixed colours, so they read the same in light and dark
    expect(ratio('#1b2230', '#efe3c8')).toBeGreaterThan(7)
    expect(ratio('#F4ECD8', '#1B2230')).toBeGreaterThan(7)
    // the rail's notch sits on the paper in either theme, with its own cream rim
    expect(ratio('#1B2230', '#EFE7D6')).toBeGreaterThan(7)
    expect(ratio('#1B2230', '#2A2F3E')).toBeLessThan(2) // dark paper: the rim, not the disc, carries the mark
    expect(ratio('#F4ECD8', '#2A2F3E')).toBeGreaterThan(7)
  })
})
