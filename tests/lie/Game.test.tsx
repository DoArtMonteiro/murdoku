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
// the ledger is one line in the column; this opens it (if it is not open) and looks inside
const ledger = () => {
  const region = screen.getByRole('region', { name: 'Contradictions' })
  const toggle = within(region).getAllByRole('button')[0]
  if (toggle.getAttribute('aria-expanded') !== 'true') fireEvent.click(toggle)
  return within(region)
}
const line = () => document.querySelector('.ofa-line[data-kind="event"]')
const record = (...ids: string[]) => { ids.forEach(pin); cite() }
const proveBoth = () => { record(...C.collisions[0]); record(...C.collisions[1]) }
const doubtChip = (name: string) => ledger().getAllByRole('button', { name: new RegExp(`^Doubt: ${name}`) })[0]
const doubtFromLedger = (name: string) => {
  fireEvent.click(doubtChip(name))
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
    expect(d).toHaveTextContent('No two people stood in the same row or column \u2014 the night watch would have seen them together.')
    expect(d).toHaveTextContent(/share just one statement/)
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
    expect(line()).toHaveTextContent('Bruno already holds that row. No two people stood in the same row or column \u2014 the night watch would have seen them together.')
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
    expect(line()).toHaveTextContent("Start from what can't be doubted: the scene facts and the plan.")
  })

  it('after four false steps a suspect pulses in the strip, and it is never the liar; after six a statement is pinned for the player', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    pin('s1')
    pin('s3')
    expect(container.querySelectorAll('[data-pulse]')).toHaveLength(0)
    for (let i = 0; i < 4; i++) cite()
    const pulsing = container.querySelectorAll('[data-pulse]')
    expect(pulsing).toHaveLength(1)
    expect(pulsing[0].getAttribute('aria-label')).not.toMatch(/^Ana/)
    cite()
    cite()
    expect(line()).toHaveTextContent('Try this one against the others.')
    expect(within(screen.getByRole('region', { name: 'Pinned statements' })).getAllByRole('button', { name: /^Unpin/ })).toHaveLength(3)
  })

  it('an unfounded doubt is a false step, and never ends the case', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    doubtFromLedger('Ana · the Net Loft')
    expect(line()).toHaveTextContent("One contradiction isn't proof: any of its accounts could be the lie.")
    expect(screen.queryByRole('region', { name: 'The case, closed' })).toBeNull()
    expect(document.querySelector('[data-act="2"]')).toBeNull()
  })

  it('with two contradictions the pill invites the comparison, but never marks the shared statement', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    record('s2', 's3', 's5')
    expect(screen.getByRole('button', { name: /Contradictions · 2 — compare them/ })).toBeInTheDocument()
    const rows = ledger().getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    // spotting the overlap is the player's deduction: no badge, no sorting, no count in the label
    for (const r of rows) expect(r.querySelectorAll('[data-shared]')).toHaveLength(0)
    expect(doubtChip('Ana · the Net Loft')).toHaveAttribute('aria-label', 'Doubt: Ana · the Net Loft')
  })

  it('when the ledger can prove something the pill says so, without saying what', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    expect(screen.getByRole('button', { name: /^Contradictions · 1/ })).not.toHaveAttribute('data-ready')
    record(...C.collisions[1])
    const pill = screen.getByRole('button', { name: 'You have enough to accuse. Open your contradictions.' })
    expect(pill).toHaveAttribute('data-ready')
    expect(pill.textContent).not.toMatch(/Ana|Net Loft|lie\b/)
  })

  it('a recorded contradiction lands in the ledger as chips in the accessibility tree, with a line', () => {
    render(<Game lieCase={C} />)
    begin()
    record('s1', 's2', 's3')
    expect(line()).toHaveTextContent("Those accounts can't all be true.")
    expect(doubtChip('Ana · a wall')).toBeInTheDocument()
    expect(doubtChip('Ana · the Net Loft')).toBeInTheDocument()
    expect(doubtChip('Bruno · on the chair')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pinned statements' })).toBeNull()
  })

  it('refusals are specific: one row, rows sharing more than one statement, a statement in only one row', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    record('s2', 's3', 's5')
    doubtFromLedger('Ana · the Net Loft')
    expect(line()).toHaveTextContent('These contradictions share more than one statement. Find another that rules one out.')
    doubtFromLedger('Ana · a wall')
    expect(line()).toHaveTextContent('Only one contradiction names this.')
  })

  it('a refused doubt can be tried against one contradiction too', () => {
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
    expect(ledger().getAllByRole('listitem')).toHaveLength(2)
    doubtFromLedger('Ana · the Net Loft')
    // act 2: the lie cracks, the liar token lifts, honest tokens lock, the subtitle asks the next question
    expect(document.querySelector('[data-act="2"]')).not.toBeNull()
    expect(screen.getByText('Then where was Ana?')).toBeInTheDocument()
    expect(screen.getByText('Cracked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contradictions · solved' })).toBeInTheDocument()
    expect(ledger().getAllByText(/Ana · the Net Loft/)[0].closest('.ofa-chip')).toHaveAttribute('data-struck')
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

  it('the doubt sheet itself says nothing about the method', () => {
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    fireEvent.click(doubtChip('Ana · the Net Loft'))
    const sheet = screen.getByRole('dialog')
    expect(sheet.textContent).not.toMatch(/in common|meet|intersect|both|every contradiction|same statement/i)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Not yet' }))
  })

  it('the back arrow opens the cases, and never leaves for the other game', () => {
    render(<Game lieCase={C} />)
    begin()
    expect(document.querySelector('a[href*="casebook"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cases' }))
    expect(screen.getByRole('dialog', { name: 'Cases' })).toBeInTheDocument()
  })

  it('the first screen teaches the row and column rule in fiction, and the first refusal says it again', () => {
    render(<Game lieCase={C} />)
    expect(within(screen.getByRole('dialog')).getByText('No two people stood in the same row or column.')).toBeInTheDocument()
  })

  it('a lit statement with no tile says so on its row instead of "Lit on the plan"', () => {
    render(<Game lieCase={C} />)
    begin()
    fireEvent.click(screen.getByRole('button', { name: /^I was in the Net Loft\./ }))
    put('b', 0, 0)
    put('d', 1, 1)
    pick('a')
    expect(screen.getAllByText('Nowhere fits').length).toBeGreaterThan(0)
    expect(screen.queryByText('Lit on the plan')).toBeNull()
  })

  it('the band keeps its place: the line slot and the band are there before, and after, a pin', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    expect(container.querySelectorAll('.ofa-line-slot, .ofa-band')).toHaveLength(2)
    pin('s1')
    pin('s2')
    cite()
    expect(container.querySelectorAll('.ofa-line-slot, .ofa-band')).toHaveLength(2)
  })

  it('the playtest notes are in the menu, readable, and copy to the clipboard', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true })
    render(<Game lieCase={C} />)
    begin()
    record(...C.collisions[0])
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Playtest notes/ }))
    const d = screen.getByRole('dialog', { name: 'Playtest notes' })
    expect(d).toHaveTextContent('fixture "The Quiet Quay"')
    expect(d).toHaveTextContent(/first recorded contradiction \+0:0\d/)
    expect(d).toHaveTextContent(/citations: \+0:0\d minimal/)
    fireEvent.click(within(d).getByRole('button', { name: 'Copy my notes' }))
    await within(d).findByText('Copied.')
    expect(write).toHaveBeenCalledOnce()
    expect(write.mock.calls[0][0]).toContain('playtest notes')
  })

  it('after the last case there is an end card with a copy button, not a Next case', () => {
    render(<Game lieCase={C} />)
    begin()
    proveBoth()
    doubtFromLedger('Ana · the Net Loft')
    for (const [id, cell] of Object.entries(C.puzzle.solution)) put(id, cell.row, cell.col)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('button', { name: 'Next case' })).toBeNull()
    const end = screen.getByRole('region', { name: "That's every case for now" })
    expect(within(end).getByRole('button', { name: 'Copy my notes' })).toBeInTheDocument()
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

describe('coach order', () => {
  it('beats never go backwards: once the player has pinned or cited, beat 1 does not return', () => {
    render(<Game lieCase={C} />)
    begin()
    expect(screen.getByText('Tap a statement: the plan shows where it can hold.')).toBeInTheDocument()
    pin('s1')
    expect(screen.queryByText(/Tap a statement/)).toBeNull()
    pin('s2')
    pin('s3')
    cite()
    put('b', 0, 0)
    expect(screen.queryByText(/Tap a statement/)).toBeNull()
    pick('d')
    expect(screen.queryByText(/Tap a statement/)).toBeNull()
  })

  it('only one line at a time: an event takes the place of a beat', () => {
    const { container } = render(<Game lieCase={C} />)
    begin()
    pin('s1')
    pin('s3')
    cite()
    expect(container.querySelectorAll('.ofa-line')).toHaveLength(1)
    expect(line()).toHaveTextContent('They can all be true.')
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
    expect(doubtChip('Ana · a wall')).toBeInTheDocument()
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
