import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cell } from '../../src/core/types'
import { Reveal, RevealCaption } from '../../src/lie/Reveal.tsx'
import type { LieCase } from '../../src/lie/model'
import { buildSteps, claimedTile, refuters, refutingStatements, useRevealSequence } from '../../src/lie/revealSequence'
import { SOUND_KEY } from '../../src/lie/sound'
import { case0 } from '../../src/tutorial/case0'

vi.mock('../../src/lie/sound', async orig => ({ ...(await orig<typeof import('../../src/lie/sound')>()), playCue: vi.fn() }))
import { playCue } from '../../src/lie/sound'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.mocked(playCue).mockClear() })

// NB: Reveal.tsx and reveal.ts differ only in case and extension, so import both WITH their extensions
// (a bare './Reveal' resolves to reveal.ts on a case-insensitive filesystem).
// Case 0's house, with Lena (the murderer, p0) saying she stood on the fridge. She really stood on the clock.
function lieCase(lie: LieCase['statements'][number]['clue'], text: string, display: string): LieCase {
  const mk = (id: string, author: string, clue: LieCase['statements'][number]['clue'], t: string, d: string) => ({ id, author, clue, text: t, display: d })
  return {
    id: 'rv-test',
    puzzle: { ...case0, murdererId: 'p0', victimId: 'p3' },
    statements: [
      mk('s1', 'p1', { kind: 'besideFurniture', person: 'p1', furniture: 'desk' }, 'Beside the desk.', 'I was beside the desk.'),
      mk('s2', 'p2', { kind: 'room', person: 'p2', roomId: 'room1' }, 'In the Kitchen.', 'I was in the Kitchen.'),
      mk('s3', 'p0', lie, text, display),
      mk('s4', 'p2', { kind: 'row', person: 'p2', row: 0 }, 'In the top row.', 'I never left the top row.'),
    ],
    lieId: 's3',
    collisions: [['s3', 's1'], ['s3', 's2', 's4']],
    story: {
      title: 'The Bell Rang Once',
      premise: 'x',
      closing: '{M} bent one account to fit the night. {V} will not ring again.',
      cast: {
        p0: { name: 'Lena', role: 'Baker', emblem: 'bread', motive: 'The ledger named her.' },
        p1: { name: 'Tomas', role: 'Net mender', emblem: 'net', motive: 'm1' },
        p2: { name: 'Greta', role: 'Lamplighter', emblem: 'lantern', motive: 'm2' },
        p3: { name: 'Marco', role: 'Harbour master', emblem: 'compass', motive: 'm3' },
      },
    },
  }
}
const FRIDGE = lieCase({ kind: 'onFurniture', person: 'p0', furniture: 'fridge' }, 'On the fridge.', 'I was on the fridge.')
const RELATIONAL = lieCase({ kind: 'direction', person: 'p0', other: 'p1', dir: 'N' }, 'Somewhere north of Tomas.', 'I was somewhere north of Tomas.')
const EDGE = lieCase({ kind: 'edge', person: 'p0' }, 'On the outer edge of the board.', 'I was out on the edge.')
const placed: Record<string, Cell> = case0.solution

describe('claimedTile', () => {
  it('finds the one tile the statement allows, off the real tile', () => {
    expect(claimedTile(FRIDGE, placed)).toEqual({ row: 1, col: 3 })
  })

  it('is null for a relational lie, which names no tile', () => {
    expect(claimedTile(RELATIONAL, placed)).toBeNull()
  })

  it('falls back deterministically when every allowed tile clashes: fewest clashes, then nearest the real tile, then row-major', () => {
    // every edge tile shares a row or column with someone; (2,0) and (3,1) each clash once and sit one step from (3,0)
    expect(claimedTile(EDGE, placed)).toEqual({ row: 2, col: 0 })
    expect(claimedTile(EDGE, placed)).toEqual(claimedTile(EDGE, placed))
  })

  it('reads the real tile from placed, never from the solution', () => {
    const moved = { ...placed, p0: { row: 0, col: 0 } }
    // from (0,0) the nearest clash-once edge tile changes
    expect(claimedTile(EDGE, moved)).not.toEqual({ row: 2, col: 0 })
  })
})

describe('steps', () => {
  it('runs lie, refuters, "Then where", "Alone with", each with its own plan', () => {
    const steps = buildSteps(FRIDGE, placed)
    expect(steps.map(s => s.caption)).toEqual([
      '“I was on the fridge.” — Lena',
      'Tomas: “I was beside the desk.”',
      'Greta: “I was in the Kitchen.”',
      'Then where was Lena?',
      'Alone with Marco.',
    ])
    expect(steps.every(s => s.ms >= 1100 && s.ms <= 1700)).toBe(true)
    // beat 1: the ghost on the claimed tile, the real token waiting off the plan
    expect(steps[0].plan.ghost).toEqual({ person: 'p0', cell: { row: 1, col: 3 } })
    expect(steps[0].plan.tokens).not.toHaveProperty('p0')
    expect(steps[0].plan.tokens).toHaveProperty('p1')
    // beat 2: a pulse per refuter, ghost still out
    expect(steps[1].plan.pulse).toBe('p1')
    expect(steps[2].plan.pulse).toBe('p2')
    expect(steps[1].plan.ghost?.cell).toEqual({ row: 1, col: 3 })
    expect(steps[0].plan.murderer).toBeNull() // explicit, so spreading the plan over a host's own murderer prop clears the ring
    // beat 3: the ghost on the real tile, the ring, the murder room (Hall: 8 tiles) tinted
    expect(steps[3].plan.ghost).toEqual({ person: 'p0', cell: expect.objectContaining({ row: 3, col: 0 }) })
    expect(steps[3].plan.murderer).toBe('p0')
    expect([...steps[3].plan.tint!].sort()).toEqual(['2,0', '2,1', '2,2', '2,3', '3,0', '3,1', '3,2', '3,3'])
    // beat 4: the ghost gives way to the real token, ring and tint stay
    expect(steps[4].plan.ghost).toBeUndefined()
    expect(steps[4].plan.tokens).toBeUndefined()
    expect(steps[4].plan.murderer).toBe('p0')
  })

  it('skips the ghost beat for a relational lie, and never hides the liar', () => {
    const steps = buildSteps(RELATIONAL, placed)
    expect(steps.map(s => s.caption)).toEqual(['Tomas: “I was beside the desk.”', 'Greta: “I was in the Kitchen.”', 'Then where was Lena?', 'Alone with Marco.'])
    expect(steps.every(s => !s.plan.ghost && !s.plan.tokens)).toBe(true)
    expect(steps[2].plan.murderer).toBe('p0')
  })

  it('dedupes refuters by author and caps them', () => {
    expect(refuters(FRIDGE)).toEqual(['p1', 'p2'])
    expect(refutingStatements(FRIDGE).map(s => s.id)).toEqual(['s1', 's2'])
    expect(refutingStatements(FRIDGE, 1)).toHaveLength(1)
    const many = { ...FRIDGE, statements: [...FRIDGE.statements, { ...FRIDGE.statements[0], id: 's5', author: 'p3' }, { ...FRIDGE.statements[0], id: 's6', author: 'p4' }], collisions: [['s3', 's1', 's2', 's5', 's6']] }
    expect(refutingStatements(many)).toHaveLength(3)
  })

  it("replays the player's own recorded contradictions, not the stored ones", () => {
    const own = [['s3', 's2']]
    expect(refutingStatements(FRIDGE, 3, own).map(s => s.id)).toEqual(['s2'])
    const caps = buildSteps(FRIDGE, placed, own).map(s => s.caption)
    expect(caps.some(c => c.startsWith('Greta:'))).toBe(true)
    expect(caps.some(c => c.startsWith('Tomas:'))).toBe(false)
    // rows that do not hold the lie are not a proof: the stored collisions stand in
    expect(refutingStatements(FRIDGE, 3, [['s1', 's2']]).map(s => s.id)).toEqual(['s1', 's2'])
  })

  it('quotes the statement text when there is no display', () => {
    const plain = { ...FRIDGE, statements: FRIDGE.statements.map(s => (s.id === 's3' ? { ...s, display: undefined } : s)) }
    expect(buildSteps(plain, placed)[0].caption).toBe('“On the fridge.” — Lena')
  })
})

describe('useRevealSequence', () => {
  beforeEach(() => { vi.useFakeTimers() })

  const setup = (active: boolean, reduced = false, c = FRIDGE) =>
    renderHook(({ a, r }: { a: boolean; r: boolean }) => useRevealSequence(c, placed, a, r), { initialProps: { a: active, r: reduced } })

  it('is silent until active, then walks the beats in order on its timers', () => {
    const { result, rerender } = setup(false)
    expect(result.current.caption).toBeNull()
    expect(result.current.plan).toEqual({})
    expect(result.current.done).toBe(false)

    rerender({ a: true, r: false })
    const seen = [result.current.caption]
    const steps = buildSteps(FRIDGE, placed)
    for (const s of steps.slice(0, -1)) {
      act(() => { vi.advanceTimersByTime(s.ms - 1) })
      expect(result.current.caption).toBe(seen[seen.length - 1]) // not yet
      expect(result.current.done).toBe(false)
      act(() => { vi.advanceTimersByTime(1) })
      seen.push(result.current.caption)
    }
    expect(seen).toEqual(steps.map(s => s.caption))
    expect(result.current.done).toBe(true)
    expect(result.current.plan.murderer).toBe('p0')
    // done is final: nothing more is scheduled
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skip() jumps to the final frame', () => {
    const { result, rerender } = setup(true)
    expect(result.current.caption).toContain('I was on the fridge')
    act(() => { result.current.skip() })
    expect(result.current.caption).toBe('Alone with Marco.')
    expect(result.current.done).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    rerender({ a: true, r: false })
    expect(result.current.done).toBe(true)
  })

  it('goes straight to the final frame under reduced motion, with no timers', () => {
    const { result } = setup(true, true)
    expect(result.current.caption).toBe('Alone with Marco.')
    expect(result.current.done).toBe(true)
    expect(result.current.plan.ghost).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restart() plays it again from the first beat; deactivating resets it', () => {
    const { result, rerender } = setup(true)
    act(() => { result.current.skip() })
    expect(result.current.done).toBe(true)
    act(() => { result.current.restart() })
    expect(result.current.done).toBe(false)
    expect(result.current.caption).toContain('I was on the fridge')
    act(() => { vi.advanceTimersByTime(buildSteps(FRIDGE, placed)[0].ms) })
    expect(result.current.caption).toContain('Tomas')
    rerender({ a: false, r: false })
    expect(result.current.caption).toBeNull()
    rerender({ a: true, r: false })
    expect(result.current.caption).toContain('I was on the fridge')
  })

  it('rings the harbour bell once, when done, only if sound is on', () => {
    localStorage.setItem(SOUND_KEY, '1')
    const { result } = setup(true)
    expect(playCue).not.toHaveBeenCalled()
    act(() => { result.current.skip() })
    expect(playCue).toHaveBeenCalledTimes(1)
    expect(playCue).toHaveBeenCalledWith('bell')
    act(() => { result.current.skip() })
    expect(playCue).toHaveBeenCalledTimes(1)
    act(() => { result.current.restart() })
    act(() => { result.current.skip() })
    expect(playCue).toHaveBeenCalledTimes(2)

    localStorage.setItem(SOUND_KEY, '0')
    const quiet = setup(true, true)
    expect(quiet.result.current.done).toBe(true)
    expect(playCue).toHaveBeenCalledTimes(2)
  })
})

describe('Reveal panel', () => {
  const props = { c: FRIDGE, placed, tier: 'Proved', done: true, onReplay: () => {} }

  it('renders nothing until the sequence is done', () => {
    const { container } = render(<Reveal {...props} done={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('puts the stamp, the headline, the motive and closing, the innocents line and the buttons in that order', () => {
    const { container } = render(<Reveal {...props} onNext={() => {}} />)
    const stamp = container.querySelector('.rv-stamp')!
    const head = screen.getByRole('heading', { name: 'Lena lied about one thing.' })
    const story = container.querySelector('.rv-story')!
    const clear = container.querySelector('.rv-clear')!
    const actions = container.querySelector('.rv-actions')!
    expect(stamp).toHaveTextContent('Proved')
    expect(story).toHaveTextContent('The ledger named her. Lena bent one account to fit the night. Marco will not ring again.')
    expect(story.textContent).not.toMatch(/\{[MV]\}/)
    expect(clear.querySelector('summary')).toHaveTextContent('Tomas and Greta told the truth.')
    const before = (a: Element, b: Element) => expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    before(stamp, head); before(head, story); before(story, clear); before(clear, actions)
    expect(screen.queryByText(/cleared by their own account/)).toBeNull()
    // one line, expandable to where each of them was
    expect([...clear.querySelectorAll('li')].map(li => li.textContent)).toEqual(['Tomas in the Study', 'Greta in the Kitchen'])
  })

  it('offers "Next case" as the primary button when onNext is given, and always "Replay the reveal"', () => {
    const onNext = vi.fn(), onReplay = vi.fn()
    render(<Reveal {...props} onNext={onNext} onReplay={onReplay} />)
    const next = screen.getByRole('button', { name: 'Next case' })
    expect(next).toHaveAttribute('data-kind', 'primary')
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Replay the reveal' }))
    expect(onReplay).toHaveBeenCalledTimes(1)
    cleanup()
    render(<Reveal {...props} onReplay={onReplay} />)
    expect(screen.queryByRole('button', { name: 'Next case' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Replay the reveal' })).toBeInTheDocument()
  })

  it('reads as a plain closing when there was no lie to catch (tier Closed)', () => {
    render(<Reveal {...props} tier="Closed" />)
    expect(screen.getByRole('heading', { name: 'Lena was alone with Marco.' })).toBeInTheDocument()
    expect(screen.getByText('Tomas and Greta were cleared.')).toBeInTheDocument()
  })

  it('marks a clean solve and a false start differently', () => {
    const a = render(<Reveal {...props} tier="Proved, after a false start" />)
    expect(a.container.querySelector('.rv-stamp')).toHaveAttribute('data-tier', 'false-start')
    cleanup()
    const b = render(<Reveal {...props} />)
    expect(b.container.querySelector('.rv-stamp')).toHaveAttribute('data-tier', 'clean')
  })

  it('has no style elements or attributes, and no off-palette bar classes', () => {
    const { container } = render(<Reveal {...props} onNext={() => {}} />)
    expect(container.querySelectorAll('style, [style]')).toHaveLength(0)
    expect(container.querySelectorAll('.ofa-roll-li')).toHaveLength(0)
  })
})

describe('RevealCaption', () => {
  it('is a polite live region with a Skip button until done', () => {
    const onSkip = vi.fn()
    const { rerender } = render(<RevealCaption text="Then where was Lena?" done={false} onSkip={onSkip} />)
    expect(screen.getByRole('status')).toHaveTextContent('Then where was Lena?')
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
    rerender(<RevealCaption text="Alone with Marco." done onSkip={onSkip} />)
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
  })
})
