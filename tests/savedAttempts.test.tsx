import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomeScreen from '../src/components/HomeScreen'
import { getAllPuzzles } from '../src/core/catalog'
import { summarizeSaves, writeSave } from '../src/core/saves'
import type { SavedAttempts } from '../src/core/saves'
import type { CellMark, GameMode, Puzzle } from '../src/core/types'
import { IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY } from '../src/core/ux'
import { useGame } from '../src/hooks/useGame'
import { makePuzzle } from './fixtures'

// R3.2 closeout: every saved attempt can be found from the case list, opens in
// its own mode, and nothing saved is replaced by opening a case. Previously only
// the newest attempt was offered (the Continue strip) and a case card always
// opened in the selected mode, so a Detective attempt was invisible from a
// Classic catalog and its card opened an empty Classic board.

afterEach(() => vi.restoreAllMocks())

// ── Case list (HomeScreen) ──────────────────────────────────────────────────

const ui = [
  makePuzzle({ id: 'case-1', title: 'The Empty Chair', difficulty: 'Easy' }),
  makePuzzle({ id: 'case-2', title: 'Midnight Delivery', difficulty: 'Easy' }),
  makePuzzle({ id: 'case-3', title: 'The Locked Study', difficulty: 'Easy' }),
  makePuzzle({ id: 'case-4', title: 'The Late Arrival', difficulty: 'Hard', floors: 2 }),
]
const att = (id: string, mode: GameMode, placedCount: number, elapsedSeconds = 65) =>
  ({ id, mode, placedCount, elapsedSeconds, selectedPerson: null })
// case-1: both modes (detective newest); case-2: detective only; case-3: nothing; case-4: classic only.
const SAVED: SavedAttempts = {
  'case-1': [att('case-1', 'detective', 1), att('case-1', 'classic', 2)],
  'case-2': [att('case-2', 'detective', 3)],
  'case-4': [att('case-4', 'classic', 2)],
}

function home(mode: GameMode = 'classic', savedAttempts: SavedAttempts = SAVED) {
  const onSelect = vi.fn(), onResume = vi.fn()
  render(
    <HomeScreen
      puzzles={ui} completedIds={['case-1']} records={{}} mode={mode} onSetMode={vi.fn()}
      onSelect={onSelect} onResume={onResume} onOpenReleases={vi.fn()} resolvedTheme="dark"
      onToggleTheme={vi.fn()} savedAttempts={savedAttempts}
    />,
  )
  return { onSelect, onResume }
}
const tier = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name} cases`) }))
const card = (title: string) => screen.getByRole('button', { name: new RegExp(title, 'i') })

describe('case list marks every saved attempt', () => {
  it('each tier on the landing says how many of its cases are in progress', () => {
    home()
    expect(screen.getByRole('button', { name: /^Easy cases/ })).toHaveAccessibleName(/2 in progress/)
    expect(screen.getByTestId('tier-saved-easy')).toHaveTextContent('2 in progress')
    expect(screen.getByRole('button', { name: /^Hard cases/ })).toHaveAccessibleName(/1 in progress/)
  })

  it('a case card names each saved mode with its placements; a solved case can be in progress again', () => {
    home(); tier('Easy')
    expect(screen.getByTestId('card-saved-case-1')).toHaveTextContent(/In progress.*Detective 1\/4.*Classic 2\/4/)
    expect(within(card('The Empty Chair')).getByText('CLOSED')).toBeInTheDocument()
    expect(screen.getByTestId('card-saved-case-2')).toHaveTextContent(/Detective 3\/4/)
    expect(screen.getByTestId('card-saved-case-2')).not.toHaveTextContent(/Classic/)
    expect(screen.queryByTestId('card-saved-case-3')).toBeNull()
    // the card's accessible name carries it too
    expect(card('Midnight Delivery')).toHaveAccessibleName(/In progress.*Detective 3\/4/)
  })

  it('no saved attempts: no marks anywhere', () => {
    home('classic', {}); tier('Easy')
    expect(screen.queryByTestId(/^card-saved-/)).toBeNull()
  })
})

describe('opening a case selects its saved case and mode', () => {
  it('nothing saved: starts at once in the selected mode, no question asked', () => {
    const { onSelect, onResume } = home(); tier('Easy')
    fireEvent.click(card('The Locked Study'))
    expect(onSelect).toHaveBeenCalledWith('case-3')
    expect(onResume).not.toHaveBeenCalled()
    expect(screen.queryByTestId('resume-chooser')).toBeNull()
  })

  it('one attempt, saved in the selected mode: resumes it at once', () => {
    const { onSelect, onResume } = home('classic'); tier('Hard')
    fireEvent.click(card('The Late Arrival'))
    expect(onResume).toHaveBeenCalledWith('case-4', 'classic')
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByTestId('resume-chooser')).toBeNull()
  })

  it('one attempt in the other mode: asks; resume opens that mode, a new game is the selected mode and keeps the save', () => {
    const { onSelect, onResume } = home('classic'); tier('Easy')
    fireEvent.click(card('Midnight Delivery'))
    const dialog = screen.getByRole('dialog', { name: /Midnight Delivery/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(/Saved progress in Detective/)
    expect(screen.queryByTestId('resume-classic')).toBeNull()
    expect(screen.getByTestId('resume-fresh')).toHaveTextContent(/New Classic game.*saved Detective progress is kept/)
    fireEvent.click(screen.getByTestId('resume-detective'))
    expect(onResume).toHaveBeenLastCalledWith('case-2', 'detective')
    expect(screen.queryByTestId('resume-chooser')).toBeNull()
    fireEvent.click(card('Midnight Delivery'))
    fireEvent.click(screen.getByTestId('resume-fresh'))
    expect(onResume).toHaveBeenLastCalledWith('case-2', 'classic')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('both modes saved: both offered, newest first, and no new game that would replace either', () => {
    const { onResume } = home('detective'); tier('Easy')
    fireEvent.click(card('The Empty Chair'))
    const buttons = within(screen.getByTestId('resume-chooser')).getAllByRole('button')
    expect(buttons.map(b => b.textContent)).toEqual([
      expect.stringMatching(/Resume Detective.*1 \/ 4 placed · 01:05 · most recent/),
      expect.stringMatching(/Resume Classic.*2 \/ 4 placed/),
      'Cancel',
    ])
    expect(screen.queryByTestId('resume-fresh')).toBeNull()
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(/open it and clear the board/)
    fireEvent.click(screen.getByTestId('resume-classic'))
    expect(onResume).toHaveBeenCalledWith('case-1', 'classic')
  })

  it('keyboard: focus moves into the choice, Tab stays inside, Escape and Cancel close it and return focus', () => {
    const { onSelect, onResume } = home('classic'); tier('Easy')
    const opener = card('The Empty Chair')
    opener.focus(); fireEvent.click(opener)
    expect(screen.getByTestId('resume-detective')).toHaveFocus()
    const cancel = screen.getByTestId('resume-cancel')
    cancel.focus(); fireEvent.keyDown(cancel, { key: 'Tab' })
    expect(screen.getByTestId('resume-detective')).toHaveFocus()
    fireEvent.keyDown(screen.getByTestId('resume-detective'), { key: 'Tab', shiftKey: true })
    expect(cancel).toHaveFocus()
    fireEvent.keyDown(cancel, { key: 'Escape' })
    expect(screen.queryByTestId('resume-chooser')).toBeNull()
    expect(opener).toHaveFocus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByTestId('resume-cancel'))
    expect(screen.queryByTestId('resume-chooser')).toBeNull()
    expect(opener).toHaveFocus()
    expect(onSelect).not.toHaveBeenCalled()
    expect(onResume).not.toHaveBeenCalled()
  })

  it("today's case opens the same way", () => {
    // The daily pick is deterministic per date; mark whichever case it is as saved in the other mode.
    const { onResume } = home('classic', Object.fromEntries(ui.map(p => [p.id, [att(p.id, 'detective', 1)]])))
    fireEvent.click(screen.getByRole('button', { name: /^Play today's case/ }))
    expect(screen.getByTestId('resume-chooser')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('resume-detective'))
    expect(onResume).toHaveBeenCalledWith(expect.any(String), 'detective')
  })
})

// ── What the hook offers the case list (real storage) ───────────────────────

type Hook = ReturnType<typeof renderHook<ReturnType<typeof useGame>, unknown>>
const byId = (id: string) => getAllPuzzles().find(p => p.id === id)!
const A = byId('hard-9')        // two storeys
const B = byId('very-easy-1')
const C = byId('medium-2')
const onFloor = (p: Puzzle, f: number) => p.people.filter(x => (p.solution[x.id].floor ?? 0) === f)
const aIds = [onFloor(A, 0)[0].id, onFloor(A, 1)[0].id]

function place(h: Hook, p: Puzzle, ids: string[]) {
  for (const id of ids) {
    const at = p.solution[id]
    act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
    act(() => h.result.current.selectPerson(id))
    act(() => h.result.current.clickCell(at.row, at.col))
  }
}
const open = (h: Hook, p: Puzzle, mode: GameMode = 'classic') => act(() => h.result.current.start(p.id, mode))
const fresh = async () => {
  const h = renderHook(() => useGame())
  await waitFor(() => expect(h.result.current.puzzles.length).toBe(60))
  return h
}
const modes = (h: Hook, id: string) => (h.result.current.savedAttempts[id] ?? []).map(a => `${a.mode}:${a.placedCount}`)
function winAll(h: Hook, p: Puzzle) {
  place(h, p, p.people.filter(x => !h.result.current.placedOf[x.id]).map(x => x.id))
  act(() => h.result.current.submit())
  expect(h.result.current.completed).toBe(true)
}
/** Three wrong accusations: two suspects swapped, so the case goes cold. */
function goCold(h: Hook, p: Puzzle) {
  const [a, b] = p.people.filter(x => x.id !== p.victimId)
  const bad = { ...p.solution, [a.id]: p.solution[b.id], [b.id]: p.solution[a.id] }
  act(() => h.result.current.clearAll())
  for (const person of p.people) {
    const at = bad[person.id]
    act(() => h.result.current.switchFloor((at.floor ?? 0) as 0 | 1))
    act(() => h.result.current.selectPerson(person.id))
    act(() => h.result.current.clickCell(at.row, at.col))
  }
  for (let i = 0; i < 3; i++) act(() => h.result.current.submit())
  expect(h.result.current.feedback).toBe('cold')
}

describe('saved attempts the case list is given', () => {
  it('several cases, both modes, both storeys counted, newest first; unchanged by a reload', async () => {
    const h = await fresh()
    open(h, A, 'classic'); place(h, A, aIds)
    open(h, B, 'detective'); place(h, B, [B.people[0].id])
    open(h, A, 'detective'); place(h, A, [aIds[1]])
    act(() => h.result.current.navigate('home'))
    expect(modes(h, A.id)).toEqual(['detective:1', 'classic:2'])
    expect(modes(h, B.id)).toEqual(['detective:1'])
    expect(h.result.current.savedAttempts[C.id]).toBeUndefined()
    expect(h.result.current.inProgress).toMatchObject({ id: A.id, mode: 'detective' })
    h.unmount()
    const r = await fresh()
    expect(modes(r, A.id)).toEqual(['detective:1', 'classic:2'])
    expect(modes(r, B.id)).toEqual(['detective:1'])
  })

  it.each([
    ['Clear', (h: Hook) => act(() => h.result.current.clearAll())],
    ['Win', (h: Hook) => winAll(h, A)],
    ['Reveal', (h: Hook) => { goCold(h, A); act(() => h.result.current.reveal()) }],
    ['Start over', (h: Hook) => { goCold(h, A); act(() => h.result.current.startOver()) }],
  ])('%s drops only that mode\'s mark, and it does not come back after a reload', async (_name, end) => {
    const h = await fresh()
    open(h, A, 'detective'); place(h, A, [aIds[0]])
    open(h, B, 'classic'); place(h, B, [B.people[0].id])
    open(h, A, 'classic'); place(h, A, aIds)
    end(h)
    act(() => h.result.current.navigate('home'))
    expect(modes(h, A.id)).toEqual(['detective:1'])
    expect(modes(h, B.id)).toEqual(['classic:1'])
    h.unmount()
    const r = await fresh()
    expect(modes(r, A.id)).toEqual(['detective:1'])
    expect(modes(r, B.id)).toEqual(['classic:1'])
  })

  it('an attempt only the previous single-slot format holds is listed (migrated), both storeys', async () => {
    const grid = (p: Puzzle, f: number): CellMark[][] => {
      const g: CellMark[][] = Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' as const })))
      for (const x of onFloor(p, f).slice(0, 1)) g[p.solution[x.id].row][p.solution[x.id].col] = { kind: 'person', person: x.id }
      return g
    }
    localStorage.setItem(LEGACY_IN_PROGRESS_KEY, JSON.stringify({ puzzleId: A.id, mode: 'detective', marks: grid(A, 0), elapsed: 30, hints: 0 }))
    localStorage.setItem('murdoku_floor_marks_v1', JSON.stringify({ id: A.id, marks: grid(A, 1) }))
    const h = await fresh()
    expect(modes(h, A.id)).toEqual(['detective:2'])
    open(h, A, 'detective')
    expect(Object.keys(h.result.current.placedOf).sort()).toEqual([...aIds].sort())
  })

  it('a full store: listing still works, never throws, and the unsaved attempt is not shown as saved', async () => {
    const h = await fresh()
    open(h, B, 'classic'); place(h, B, [B.people[0].id])
    const real = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.startsWith('murdoku_save_v2:') || k === IN_PROGRESS_KEY || k === LEGACY_IN_PROGRESS_KEY) throw new DOMException('full', 'QuotaExceededError')
      return real.call(this, k, v)
    })
    open(h, C, 'detective'); place(h, C, [C.people[0].id])
    expect(h.result.current.saveFailed).toBe(true)
    act(() => h.result.current.navigate('home'))
    expect(modes(h, C.id)).toEqual([])
    expect(modes(h, B.id)).toEqual(['classic:1'])
    expect(() => summarizeSaves(getAllPuzzles())).not.toThrow()
  })

  it('reading the list twice changes nothing (no resurrection, no duplicates)', async () => {
    writeSave(B, { id: B.id, mode: 'detective', floors: [Array.from({ length: B.size }, () => Array.from({ length: B.size }, () => ({ kind: 'empty' as const })))], elapsed: 1, selected: null })
    const first = summarizeSaves(getAllPuzzles())
    const snapshot = { ...localStorage }
    const second = summarizeSaves(getAllPuzzles())
    expect(second).toEqual(first)
    expect({ ...localStorage }).toEqual(snapshot)
  })
})
