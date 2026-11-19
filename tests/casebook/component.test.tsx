import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// The baked JSON is imported directly: going through core/catalog would call
// initCatalog, which touches murdoku_* keys, and this test proves the slice does not.
import baked from '../../src/data/catalog.generated.json'
import type { Puzzle } from '../../src/core/types'
import Casebook from '../../src/casebook/Casebook'
import CasebookRoute from '../../src/casebook/Route'
import { pickerCases, registerCase, resolveCase } from '../../src/casebook/cases'
import { leadCases } from '../../src/casebook/deep'
import { titleFor } from '../../src/casebook/stories'
import { saveKey } from '../../src/casebook/save'
import { THEME_KEY } from '../../src/casebook/theme'

const easy = (baked as unknown as Puzzle[]).find(p => p.id === 'very-easy-3') as Puzzle
afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals() })

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
    expect(sheet.textContent).toMatch(/Evangeline has an alibi./)
    expect(sheet.textContent).not.toMatch(/It was not/)
    expect(sheet.textContent).not.toMatch(/Yuki|Lena/)
    // no position, room, floor or square leaks into the sheet or onto the plan
    expect(sheet.textContent).not.toMatch(/row|column|upstairs|ground|wall|hallway|kitchen/i)
    expect(document.querySelectorAll('[data-testid^=token-]')).toHaveLength(0)
  })

  it('shows no motive line before the solve', () => {
    render(<Casebook puzzle={easy} />)
    expect(document.body.textContent).not.toContain('Eleven seasons')
  })
})


/** Place everyone on the true plan, then name the murderer. */
function solveAndAccuse() {
  for (const x of easy.people) {
    const c = easy.solution[x.id]
    fireEvent.click(cellAt(c.row, c.col))
  }
  fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
  const sheet = screen.getByRole('dialog')
  const murderer = easy.people.find(x => x.id === easy.murdererId)!.name
  fireEvent.click(within(sheet).getByRole('button', { name: new RegExp(murderer) }))
}

describe('alibi roll-call', () => {
  it('replaces the sheet and the replay: dark house, the scene first, then one alibi at a time, then no alibi', () => {
    vi.useFakeTimers()
    render(<Casebook puzzle={easy} />)
    solveAndAccuse()
    const roll = screen.getByTestId('rollcall')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.querySelector('.cb-dusk')).not.toBeNull()
    expect(roll.textContent).toMatch(/Greta was found in the /)
    expect(roll.textContent).not.toMatch(/Cleared|No alibi/)
    // the victim stands on the plan; nobody else yet
    expect(document.querySelectorAll('[data-testid^=token-]')).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(1300) })
    expect(roll.textContent).toMatch(/Cleared./)
    // one clock tick per render: the next step is timed from the render that shows it
    act(() => { vi.advanceTimersByTime(900) })
    act(() => { vi.advanceTimersByTime(900) })
    expect(roll.textContent).toMatch(/No alibi./)
    act(() => { vi.advanceTimersByTime(1600) })
    expect(roll.textContent).toMatch(/Show the proof/)
    expect(roll.textContent).toMatch(/Proved./)
    expect(roll.textContent).toMatch(/Eleven seasons|Everyone told the truth/)
    expect(roll.querySelector('[data-testid^=roll-]')).not.toBeNull()
  })

  it('a tap moves on at once, and Skip jumps to the ending; "Show the proof" opens the solver replay', () => {
    vi.useFakeTimers()
    render(<Casebook puzzle={easy} />)
    solveAndAccuse()
    fireEvent.click(screen.getByTestId('rollcall'))
    expect(screen.getByTestId('rollcall').textContent).toMatch(/Cleared./)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show the proof' }))
    expect(screen.getByRole('region', { name: 'Reconstruction' })).toBeInTheDocument()
  })

  it('reduced motion shows the whole roll-call at once, as a list, with no clock', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
    render(<Casebook puzzle={easy} />)
    solveAndAccuse()
    const list = screen.getByRole('list', { name: 'Alibis' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(easy.people.length)
    expect(list.textContent).toMatch(/Cleared./)
    expect(list.textContent).toMatch(/No alibi./)
    expect(screen.getByRole('button', { name: 'Show the proof' })).toBeInTheDocument()
  })

  it('a wrong name starts no roll-call and reveals no position', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    const wrong = easy.people.find(x => x.id !== easy.murdererId && x.id !== easy.victimId)!
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(wrong.name) }))
    expect(screen.queryByTestId('rollcall')).toBeNull()
    expect(document.querySelector('.cb-dusk')).toBeNull()
    expect(screen.getByRole('dialog')).toHaveTextContent(`${wrong.name} has an alibi.`)
  })
})

describe('play surface cuts', () => {
  it('has no "Depth" label, no mute icon on the play surface, and an overflow menu with Sound and Theme', () => {
    render(<Casebook puzzle={easy} />)
    expect(document.body.textContent).not.toMatch(/Depth|Case No./)
    expect(document.querySelector('.cb-sound')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitemcheckbox', { name: /Sound/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Theme/ })).toBeInTheDocument()
  })

  it('writes the theme choice under its own key, and only when it is toggled', () => {
    render(<Casebook puzzle={easy} />)
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Theme/ }))
    expect(['dark', 'light']).toContain(localStorage.getItem(THEME_KEY))
    expect(Object.keys(localStorage).filter(k => k.startsWith('murdoku_'))).toEqual([])
  })

  it('shows the how-to line only before the first placement, and no "to place" captions', () => {
    render(<Casebook puzzle={easy} />)
    expect(screen.getByTestId('readout').textContent).toMatch(/Tap a square to place/)
    expect(document.querySelector('.cb-rail')!.textContent).not.toMatch(/to place|placed|fits/)
    fireEvent.click(cellAt(5, 0))
    expect(screen.getByTestId('readout').textContent).not.toMatch(/Tap a square to place/)
  })

  it('fills the row and column numerals for a lane someone holds', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(cellAt(5, 0))
    const taken = [...document.querySelectorAll('.cb-num[data-taken]')].map(e => e.textContent)
    expect(taken.sort()).toEqual(['1', '6'])
  })
})

describe('case source', () => {
  it('prefers an injected puzzle over the catalogue, by id', () => {
    const injected = { ...easy, id: 'injected-x', title: 'Injected' } as Puzzle
    registerCase(injected)
    expect(resolveCase('injected-x')?.title).toBe('Injected')
  })
})

describe('casebook route', () => {
  it.each(['', 'hard-2', 'very-easy-3', 'depth-d-189', 'depth-b-95', 'no-such-case'])('loading ?casebook=%s writes no murdoku_* key', async id => {
    localStorage.clear()
    render(<CasebookRoute caseId={id} />)
    // let the lazy avatar and board chunks settle
    await new Promise(r => setTimeout(r, 50))
    expect(Object.keys(localStorage).filter(k => k.startsWith('murdoku_'))).toEqual([])
  })

  it('the picker leads with the deep cases (generated, else the fixtures), then the two baked picks', () => {
    render(<CasebookRoute caseId="" />)
    const titles = [...document.querySelectorAll('.cb-case-title')].map(e => e.textContent)
    const lead = leadCases().map(p => titleFor(p))
    expect(titles.slice(0, lead.length)).toEqual(lead)
    expect(titles.slice(lead.length)).toEqual(['Ashes at Midnight', 'A Fatal Rehearsal'])
    expect(titles.slice(0, 12)).toEqual(['A Pinch of Salt', 'The Auction of Small Hours', 'Matins for the Absent', 'Rivets and Rumours', 'The Falling Glass', 'Lace in the Dark', 'Second Feature', 'The Mill Stops Grinding', 'Meridian Lines', 'The Brass Section', 'The Short Manifest', 'The Last Peal'])
    expect(titles).toHaveLength(pickerCases().length)
  })
})
