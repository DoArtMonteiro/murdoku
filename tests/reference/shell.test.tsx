import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getAllPuzzles } from '../../src/core/catalog'
import type { CellMark, Puzzle } from '../../src/core/types'
import { Shell } from '../../src/reference/shell/Shell'
import type { BoardModule, GameApi } from '../../src/reference/shell/types'
import { clueTargets } from '../../src/reference/shell/clueTargets'
import { planGeometry, fallbackLayout } from '../../src/reference/shell/geometry'
import ReferenceGame from '../../src/reference/ReferenceGame'
import { useGame } from '../../src/hooks/useGame'
import { buildModel, ownCellOk, parseSentence } from '../truth/literal'

const puzzle = getAllPuzzles().find(p => p.id === 'very-easy-1') as Puzzle
const N = puzzle.size

function emptyMarks(): CellMark[][] {
  return Array.from({ length: N }, () => Array.from({ length: N }, () => ({ kind: 'empty' as const })))
}

function makeBoard() {
  const renders = { count: 0 }
  const board: BoardModule = {
    Board: () => { renders.count++; return <div data-testid="mock-board" /> },
    boardLayout: fallbackLayout,
  }
  return { board, renders }
}

function makeGame(over: Partial<GameApi> = {}): GameApi {
  const marks = emptyMarks()
  return {
    puzzles: [puzzle], catalogProgress: null, puzzle, mode: 'classic', marks, activeFloor: 0,
    selectedPerson: puzzle.people[0].id, tool: 'place', hintsLeft: 3, completed: false, murderer: null,
    feedback: 'none', placedOf: {}, conflicts: new Set<string>(), history: [],
    start: vi.fn(), selectPerson: vi.fn(), setTool: vi.fn(), clickCell: vi.fn(), clearAll: vi.fn(),
    undo: vi.fn(), hint: vi.fn(), submit: vi.fn(),
    ...over,
  }
}

const shell = (game: GameApi, board: BoardModule | null = null) =>
  <Shell game={game} board={board} variant="nightplan" theme="dark" onToggleTheme={() => {}} intro={false} />

describe('clueTargets (reading aid)', () => {
  it('lights only literal plan references and ignores the solution', () => {
    const stripped = { ...puzzle, solution: {} } as unknown as Puzzle
    expect(clueTargets(puzzle, { kind: 'row', person: 'x', row: 5 }, 0).rows).toEqual([5])
    expect(clueTargets(puzzle, { kind: 'col', person: 'x', col: 2 }, 0).cols).toEqual([2])
    expect(clueTargets(puzzle, { kind: 'corner', person: 'x' }, 0).cells).toHaveLength(4)
    const room = puzzle.rooms[0]
    expect(clueTargets(puzzle, { kind: 'room', person: 'x', roomId: room.id }, 0).cells).toHaveLength(room.cells.length)
    const tv = clueTargets(stripped, { kind: 'besideFurniture', person: 'x', furniture: 'tv' }, 0)
    expect(tv.cells).toEqual(clueTargets(puzzle, { kind: 'besideFurniture', person: 'x', furniture: 'tv' }, 0).cells)
    // TV at (4,2): same-room neighbours only. The kitchen table (4,3) is behind a wall; the TV cell itself is not lit.
    expect(tv.cells.map(([r, c]) => `${r},${c}`).sort()).toEqual(['3,2', '4,1', '5,2'])
    // relative / person clues carry no printed target
    const none = clueTargets(puzzle, { kind: 'besidePerson', person: 'x', other: 'y' }, 0)
    expect(none.rows.length + none.cols.length + none.cells.length).toBe(0)
  })
})

describe('clueTargets vs the independent literal interpreter (all cases)', () => {
  it('washes exactly the cells where the printed sentence would hold, on every floor', () => {
    let checked = 0
    for (const p of getAllPuzzles()) {
      const m = buildModel(p)
      for (const ct of p.clues) {
        const pc = parseSentence(m, ct.clue.person, ct.text)
        if (!['room', 'on', 'onlyOn', 'beside', 'row', 'col', 'edge', 'corner', 'aboveRoom', 'belowRoom'].includes(pc.rule.t)) continue
        for (let f = 0; f < (p.floors ?? 1); f++) {
          const t = clueTargets(p, ct.clue, f)
          const got = new Set<string>()
          t.cells.forEach(([r, c]) => got.add(`${r},${c}`))
          t.rows.forEach(r => { for (let c = 0; c < p.size; c++) got.add(`${r},${c}`) })
          t.cols.forEach(c => { for (let r = 0; r < p.size; r++) got.add(`${r},${c}`) })
          const want = new Set<string>()
          for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) if (ownCellOk(m, pc.rule, { f, r, c })) want.add(`${r},${c}`)
          // a clue that holds everywhere (e.g. "above" on the ground floor yields none) is not drawn
          if (want.size === p.size * p.size || want.size === 0) { expect(got.size).toBe(0); continue }
          expect([...got].sort(), `${p.id} "${ct.text}" floor ${f}`).toEqual([...want].sort())
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  }, 60000)
})

describe('plan geometry', () => {
  it('guarantees a numeral margin even for a board with no margin', () => {
    const g = planGeometry(600, N, (w, h, n) => ({ x0: 0, y0: 0, cellW: Math.floor(Math.min(w, h) / n), cellH: Math.floor(Math.min(w, h) / n) }))
    expect(g.gx).toBeGreaterThanOrEqual(18)
    expect(g.gy).toBeGreaterThanOrEqual(18)
    expect(g.gx + g.gw).toBeLessThanOrEqual(600)
  })
  it('follows the F-spec sheet for the fallback layout (u = min/(n+1), 0.6u margin)', () => {
    const l = fallbackLayout(812, 812, 6)
    expect(l.cellW).toBe(116)
    expect(l.x0).toBe(Math.floor(0.6 * 116))
  })
})

describe('shell: accessible grid and numerals', () => {
  it('exposes role=grid > row > gridcell with one tab stop and 1..N numerals on both margins', () => {
    render(shell(makeGame()))
    const grid = screen.getByRole('grid')
    expect(within(grid).getAllByRole('row')).toHaveLength(N)
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(N * N)
    expect(grid.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    for (const axis of ['col', 'row']) {
      const nums = [...document.querySelectorAll(`.rs-num[data-axis="${axis}"]`)].map(e => e.textContent)
      expect(nums).toEqual(Array.from({ length: N }, (_, i) => String(i + 1)))
    }
  })

  it('arrow keys move focus, Enter and Space apply the tool at that cell', () => {
    const game = makeGame()
    render(shell(game))
    const start = screen.getByTestId('cell-0-0')
    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByTestId('cell-0-1'))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByTestId('cell-1-1'))
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(game.clickCell).toHaveBeenLastCalledWith(1, 1)
    fireEvent.keyDown(document.activeElement!, { key: ' ' })
    expect(game.clickCell).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('cell-1-1')).toHaveAttribute('tabindex', '0')
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('tabindex', '-1')
  })

  it('shows the R/C/room caption on hover and focus', () => {
    render(shell(makeGame()))
    fireEvent.mouseEnter(screen.getByTestId('cell-4-2'))
    expect(screen.getByTestId('caption')).toHaveTextContent(/R5 · C3 · Living Room/)
  })

  it('draws one portrait token per placed person from the offline contact sheet, victim with chalk', () => {
    const marks = emptyMarks()
    puzzle.people.forEach((p, i) => { marks[i][i] = { kind: 'person', person: p.id } })
    marks[5][0] = { kind: 'x' }
    const placedOf = Object.fromEntries(puzzle.people.map((p, i) => [p.id, { row: i, col: i, floor: 0 }]))
    const { container } = render(shell(makeGame({ marks, placedOf })))
    expect(container.querySelectorAll('.rs-token')).toHaveLength(puzzle.people.length)
    const bg = (container.querySelector('.rs-token .rs-portrait') as HTMLElement).style.backgroundImage
    expect(bg).toContain('/assets/contact-sheet.jpg')
    expect(container.innerHTML).not.toMatch(/dicebear|src="http|url\("?http/)
    expect(screen.getAllByTestId('chalk-outline')).toHaveLength(1)
    expect(container.querySelectorAll('.rs-cross')).toHaveLength(1)
  })
})

describe('shell: reading-aid washes', () => {
  it('washes the lane named by a row/column clue for the selected suspect, nothing otherwise', () => {
    const rowClue = puzzle.clues.find(c => c.clue.kind === 'row' || c.clue.kind === 'col')
    if (!rowClue) return
    const game = makeGame({ selectedPerson: rowClue.clue.person })
    render(shell(game))
    const lane = rowClue.clue.kind === 'row' ? `row-${rowClue.clue.row}` : `col-${(rowClue.clue as { col: number }).col}`
    expect(document.querySelector(`[data-lane="${lane}"]`)).not.toBeNull()
  })
})

describe('shell: stable board', () => {
  it('does not re-render the board when only the 1 s timer state changes', () => {
    const { board, renders } = makeBoard()
    const first = makeGame()
    const { rerender } = render(shell(first, board))
    const base = renders.count
    expect(base).toBeGreaterThan(0)
    for (let i = 1; i <= 5; i++) {
      // useGame() returns a fresh object every TICK; marks/callbacks keep identity
      rerender(shell({ ...first, elapsedSeconds: i } as GameApi, board))
    }
    expect(renders.count).toBe(base)
  })
})

describe('shell: floors, accusation, victory', () => {
  it('renders the floor switch only for multi-storey puzzles', () => {
    const { unmount } = render(shell(makeGame()))
    expect(screen.queryByTestId('floor-switch')).toBeNull()
    unmount()
    const two = { ...puzzle, floors: 2 } as Puzzle
    const game = makeGame({ puzzle: two, switchFloor: vi.fn() })
    render(shell(game))
    fireEvent.click(screen.getByRole('button', { name: /upstairs/i }))
    expect(game.switchFloor).toHaveBeenCalledWith(1)
  })

  it('accuses through game.submit, with count-free copy and accusations left', () => {
    const game = makeGame({ feedback: 'wrong', accusationsLeft: 2 })
    render(shell(game))
    fireEvent.click(screen.getByTestId('accuse'))
    expect(game.submit).toHaveBeenCalled()
    const status = screen.getByTestId('status-line')
    expect(status).toHaveTextContent(/2 accusations left/)
    expect(status.textContent).not.toMatch(/\d+ of \d+|right spot|correct/i)
    expect(screen.getByTestId('wrong-stamp')).toHaveTextContent(/not proven/i)
  })

  it('offers Reveal / Start over in the cold state', () => {
    const game = makeGame({ feedback: 'cold', accusationsLeft: 0, reveal: vi.fn(), startOver: vi.fn() })
    render(shell(game))
    expect(screen.queryByTestId('accuse')).toBeNull()
    fireEvent.click(screen.getByTestId('reveal'))
    fireEvent.click(screen.getByTestId('start-over'))
    expect(game.reveal).toHaveBeenCalled()
    expect(game.startOver).toHaveBeenCalled()
  })

  it('shows Case closed naming the murderer with a link back without ?ref', () => {
    window.history.replaceState({}, '', '/?ref=nightplan&x=1')
    render(shell(makeGame({ completed: true, murderer: puzzle.murdererId })))
    const killer = puzzle.people.find(p => p.id === puzzle.murdererId)!
    expect(screen.getByTestId('murderer-name')).toHaveTextContent(killer.name)
    const href = screen.getByTestId('back-link').getAttribute('href')!
    expect(href).not.toMatch(/ref=/)
    expect(href).toContain('x=1')
    expect(screen.queryByTestId('accuse')).toBeNull()
    window.history.replaceState({}, '', '/')
  })

  it('has no continuity strip, tutorial line or Decorate button', () => {
    const { container } = render(shell(makeGame()))
    expect(container.textContent).not.toMatch(/continuity|sequence|decorate|tap a (suspect|card) then/i)
  })
})

describe('shell: cold and revealed', () => {
  it('disables Hint when the case is cold', () => {
    render(shell(makeGame({ feedback: 'cold', accusationsLeft: 0 })))
    expect(screen.getByTestId('tool-hint')).toBeDisabled()
  })
  it('says the case was revealed and not counted', () => {
    render(shell(makeGame({ completed: true, revealed: true, murderer: puzzle.murdererId, accusationsLeft: 0 })))
    expect(screen.getByRole('heading', { name: /case revealed/i })).toBeInTheDocument()
    expect(screen.getByTestId('revealed-note')).toHaveTextContent(/does not count/i)
    expect(screen.queryByText(/play again/i)).toBeNull()
  })
  it('keeps the plain Case closed for a real solve', () => {
    render(shell(makeGame({ completed: true, revealed: false, murderer: puzzle.murdererId, accusationsLeft: 2 })))
    expect(screen.getByRole('heading', { name: /case closed/i })).toBeInTheDocument()
  })
})

describe('shell: help dialog', () => {
  it('explains how clues read', () => {
    render(shell(makeGame()))
    fireEvent.click(screen.getByTestId('help-btn'))
    const g = screen.getByTestId('clue-glossary')
    expect(g).toHaveTextContent(/beside a tv/i)
    expect(g).toHaveTextContent(/same room/i)
    expect(g).toHaveTextContent(/outer edge/i)
    expect(g).toHaveTextContent(/corner/i)
    expect(g).toHaveTextContent(/exactly one/i)
  })
  it('takes focus, traps Tab, closes on Escape and restores focus', () => {
    render(shell(makeGame()))
    const opener = screen.getByTestId('help-btn')
    opener.focus()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})

describe('ReferenceGame with the real useGame()', () => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null }) })
  }
  function Host() {
    const game = useGame()
    const [, force] = useState(0)
    void force
    return <ReferenceGame variant="nightplan" game={game as unknown as GameApi} />
  }

  it('shows loading, starts very-easy-1 and plays it to Case closed', async () => {
    render(<Host />)
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument(), { timeout: 20000 })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(puzzle.title)
    const sol = puzzle.solution
    for (const p of puzzle.people) {
      fireEvent.click(screen.queryByTestId(`chip-${p.id}`) ?? screen.getByTestId(`suspect-${p.id}`))
      fireEvent.click(screen.getByTestId(`cell-${sol[p.id].row}-${sol[p.id].col}`))
    }
    await act(async () => { fireEvent.click(screen.getByTestId('accuse')) })
    await waitFor(() => expect(screen.getByTestId('case-closed')).toBeInTheDocument())
    expect(screen.getByTestId('murderer-name')).toHaveTextContent(puzzle.people.find(p => p.id === puzzle.murdererId)!.name)
  }, 40000)

  const PLAY_KEY = 'murdoku_play_v1'
  function savedPlay(mode: string) {
    const marks = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ kind: 'empty' })))
    ;(marks[0] as { kind: string; person?: string }[])[0] = { kind: 'person', person: puzzle.people[1].id }
    return JSON.stringify({ id: puzzle.id, mode, marks, elapsed: 5, hints: 3, selected: puzzle.people[1].id })
  }

  it('does not wipe or re-mode a saved detective attempt, and resumes a classic one', async () => {
    localStorage.setItem('murdoku_mode', 'detective')
    localStorage.setItem(PLAY_KEY, savedPlay('detective'))
    const { unmount } = render(<Host />)
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument(), { timeout: 20000 })
    await new Promise(r => setTimeout(r, 1500))
    expect(localStorage.getItem('murdoku_mode')).toBe('detective')
    expect(JSON.parse(localStorage.getItem(PLAY_KEY)!).mode).toBe('detective')
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-person', puzzle.people[1].id)
    unmount()
    localStorage.clear()
    localStorage.setItem('murdoku_mode', 'detective')
    localStorage.setItem(PLAY_KEY, savedPlay('classic'))
    render(<Host />)
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument(), { timeout: 20000 })
    expect(screen.getByTestId('cell-0-0')).toHaveAttribute('data-person', puzzle.people[1].id)
    await new Promise(r => setTimeout(r, 300))
    expect(localStorage.getItem('murdoku_mode')).toBe('detective') // preference untouched
  }, 40000)

  it('keeps hooks usable (smoke)', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.screen).toBeDefined()
  })
})
