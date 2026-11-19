import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Casebook from '../../src/casebook/Casebook'
import { firstName } from '../../src/casebook/cells'
import { deep, leadCases } from '../../src/casebook/deep'
import { STORIES } from '../../src/casebook/stories'
import type { Puzzle } from '../../src/core/types'
import { easy } from './fixtures'

afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals() })

const cellAt = (r: number, c: number) => document.querySelector<HTMLElement>(`[role=gridcell][data-row="${r}"][data-col="${c}"]`)!
const accuse = (p: Puzzle, id: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(p, id)) }))
}

describe('a right name goes straight into the roll-call; the verdict is the payoff', () => {
  it('over an unfinished plan: no sheet, no verdict word, no murderer named, until the end', () => {
    vi.useFakeTimers()
    render(<Casebook puzzle={easy} />)
    accuse(easy, easy.murdererId)
    expect(screen.queryByRole('dialog')).toBeNull()
    const roll = screen.getByTestId('rollcall')
    expect(roll).toBeInTheDocument()
    // before the end: the scene is read out, and no verdict word anywhere (visible or announced)
    expect(roll.textContent).toMatch(/was found in the/)
    expect(document.body.textContent).not.toMatch(/Proved|Called it/)
    expect(screen.getByRole('status').textContent).not.toMatch(/Proved|Called it|alone with/)
    // no "murderer" language and no motive yet
    expect(roll.textContent).not.toMatch(/Eleven seasons|alone with/)
    act(() => { vi.advanceTimersByTime(1300) })
    act(() => { vi.advanceTimersByTime(900) })
    expect(document.body.textContent).not.toMatch(/Proved|Called it/)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    // the payoff: the verdict word, and the murderer's name with the motive
    expect(roll.textContent).toMatch(/Called it\./)
    expect(roll.querySelector('.cb-roll-motive')!.textContent).toContain(firstName(easy, easy.murdererId))
  })

  it('over the finished plan: the same, and the verdict word is "Proved"', () => {
    vi.useFakeTimers()
    render(<Casebook puzzle={easy} />)
    for (const x of easy.people) fireEvent.click(cellAt(easy.solution[x.id].row, easy.solution[x.id].col))
    accuse(easy, easy.murdererId)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Proved|Called it/)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByTestId('rollcall').textContent).toMatch(/Proved\./)
  })

  it('shows the faces in the cast order, so the last face is not the one left', () => {
    render(<Casebook puzzle={easy} />)
    accuse(easy, easy.murdererId)
    const faces = [...document.querySelectorAll('.cb-roll-faces li')].map(li => li.getAttribute('data-testid'))
    expect(faces).toEqual(easy.people.filter(x => x.id !== easy.victimId).map(x => `roll-${x.id}`))
  })

  it('offers no "Finish the plan" or "Hear the alibis instead" on a right name', () => {
    render(<Casebook puzzle={easy} />)
    accuse(easy, easy.murdererId)
    expect(screen.queryByRole('button', { name: /Finish the plan|alibis instead/ })).toBeNull()
  })
})

describe('a wrong name shows the count, in the word "accusations"', () => {
  it('says "1 of 3 accusations used" on screen, with three marks', () => {
    render(<Casebook puzzle={easy} />)
    const wrong = easy.people.find(x => x.id !== easy.murdererId && x.id !== easy.victimId)!
    accuse(easy, wrong.id)
    const used = within(screen.getByRole('dialog')).getByTestId('accusations-used')
    expect(used.textContent).toBe('1 of 3 accusations used.')
    expect(used.querySelectorAll('i')).toHaveLength(3)
    expect(used.querySelectorAll('i[data-on]')).toHaveLength(1)
    expect(screen.getByRole('dialog').textContent).not.toMatch(/strike/i)
  })

  it('never says "strike" in the copy, the aria, or the live region', () => {
    render(<Casebook puzzle={easy} />)
    expect(screen.getByLabelText('0 of 3 accusations used')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    expect(screen.getByRole('dialog').textContent).toMatch(/Three wrong accusations and the case goes cold\./)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(firstName(easy, easy.people.find(x => x.id !== easy.murdererId && x.id !== easy.victimId)!.id)) }))
    fireEvent.click(screen.getByRole('button', { name: 'Back to the plan' }))
    expect(screen.getByLabelText('1 of 3 accusations used')).toBeInTheDocument()
    expect(screen.getByRole('status').textContent).toMatch(/has an alibi. 1 of 3 accusations used.$/)
    const said = [document.body.textContent, ...[...document.querySelectorAll('[aria-label],[title]')].map(e => `${e.getAttribute('aria-label')} ${e.getAttribute('title')}`)].join(' ')
    expect(said).not.toMatch(/strike/i)
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    expect(screen.getByRole('dialog').textContent).toMatch(/1 of 3 accusations used\./)
  })
})

describe('a shared lane is marked in ink, never in red pencil', () => {
  it('marks both tokens with a notch and strikes the row badge of a row held twice', () => {
    render(<Casebook puzzle={easy} />)
    // two people in one row: p0 at (5,0), then p1 on the same row
    fireEvent.click(cellAt(5, 0))
    fireEvent.click(cellAt(5, 3))
    const notches = document.querySelectorAll('[data-testid^=token-] .cb-notch')
    expect(notches).toHaveLength(2)
    expect(document.querySelectorAll('.cb-clash')).toHaveLength(0)
    const struck = [...document.querySelectorAll('.cb-num[data-clash]')].map(e => e.textContent)
    expect(struck).toEqual(['6'])
    // the rail carries the same mark, and says so
    expect(document.querySelectorAll('.cb-who .cb-notch')).toHaveLength(2)
    expect(document.querySelectorAll('.cb-who[data-bad]')).toHaveLength(2)
    // lifting one clears every mark (the first tap selects the person standing there, the second lifts them)
    fireEvent.click(cellAt(5, 3))
    fireEvent.click(cellAt(5, 3))
    expect(document.querySelectorAll('.cb-notch')).toHaveLength(0)
    expect(document.querySelectorAll('.cb-num[data-clash]')).toHaveLength(0)
  })

  it('a column held twice strikes the column badge, and a lane held once is not struck', () => {
    render(<Casebook puzzle={easy} />)
    fireEvent.click(cellAt(1, 2))
    expect(document.querySelectorAll('.cb-num[data-clash]')).toHaveLength(0)
    fireEvent.click(cellAt(4, 2))
    expect([...document.querySelectorAll('.cb-num[data-clash]')].map(e => e.textContent)).toEqual(['3'])
  })
})

describe('the end card never drops "No alibi" and always scrolls clear of its buttons', () => {
  it.each(['pt-12', 'pt-01'])('%s: the ending is one scroll region above a separate bar', id => {
    const p = leadCases().find(x => x.id === id) as Puzzle
    render(<Casebook puzzle={p} />)
    accuse(p, p.murdererId)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    const roll = screen.getByTestId('rollcall')
    const body = roll.querySelector('.cb-roll-body') as HTMLElement
    expect(body.getAttribute('role')).toBe('region')
    expect(body.tabIndex).toBe(0)
    // the line, the verdict, the motive and the whole closing are inside the region
    expect(body.textContent).toMatch(/No alibi\./)
    expect(body.textContent).toMatch(/Proved|Called it/)
    expect(body.querySelector('.cb-roll-closing')!.textContent).toBe(
      STORIES[id].closing!.replace('{M}', firstName(p, p.murdererId)).replace('{V}', firstName(p, p.victimId)),
    )
    // the buttons are a sibling of the region, so nothing can run under them
    const bar = roll.querySelector('.cb-roll-bar') as HTMLElement
    expect(body.contains(bar)).toBe(false)
    expect(within(bar).getByRole('button', { name: 'Close the case' })).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Show the proof' })).toBeInTheDocument()
  })
})

describe('the cross-floor lens cue', () => {
  const d189 = deep().find(p => p.id === 'depth-d-189') as Puzzle
  const oscar = d189.people.find(p => p.id === 'p5')!

  it('says where the lit squares are when the floor in view has none, and the button flips to them', () => {
    render(<Casebook puzzle={d189} />)
    fireEvent.click(within(screen.getByRole('list', { name: 'Suspects' })).getByRole('button', { name: new RegExp(`^${oscar.name}`) }))
    expect(screen.queryByTestId('lens-cue')).toBeNull()
    // "Upstairs" lights squares on the upper floor only: the first light brings that floor into view
    fireEvent.click(within(screen.getByRole('list', { name: /statements/ })).getByRole('button', { name: 'Upstairs' }))
    const floors = within(screen.getByRole('group', { name: 'Floor' })).getAllByRole('button')
    expect(floors[1]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('lens-cue')).toBeNull()
    // looking at the ground floor, the board is dark: the readout says so
    fireEvent.click(floors[0])
    const cue = screen.getByTestId('lens-cue')
    expect(cue.textContent).toMatch(/Lit squares are Upstairs\./)
    fireEvent.click(within(cue).getByRole('button', { name: /Show upstairs/ }))
    expect(floors[1]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('lens-cue')).toBeNull()
  })
})
