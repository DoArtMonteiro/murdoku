import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Game from '../../src/lie/Game'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { COACH_KEY } from '../../src/lie/coach'
import { saveKey } from '../../src/lie/save'
import { SOUND_KEY } from '../../src/lie/sound'

const NAMES: Record<string, string> = { a: 'Ana', b: 'Bruno', c: 'Cleo', d: 'Davi', v: 'Ines' }

const begin = () => fireEvent.click(screen.getByRole('button', { name: 'Begin' }))
const pick = (id: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${NAMES[id]}`) }))
const tile = (row: number, col: number) => fireEvent.click(screen.getByRole('gridcell', { name: new RegExp(`^Row ${row + 1}, column ${col + 1}\\.`) }))
const put = (id: string, row: number, col: number) => { pick(id); tile(row, col) }
const doubt = (text: string, who: string) => {
  fireEvent.click(screen.getByRole('button', { name: `Doubt ${who}'s statement: ${text}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Doubt it' }))
}

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-theme') })

describe('opening', () => {
  it('states the premise and the row and column rule once, then gets out of the way', () => {
    render(<Game lieCase={C} />)
    const d = screen.getByRole('dialog')
    expect(within(d).getByText(/Exactly one statement in all of them is false/)).toBeInTheDocument()
    expect(within(d).getByText(/row and a column of their own/)).toBeInTheDocument()
    begin()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('direction A says everyone told the truth and offers no doubt', () => {
    render(<Game lieCase={C} truthOnly />)
    expect(screen.getAllByText(/Everyone told the truth/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/false/i)).toBeNull()
    begin()
    pick('a')
    expect(screen.queryByText('I was in the Net Loft.')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Doubt / })).toBeNull()
  })
})

describe('playing', () => {
  it('places a suspect, and says so', () => {
    render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    expect(screen.getByRole('status')).toHaveTextContent('Bruno placed, row 1, column 1.')
    expect(screen.getByRole('button', { name: /^Bruno, placed/ })).toBeInTheDocument()
  })

  it('lights a statement and marks it', () => {
    render(<Game lieCase={C} />)
    begin()
    pick('a')
    fireEvent.click(screen.getByText('I was against a wall.'))
    expect(screen.getAllByRole('gridcell', { name: /A statement can hold here\./ }).length).toBeGreaterThan(0)
    expect(screen.getByText('Lit on the plan')).toBeInTheDocument()
  })

  it('two collisions fill the ledger and make the murderer glow, without naming a liar', () => {
    render(<Game lieCase={C} />)
    begin()
    expect(screen.queryByRole('region', { name: 'Contradictions' })).toBeNull()
    put('b', 0, 0)
    expect(screen.getByRole('region', { name: 'Contradictions' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent("These accounts can't all be true.")
    expect(screen.getByRole('button', { name: /^Ana/ })).not.toHaveAttribute('data-common')
    put('d', 3, 1)
    expect(within(screen.getByRole('region', { name: 'Contradictions' })).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /^Ana.*in every contradiction/ })).toHaveAttribute('data-common')
    expect(screen.getByRole('button', { name: /^Bruno/ })).not.toHaveAttribute('data-common')
    expect(document.body.textContent).not.toMatch(/liar/i)
  })

  it('keeps the notes after undo', () => {
    render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('region', { name: 'Contradictions' })).toBeInTheDocument()
  })

  it('shows the coach beats on a first play and keeps quiet once dismissed', () => {
    const { unmount } = render(<Game lieCase={C} />)
    begin()
    expect(screen.getByText('Tap a suspect, then a statement: the plan shows where it can be true.')).toBeInTheDocument()
    put('b', 0, 0)
    // the first collision arrives with the third beat
    expect(screen.getByText(/find a second collision/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss hint' }))
    expect(localStorage.getItem(COACH_KEY)).toBe('1')
    unmount()
    render(<Game lieCase={C} />)
    expect(screen.queryByText(/Tap a suspect, then a statement/)).toBeNull()
    expect(screen.queryByText(/One person per row and column./)).toBeNull()
  })
})

describe('doubting', () => {
  it('a wrong doubt shows its own line even while the third beat is up', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    expect(container.querySelector('.ofa-line')).toHaveTextContent(/find a second collision/)
    pick('d')
    doubt('I was north of Ana.', 'Davi')
    expect(container.querySelector('.ofa-line')).toHaveTextContent('That account stands.')
  })

  it('a wrong doubt says the account stands; the second ends the case cold, restartable', () => {
    render(<Game lieCase={C} />)
    begin()
    pick('d')
    doubt('I was north of Ana.', 'Davi')
    expect(screen.getAllByText('That account stands.').length).toBeGreaterThan(0)
    expect(screen.getByText('Stands')).toBeInTheDocument()
    doubt('I was beside the plant.', 'Davi')
    expect(screen.getByRole('dialog', { name: 'The case has gone cold.' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Stands')).toBeNull()
  })

  it('scene facts have no doubt button', () => {
    render(<Game lieCase={C} />)
    begin()
    pick('v')
    expect(screen.getByText('Found at the desk.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Doubt / })).toBeNull()
  })

  it('the right doubt cracks the lie; the rebuilt plan closes the case with a reveal', () => {
    render(<Game lieCase={C} />)
    begin()
    put('a', 0, 2)
    pick('a')
    doubt('I was in the Net Loft.', 'Ana')
    expect(screen.getAllByText('Then where were you, really?').length).toBeGreaterThan(0)
    expect(screen.getByText('Cracked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Ana/ })).not.toHaveAttribute('aria-label', expect.stringContaining('placed'))
    // there is no Accuse anywhere: the plan closes the case by itself
    expect(screen.queryByRole('button', { name: /accuse/i })).toBeNull()
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    const reveal = screen.getByRole('region', { name: 'The case, closed' })
    expect(within(reveal).getByText('Proved')).toBeInTheDocument()
    expect(within(reveal).getAllByText(/cleared by their own account/)).toHaveLength(3)
    expect(within(reveal).getByText(/said/)).toHaveTextContent('Ana said “I was in the Net Loft.”')
    expect(reveal).toHaveTextContent("Bruno's and Davi's accounts say otherwise.")
  })

  it('a wrong doubt first makes it "Proved, after a false start"', () => {
    render(<Game lieCase={C} />)
    begin()
    pick('d')
    doubt('I was north of Ana.', 'Davi')
    pick('a')
    doubt('I was in the Net Loft.', 'Ana')
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    expect(screen.getByText('Proved, after a false start')).toBeInTheDocument()
  })

  it('does not close in Act 1 even when the plan is the true one', () => {
    render(<Game lieCase={C} />)
    begin()
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    expect(screen.queryByRole('region', { name: 'The case, closed' })).toBeNull()
  })
})

describe('storage, sound and the page', () => {
  it('saves under its own key, restores after a remount and skips the opening for a case in progress', () => {
    const { unmount } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    unmount()
    expect(localStorage.getItem(saveKey('fixture', false))).toContain('"b"')
    render(<Game lieCase={C} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('gridcell', { name: /^Row 1, column 1\..*Bruno/ })).toBeInTheDocument()
  })

  it('sound is off until the player turns it on', () => {
    render(<Game lieCase={C} />)
    begin()
    expect(localStorage.getItem(SOUND_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('menuitemcheckbox', { name: /Sound/ })).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Sound/ }))
    expect(localStorage.getItem(SOUND_KEY)).toBe('1')
  })

  it('writes no style element and touches no other mode\'s storage keys', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    expect(container.querySelectorAll('style')).toHaveLength(0)
    for (const k of Object.keys(localStorage)) expect(k).toMatch(/^alibi_ofa_/)
  })

  it('sets the theme on the document root for the tokens', () => {
    render(<Game lieCase={C} />)
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'))
  })
})
