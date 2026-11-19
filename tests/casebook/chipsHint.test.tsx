import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Casebook from '../../src/casebook/Casebook'
import { firstName } from '../../src/casebook/cells'
import { deep, leadCases } from '../../src/casebook/deep'
import { fitPlan, heightForCell } from '../../src/casebook/layout'
import { statementsOf } from '../../src/casebook/lens'
import { fallbackLayout } from '../../src/reference/shell/geometry'

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers() })

const CASES = [...leadCases(), ...deep()]
/** A case, and the suspect in it, whose first statement is about somebody else: waiting while nobody is placed. */
const found = (() => {
  for (const p of CASES) for (const x of p.people) {
    const st = statementsOf(p, x.id).find(s => s.needs)
    if (st) return { p, who: x.id, st }
  }
  throw new Error('no relational statement in any case')
})()
const open = () => {
  render(<Casebook puzzle={found.p} />)
  const buttons = within(screen.getByRole('list', { name: 'Suspects' })).getAllByRole('button')
  fireEvent.click(buttons[found.p.people.findIndex(x => x.id === found.who)])
  const waiting = screen.getAllByRole('list', { name: /statements/ })[0].querySelector<HTMLElement>('.cb-chip[data-wait]')!
  return waiting
}

describe('a statement waiting for someone to be placed', () => {
  const name = firstName(found.p, found.st.needs!)

  it('wears that person’s initial and a dashed outline, with no second line of text', () => {
    const chip = open()
    expect(chip.querySelector('.cb-chip-dep')!.textContent).toBe(name.charAt(0))
    expect(chip.querySelector('.cb-chip-sub')).toBeNull()
    expect(chip).toHaveAttribute('data-wait')
  })

  it('says the whole thing to a screen reader and as a tooltip', () => {
    const chip = open()
    expect(chip.getAttribute('aria-label')).toBe(`${found.st.text}. Place ${name} first.`)
    expect(chip).toHaveAttribute('title', `Place ${name} first`)
  })

  it('shows the reason on a long press, once, and the press does not light the statement', () => {
    vi.useFakeTimers()
    const chip = open()
    fireEvent.pointerDown(chip)
    expect(document.querySelector('.cb-tip')).toBeNull()
    act(() => { vi.advanceTimersByTime(500) })
    expect(document.querySelector('.cb-tip')!.textContent).toBe(`Place ${name} first`)
    fireEvent.click(chip) // the click that ends the press
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    act(() => { vi.advanceTimersByTime(2500) })
    expect(document.querySelector('.cb-tip')).toBeNull()
  })

  it('shows the reason on a plain tap too, since a touch screen has no hover', () => {
    const chip = open()
    fireEvent.click(chip)
    expect(document.querySelector('.cb-tip')!.textContent).toBe(`Place ${name} first`)
  })

  it('a statement that is not waiting has no marker', () => {
    render(<Casebook puzzle={found.p} />)
    for (const chip of document.querySelectorAll('.cb-chip:not([data-wait])')) {
      expect(chip.querySelector('.cb-chip-dep')).toBeNull()
      expect(chip.getAttribute('aria-label')).toBeNull()
    }
  })
})

describe('the height the plan needs for a target square', () => {
  it('is enough: the plan fitted into it has squares at least that big, for every size and width a phone has', () => {
    for (const n of [4, 6, 8]) for (const w of [288, 304, 328, 344]) for (const cell of [26, 30]) {
      const h = heightForCell(w, n, cell, fallbackLayout)
      expect(h, `${n} ${w} ${cell}`).toBeGreaterThan(0)
      const fit = fitPlan(w, h, n, fallbackLayout)
      // unless the width ran out first, in which case more height would not have helped
      if (fit.visW < w - 4) expect(fit.cell, `${n} ${w} ${cell}`).toBeGreaterThanOrEqual(cell)
    }
  })

  it('grows with the square, and with the size of the house', () => {
    expect(heightForCell(328, 8, 30, fallbackLayout)).toBeGreaterThan(heightForCell(328, 8, 26, fallbackLayout))
    expect(heightForCell(328, 8, 30, fallbackLayout)).toBeGreaterThan(heightForCell(328, 6, 30, fallbackLayout))
  })
})
