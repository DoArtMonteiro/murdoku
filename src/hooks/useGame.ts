import { useReducer, useEffect, useCallback, useMemo, useState } from 'react'
import type { Puzzle, CellMark, Screen, GameMode } from '../core/types'
import { cellFloor } from '../core/types'
import { getAllPuzzles, getPuzzleById, initCatalogAsync } from '../core/catalog'
import { deriveEliminations, findMurderer } from '../core/engine'
import { advanceStreak, dailyPuzzle, loadStreak, saveStreak, todayStamp } from '../core/daily'
import type { StreakState } from '../core/daily'
import { IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY, parseInProgress, parseMarksGrid } from '../core/ux'
import type { InProgressSummary } from '../core/ux'
import { MODE_KEY, TIMER_KEY, UPPER_FLOOR_KEY, readJson, removeKey, writeJson } from '../core/storage'
import {
  MAX_ACCUSATIONS, loadCaseState, loadRecords, loadSolved, puzzleFingerprint, saveCaseState, saveRecord, saveSolved,
} from '../core/progress'
import type { CaseRecord } from '../core/progress'

export type Tool = 'place' | 'x' | 'draft'

interface GameState {
  screen: Screen
  mode: GameMode
  puzzle: Puzzle | null
  /** Active floor's 2D marks — exposed as `marks` for backward compat. */
  marks: CellMark[][]
  /** Per-floor 3D marks. marks === marksPerFloor[activeFloor] always. */
  marksPerFloor: CellMark[][][]
  activeFloor: 0 | 1
  selectedPerson: string | null
  tool: Tool
  /** History entries store the full marksPerFloor snapshot. */
  history: CellMark[][][][]
  future: CellMark[][][][]   // redo stack
  hintsLeft: number
  elapsedSeconds: number
  completed: boolean
  murderer: string | null
  /**
   * Outcome of the last Accuse. 'wrong' carries exactly ONE bit: the account
   * is not the solution. Nothing about HOW wrong it was is kept anywhere.
   * 'cold' = the accusation budget is spent and the case needs Reveal or Start over.
   */
  feedback: 'none' | 'incomplete' | 'wrong' | 'blocked' | 'cold'
  /** Wrong accusations left before the case goes cold. */
  accusationsLeft: number
  /** Suspects a hint has already placed (persisted per case so Clear / re-entering cannot refill hints). */
  hinted: string[]
  /**
   * The solution has been shown for this case (persisted per content
   * fingerprint, so it survives reload, Start over and re-entering). While true,
   * nothing the player does on this case counts: no tick, record, streak or
   * badge. UIs should say "Case revealed — not counted", never "Case closed".
   */
  revealed: boolean
  /** The revealed (or uncounted-win) board is on screen and read-only. Session-only. */
  solutionShown: boolean
  /** Times the player has started this case over after it went cold. */
  attempts: number
  hideTimer: boolean
  resolvedClues: string[]   // person ids the player has crossed off (detective)
  completedIds: string[]
}

type Action =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'START'; puzzleId: string; mode: GameMode }
  | { type: 'SELECT_PERSON'; id: string }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'CELL'; row: number; col: number }
  | { type: 'ERASE'; row: number; col: number }
  | { type: 'TOGGLE_CLUE'; person: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'UNDO' }
  | { type: 'HINT' }
  | { type: 'SUBMIT' }
  | { type: 'REVEAL' }
  | { type: 'START_OVER' }
  | { type: 'SYNC_PROGRESS' }
  | { type: 'DISMISS_FEEDBACK' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'TICK' }
  | { type: 'ASSIST' }
  | { type: 'SWITCH_FLOOR'; floor: 0 | 1 }

const HINTS_START = 3

function emptyMarks(n: number): CellMark[][] {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ({ kind: 'empty' as const })))
}
function cloneMarks(m: CellMark[][]): CellMark[][] {
  return m.map(row => row.map(c => c.kind === 'draft' ? { kind: 'draft' as const, persons: [...c.persons] } : { ...c }))
}
function cloneMarksPerFloor(mpf: CellMark[][][]): CellMark[][][] {
  return mpf.map(floor => cloneMarks(floor))
}
function emptyMarksPerFloor(n: number, floors: number): CellMark[][][] {
  return Array.from({ length: floors }, () => emptyMarks(n))
}
/** Derive the active floor's 2D slice from the per-floor 3D array. */
function activeFloorMarks(mpf: CellMark[][][], floor: 0 | 1): CellMark[][] {
  return mpf[floor] ?? mpf[0]
}

export type { CaseRecord }
export { loadRecords }
function loadMode(): GameMode {
  try {
    const v = localStorage.getItem(MODE_KEY)
    return v === 'detective' || v === 'classic' ? v : 'classic'
  } catch { return 'classic' }
}
function loadHideTimer(): boolean { try { return localStorage.getItem(TIMER_KEY) === '1' } catch { return false } }

// --- mid-solve autosave (survives backing out to the case list / tab close) --
// v1 is the public read-only summary source. Keep writing the original key
// too so existing installs retain their resume behavior and compatibility.
const PLAY_KEY = IN_PROGRESS_KEY
const LEGACY_PLAY_KEY = LEGACY_IN_PROGRESS_KEY
// The key that stores upper floor marks for two-floor puzzles (storage.ts).
// MUST NOT be renamed — it is a separate key, not a rename of existing keys.
interface SavedPlay { id: string; mode: GameMode; marks: CellMark[][]; elapsed: number; hints: number; selected: string | null; fp?: string }
function loadPlay(puzzle: Puzzle): { play: SavedPlay; marksPerFloor: CellMark[][][] } | null {
  for (const key of [PLAY_KEY, LEGACY_PLAY_KEY]) {
    const parsed = readJson(key) as Partial<SavedPlay> | null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
    // A save made against different content is never applied to this puzzle.
    if (typeof parsed.fp === 'string' && parsed.fp !== puzzleFingerprint(puzzle)) continue
    if (!parseInProgress(parsed, [puzzle])) continue
    const personIds = new Set(puzzle.people.map(x => x.id))
    const ground = parseMarksGrid(parsed.marks, puzzle.size, personIds)
    if (!ground) continue
    const mpf: CellMark[][][] = [ground]
    // Upper storeys live under their own key, validated just as strictly. A
    // suspect cannot stand on two storeys, so an upper save that repeats one is dropped.
    const upper = readJson(UPPER_FLOOR_KEY) as { id?: unknown; marks?: unknown } | null
    if (upper && typeof upper === 'object' && upper.id === parsed.id) {
      const grid = parseMarksGrid(upper.marks, puzzle.size, personIds)
      const onGround = new Set(ground.flat().flatMap(m => (m.kind === 'person' ? [m.person] : [])))
      const clash = grid?.flat().some(m => m.kind === 'person' && onGround.has(m.person))
      if (grid && !clash) mpf.push(grid)
    }
    return {
      play: {
        id: parsed.id as string,
        mode: parsed.mode as GameMode,
        marks: ground,
        elapsed: typeof parsed.elapsed === 'number' && Number.isFinite(parsed.elapsed) && parsed.elapsed >= 0 ? parsed.elapsed : 0,
        hints: 0,
        selected: typeof parsed.selected === 'string' && personIds.has(parsed.selected) ? parsed.selected : null,
      },
      marksPerFloor: mpf,
    }
  }
  return null
}
function savePlay(p: SavedPlay, upperFloorMarks?: CellMark[][]) {
  const raw = JSON.stringify(p)
  try {
    localStorage.setItem(PLAY_KEY, raw)
    localStorage.setItem(LEGACY_PLAY_KEY, raw)
  } catch { return }
  if (upperFloorMarks) writeJson(UPPER_FLOOR_KEY, { id: p.id, marks: upperFloorMarks })
  else removeKey(UPPER_FLOOR_KEY)
}
function clearPlay() {
  removeKey(PLAY_KEY)
  removeKey(LEGACY_PLAY_KEY)
  removeKey(UPPER_FLOOR_KEY)
}
function loadInProgressSummary(puzzles: readonly Puzzle[]): InProgressSummary | null {
  for (const key of [PLAY_KEY, LEGACY_PLAY_KEY]) {
    try {
      const summary = parseInProgress(localStorage.getItem(key), puzzles)
      if (summary) return summary
    } catch { /* ignore unavailable storage */ }
  }
  return null
}
function hasAnyPlacement(marksPerFloor: CellMark[][][]): boolean {
  return marksPerFloor.some(floor => floor.some(row => row.some(c => c.kind === 'person' || c.kind === 'draft' || c.kind === 'x')))
}

function clearPerson(marks: CellMark[][], personId: string) {
  for (const row of marks) for (let c = 0; c < row.length; c++) {
    const m = row[c]
    if (m.kind === 'person' && m.person === personId) row[c] = { kind: 'empty' }
    if (m.kind === 'draft') { const rest = m.persons.filter(p => p !== personId); row[c] = rest.length ? { kind: 'draft', persons: rest } : { kind: 'empty' } }
  }
}

/** Clear a person from ALL floors. */
function clearPersonAllFloors(mpf: CellMark[][][], personId: string) {
  for (const floor of mpf) clearPerson(floor, personId)
}

/** Find a person's cell across all floors. Returns {row, col, floor}. */
function personCellAcrossFloors(mpf: CellMark[][][], personId: string): { row: number; col: number; floor: number } | null {
  for (let f = 0; f < mpf.length; f++) {
    const floor = mpf[f]
    for (let r = 0; r < floor.length; r++) for (let c = 0; c < floor[r].length; c++) {
      const m = floor[r][c]
      if (m.kind === 'person' && m.person === personId) return { row: r, col: c, floor: f }
    }
  }
  return null
}


/**
 * Detective mode: placing a suspect immediately crosses their whole row and
 * column (nobody else can be there). Rows and columns are GLOBAL across floors —
 * a suspect on floor 1 in row 3 eliminates row 3 on floor 0 too.
 * So auto-X is applied per-floor using placed suspects from ALL floors.
 */
function withAutoXPerFloor(mpf: CellMark[][][], mode: GameMode): CellMark[][][] {
  // Clone first
  const result = mpf.map(floor =>
    floor.map(row => row.map(c => (c.kind === 'x' && c.auto) ? { kind: 'empty' as const } : (c.kind === 'draft' ? { kind: 'draft' as const, persons: [...c.persons] } : { ...c })))
  )
  if (mode !== 'detective') return result
  const N = result[0]?.length ?? 0
  // Collect all placed suspects across ALL floors with their row/col
  const placed: { r: number; c: number }[] = []
  for (const floor of result) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (floor[r][c].kind === 'person') placed.push({ r, c })
    }
  }
  // Apply cross-floor eliminations to every floor
  for (const floor of result) {
    for (const { r, c } of placed) {
      for (let k = 0; k < N; k++) {
        for (const [rr, cc] of [[r, k], [k, c]] as const) {
          const cell = floor[rr]?.[cc]
          if (!cell) continue
          if (cell.kind === 'person') continue  // never auto-X a placed person
          if (cell.kind === 'empty' || cell.kind === 'draft') floor[rr][cc] = { kind: 'x', auto: true }
        }
      }
    }
  }
  return result
}

/**
 * Is there ANOTHER placed suspect sharing this row or column across ALL floors?
 * Rows and columns are shared globally, so upstairs placements block downstairs too.
 */
function occupiedRowOrColAllFloors(mpf: CellMark[][][], row: number, col: number, except: string): boolean {
  const N = mpf[0]?.length ?? 0
  for (const floor of mpf) {
    for (let k = 0; k < N; k++) {
      for (const [r, c] of [[row, k], [k, col]] as const) {
        const m = floor[r]?.[c]
        if (m && m.kind === 'person' && m.person !== except) return true
      }
    }
  }
  return false
}


const initial: GameState = {
  screen: 'home', mode: loadMode(), puzzle: null,
  marks: [], marksPerFloor: [[]], activeFloor: 0,
  selectedPerson: null, tool: 'place',
  history: [], future: [], hintsLeft: HINTS_START, elapsedSeconds: 0, completed: false,
  murderer: null, feedback: 'none', accusationsLeft: MAX_ACCUSATIONS, hinted: [], revealed: false, solutionShown: false, attempts: 0,
  hideTimer: loadHideTimer(),
  resolvedClues: [], completedIds: loadSolved(),
}

function pushHistory(state: GameState): CellMark[][][][] {
  return [...state.history.slice(-80), cloneMarksPerFloor(state.marksPerFloor)]
}

// After Reveal the solution is on the board for reading; nothing may edit it or
// spend anything. Navigation, starting a case and the view controls still work.
const WHEN_REVEALED: ReadonlySet<Action['type']> = new Set([
  'NAVIGATE', 'START', 'SET_MODE', 'SWITCH_FLOOR', 'TOGGLE_TIMER', 'TICK', 'SELECT_PERSON', 'DISMISS_FEEDBACK', 'SYNC_PROGRESS',
])

function reducer(state: GameState, action: Action): GameState {
  if (state.solutionShown && !WHEN_REVEALED.has(action.type)) return state
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen }

    case 'SET_MODE': {
      try { localStorage.setItem(MODE_KEY, action.mode) } catch { /* ignore */ }
      return { ...state, mode: action.mode }
    }

    case 'START': {
      const puzzle = getPuzzleById(action.puzzleId)
      if (!puzzle) return state
      try { localStorage.setItem(MODE_KEY, action.mode) } catch { /* ignore */ }
      // Resume an unsubmitted attempt on this exact case + mode, if one exists.
      const savedResult = loadPlay(puzzle)
      const saved = savedResult?.play
      const resume = saved && saved.id === action.puzzleId && saved.mode === action.mode
        && Array.isArray(saved.marks) && saved.marks.length === puzzle.size
      const floors = puzzle.floors ?? 1
      let marksPerFloor: CellMark[][][]
      if (resume) {
        // Loaded floor 0 from saved.marks; upper floors from savedResult.marksPerFloor if present
        marksPerFloor = savedResult!.marksPerFloor.length >= floors
          ? savedResult!.marksPerFloor.slice(0, floors)
          : [...savedResult!.marksPerFloor, ...Array.from({ length: floors - savedResult!.marksPerFloor.length }, () => emptyMarks(puzzle.size))]
      } else {
        marksPerFloor = emptyMarksPerFloor(puzzle.size, floors)
      }
      // Hints and accusations spent on this case live in their own fingerprinted
      // store, NOT in the board autosave: Clear (which empties the autosave) and
      // leaving and re-entering must never hand them back.
      const spent = loadCaseState(puzzle)
      const accusationsLeft = Math.max(0, MAX_ACCUSATIONS - spent.wrong)
      return {
        ...state, screen: 'game', mode: action.mode, puzzle, activeFloor: 0,
        marksPerFloor,
        marks: marksPerFloor[0],
        selectedPerson: resume ? (saved!.selected ?? puzzle.people[0]?.id ?? null) : (puzzle.people[0]?.id ?? null),
        tool: 'place', history: [], future: [],
        hintsLeft: Math.max(0, HINTS_START - spent.hinted.length), hinted: spent.hinted,
        elapsedSeconds: resume ? saved!.elapsed : 0,
        completed: false, revealed: spent.revealed, solutionShown: false, attempts: spent.attempts, murderer: null,
        feedback: accusationsLeft === 0 ? 'cold' : 'none', accusationsLeft, resolvedClues: [],
      }
    }

    case 'SELECT_PERSON':
      return { ...state, selectedPerson: action.id, tool: state.tool === 'x' ? 'place' : state.tool, feedback: 'none' }

    case 'SET_TOOL':
      return { ...state, tool: action.tool, feedback: 'none' }

    case 'CELL': {
      if (!state.puzzle) return state
      const { row, col } = action
      const cur = state.marks[row][col]
      const history = pushHistory(state)
      let mpf = cloneMarksPerFloor(state.marksPerFloor)
      let activeFloorMarksRef = mpf[state.activeFloor]

      if (state.tool === 'x') {
        if (cur.kind === 'person' && cur.locked) return state       // can't ✕ a locked answer
        if (cur.kind === 'x' && cur.auto) return { ...state, feedback: 'blocked' }
        activeFloorMarksRef[row][col] = cur.kind === 'x' ? { kind: 'empty' } : { kind: 'x' }
        mpf = withAutoXPerFloor(mpf, state.mode)
        const activeMarks = activeFloorMarks(mpf, state.activeFloor)
        return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], feedback: 'none' }
      }

      if (state.tool === 'draft') {
        if (!state.selectedPerson) return state
        if (cur.kind === 'person' || (cur.kind === 'x' && cur.auto)) return state
        const persons = cur.kind === 'draft' ? [...cur.persons] : []
        const i = persons.indexOf(state.selectedPerson)
        if (i >= 0) persons.splice(i, 1); else persons.push(state.selectedPerson)
        activeFloorMarksRef[row][col] = persons.length ? { kind: 'draft', persons } : { kind: 'empty' }
        mpf = withAutoXPerFloor(mpf, state.mode)
        const activeMarks = activeFloorMarks(mpf, state.activeFloor)
        return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], feedback: 'none' }
      }

      // place mode
      if (!state.selectedPerson) return state
      const existing = personCellAcrossFloors(state.marksPerFloor, state.selectedPerson)

      // tap the selected suspect's own cell (on active floor) to lift them
      if (cur.kind === 'person' && cur.person === state.selectedPerson) {
        activeFloorMarksRef[row][col] = { kind: 'empty' }
        mpf = withAutoXPerFloor(mpf, state.mode)
        const activeMarks = activeFloorMarks(mpf, state.activeFloor)
        return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], feedback: 'none' }
      }

      if (state.mode === 'detective') {
        // Placing auto-crosses the row & column across ALL floors — block if occupied.
        if (occupiedRowOrColAllFloors(state.marksPerFloor, row, col, state.selectedPerson)) {
          return { ...state, feedback: 'blocked' }
        }
        clearPersonAllFloors(mpf, state.selectedPerson)
        mpf[state.activeFloor][row][col] = { kind: 'person', person: state.selectedPerson }
        mpf = withAutoXPerFloor(mpf, state.mode)
        const activeMarks = activeFloorMarks(mpf, state.activeFloor)
        return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], feedback: 'none' }
      }

      // classic mode: free placement. If the target holds another suspect, swap
      // them to the mover's old cell rather than silently deleting them.
      const occupant = cur.kind === 'person' ? cur.person : null
      clearPersonAllFloors(mpf, state.selectedPerson)
      mpf[state.activeFloor][row][col] = { kind: 'person', person: state.selectedPerson }
      if (occupant && occupant !== state.selectedPerson && existing) {
        // Swap occupant back to the person's old cell on the floor they came from
        mpf[existing.floor][existing.row][existing.col] = { kind: 'person', person: occupant }
      }
      const activeMarks = activeFloorMarks(mpf, state.activeFloor)
      return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], feedback: 'none' }
    }

    case 'TOGGLE_CLUE': {
      const has = state.resolvedClues.includes(action.person)
      return { ...state, resolvedClues: has ? state.resolvedClues.filter(p => p !== action.person) : [...state.resolvedClues, action.person] }
    }

    case 'ERASE': {
      const cur = state.marks[action.row][action.col]
      if (cur.kind === 'person' && cur.locked) return state
      if (cur.kind === 'x' && cur.auto) return state
      const history = pushHistory(state)
      const mpf = cloneMarksPerFloor(state.marksPerFloor)
      mpf[state.activeFloor][action.row][action.col] = { kind: 'empty' }
      const updated = withAutoXPerFloor(mpf, state.mode)
      return { ...state, marksPerFloor: updated, marks: activeFloorMarks(updated, state.activeFloor), history, future: [], feedback: 'none' }
    }

    case 'CLEAR_ALL': {
      if (!state.puzzle) return state
      const floors = state.puzzle.floors ?? 1
      const mpf = emptyMarksPerFloor(state.puzzle.size, floors)
      return { ...state, history: pushHistory(state), future: [], marksPerFloor: mpf, marks: mpf[0], activeFloor: 0, resolvedClues: [], feedback: 'none' }
    }

    case 'UNDO': {
      if (!state.history.length) return state
      const prev = state.history[state.history.length - 1]
      const mpf = cloneMarksPerFloor(prev)
      const activeF = Math.min(state.activeFloor, mpf.length - 1) as 0 | 1
      return { ...state, marksPerFloor: mpf, marks: activeFloorMarks(mpf, activeF), history: state.history.slice(0, -1), future: [cloneMarksPerFloor(state.marksPerFloor), ...state.future].slice(0, 80), feedback: 'none' }
    }

    case 'REDO': {
      if (!state.future.length) return state
      const next = state.future[0]
      const mpf = cloneMarksPerFloor(next)
      const activeF = Math.min(state.activeFloor, mpf.length - 1) as 0 | 1
      return { ...state, marksPerFloor: mpf, marks: activeFloorMarks(mpf, activeF), future: state.future.slice(1), history: [...state.history, cloneMarksPerFloor(state.marksPerFloor)], feedback: 'none' }
    }

    case 'SWITCH_FLOOR': {
      if (!state.puzzle || (state.puzzle.floors ?? 1) < 2) return state
      return { ...state, activeFloor: action.floor, marks: activeFloorMarks(state.marksPerFloor, action.floor) }
    }

    case 'TOGGLE_TIMER': {
      const v = !state.hideTimer
      try { localStorage.setItem(TIMER_KEY, v ? '1' : '0') } catch { /* ignore */ }
      return { ...state, hideTimer: v }
    }

    case 'ASSIST': {
      // The Logic Assistant marks only cells that are provably empty given the
      // current placements (see deriveEliminations). It is NOT a solver: it
      // never places anybody and never reveals an answer, so unlike HINT it
      // costs nothing. Marks land as auto X's so the player's own X's stay
      // visually distinct and a single UNDO takes the whole sweep back.
      //
      // Assist is a Detective-mode tool: elimination is the core detective
      // discipline. Classic mode players are not expected to track provable
      // absences — they place by feel and submit. Gated here (not just in the
      // view) so tests can assert the rule directly.
      if (state.mode !== 'detective') return state
      if (!state.puzzle) return state
      // Build placed WITH floor so deriveEliminations can reason across both storeys.
      const placed: Record<string, { row: number; col: number; floor?: number }> = {}
      for (const person of state.puzzle.people) {
        const cell = personCellAcrossFloors(state.marksPerFloor, person.id)
        if (cell) placed[person.id] = cell
      }
      const eliminations = deriveEliminations(state.puzzle, placed)
      // Filter each elimination against the marks of ITS OWN floor.
      const fresh = eliminations.filter(cell => {
        const fl = cellFloor(cell)
        const floorMarks = state.marksPerFloor[fl]
        return floorMarks && floorMarks[cell.row]?.[cell.col]?.kind === 'empty'
      })
      if (!fresh.length) return state
      const history = pushHistory(state)
      const mpf = cloneMarksPerFloor(state.marksPerFloor)
      // Write each elimination into its own floor's marks.
      for (const cell of fresh) mpf[cellFloor(cell)][cell.row][cell.col] = { kind: 'x', auto: true }
      // Deliberately NOT running withAutoXPerFloor here. That pass wipes every
      // auto mark and regenerates them from the placed suspects, which would
      // erase the eliminations Assist just wrote. Assist changes no placement,
      // so the derived auto-X set is already correct.
      return { ...state, marksPerFloor: mpf, marks: activeFloorMarks(mpf, state.activeFloor), history, future: [] }
    }

    case 'HINT': {
      // Hints place a suspect at their correct position — they short-circuit the
      // deduction the player was supposed to make. Classic mode is forgiving and
      // uses hints as a nudge toward finishing. Detective mode's contract is that
      // every placed suspect is provable: a dropped answer would break that
      // contract, so hints are unavailable. The Assist tool (provable-empty
      // cell marking) is the detective's substitute.
      if (state.mode === 'detective') return state
      if (!state.puzzle || state.hintsLeft <= 0 || state.completed || state.revealed || state.accusationsLeft <= 0) return state
      // The order is fixed by the case alone: bystanders first, then the victim,
      // the murderer last. It must NOT depend on what the player has placed, or
      // the choice of who gets hinted ("p0 was skipped, so p0 must already be
      // right") would tell the player which of their placements are correct.
      const target = hintOrder(state.puzzle).find(id => !state.hinted.includes(id))
      if (!target) return state
      const history = pushHistory(state)
      let mpf = cloneMarksPerFloor(state.marksPerFloor)
      // don't disturb locked correct answers
      const targetCellNow = personCellAcrossFloors(mpf, target)
      if (targetCellNow) {
        const tm = mpf[targetCellNow.floor][targetCellNow.row][targetCellNow.col]
        if (tm.kind === 'person' && tm.locked) return state
      }
      clearPersonAllFloors(mpf, target)
      const sol = state.puzzle.solution[target]
      const solFloor = sol.floor ?? 0
      const occ = mpf[solFloor][sol.row][sol.col]
      if (occ.kind === 'person') { if (occ.locked) return state; clearPersonAllFloors(mpf, occ.person) }
      mpf[solFloor][sol.row][sol.col] = { kind: 'person', person: target }
      mpf = withAutoXPerFloor(mpf, state.mode)
      const activeMarks = activeFloorMarks(mpf, state.activeFloor)
      const hinted = [...state.hinted, target]
      const spent = loadCaseState(state.puzzle)
      saveCaseState(state.puzzle, { ...spent, hinted })
      // A hint may complete the arrangement, but it never closes the case: the
      // player still has to make the accusation themselves.
      return { ...state, marksPerFloor: mpf, marks: activeMarks, history, future: [], hintsLeft: Math.max(0, HINTS_START - hinted.length), hinted, feedback: 'none' }
    }

    case 'SUBMIT': {
      if (!state.puzzle || state.completed) return state
      if (state.accusationsLeft <= 0) return { ...state, feedback: 'cold' }
      const allPlaced = state.puzzle.people.every(p => personCellAcrossFloors(state.marksPerFloor, p.id))
      if (!allPlaced) return { ...state, feedback: 'incomplete' }
      // The ONLY thing an accusation reports is whether it is exactly right.
      // No count of correct suspects, no clue named, no cell: a wrong account
      // looks the same however close it was, so it cannot be used as an oracle.
      const exact = state.puzzle.people.every(p => {
        const cell = personCellAcrossFloors(state.marksPerFloor, p.id)!
        const sol = state.puzzle!.solution[p.id]
        // Must match row, col AND floor — right position wrong storey is wrong
        return cell.row === sol.row && cell.col === sol.col && cell.floor === (sol.floor ?? 0)
      })
      if (exact) return win(state)
      const spent = loadCaseState(state.puzzle)
      const wrong = Math.min(MAX_ACCUSATIONS, MAX_ACCUSATIONS - state.accusationsLeft + 1)
      saveCaseState(state.puzzle, { ...spent, wrong })
      const accusationsLeft = MAX_ACCUSATIONS - wrong
      return { ...state, accusationsLeft, feedback: accusationsLeft === 0 ? 'cold' : 'wrong' }
    }

    case 'REVEAL': {
      // Giving up. Only available once the case has gone cold. The solution is
      // shown, the case is NOT marked solved, no record is written and no streak
      // advances.
      if (!state.puzzle || state.completed || state.accusationsLeft > 0) return state
      const floors = state.puzzle.floors ?? 1
      const shown = emptyMarksPerFloor(state.puzzle.size, floors)
      for (const person of state.puzzle.people) {
        const sol = state.puzzle.solution[person.id]
        shown[sol.floor ?? 0][sol.row][sol.col] = { kind: 'person', person: person.id, locked: true }
      }
      clearPlay()
      // Sticky and fingerprinted: reloading, Start over and winning later do not undo it.
      saveCaseState(state.puzzle, { ...loadCaseState(state.puzzle), revealed: true })
      return {
        ...state, marksPerFloor: shown, marks: activeFloorMarks(shown, state.activeFloor),
        history: pushHistory(state), future: [], completed: true, revealed: true, solutionShown: true,
        murderer: findMurderer(state.puzzle, state.puzzle.solution), feedback: 'none',
      }
    }

    case 'START_OVER': {
      // A fresh attempt at a case that went cold: empty board, a full accusation
      // budget, the attempt counted. Hints already spent stay spent, and the
      // clock keeps running so a restart does not launder a slow time.
      if (!state.puzzle || state.completed || state.accusationsLeft > 0) return state
      const floors = state.puzzle.floors ?? 1
      const mpf = emptyMarksPerFloor(state.puzzle.size, floors)
      const spent = loadCaseState(state.puzzle)
      saveCaseState(state.puzzle, { ...spent, wrong: 0, attempts: spent.attempts + 1 })
      clearPlay()
      return {
        ...state, marksPerFloor: mpf, marks: mpf[0], activeFloor: 0, history: [], future: [], attempts: spent.attempts + 1,
        resolvedClues: [], accusationsLeft: MAX_ACCUSATIONS, feedback: 'none',
      }
    }

    case 'SYNC_PROGRESS':
      return { ...state, completedIds: loadSolved() }

    case 'DISMISS_FEEDBACK':
      // 'cold' is a state, not a message: it stays until the player picks Reveal or Start over.
      return state.feedback === 'cold' ? state : { ...state, feedback: 'none' }

    case 'TICK':
      if (state.screen !== 'game' || state.completed) return state
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 }

    default:
      return state
  }
}

/**
 * Who a hint places next. A function of the case alone (never of the board):
 * bystanders in cast order, then the victim, then the murderer, so the first
 * hints do not hand out the pair the accusation is about.
 */
function hintOrder(puzzle: Puzzle): string[] {
  const murderer = findMurderer(puzzle, puzzle.solution) ?? puzzle.murdererId
  const rank = (id: string) => (id === murderer ? 2 : id === puzzle.victimId ? 1 : 0)
  return puzzle.people.map((x, i) => ({ id: x.id, i })).sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i).map(x => x.id)
}

function win(state: GameState): GameState {
  const puzzle = state.puzzle!
  const murderer = findMurderer(puzzle, puzzle.solution)
  if (state.revealed) {
    // The solution was shown for this very content, so placing it again proves
    // nothing. The board is accepted and read out, but no tick, record, streak
    // or badge is earned and the victory screen ("Case closed") is not shown.
    saveCaseState(puzzle, { fp: puzzleFingerprint(puzzle), hinted: [], wrong: 0, attempts: state.attempts, revealed: true })
    clearPlay()
    return { ...state, completed: true, solutionShown: true, murderer, feedback: 'none' }
  }
  const completedIds = state.completedIds.includes(puzzle.id)
    ? state.completedIds : [...state.completedIds, puzzle.id]
  saveSolved(completedIds)
  // The record stores hints USED, so "No Assistance" is `hints === 0`.
  saveRecord(puzzle.id, state.elapsedSeconds, HINTS_START - state.hintsLeft)
  // Solved: the next visit to this case starts with a full set of hints and accusations.
  saveCaseState(puzzle, { fp: puzzleFingerprint(puzzle), hinted: [], wrong: 0, attempts: 0, revealed: false })

  // A streak only advances for the case that IS today's daily. Solving six
  // cases in one evening is not a six-day streak.
  const today = todayStamp()
  if (dailyPuzzle(getAllPuzzles(), today)?.id === puzzle.id) {
    saveStreak(advanceStreak(loadStreak(), today))
  }

  clearPlay() // solved — drop the in-progress autosave
  return { ...state, completed: true, murderer, screen: 'victory', completedIds, feedback: 'none' }
}

/** Exposed so tests can drive the pure reducer without a React tree. */
export { reducer as gameReducer, initial as initialGameState }
export type { GameState, Action as GameAction }

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initial)

  // The catalog is built AFTER first paint, one case per macrotask. Building it
  // inside render meant a cold visitor watched a blank page for the length of a
  // 60-case generation. `catalogProgress` lets the shell say what it is doing;
  // a warm cache resolves on the first tick and is never seen.
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [catalogProgress, setCatalogProgress] = useState<{ done: number; total: number } | null>(null)
  useEffect(() => {
    let live = true
    initCatalogAsync((done, total) => { if (live) setCatalogProgress({ done, total }) })
      .then(list => {
        if (!live) return
        setPuzzles(list)
        setCatalogProgress(null)
        // Building the catalog reconciles saved progress with each case's
        // fingerprint; pick up whatever it purged.
        dispatch({ type: 'SYNC_PROGRESS' })
      })
      .catch(() => { if (live) setCatalogProgress(null) })
    return () => { live = false }
  }, [])

  const [streak, setStreak] = useState<StreakState>(() => loadStreak())
  // The streak is written inside the reducer's win path, so re-read it whenever
  // a case closes rather than duplicating the advance logic here.
  useEffect(() => { if (state.completed) setStreak(loadStreak()) }, [state.completed])

  useEffect(() => {
    let paused = document.hidden
    const onVisibility = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)
    const id = setInterval(() => { if (!paused) dispatch({ type: 'TICK' }) }, 1000)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  // Autosave the in-progress attempt so backing out (or a tab close) never
  // loses mid-solve placements. Cleared automatically on solve.
  // Floor 0 marks go to the existing PLAY_KEY (compat). Upper floors go to the
  // new UPPER_FLOOR_KEY so old clients still resume from floor 0 correctly.
  useEffect(() => {
    if (state.screen === 'game' && state.puzzle && !state.completed) {
      if (hasAnyPlacement(state.marksPerFloor)) {
        const floor0 = state.marksPerFloor[0]
        const upperFloor = state.marksPerFloor.length > 1 ? state.marksPerFloor[1] : undefined
        savePlay(
          { id: state.puzzle.id, mode: state.mode, marks: floor0, elapsed: state.elapsedSeconds, hints: state.hintsLeft, selected: state.selectedPerson, fp: puzzleFingerprint(state.puzzle) },
          upperFloor,
        )
      } else {
        clearPlay()
      }
    }
  }, [state.marksPerFloor, state.elapsedSeconds, state.screen, state.completed, state.puzzle, state.mode, state.hintsLeft, state.selectedPerson])

  const daily = useMemo(() => dailyPuzzle(puzzles), [puzzles])

  const placedOf = useMemo(() => {
    // Scan all floors; the last-placed wins (each person can only appear once).
    const map: Record<string, { row: number; col: number; floor: number; locked?: boolean }> = {}
    state.marksPerFloor.forEach((floor, f) => {
      floor.forEach((row, r) => row.forEach((m, c) => {
        if (m.kind === 'person') map[m.person] = { row: r, col: c, floor: f, locked: m.locked }
      }))
    })
    return map
  }, [state.marksPerFloor])

  const conflicts = useMemo(() => {
    if (!state.puzzle) return new Set<string>()
    // Rows and columns are GLOBAL across floors — conflict if same row/col regardless of floor.
    const byRow: Record<number, string[]> = {}, byCol: Record<number, string[]> = {}
    for (const [pid, cell] of Object.entries(placedOf)) {
      ; (byRow[cell.row] ||= []).push(pid); (byCol[cell.col] ||= []).push(pid)
    }
    const bad = new Set<string>()
    for (const g of [...Object.values(byRow), ...Object.values(byCol)])
      if (g.length > 1) g.forEach(id => bad.add(id))
    return bad
  }, [placedOf, state.puzzle])

  const inProgress = loadInProgressSummary(puzzles)

  return {
    ...state,
    // Once the budget is spent the case is cold until the player chooses Reveal
    // or Start over; nothing else (selecting a suspect, moving a token) lifts it.
    feedback: state.accusationsLeft <= 0 && state.puzzle && !state.completed ? 'cold' as const : state.feedback,
    puzzles,
    catalogProgress,
    daily,
    streak,
    placedOf,
    conflicts,
    inProgress,
    records: loadRecords(),
    timer: formatTime(state.elapsedSeconds),
    start: useCallback((id: string, mode: GameMode) => dispatch({ type: 'START', puzzleId: id, mode }), []),
    setMode: useCallback((mode: GameMode) => dispatch({ type: 'SET_MODE', mode }), []),
    navigate: useCallback((screen: Screen) => dispatch({ type: 'NAVIGATE', screen }), []),
    selectPerson: useCallback((id: string) => dispatch({ type: 'SELECT_PERSON', id }), []),
    setTool: useCallback((tool: Tool) => dispatch({ type: 'SET_TOOL', tool }), []),
    clickCell: useCallback((row: number, col: number) => dispatch({ type: 'CELL', row, col }), []),
    eraseCell: useCallback((row: number, col: number) => dispatch({ type: 'ERASE', row, col }), []),
    toggleClue: useCallback((person: string) => dispatch({ type: 'TOGGLE_CLUE', person }), []),
    clearAll: useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []),
    undo: useCallback(() => dispatch({ type: 'UNDO' }), []),
    redo: useCallback(() => dispatch({ type: 'REDO' }), []),
    toggleTimer: useCallback(() => dispatch({ type: 'TOGGLE_TIMER' }), []),
    hint: useCallback(() => dispatch({ type: 'HINT' }), []),
    assist: useCallback(() => dispatch({ type: 'ASSIST' }), []),
    submit: useCallback(() => dispatch({ type: 'SUBMIT' }), []),
    reveal: useCallback(() => dispatch({ type: 'REVEAL' }), []),
    startOver: useCallback(() => dispatch({ type: 'START_OVER' }), []),
    dismissFeedback: useCallback(() => dispatch({ type: 'DISMISS_FEEDBACK' }), []),
    switchFloor: useCallback((floor: 0 | 1) => dispatch({ type: 'SWITCH_FLOOR', floor }), []),
  }
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
