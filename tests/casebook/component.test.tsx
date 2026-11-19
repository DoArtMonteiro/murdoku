import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// The baked JSON is imported directly: going through core/catalog would call
// initCatalog, which touches murdoku_* keys, and this test proves the slice does not.
import baked from '../../src/data/catalog.generated.json'
import type { Puzzle } from '../../src/core/types'
import Casebook from '../../src/casebook/Casebook'
import { registerCase, resolveCase } from '../../src/casebook/cases'
import { saveKey } from '../../src/casebook/save'

const easy = (baked as unknown as Puzzle[]).find(p => p.id === 'very-easy-3') as Puzzle
afterEach(() => { cleanup(); localStorage.clear() })

const cellAt = (r: number, c: number) => document.querySelector<HTMLElement>(`[role=gridcell][data-row="${r}"][data-col="${c}"]`)!

describe('Casebook component', () => {
  it('renders an injected puzzle, with grid semantics and every person on the rail', () => {
    render(<Casebook puzzle={easy} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(document.querySelectorAll('[role=gridcell]')).toHaveLength(36)
    expect(within(screen.getByRole('list', { name: 'Suspects' })).getAllByRole('button')).toHaveLength(4)
    expect(cellAt(0, 0).getAttribute('aria-label')).toMatch(/^Row 1, column 1\./)
  })

  it('places with one tap, marks the plan saved under its own key, and writes no murdoku_* key', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(cellAt(5, 0))
    expect(cellAt(5, 0).querySelector('[data-testid=token-p0]')).not.toBeNull()
    const keys = Object.keys(localStorage)
    expect(keys).toEqual([saveKey('very-easy-3')])
    expect(keys.some(k => k.startsWith('murdoku_'))).toBe(false)
    expect(JSON.parse(localStorage.getItem(saveKey('very-easy-3'))!).placement.p0).toEqual({ row: 5, col: 0, floor: 0 })
  })

  it('lights the lens cells for lit statements and says so in the cell label', () => {
    render(<Casebook puzzle={easy} />)
    for (const chip of screen.getAllByRole('button', { pressed: false }).filter(b => b.className.includes('cb-chip'))) fireEvent.click(chip)
    expect(cellAt(5, 0).dataset.lens).toBe('lit')
    expect(cellAt(0, 0).dataset.lens).toBe('dim')
    expect(cellAt(5, 0).getAttribute('aria-label')).toMatch(/lens: lit/)
  })

  it('names the victim in the accusation sheet and keeps a wrong name to a bare strike', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText('Who was alone with Greta?')).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: /Evangeline/ }))
    expect(sheet.textContent).toMatch(/It was not Evangeline/)
    expect(sheet.textContent).not.toMatch(/Yuki|Lena/)
  })

  it('shows no motive line before the solve', () => {
    render(<Casebook puzzle={easy} />)
    expect(document.body.textContent).not.toContain('Eleven seasons')
  })
})

describe('case source', () => {
  it('prefers an injected puzzle over the catalogue, by id', () => {
    const injected = { ...easy, id: 'injected-x', title: 'Injected' } as Puzzle
    registerCase(injected)
    expect(resolveCase('injected-x')?.title).toBe('Injected')
  })
})
