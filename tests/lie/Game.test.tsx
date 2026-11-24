import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Game from '../../src/lie/Game'
import { LIE_FIXTURE as C } from '../../src/lie/fixture'
import { COACH_KEY } from '../../src/lie/coach'
import { saveKey } from '../../src/lie/save'
import { SOUND_KEY } from '../../src/lie/sound'

const NAMES: Record<string, string> = { a: 'Ana', b: 'Bruno', c: 'Cleo', d: 'Davi', v: 'Ines' }
const TEXT: Record<string, string> = Object.fromEntries(C.statements.map(s => [s.id, s.text]))
const AUTHOR: Record<string, string> = Object.fromEntries(C.statements.map(s => [s.id, NAMES[s.author]]))

const begin = () => fireEvent.click(screen.getByRole('button', { name: 'Begin' }))
const people = () => within(screen.getByRole('list', { name: 'People' }))
const pick = (id: string) => fireEvent.click(people().getByRole('button', { name: new RegExp(`^${NAMES[id]}`) }))
const tile = (row: number, col: number) => fireEvent.click(screen.getByRole('gridcell', { name: new RegExp(`^Row ${row + 1}, column ${col + 1}\\.`) }))
const put = (id: string, row: number, col: number) => { pick(id); tile(row, col) }
/** Pin a statement from its speaker's card. */
const pin = (sid: string) => {
  pick(C.statements.find(s => s.id === sid)!.author)
  fireEvent.click(screen.getByRole('button', { name: `Pin ${AUTHOR[sid]}'s statement: ${TEXT[sid]}` }))
}
const cite = () => fireEvent.click(screen.getByRole('button', { name: "These can't all be true" }))
const ledger = () => within(screen.getByRole('region', { name: 'Contradictions' }))
const line = () => document.querySelector('.ofa-line[data-kind="event"]')
const record = (...ids: string[]) => { ids.forEach(pin); cite() }
const proveBoth = () => { record(...C.collisions[0]); record(...C.collisions[1]) }
const doubtFromLedger = (name: string) => {
  fireEvent.click(ledger().getAllByRole('button', { name })[0])
  fireEvent.click(screen.getByRole('button', { name: 'Doubt this' }))
}

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-theme') })

describe('the first minute', () => {
  it('shows the premise, one line to do and a single Begin, then opens on the first suspect with a statement lit', () => {
    render(<Game lieCase={C} />)
    const d = screen.getByRole('dialog')
    expect(within(d).getByText('Ines was found at her desk in the counting-house. Everyone was asked where they had been.')).toBeInTheDocument()
    expect(within(d).getByText('One of them lied. Prove which.')).toBeInTheDocument()
    expect(within(d).getAllByRole('button')).toHaveLength(1)
    expect(d.textContent).not.toMatch(/row and a column|collide|pin|doubt/i)
    begin()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^I was against a wall\./ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Tap a statement: the plan shows where it can hold.')).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell', { name: /A statement can hold here\./ }).length).toBeGreaterThan(0)
  })

  it('"How it works" in the menu says what beside means and that scene facts are evidence', () => {
    render(<Game lieCase={C} />)
    begin()
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /How it works/ }))
    const d = screen.getByRole('dialog', { name: 'How it works' })
    expect(d).toHaveTextContent(/next to it, in the same room/)
    expect(d).toHaveTextContent(/one person per row and per column/)
    expect(d).toHaveTextContent(/Scene facts are evidence/)
  })

  it('hidden harness says everyone told the truth and has nothing to pin', () => {
    render(<Game lieCase={C} truthOnly />)
    expect(screen.getAllByText(/Everyone told the truth/).length).toBeGreaterThan(0)
    begin()
    pick('a')
    expect(screen.queryByText('I was in the Net Loft.')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Pin / })).toBeNull()
  })
})

describe('a silent bench', () => {
  it('placing clashing people writes nothing down: no ledger, no line, no glow', () => {
    render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    put('d', 3, 1)
    expect(screen.queryByRole('region', { name: 'Contradictions' })).toBeNull()
    expect(line()).toBeNull()
    expect(document.querySelector('[data-common]')).toBeNull()
    expect(document.body.textContent).not.toMatch(/in every contradiction|liar/i)
    expect(document.querySelector('.lp-crack, [class*="crack"]')).toBeNull()
  })

  it('a ruled-out tile is refused with a short message, and the second beat appears', () => {
    render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    put('c', 0, 3)
    expect(line()).toHaveTextContent('Bruno already holds that row.')
    expect(screen.getByText('One person per row and per column.')).toBeInTheDocument()
    tile(1, 0)
    expect(line()).toHaveTextContent('That column is taken.')
  })

  it('says nowhere fits when a selected, unplaced suspect has no tile for what is lit', () => {
    render(<Game lieCase={C} />)
    begin()
    fireEvent.click(screen.getByRole('button', { name: /^I was in the Net Loft\./ }))
    put('b', 0, 0)
    put('d', 1, 1)
    pick('a')
    expect(line()).toHaveTextContent('Nowhere fits all of that.')
  })
})

describe('pin, cite, record, doubt', () => {
  it('pinning shows the tray with short chips and the third beat, and the cite button needs two', () => {
    render(<Game lieCase={C} />)
    begin()
    pin('s2')
    const tray = within(screen.getByRole('region', { name: 'Pinned statements' }))
    expect(tray.getByRole('button', { name: 'Unpin Ana · the Net Loft' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "These can't all be true" })).toBeDisabled()
    expect(screen.getByText("Pin the statements that can't all be true, then cite them.")).toBeInTheDocument()
    pin('s1')
    expect(screen.getByRole('button', { name: "These can't all be true" })).toBeEnabled()
    fireEvent.click(tray.getByRole('button', { name: 'Unpin Ana · a wall' }))
    expect(screen.getByRole('button', { name: "These can't all be true" })).toBeDisabled()
  })

  it('scene facts have no pin', () => {
    render(<Game lieCase={C} />)
    begin()
    pick('v')
    expect(screen.getByText('Found at the desk.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Pin / })).toBeNull()
  })

  it('every pin target is at least 44px', () => {
    render(<Game lieCase={C} />)
    begin()
    for (const b of screen.getAllByRole('button', { name: /^Pin Ana/ })) expect(b).toHaveClass('ofa-pin')
    const css = readFileSync('src/lie/game.css', 'utf8')
    const rule = css.match(/\.ofa-pin \{[^}]*\}/)![0]
    expect(Number(rule.match(/ width: (\d+)px/)![1])).toBeGreaterThanOrEqual(44)
    expect(Number(rule.match(/min-height: (\d+)px/)![1])).toBeGreaterThanOrEqual(44)
  })

  it('a satisfiable citation is not recorded, and says so; the hint line comes after two', () => {
    render(<Game lieCase={C} />)
    begin()
    pin('s1')
    pin('s3')
    cite()
    expect(line()).toHaveTextContent('They can all be true.')
    expect(screen.queryByRole('region', { name: 'Contradictions' })).toBeNull()
    cite()
    // events win the line; unpinning-and-moving on shows the hint
    put('b', 0, 0)
    expect(line()).toHaveTextContent('Who is standing in the way?')
  })

  it('after four false citations the plan draws the lines held by placed people', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    pin('s1')
    pin('s3')
    expect(container.querySelectorAll('.lp-sight')).toHaveLength(0)
    for (let i = 0; i < 4; i++) cite()
    pick('c')
    expect(container.querySelectorAll('.lp-sight').length).toBeGreaterThan(0)
  })

  it('a recorded contradiction lands in the ledger as chips in the accessibility tree, with a line', () => {
    render(<Game lieCase={C} />)
    begin()
    record('s1', 's2', 's3')
    expect(line()).toHaveTextContent("Those accounts can't all be true.")
    expect(ledger().getByRole('button', { name: 'Ana · a wall' })).toBeInTheDocument()
    expect(ledger().getByRole('button', { name: 'Ana · the Net Loft' })).toBeInTheDocument()
    expect(ledger().getByRole('button', { name: 'Bruno · on the chair' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pinned statements' })).toBeNull()
  })

  it('one contradiction is not proof, and costs nothing', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    doubtFromLedger('Ana · the Net Loft')
    expect(line()).toHaveTextContent("One contradiction isn't proof")
    expect(screen.queryByRole('region', { name: 'The case, closed' })).toBeNull()
    expect(document.querySelector('[data-act="2"]')).toBeNull()
  })

  it('the full run: pin, cite, record twice, doubt, Act 2, complete', () => {
    const onNext = vi.fn()
    render(<Game lieCase={C} onNext={onNext} />)
    begin()
    put('b', 0, 0)
    proveBoth()
    expect(within(screen.getByRole('region', { name: 'Contradictions' })).getAllByRole('listitem')).toHaveLength(2)
    doubtFromLedger('Ana · the Net Loft')
    // act 2: the lie cracks, the liar token lifts, honest tokens lock, the subtitle asks the next question
    expect(document.querySelector('[data-act="2"]')).not.toBeNull()
    expect(screen.getByText('Then where was Ana?')).toBeInTheDocument()
    expect(screen.getByText('Cracked')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Contradictions · solved/ })).toBeInTheDocument()
    expect(ledger().getAllByText(/Ana · the Net Loft/)[0]).toHaveAttribute('data-struck')
    expect(screen.queryByRole('button', { name: /^Pin / })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Pinned statements' })).toBeNull()
    expect(screen.queryByRole('button', { name: /accuse/i })).toBeNull()
    // Bruno (placed where the true accounts put him) is locked
    pick('b')
    tile(0, 0)
    expect(line()).toHaveTextContent("Bruno's place is settled.")
    for (const [id, cell] of Object.entries(C.puzzle.solution)) if (id !== 'b') put(id, cell.row, cell.col)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    const reveal = screen.getByRole('region', { name: 'The case, closed' })
    expect(within(reveal).getByText('Proved')).toBeInTheDocument()
    fireEvent.click(within(reveal).getByRole('button', { name: 'Next case' }))
    expect(onNext).toHaveBeenCalledOnce()
    expect(JSON.parse(localStorage.getItem('alibi_ofa_solved_v1')!)).toEqual(['fixture'])
  })

  it('a false start changes the tier', () => {
    render(<Game lieCase={C} />)
    begin()
    pin('s1')
    pin('s3')
    cite()
    pin('s1')
    pin('s3')
    proveBoth()
    doubtFromLedger('Ana · the Net Loft')
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByText('Proved, after some false starts')).toBeInTheDocument()
  })

  it('a complete plan that breaks a statement says whose account does not hold', () => {
    render(<Game lieCase={C} />)
    begin()
    proveBoth()
    doubtFromLedger('Ana · the Net Loft')
    put('b', 0, 0); put('c', 1, 4); put('v', 2, 3); put('d', 4, 2); put('a', 3, 1)
    expect(line()?.textContent).toMatch(/^(Ana|Davi)'s account doesn't hold there\.$/)
    expect(screen.queryByRole('region', { name: 'The case, closed' })).toBeNull()
  })

  it('the doubt sheet and How it works never state the method', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    fireEvent.click(ledger().getAllByRole('button', { name: 'Ana · the Net Loft' })[0])
    const sheet = screen.getByRole('dialog')
    expect(sheet.textContent).not.toMatch(/in common|meet|intersect|both|every contradiction|same statement/i)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Not yet' }))
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /How it works/ }))
    expect(screen.getByRole('dialog').textContent).not.toMatch(/in common|meet|intersect|prove it false|every contradiction|same statement/i)
  })

  it('a finished case restores closed at once: the panel, no strip, no sequence to wait for', () => {
    const { unmount } = render(<Game lieCase={C} />)
    begin()
    proveBoth()
    doubtFromLedger('Ana · the Net Loft')
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('list', { name: 'People' })).toBeNull()
    unmount()
    render(<Game lieCase={C} />)
    expect(screen.getByRole('region', { name: 'The case, closed' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
  })

  it('does not close in Act 1 even when the plan is the true one', () => {
    render(<Game lieCase={C} />)
    begin()
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    expect(screen.queryByRole('region', { name: 'The case, closed' })).toBeNull()
    expect(line()).toBeNull()
  })
})

describe('coach', () => {
  it('keeps quiet once dismissed, under its own v2 key', () => {
    const { unmount } = render(<Game lieCase={C} />)
    begin()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss hint' }))
    expect(localStorage.getItem(COACH_KEY)).toBe('1')
    expect(COACH_KEY).toBe('alibi_ofa_coach_v2')
    unmount()
    render(<Game lieCase={C} />)
    expect(screen.queryByText(/Tap a statement: the plan shows/)).toBeNull()
  })
})

describe('storage, sound and the page', () => {
  it('saves under the v2 key, restores pins and the ledger after a remount, and skips the opening', () => {
    const { unmount } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    record(...C.collisions[0])
    pin('s9')
    unmount()
    expect(localStorage.getItem(saveKey('fixture', false))).toContain('"ledger":[["s1","s2","s3"]]')
    render(<Game lieCase={C} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('gridcell', { name: /^Row 1, column 1\..*Bruno/ })).toBeInTheDocument()
    expect(ledger().getByRole('button', { name: 'Ana · a wall' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unpin Davi · north of Ana' })).toBeInTheDocument()
  })

  it('shows the casebook list in the menu with solved marks', () => {
    localStorage.setItem('alibi_ofa_solved_v1', JSON.stringify(['ofa-01']))
    render(<Game lieCase={C} cases={[{ id: 'ofa-01', title: 'The First' }, { id: 'ofa-02', title: 'The Second' }]} />)
    begin()
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Cases/ }))
    const d = screen.getByRole('dialog', { name: 'Cases' })
    expect(within(d).getByRole('link', { name: /The First\s*Solved/ })).toHaveAttribute('href', '?alibi=ofa-01')
    expect(within(d).getByRole('link', { name: /The Second/ })).not.toHaveTextContent('Solved')
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

  it("writes no style element and touches no other mode's storage keys", () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    put('b', 0, 0)
    pin('s1')
    expect(container.querySelectorAll('style')).toHaveLength(0)
    for (const k of Object.keys(localStorage)) expect(k).toMatch(/^alibi_ofa_/)
  })

  it('sets the theme on the document root for the tokens', () => {
    render(<Game lieCase={C} />)
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'))
  })
})
