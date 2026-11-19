import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { case0 as p, case0Story } from '../../src/tutorial/case0'
import CasebookRoute from '../../src/casebook/Route'
import Offer from '../../src/tutorial/Offer'
import Tutorial from '../../src/tutorial/Tutorial'
import { readTutorialFlag, TUTORIAL_KEY, writeTutorialFlag } from '../../src/tutorial/storage'

const reduced = (on: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))

const cellAt = (r: number, c: number) => document.querySelector<HTMLElement>(`[role=gridcell][data-row="${r}"][data-col="${c}"]`)!
const instruction = () => screen.getByTestId('instruction').textContent
const chip = (name: RegExp) => screen.getAllByRole('button').find(b => b.className.includes('cb-chip') && name.test(b.textContent ?? ''))!
const halo = () => document.querySelector('.tut-root .cb-root')?.getAttribute('data-halo') ?? ''

beforeEach(() => reduced(false))
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/') })

describe('Case 0 on screen', () => {
  it('opens on the prologue: the premise, the investigator line, a way in and a way out, and no instruction yet', () => {
    render(<Tutorial />)
    const card = screen.getByRole('group', { name: 'Prologue' })
    expect(card).toHaveTextContent(case0Story.premise)
    // the investigator names the victim, not a pronoun
    expect(card).toHaveTextContent('whose true account leaves a suspect alone with Marco.')
    expect(card.textContent).not.toMatch(/{V}|him|them/)
    expect(within(card).getByRole('button', { name: /Begin/ })).toBeInTheDocument()
    const skip = screen.getByRole('link', { name: 'Skip — I know how to play' })
    expect(skip).toHaveAttribute('href', '?casebook=')
    expect(halo()).toBe('')
  })

  it('skipping stores a flag so the picker stops offering Case 0', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('link', { name: /Skip/ }))
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('skipped')
  })

  it('keeps the board, the statements and the rail on screen while it teaches, and halos the first statement', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Suspects' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: "Lena's statements" })).toBeInTheDocument()
    expect(instruction()).toBe('Tap a statement — the lamp shows where it can be true.')
    expect(halo()).toContain('chip-0')
    // no modal covers the board while a beat is on
    expect(document.querySelector('[role=dialog]')).toBeNull()
    // read out from a live region that existed before the beat, and focus lands on the line after Begin
    expect(screen.getByTestId('beat-live')).toHaveTextContent('Step 1 of 8. Tap a statement — the lamp shows where it can be true.')
    expect(screen.getByTestId('beat-live')).toHaveAttribute('aria-live', 'polite')
  })

  it('plays all eight beats from the on-screen text alone, hears the roll-call, and stores done', async () => {
    reduced(true)
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))

    fireEvent.click(chip(/clock/))
    expect(instruction()).toBe('Only one square fits. Tap it to place her.')
    expect(cellAt(3, 0).dataset.lens).toBe('lit')
    fireEvent.click(cellAt(3, 0))

    expect(instruction()).toBe('Now this statement can be measured — tap it.')
    expect(halo()).toContain('chip-0')
    fireEvent.click(chip(/north of Lena/))
    // placing Tomas is two taps, and the text says so: first his other statement, then the square
    expect(instruction()).toBe('Placing Tomas takes two taps. Tap 1: light his other statement.')
    fireEvent.click(chip(/desk/))
    expect(instruction()).toBe('Tap 2: the one lit square places Tomas.')
    expect(halo()).toContain('cell-1-1')
    fireEvent.click(cellAt(1, 1))

    expect(instruction()).toBe('Not sure? Hold a square to suppose.')
    expect(halo()).toContain('cell-0-3')
    // the Suppose button then the square: the same as a hold, and the switch is left on
    fireEvent.click(screen.getByRole('button', { name: 'Suppose' }))
    fireEvent.click(cellAt(0, 3))
    expect(instruction()).toBe('Place the third suspect on the other lit square.')
    expect(screen.getByTestId('readout')).toHaveTextContent('No square left for Marco.')
    fireEvent.click(cellAt(0, 2))
    expect(screen.getByRole('button', { name: 'Suppose' })).toHaveAttribute('aria-pressed', 'false')
    expect(cellAt(0, 2).querySelector('[data-testid=token-p2]')).not.toBeNull()

    expect(instruction()).toBe('Set the scene: tap where the victim was found.')
    fireEvent.click(cellAt(2, 3))
    expect(instruction()).toBe('Who was alone with the victim? Accuse.')
    expect(screen.getByRole('button', { name: 'Accuse' })).toBeEnabled()
    expect(halo()).toContain('bar')

    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    // a wrong name is only an alibi
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tomas' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Tomas has an alibi.')
    expect(screen.getByRole('dialog')).toHaveTextContent('Nothing is counted')
    fireEvent.click(screen.getByRole('button', { name: 'Back to the plan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Accuse' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Lena' }))

    // reduced motion: every alibi at once, ending on the one with none
    const roll = await screen.findByTestId('rollcall')
    expect(roll).toHaveTextContent('Tomas: in the Study')
    expect(roll).toHaveTextContent('Lena: in the Hall, with Marco and no one else. No alibi.')
    expect(roll).toHaveTextContent(case0Story.cast.p0.motive.charAt(0).toLowerCase())
    expect(roll).toHaveTextContent(case0Story.closing!)
    // Case 0 has no reconstruction to show: the casebook's "Show the proof" is simply not offered
    expect(within(roll).queryByRole('button', { name: 'Show the proof' })).toBeNull()
    await waitFor(() => expect(localStorage.getItem(TUTORIAL_KEY)).toBe('done'))

    fireEvent.click(within(roll).getByRole('button', { name: 'Close the case' }))
    expect(screen.getByText('Case 0, closed.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Play a real case' })).toHaveAttribute('href', '?casebook=')
    // replayable
    fireEvent.click(screen.getByRole('button', { name: 'Play Case 0 again' }))
    expect(instruction()).toBe('Tap a statement — the lamp shows where it can be true.')
    expect(document.querySelectorAll('[data-testid^=token-]')).toHaveLength(0)
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('done')
  })

  it('does something else: the instruction stays, nothing is punished, and a portrait is haloed', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Tomas/ }))
    expect(instruction()).toBe('Tap a statement — the lamp shows where it can be true.')
    expect(halo()).toContain('who-0')
    fireEvent.click(screen.getByRole('button', { name: 'Pencil' }))
    fireEvent.click(cellAt(0, 0))
    expect(instruction()).toBe('Tap a statement — the lamp shows where it can be true.')
    expect(screen.queryByLabelText(/strikes/)).toBeNull()
  })

  it('Why? says something: the casebook hint shows in the slot', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Why?' }))
    expect(screen.getByTestId('readout').textContent!.length).toBeGreaterThan(instruction()!.length)
    expect(screen.getByTestId('readout')).toHaveTextContent(/Lena/)
  })

  it('writes no murdoku_* key and no casebook save', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    fireEvent.click(chip(/clock/))
    fireEvent.click(cellAt(3, 0))
    expect(Object.keys(localStorage).filter(k => k !== 'alibi_theme')).toEqual([])
  })
})

describe('the picker offer', () => {
  it('shows "New here? Play Case 0 (90 s)" while no flag is stored, and links to ?tutorial', () => {
    render(<Offer />)
    const link = screen.getByRole('link', { name: /New here\? Play Case 0 \(90 s\)/ })
    expect(link).toHaveAttribute('href', '?tutorial')
  })

  it('dismissing it hides it and stores a flag; a stored flag hides it from the start', () => {
    const { unmount } = render(<Offer />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('link')).toBeNull()
    expect(readTutorialFlag()).toBe('dismissed')
    unmount()
    render(<Offer />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('a finished walk-through is never downgraded by a later skip or dismissal', () => {
    writeTutorialFlag('done')
    writeTutorialFlag('skipped')
    writeTutorialFlag('dismissed')
    expect(readTutorialFlag()).toBe('done')
  })

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(readTutorialFlag()).toBeNull()
    expect(() => writeTutorialFlag('done')).not.toThrow()
    vi.restoreAllMocks()
  })
})

describe('the picker offers Case 0 itself', () => {
  it('the casebook picker carries the offer, and an unknown case id does not', () => {
    const { unmount } = render(<CasebookRoute caseId="" />)
    expect(screen.getByRole('link', { name: /Play Case 0/ })).toHaveAttribute('href', '?tutorial')
    unmount()
    render(<CasebookRoute caseId="no-such-case" />)
    expect(screen.getByText(/No case called/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Play Case 0/ })).toBeNull()
  })
})

describe('Case 0 is the casebook with a coach', () => {
  it('shows the step counter in place of the accusation marks, and no case file, how-to or save', () => {
    render(<Tutorial />)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    expect(screen.getByLabelText('Step 1 of 8')).toHaveTextContent('1 / 8')
    expect(document.querySelector('.cb-strikes')).toBeNull()
    expect(screen.queryByRole('button', { name: /Case file/ })).toBeNull()
    expect(screen.queryByText(/Tap a square to place/)).toBeNull()
  })

  it('keeps the desk behind the prologue out of reach, and out of the live region', () => {
    render(<Tutorial />)
    expect(document.querySelector('.cb-body')).toHaveAttribute('inert')
    expect(screen.getByTestId('beat-live')).toBeEmptyDOMElement()
    fireEvent.click(cellAt(3, 0))
    expect(document.querySelectorAll('[data-testid^=token-]')).toHaveLength(0)
  })
})

describe('routes', () => {
  it('?tutorial renders Case 0 through App, lazy-loaded', async () => {
    window.history.replaceState(null, '', '/?tutorial')
    render(<App />)
    expect(await screen.findByRole('group', { name: 'Prologue' }, { timeout: 8000 })).toBeInTheDocument()
    await act(async () => {})
  })

  it('?casebook= offers Case 0 beside the picker until a flag is stored', async () => {
    window.history.replaceState(null, '', '/?casebook=')
    render(<App />)
    expect(await screen.findByRole('link', { name: /Play Case 0/ }, { timeout: 8000 })).toHaveAttribute('href', '?tutorial')
    cleanup()
    localStorage.setItem(TUTORIAL_KEY, 'done')
    render(<App />)
    await screen.findByText('Everyone told the truth. Pick a case.', undefined, { timeout: 8000 })
    expect(screen.queryByRole('link', { name: /Play Case 0/ })).toBeNull()
  })

  it('?casebook=<id> does not carry the offer', async () => {
    window.history.replaceState(null, '', '/?casebook=very-easy-3')
    render(<App />)
    await screen.findByRole('grid', undefined, { timeout: 8000 })
    expect(screen.queryByRole('link', { name: /Play Case 0/ })).toBeNull()
  })
})

// Keeps the puzzle import honest: the screen must be playing the verified case.
it('plays the one verified case', () => {
  render(<Tutorial />)
  expect(p.id).toBe('case-0')
  expect(screen.getAllByRole('gridcell')).toHaveLength(16)
})
