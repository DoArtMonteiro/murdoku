import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameScreen from '../../src/components/GameScreen'
import { getAllPuzzles } from '../../src/core/catalog'
import { loadCaseState } from '../../src/core/progress'
import { CASE_STATE_KEY, RECORDS_KEY, SOLVED_KEY } from '../../src/core/storage'
import type { Cell, Puzzle } from '../../src/core/types'
import { gameReducer, initialGameState, useGame } from '../../src/hooks/useGame'
import type { GameAction, GameState } from '../../src/hooks/useGame'
import { prng } from './helpers'

// The Accuse button must report ONE bit. These tests drive the real reducer / hook
// as a script would: a guessing bot with no knowledge of the clues.

const puzzles = getAllPuzzles()
const classic = (id: string): GameState => gameReducer(initialGameState, { type: 'START', puzzleId: id, mode: 'classic' })
const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s)

/** Put every person at `cells[id]` through the same actions a player's clicks produce. */
function arrange(s: GameState, cells: Record<string, Cell>): GameState {
  let cur = s
  for (const person of cur.puzzle!.people) {
    const c = cells[person.id]
    const here = cur.marksPerFloor[c.floor ?? 0][c.row][c.col]
    if (here.kind === 'person' && here.person === person.id) continue // clicking your own token would lift it
    cur = run(cur, { type: 'SWITCH_FLOOR', floor: (c.floor ?? 0) as 0 | 1 }, { type: 'SELECT_PERSON', id: person.id }, { type: 'CELL', row: c.row, col: c.col })
  }
  return cur
}

/** A legal-looking guess: distinct rows and columns, random storeys. No knowledge of the answer. */
function randomGuess(p: Puzzle, rand: () => number): Record<string, Cell> {
  const rows = [...Array(p.size).keys()].sort(() => rand() - 0.5)
  const cols = [...Array(p.size).keys()].sort(() => rand() - 0.5)
  const floors = p.floors ?? 1
  return Object.fromEntries(p.people.map((x, i) => [x.id, { row: rows[i], col: cols[i], floor: Math.floor(rand() * floors) }]))
}

/** A solution that is wrong in exactly the way `how` says. */
function nearMiss(p: Puzzle, how: 'swap' | 'move'): Record<string, Cell> {
  const [a, b] = p.people.filter(x => x.id !== p.victimId)
  const sol = { ...p.solution }
  if (how === 'swap') { sol[a.id] = p.solution[b.id]; sol[b.id] = p.solution[a.id]; return sol }
  // move one person to the first free cell in their own row and column's complement
  const used = new Set(Object.values(p.solution).map(c => `${c.row},${c.col}`))
  for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) {
    if (r === p.solution[a.id].row && c === p.solution[a.id].col) continue
    if (used.has(`${r},${c}`)) continue
    sol[a.id] = { row: r, col: c, floor: p.solution[a.id].floor }
    return sol
  }
  return sol
}

describe('an accusation reveals at most one bit', () => {
  const p = puzzles.find(x => x.id === 'easy-5')!

  it('a wrong accusation leaves no count in state, return value or storage', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(p.id, 'classic'))
    for (const person of p.people) {
      const c = nearMiss(p, 'swap')[person.id]
      act(() => result.current.selectPerson(person.id))
      act(() => result.current.clickCell(c.row, c.col))
    }
    act(() => result.current.submit())
    expect(result.current.feedback).toBe('wrong')
    expect(Object.keys(result.current).filter(k => /correct|count|broken|right/i.test(k))).toEqual([])
    expect(JSON.stringify(Object.values(result.current).filter(v => typeof v !== 'function' && typeof v !== 'object'))).not.toMatch(/correct/i)
  })

  it('a near miss and a hopeless guess are indistinguishable after Accuse', () => {
    const rand = prng(11)
    const afterWrong = (cells: Record<string, Cell>) => {
      localStorage.clear()
      let s = arrange(classic(p.id), cells)
      s = run(s, { type: 'SUBMIT' })
      // everything a wrong accusation may have changed, with the board itself left out
      const { marks: _m, marksPerFloor: _mpf, history: _h, future: _f, placedOf: _p, ...rest } = s as GameState & { placedOf?: unknown }
      return { rest: JSON.stringify(rest), stored: localStorage.getItem(CASE_STATE_KEY) }
    }
    const swapped = afterWrong(nearMiss(p, 'swap'))
    const moved = afterWrong(nearMiss(p, 'move'))
    expect(swapped.rest).toBe(moved.rest)
    expect(swapped.stored).toBe(moved.stored)
    for (let i = 0; i < 12; i++) {
      const guess = randomGuess(p, rand)
      if (p.people.every(x => guess[x.id].row === p.solution[x.id].row && guess[x.id].col === p.solution[x.id].col && (guess[x.id].floor ?? 0) === (p.solution[x.id].floor ?? 0))) continue
      const other = afterWrong(guess)
      expect(other.rest, `random guess ${i}`).toBe(swapped.rest)
      expect(other.stored).toBe(swapped.stored)
    }
  })

  it('the right accusation still wins, with records and a clean case state', () => {
    let s = arrange(classic(p.id), p.solution)
    s = run(s, { type: 'SUBMIT' })
    expect(s.completed).toBe(true)
    expect(s.screen).toBe('victory')
    expect(s.murderer).toBe(p.murdererId)
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toContain(p.id)
    expect(JSON.parse(localStorage.getItem(RECORDS_KEY)!)[p.id].hints).toBe(0)
  })

  it('an incomplete or blocked accusation spends nothing', () => {
    let s = classic(p.id)
    s = run(s, { type: 'SUBMIT' })
    expect(s.feedback).toBe('incomplete')
    expect(s.accusationsLeft).toBe(3)
  })
})

describe('the accusation budget', () => {
  const p = puzzles.find(x => x.id === 'very-easy-3')!
  const wrong = nearMiss(p, 'swap')

  it('starts at three and each wrong accusation spends one', () => {
    let s = arrange(classic(p.id), wrong)
    expect(s.accusationsLeft).toBe(3)
    s = run(s, { type: 'SUBMIT' })
    expect([s.feedback, s.accusationsLeft]).toEqual(['wrong', 2])
    s = run(s, { type: 'SUBMIT' })
    expect([s.feedback, s.accusationsLeft]).toEqual(['wrong', 1])
    s = run(s, { type: 'SUBMIT' })
    expect([s.feedback, s.accusationsLeft]).toEqual(['cold', 0])
  })

  it('a cold case cannot be accused again, not even with the right answer', () => {
    let s = arrange(classic(p.id), wrong)
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'SUBMIT' })
    s = arrange(s, p.solution)
    s = run(s, { type: 'SUBMIT' })
    expect(s.completed).toBe(false)
    expect(s.screen).toBe('game')
    expect(s.feedback).toBe('cold')
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY) ?? '[]')).not.toContain(p.id)
  })

  it('leaving the case and coming back does not refill the budget', () => {
    let s = arrange(classic(p.id), wrong)
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT' })
    expect(s.accusationsLeft).toBe(1)
    s = run(s, { type: 'NAVIGATE', screen: 'home' }, { type: 'START', puzzleId: p.id, mode: 'classic' })
    expect(s.accusationsLeft).toBe(1)
    expect(loadCaseState(p).wrong).toBe(2)
  })

  it('Clear does not refill the budget either', () => {
    let s = arrange(classic(p.id), wrong)
    s = run(s, { type: 'SUBMIT' }, { type: 'CLEAR_ALL' })
    expect(s.accusationsLeft).toBe(2)
  })

  it('Reveal is only offered once cold, shows the answer, and is not a solve', () => {
    let s = arrange(classic(p.id), wrong)
    expect(run(s, { type: 'REVEAL' }).revealed).toBe(false) // still has accusations
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'REVEAL' })
    expect(s.revealed).toBe(true)
    expect(s.completed).toBe(true)
    expect(s.screen).toBe('game')           // not the victory screen
    expect(s.completedIds).not.toContain(p.id)
    expect(localStorage.getItem(SOLVED_KEY)).toBeNull()
    expect(localStorage.getItem(RECORDS_KEY)).toBeNull()
    expect(localStorage.getItem('murdoku_streak_v1')).toBeNull()
    const shown = Object.fromEntries(p.people.map(x => [x.id, s.placedOf]))
    void shown
    // the board now shows the real arrangement
    for (const person of p.people) {
      const sol = p.solution[person.id]
      const cell = s.marksPerFloor[sol.floor ?? 0][sol.row][sol.col]
      expect(cell).toMatchObject({ kind: 'person', person: person.id })
    }
  })

  it('a revealed board is read-only', () => {
    let s = arrange(classic(p.id), wrong)
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'REVEAL' })
    const frozen = JSON.stringify(s.marksPerFloor)
    s = run(s, { type: 'CLEAR_ALL' }, { type: 'UNDO' }, { type: 'HINT' }, { type: 'SUBMIT' }, { type: 'START_OVER' }, { type: 'CELL', row: 0, col: 0 })
    expect(JSON.stringify(s.marksPerFloor)).toBe(frozen)
    expect(s.revealed).toBe(true)
    expect(s.completedIds).not.toContain(p.id)
    // but the player can still leave and open another case
    expect(run(s, { type: 'NAVIGATE', screen: 'home' }).screen).toBe('home')
    expect(run(s, { type: 'START', puzzleId: p.id, mode: 'classic' }).revealed).toBe(true) // sticky for this content
  })

  it('Start over clears the board, resets the budget and counts the attempt', () => {
    let s = arrange(classic(p.id), wrong)
    expect(run(s, { type: 'START_OVER' }).accusationsLeft).toBe(3) // refused: not cold
    expect(loadCaseState(p).attempts).toBe(0)
    s = run(s, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'START_OVER' })
    expect(s.accusationsLeft).toBe(3)
    expect(s.feedback).toBe('none')
    expect(s.marksPerFloor.flat(2).every(m => m.kind === 'empty')).toBe(true)
    expect(loadCaseState(p).attempts).toBe(1)
    expect(loadCaseState(p).wrong).toBe(0)
  })

  it('the hook reports cold, accusationsLeft, reveal and startOver', () => {
    const { result } = renderHook(() => useGame())
    act(() => result.current.start(p.id, 'classic'))
    for (const person of p.people) {
      const c = wrong[person.id]
      act(() => result.current.selectPerson(person.id))
      act(() => result.current.clickCell(c.row, c.col))
    }
    expect(result.current.accusationsLeft).toBe(3)
    for (let i = 0; i < 3; i++) act(() => result.current.submit())
    expect(result.current.feedback).toBe('cold')
    act(() => result.current.selectPerson(p.people[0].id)) // selecting must not lift the cold state
    expect(result.current.feedback).toBe('cold')
    act(() => result.current.startOver())
    expect(result.current.accusationsLeft).toBe(3)
    expect(result.current.feedback).toBe('none')
  })
})

describe('guessing blind does not win', () => {
  it('a bot that cannot read the clues essentially never wins within the budget (tens of thousands of cases)', () => {
    const rand = prng(2026)
    let wins = 0, trials = 0
    for (const id of ['very-easy-1', 'very-easy-3', 'easy-1', 'medium-1', 'hard-2', 'expert-3']) {
      const puzzle = puzzles.find(x => x.id === id)!
      for (let t = 0; t < 4000; t++) {
        localStorage.clear()
        let s = classic(id)
        for (let g = 0; g < 3 && !s.completed; g++) {
          s = arrange(run(s, { type: 'CLEAR_ALL' }), randomGuess(puzzle, rand))
          s = run(s, { type: 'SUBMIT' })
        }
        trials++
        if (s.completed) wins++
      }
    }
    expect(trials).toBe(24000)
    expect(wins).toBe(0)
  }, 120000)

  it('and an adaptive bot gets nothing from wrong guesses: every wrong answer returns identical state', () => {
    // If the response varied with closeness, a bot could climb. It cannot read anything but 'wrong'/'cold'.
    const puzzle = puzzles.find(x => x.id === 'medium-4')!
    const rand = prng(5)
    const seen = new Set<string>()
    for (let t = 0; t < 300; t++) {
      localStorage.clear()
      const s = run(arrange(classic(puzzle.id), randomGuess(puzzle, rand)), { type: 'SUBMIT' })
      if (s.completed) continue
      const { marks: _a, marksPerFloor: _b, history: _c, future: _d, ...rest } = s
      seen.add(JSON.stringify(rest))
    }
    expect(seen.size).toBe(1)
  })
})

describe('hints', () => {
  const p = puzzles.find(x => x.id === 'medium-2')!

  it('place the case\'s bystanders first and never the victim and murderer together up front', () => {
    let s = classic(p.id)
    const placedByHints: string[] = []
    for (let i = 0; i < 3; i++) {
      const before = s.hinted.length
      s = run(s, { type: 'HINT' })
      expect(s.hinted.length).toBe(before + 1)
      placedByHints.push(s.hinted[s.hinted.length - 1])
    }
    const others = p.people.filter(x => x.id !== p.victimId && x.id !== p.murdererId).map(x => x.id)
    const expected = [...others, p.victimId].slice(0, 3)
    expect(placedByHints).toEqual(expected)
    expect(placedByHints).not.toContain(p.murdererId)
    for (const id of placedByHints) {
      const sol = p.solution[id]
      expect(s.marksPerFloor[sol.floor ?? 0][sol.row][sol.col]).toMatchObject({ kind: 'person', person: id })
    }
  })

  it('who gets hinted does not depend on what the player has placed (no side channel)', () => {
    const order = (cells: Record<string, Cell>) => {
      localStorage.clear()
      let s = arrange(classic(p.id), cells)
      s = run(s, { type: 'HINT' }, { type: 'HINT' }, { type: 'HINT' })
      return s.hinted
    }
    const bare = (() => { localStorage.clear(); return run(classic(p.id), { type: 'HINT' }, { type: 'HINT' }, { type: 'HINT' }).hinted })()
    expect(order(p.solution)).toEqual(bare)
    expect(order(nearMiss(p, 'swap'))).toEqual(bare)
  })

  it('are not refilled by Clear or by leaving and re-entering the case', () => {
    let s = run(classic(p.id), { type: 'HINT' }, { type: 'HINT' })
    expect(s.hintsLeft).toBe(1)
    s = run(s, { type: 'CLEAR_ALL' })
    expect(s.hintsLeft).toBe(1)
    s = run(s, { type: 'NAVIGATE', screen: 'home' }, { type: 'START', puzzleId: p.id, mode: 'classic' })
    expect(s.hintsLeft).toBe(1)
    // and a hint after re-entering moves on to the next person rather than repeating
    const before = s.hinted
    s = run(s, { type: 'HINT' })
    expect(s.hinted).toHaveLength(before.length + 1)
    expect(new Set(s.hinted).size).toBe(s.hinted.length)
    // the allowance is three and it is final
    expect(run(s, { type: 'HINT' }).hintsLeft).toBe(0)
  })

  it('can fill the board with the answer but never close the case without Accuse', () => {
    // Pre-place everybody correctly except the person the next hint will place, then hint: the board is
    // now complete and correct, and the case must still be open.
    let s = arrange(classic(p.id), p.solution)
    s = run(s, { type: 'HINT' })
    expect(s.completed).toBe(false)
    expect(s.screen).toBe('game')
    expect(s.hintsLeft).toBe(2)
    s = run(s, { type: 'SUBMIT' })
    expect(s.completed).toBe(true)
    expect(JSON.parse(localStorage.getItem(RECORDS_KEY)!)[p.id].hints).toBe(1)
  })

  it('a clean solve records zero hints, a hinted one records how many were used', () => {
    let s = run(classic(p.id), { type: 'HINT' }, { type: 'HINT' })
    s = arrange(s, p.solution)
    s = run(s, { type: 'SUBMIT' })
    expect(JSON.parse(localStorage.getItem(RECORDS_KEY)!)[p.id].hints).toBe(2)
  })
})

describe('what the screen says after a wrong accusation', () => {
  const p = puzzles.find(x => x.id === 'hard-3')!

  function renderWrong(extra: Record<string, unknown> = {}, feedback: 'wrong' | 'cold' = 'wrong') {
    localStorage.setItem('murdoku_seen_help', '1')
    return render(
      <GameScreen
        puzzle={p} mode="classic" marks={Array.from({ length: p.size }, () => Array.from({ length: p.size }, () => ({ kind: 'empty' as const })))}
        conflicts={new Set()} placedOf={{}} selectedPerson={p.people[0].id} tool="place" hintsLeft={3}
        timer="00:00" hideTimer={false} canUndo={false} canRedo={false} feedback={feedback} accusationsLeft={feedback === 'cold' ? 0 : 2}
        resolvedClues={[]} onSelectPerson={vi.fn()} onSetTool={vi.fn()} onCell={vi.fn()} onToggleClue={vi.fn()}
        onUndo={vi.fn()} onRedo={vi.fn()} onClear={vi.fn()} onHint={vi.fn()} onToggleTimer={vi.fn()}
        onSubmit={vi.fn()} onDismissFeedback={vi.fn()} onBack={vi.fn()} {...extra}
      />,
    )
  }

  it('says only that the account does not hold up: no count, no clue text, in the message or the live region', () => {
    renderWrong()
    fireEvent.click(screen.getByRole('button', { name: /accuse/i }))
    const message = screen.getAllByRole('button', { name: /doesn't hold up/i }).at(-1)!
    const live = document.querySelector('[aria-live]')!
    for (const text of [message.textContent!, live.textContent!]) {
      expect(text).not.toMatch(/\d/)
      expect(text).not.toMatch(/of \w+ (in|are)|right spot|correct|broken/i)
      for (const ct of p.clues) expect(text).not.toContain(ct.text.replace(/\.$/, ''))
    }
    expect(message.textContent).toMatch(/Two accusations left/)
    expect(live.textContent).toMatch(/doesn't hold up/)
  })

  it('may say things only the player\'s own board knows: a row/column clash, suspects not yet checked off', () => {
    renderWrong({ conflicts: new Set([p.people[0].id, p.people[1].id]), mode: 'detective', resolvedClues: [p.people[0].id] })
    const text = screen.getAllByRole('button', { name: /doesn't hold up/i }).at(-1)!.textContent!
    expect(text).toMatch(/share a row or column/)
    expect(text).toMatch(/Not yet checked off/)
    expect(text).not.toContain(p.people[0].name + ',')   // the one they did check off is not listed
    expect(text).not.toMatch(/\d/)
  })

  it('a cold case offers Reveal and Start over, and Accuse is off', () => {
    const onReveal = vi.fn(), onStartOver = vi.fn()
    renderWrong({ onReveal, onStartOver }, 'cold')
    const group = screen.getByTestId('cold-case')
    fireEvent.click(within(group).getByRole('button', { name: 'Reveal' }))
    fireEvent.click(within(group).getByRole('button', { name: 'Start over' }))
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(onStartOver).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /accuse/i })).toBeDisabled()
    // the only number allowed is the attempt counter
    expect(group.textContent).toMatch(/attempt 2\./)
    expect(group.textContent!.replace(/attempt 2\./, '')).not.toMatch(/\d/)
  })

  it('a revealed case says so and offers no hint', () => {
    renderWrong({ revealed: true, attempts: 1 }, 'cold')
    expect(screen.getByTestId('cold-case').textContent).toMatch(/attempt 3\./)
    expect(screen.getByTestId('cold-case').textContent).toMatch(/already revealed/)
    expect(screen.getByRole('button', { name: /hint/i })).toBeDisabled()
  })

  it('while cold the Hint button is disabled; after a reveal the status line says "not counted"', () => {
    renderWrong({}, 'cold')
    expect(screen.getByRole('button', { name: /hint/i })).toBeDisabled()
    renderWrong({ revealed: true }, 'none' as never)
    expect(screen.getByTestId('case-revealed').textContent).toMatch(/not counted/i)
  })
})
