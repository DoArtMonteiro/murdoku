// The play state of the slice as one pure reducer, so the rules (one-tap
// placement, lift, auto-advance, conflicts that never block, pencil, ghost,
// hints, accusation) can be tested without a browser.
import type { Cell, Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { cellKey, cellName, conflictIds, firstName, norm, sameCell } from './cells'
import type { Placement } from './cells'
import { hintFor, nextStep } from './hint'
import type { Hint } from './hint'
import { statementsOf } from './lens'
import { judgeAccusation } from './verdict'
import type { Verdict } from './verdict'
import type { Outcome, Saved } from './save'
import type { Supposition } from './suppose'

interface Snapshot { placement: Placement; pencil: Record<string, string[]> }

export interface GameState {
  placement: Placement
  pencil: Record<string, string[]>
  selected: string
  floor: number
  /** Lit statement indices per suspect. */
  lit: Record<string, number[]>
  pencilOn: boolean
  supposeOn: boolean
  ghost: Supposition | null
  hint: Hint | null
  hintsUsed: number
  strikes: number
  outcome: Outcome
  history: Snapshot[]
  announce: string
  /** Last accusation result, for the sheet. */
  verdict: Verdict | null
}

export type Action =
  | { t: 'select'; id: string }
  | { t: 'cell'; cell: Cell }
  | { t: 'long'; cell: Cell }
  | { t: 'lit'; index: number }
  | { t: 'pencil' }
  | { t: 'suppose' }
  | { t: 'undo' }
  | { t: 'why' }
  | { t: 'floor'; floor: number }
  | { t: 'accuse'; id: string }
  | { t: 'dropGhost' }
  | { t: 'clearVerdict' }

const HISTORY_CAP = 60

export function initState(p: Puzzle, saved: Saved): GameState {
  const firstFree = p.people.find(x => !saved.placement[x.id]) ?? p.people[0]
  return {
    placement: saved.placement, pencil: saved.pencil, selected: firstFree.id,
    floor: 0, lit: {}, pencilOn: false, supposeOn: false, ghost: null, hint: null,
    hintsUsed: saved.hintsUsed, strikes: saved.strikes, outcome: saved.outcome,
    history: [], announce: '', verdict: null,
  }
}

export const toSaved = (s: GameState): Saved =>
  ({ placement: s.placement, pencil: s.pencil, strikes: s.strikes, outcome: s.outcome, hintsUsed: s.hintsUsed })

const personAt = (place: Placement, cell: Cell): string | undefined =>
  Object.keys(place).find(id => sameCell(place[id], cell))

function nextUnplaced(p: Puzzle, place: Placement, after: string): string | null {
  const ids = p.people.map(x => x.id)
  const start = ids.indexOf(after)
  for (let i = 1; i <= ids.length; i++) {
    const id = ids[(start + i) % ids.length]
    if (!place[id]) return id
  }
  return null
}

function snapshot(s: GameState): Snapshot[] {
  return [...s.history, { placement: s.placement, pencil: s.pencil }].slice(-HISTORY_CAP)
}

/** Put a person on a cell (anyone already there is lifted). Never blocks on a clash. */
function place(p: Puzzle, s: GameState, id: string, cell: Cell, auto: boolean): GameState {
  const c = norm(cell)
  const next: Placement = {}
  for (const [k, v] of Object.entries(s.placement)) if (k !== id && !sameCell(v, c)) next[k] = v
  next[id] = c
  const clashes = conflictIds(next).has(id)
    ? Object.keys(next).filter(o => o !== id && (next[o].row === c.row || next[o].col === c.col)).map(o => firstName(p, o))
    : []
  const msg = `${firstName(p, id)} placed, ${cellName(p, c)}.${clashes.length ? ` Shares a row or column with ${clashes.join(' and ')}.` : ''}`
  const adv = auto ? nextUnplaced(p, next, id) : null
  return {
    ...s, placement: next, history: snapshot(s), hint: null, ghost: null,
    selected: adv ?? id, announce: msg,
  }
}

function toggleLit(p: Puzzle, s: GameState, index: number): GameState {
  const st = statementsOf(p, s.selected).find(x => x.index === index)
  if (!st) return s
  if (st.needs && !s.placement[st.needs]) {
    return { ...s, announce: `Place ${firstName(p, st.needs)} first: this statement is about ${firstName(p, st.needs)}.` }
  }
  const cur = s.lit[s.selected] ?? []
  const on = cur.includes(index)
  return { ...s, lit: { ...s.lit, [s.selected]: on ? cur.filter(i => i !== index) : [...cur, index] }, announce: on ? 'Statement unlit.' : 'Statement lit.' }
}

function tapCell(p: Puzzle, s: GameState, cell: Cell): GameState {
  if (s.ghost && !s.supposeOn) return { ...s, ghost: null, announce: 'Supposition cleared.' }
  if (s.supposeOn) return setGhost(p, s, cell)
  const key = cellKey(cell)
  const occupant = personAt(s.placement, cell)
  if (s.pencilOn) {
    if (occupant === s.selected) return s
    const cur = s.pencil[s.selected] ?? []
    const on = cur.includes(key)
    return {
      ...s, history: snapshot(s),
      pencil: { ...s.pencil, [s.selected]: on ? cur.filter(k => k !== key) : [...cur, key] },
      announce: `${on ? 'Cross removed' : 'Crossed out'}, ${cellName(p, cell)}.`,
    }
  }
  if (occupant && occupant !== s.selected) {
    return { ...s, selected: occupant, floor: cellFloor(s.placement[occupant]), announce: `${firstName(p, occupant)} selected.` }
  }
  if (occupant === s.selected) {
    const next = { ...s.placement }
    delete next[occupant]
    return { ...s, placement: next, history: snapshot(s), hint: null, announce: `${firstName(p, occupant)} lifted.` }
  }
  return place(p, s, s.selected, cell, true)
}

function setGhost(p: Puzzle, s: GameState, cell: Cell): GameState {
  if (s.ghost && sameCell(s.ghost.cell, cell)) return { ...s, ghost: null, announce: 'Supposition released.' }
  return { ...s, ghost: { person: s.selected, cell: norm(cell) }, announce: `Supposing ${firstName(p, s.selected)} in ${cellName(p, cell)}.` }
}

function why(p: Puzzle, s: GameState): GameState {
  const step = nextStep(p, s.placement)
  if (!step) return { ...s, hint: null, announce: 'Everything is where the statements put it. Name the one who was alone with the victim.' }
  const level = (s.hint && s.hint.person === step.person && s.hint.level < 3 ? s.hint.level + 1 : 1) as 1 | 2 | 3
  const h = hintFor(p, s.placement, level)!
  let next: GameState = { ...s, hint: h, hintsUsed: s.hintsUsed + 1, selected: h.person, ghost: null, announce: h.text }
  if (level === 2) next = { ...next, lit: { ...next.lit, [h.person]: h.lit } }
  if (level === 3) {
    next = { ...place(p, next, h.person, h.cell, false), hint: h, hintsUsed: next.hintsUsed, floor: cellFloor(h.cell), announce: h.text }
  }
  return next
}

function accuse(p: Puzzle, s: GameState, id: string): GameState {
  if (s.outcome === 'cold') return s
  const v = judgeAccusation(p, id, s.placement, s.strikes)
  const name = firstName(p, id)
  switch (v.kind) {
    case 'invalid': return s
    case 'proved': return { ...s, verdict: v, outcome: 'proved', announce: `Proved. ${name} was alone with ${firstName(p, p.victimId)}, and the plan holds.` }
    case 'calledIt': return { ...s, verdict: v, outcome: s.outcome === 'proved' ? 'proved' : 'called', announce: `Called it. ${name} was alone with ${firstName(p, p.victimId)}. The plan is not proven yet.` }
    case 'notThem':
      return { ...s, verdict: v, strikes: v.strikes, outcome: v.cold ? 'cold' : s.outcome, announce: `Not ${name}. ${v.cold ? 'The case has gone cold.' : `Strike ${v.strikes} of 3.`}` }
  }
}

export function reduce(p: Puzzle, s: GameState, a: Action): GameState {
  switch (a.t) {
    case 'select': {
      const c = s.placement[a.id]
      return { ...s, selected: a.id, floor: c ? cellFloor(c) : s.floor, announce: `${firstName(p, a.id)} selected.` }
    }
    case 'cell': return tapCell(p, s, a.cell)
    case 'long': return s.pencilOn ? s : setGhost(p, { ...s, supposeOn: false }, a.cell)
    case 'lit': return toggleLit(p, s, a.index)
    case 'pencil': return { ...s, pencilOn: !s.pencilOn, supposeOn: false, announce: s.pencilOn ? 'Pencil off.' : 'Pencil on. Taps cross out squares for the selected suspect.' }
    case 'suppose': return { ...s, supposeOn: !s.supposeOn, pencilOn: false, ghost: s.supposeOn ? null : s.ghost, announce: s.supposeOn ? 'Suppose off.' : 'Suppose on. Tap a square to try the selected suspect there.' }
    case 'undo': {
      const last = s.history[s.history.length - 1]
      if (!last) return s
      return { ...s, placement: last.placement, pencil: last.pencil, history: s.history.slice(0, -1), hint: null, ghost: null, announce: 'Undone.' }
    }
    case 'why': return why(p, s)
    case 'floor': return { ...s, floor: a.floor }
    case 'accuse': return accuse(p, s, a.id)
    case 'dropGhost': return s.ghost ? { ...s, ghost: null, announce: 'Supposition released.' } : s
    case 'clearVerdict': return { ...s, verdict: null }
  }
}
