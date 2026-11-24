// The play state of One False Alibi as one pure reducer, so the rules can be tested without a browser.
// The bench is silent: placement is the player's experiment tool and the game never writes down a collision
// for them. The player pins statements, cites them as "can't all be true", and the engine rules (collide.ts).
// Nothing here reads puzzle.solution: the case closes when the placement satisfies every true statement
// (puzzle.clues), which is the same thing, decided by the engine.
import { clueHolds, isSolution } from '../core/engine'
import type { Cell } from '../core/types'
import { citable, contradictionKey, crackTiles, inReadingOrder, keepConsistent, proofGate, rule } from './collide'
import type { LedgerRow } from './collide'
import { usedLines } from './lens'
import type { Placed } from './lens'
import type { LieCase, Statement } from './model'
import type { Saved } from './save'
import type { Cue } from './sound'

export interface Ctx {
  c: LieCase
  /** Hidden authoring harness (`&truth`): only true statements, no pins, no ledger. */
  truthOnly: boolean
}

export const MAX_PINS = 4
/** After this many false citations the hint line appears. */
export const HINT_AT = 2
/** After this many the lens shows the rows and columns held by placed people. */
export const SIGHTLINES_AT = 4

export type NoteKind = 'crack' | 'info' | 'refuse'
export interface Note { text: string; kind: NoteKind }

export interface GameState {
  placed: Placed
  selected: string
  /** Lit statement ids, per author. */
  lit: Record<string, string[]>
  /** Statements pinned to the citation tray, across suspects. */
  pins: string[]
  /** Recorded contradictions, each a set of statement ids in reading order. */
  ledger: LedgerRow[]
  /** Citations that were satisfiable or not minimal. */
  falseCitations: number
  /** The lie, once doubted with proof. */
  struck: string | null
  /** 'proved' when the plan is closed. */
  outcome: 'proved' | null
  /** Honest people whose place is settled after the proof. */
  locked: string[]
  /** The last recorded contradiction, while its crack shows on the plan. */
  cracked: string[]
  /** Taps on a ruled-out tile. */
  refusals: number
  /** True from a ruled-out tap until the next successful move. */
  refusalOpen: boolean
  /** The player has toggled a statement. */
  touched: boolean
  history: Placed[]
  /** The token just lifted off by the proof (the view keeps it on the plan until the lift has played). */
  lifted: { person: string; cell: Cell } | null
  announce: string
  /** The one visible line an event earns, if any. */
  note: Note | null
  cue: Cue | null
  /** Changes on every action that produced a cue, so an identical cue twice in a row still plays. */
  cueN: number
}

export type Action =
  | { t: 'select'; id: string }
  | { t: 'tile'; cell: Cell }
  | { t: 'lit'; id: string }
  | { t: 'pin'; id: string }
  | { t: 'cite' }
  | { t: 'doubt'; id: string }
  | { t: 'undo' }
  | { t: 'settleLift' }

export const nameOf = (c: LieCase, id: string): string => c.story.cast[id]?.name ?? c.puzzle.people.find(x => x.id === id)?.name ?? id

/** Suspects in case order, then the victim, who is always last. */
export function orderedPeople(c: LieCase): string[] {
  const ids = c.puzzle.people.map(x => x.id)
  return [...ids.filter(id => id !== c.puzzle.victimId), c.puzzle.victimId]
}

/** The statements in force: the lie is absent from the true-only direction, and struck once it is proved. */
export function activeStatements(ctx: Ctx, struck: string | null): Statement[] {
  const { c, truthOnly } = ctx
  return c.statements.filter(s => (truthOnly ? s.id !== c.lieId : s.id !== struck))
}

/** The statements the player reads: all of them, the struck lie included; the true-only direction never shows the lie. */
export const visibleStatements = (ctx: Ctx): Statement[] => (ctx.truthOnly ? ctx.c.statements.filter(s => s.id !== ctx.c.lieId) : ctx.c.statements)

export const liar = (c: LieCase): string => c.statements.find(s => s.id === c.lieId)?.author ?? c.puzzle.murdererId

/** Act 1 (proving which account is false) or Act 2 (reconstructing). The hidden harness is always Act 2. */
export const actOf = (ctx: Ctx, s: Pick<GameState, 'struck'>): 1 | 2 => (ctx.truthOnly || s.struck ? 2 : 1)

export type Tier = 'Proved' | 'Proved, after some false starts' | 'Proved the long way' | 'Closed'

export const tierFor = (truthOnly: boolean, falseCitations: number): Tier =>
  truthOnly ? 'Closed' : falseCitations === 0 ? 'Proved' : falseCitations < SIGHTLINES_AT ? 'Proved, after some false starts' : 'Proved the long way'

/** 0 = nothing yet, 1 = the hint line, 2 = the lens shows who holds which row and column. */
export const ladderStep = (falseCitations: number): 0 | 1 | 2 => (falseCitations >= SIGHTLINES_AT ? 2 : falseCitations >= HINT_AT ? 1 : 0)

export const HINT = 'Who is standing in the way?'

/** The first two sentences of the premise: enough to be somewhere, not a page to read. */
export const premiseOf = (text: string): string => (text.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [text]).slice(0, 2).join('').trim()

/** The statement as the player reads it. */
export const readOf = (st: Statement): string => st.display ?? st.text

const DIR_WORD = { N: 'north of', S: 'south of', E: 'east of', W: 'west of' } as const
const furn = (f: string): string => (f === 'tv' ? 'TV' : f)

/** A short claim for a chip: the place, the furniture or the person the statement is about. */
export function shortClaim(c: LieCase, st: Statement): string {
  const k = st.clue
  const room = (id: string) => c.puzzle.rooms.find(r => r.id === id)?.name
  switch (k.kind) {
    case 'room': return `the ${room(k.roomId) ?? k.roomId}`
    case 'notRoom': return `not the ${room(k.roomId) ?? k.roomId}`
    case 'onFurniture': case 'onlyOnFurniture': return `on the ${furn(k.furniture)}`
    case 'besideFurniture': return `by the ${furn(k.furniture)}`
    case 'besideAny': return `by the ${k.furniture.map(furn).join(' or the ')}`
    case 'sameRoomAs': return `with ${nameOf(c, k.other)}`
    case 'notSameRoomAs': return `apart from ${nameOf(c, k.other)}`
    case 'besidePerson': return `next to ${nameOf(c, k.other)}`
    case 'direction': return `${DIR_WORD[k.dir]} ${nameOf(c, k.other)}`
    case 'edge': return 'a wall'
    case 'corner': return 'a corner'
    default: return readOf(st)
  }
}

/** "Inês · the counter". */
export const chipOf = (c: LieCase, st: Statement): string => `${nameOf(c, st.author)} · ${shortClaim(c, st)}`

/** True when everyone is placed, in their own row and column, every true statement holds, and (in Act 1) the lie is proved. */
export function isClosed(ctx: Ctx, s: Pick<GameState, 'placed' | 'struck'>): boolean {
  const { c } = ctx
  if (!ctx.truthOnly && !s.struck) return false
  const people = c.puzzle.people
  if (!people.every(x => s.placed[x.id])) return false
  const rows = new Set(people.map(x => s.placed[x.id].row)), cols = new Set(people.map(x => s.placed[x.id].col))
  if (rows.size !== people.length || cols.size !== people.length) return false
  return isSolution(c.puzzle, s.placed)
}

/** The first person whose own statement fails on a complete plan, for "Tomé's account doesn't hold there." */
export function failingSpeaker(ctx: Ctx, placed: Placed, struck: string | null): string | null {
  const active = activeStatements(ctx, struck)
  const st = active.find(x => !x.scene && !clueHolds(ctx.c.puzzle, x.clue, placed)) ?? active.find(x => !clueHolds(ctx.c.puzzle, x.clue, placed))
  return st ? st.author : null
}

/** After the proof: the liar's token goes, honest tokens on a wrong guess go back, the rest lock. */
function afterProof(ctx: Ctx, placed: Placed): { placed: Placed; locked: string[]; released: number } {
  const who = liar(ctx.c)
  const honest = Object.keys(placed).filter(id => id !== who)
  const locked = keepConsistent(ctx.c, placed, honest)
  const next: Placed = {}
  for (const id of locked) next[id] = placed[id]
  return { placed: next, locked, released: honest.length - locked.length }
}

export function initState(ctx: Ctx, saved: Saved | null): GameState {
  const first = orderedPeople(ctx.c)[0]
  const firstStatement = visibleStatements(ctx).find(s => s.author === first && !s.scene)
  const placed = saved?.placed ?? {}
  const struck = ctx.truthOnly ? null : saved?.struck ?? null
  const locked = struck ? saved?.locked ?? [] : []
  const base: GameState = {
    placed, selected: first, lit: firstStatement ? { [first]: [firstStatement.id] } : {},
    pins: ctx.truthOnly ? [] : saved?.pins ?? [],
    ledger: ctx.truthOnly ? [] : saved?.ledger ?? [],
    falseCitations: ctx.truthOnly ? 0 : saved?.falseCitations ?? 0,
    struck, outcome: null, locked, cracked: [], refusals: 0, refusalOpen: false, touched: false,
    history: [], lifted: null, announce: '', note: null, cue: null, cueN: 0,
  }
  return isClosed(ctx, base) ? { ...base, outcome: 'proved' } : base
}

export const phaseOf = (s: Pick<GameState, 'struck'>): 'hunt' | 'rebuild' => (s.struck ? 'rebuild' : 'hunt')

export const toSaved = (s: GameState): Saved =>
  ({ placed: s.placed, struck: s.struck, pins: s.pins, locked: s.locked, ledger: s.ledger.map(r => [...r]), falseCitations: s.falseCitations, phase: phaseOf(s) })

const personAt = (placed: Placed, cell: Cell): string | undefined =>
  Object.keys(placed).find(id => placed[id].row === cell.row && placed[id].col === cell.col)

const rowCol = (c: Cell): string => `row ${c.row + 1}, column ${c.col + 1}`

const quiet = (s: GameState): GameState => ({ ...s, note: null, cracked: [], refusalOpen: false })

const refuse = (s: GameState, text: string): GameState =>
  ({ ...s, note: { text, kind: 'refuse' }, announce: text, cue: null, cracked: [] })

/** After a placement or an undo: close the case if the plan is complete, or say whose account breaks. */
function settle(ctx: Ctx, s: GameState, message: string, cue: Cue): GameState {
  const next: GameState = { ...quiet(s), announce: message, cue, cueN: s.cueN + 1 }
  if (isClosed(ctx, next)) {
    // the reveal sequence rings the bell itself, once, at its end
    return { ...next, outcome: 'proved', announce: `${message} The plan holds. Case closed.` }
  }
  const people = ctx.c.puzzle.people
  if (actOf(ctx, next) === 2 && people.every(x => next.placed[x.id])) {
    const who = failingSpeaker(ctx, next.placed, next.struck)
    if (who) {
      const text = `${nameOf(ctx.c, who)}'s account doesn't hold there.`
      return { ...next, note: { text, kind: 'refuse' }, announce: `${message} ${text}` }
    }
  }
  return next
}

function tapTile(ctx: Ctx, s: GameState, cell: Cell): GameState {
  const { c } = ctx
  if (s.outcome) return s
  const occupant = personAt(s.placed, cell)
  if (occupant === s.selected) {
    if (s.locked.includes(occupant)) return refuse(s, `${nameOf(c, occupant)}'s place is settled.`)
    const placed = { ...s.placed }
    delete placed[occupant]
    return settle(ctx, { ...s, placed, history: [...s.history, s.placed], lifted: null }, `${nameOf(c, occupant)} picked up.`, 'lift')
  }
  if (occupant) return { ...quiet(s), selected: occupant, announce: `${nameOf(c, occupant)} selected.`, cue: null }
  if (s.locked.includes(s.selected) && s.placed[s.selected]) return refuse(s, `${nameOf(c, s.selected)}'s place is settled.`)
  const { rows, cols } = usedLines(s.placed, s.selected)
  if (rows.has(cell.row) || cols.has(cell.col)) {
    const text = rows.has(cell.row)
      ? `${nameOf(c, Object.keys(s.placed).find(id => id !== s.selected && s.placed[id].row === cell.row) ?? '')} already holds that row.`
      : 'That column is taken.'
    return { ...refuse(s, text), refusals: s.refusals + 1, refusalOpen: true }
  }
  const placed = { ...s.placed, [s.selected]: { row: cell.row, col: cell.col } }
  return settle(ctx, { ...s, placed, history: [...s.history, s.placed], lifted: null }, `${nameOf(c, s.selected)} placed, ${rowCol(cell)}.`, 'place')
}

function pin(ctx: Ctx, s: GameState, id: string): GameState {
  if (ctx.truthOnly || s.struck || s.outcome) return s
  if (citable(ctx.c, [id]).length === 0) return s
  if (s.pins.includes(id)) return { ...quiet(s), pins: s.pins.filter(x => x !== id), announce: 'Unpinned.', cue: null }
  if (s.pins.length >= MAX_PINS) return refuse(s, 'Four at most. Unpin one first.')
  return { ...quiet(s), pins: inReadingOrder(ctx.c, [...s.pins, id]), announce: 'Pinned.', cue: null }
}

/** "These can't all be true." The engine rules; a recorded contradiction goes in the ledger, a false one only counts. */
function cite(ctx: Ctx, s: GameState): GameState {
  if (ctx.truthOnly || s.struck || s.outcome || s.pins.length < 2) return s
  const { c } = ctx
  const ruling = rule(c, s.pins)
  if (ruling === 'minimal') {
    const ids = inReadingOrder(c, s.pins)
    if (s.ledger.some(r => contradictionKey(r) === contradictionKey(ids))) {
      return { ...quiet(s), note: { text: 'Already on the ledger.', kind: 'info' }, announce: 'Already on the ledger.', cue: null }
    }
    const text = "Those accounts can't all be true."
    return { ...quiet(s), ledger: [...s.ledger, ids], pins: [], cracked: ids, note: { text, kind: 'crack' }, announce: text, cue: 'collision', cueN: s.cueN + 1 }
  }
  const text = ruling === 'redundant' ? "One of these isn't needed." : 'They can all be true.'
  return { ...quiet(s), falseCitations: s.falseCitations + 1, note: { text, kind: 'info' }, announce: text, cue: null }
}

const NOT_PROOF = "One contradiction isn't proof — either of them could be lying."

function doubt(ctx: Ctx, s: GameState, id: string): GameState {
  const { c } = ctx
  if (ctx.truthOnly || s.struck || s.outcome) return s
  const st = c.statements.find(x => x.id === id)
  if (!st || st.scene) return s
  if (!proofGate(s.ledger, id)) return { ...quiet(s), note: { text: NOT_PROOF, kind: 'info' }, announce: NOT_PROOF, cue: null }
  // By construction the gate only passes for the lie. If a case ever breaks that, refuse rather than strike a truth.
  if (id !== c.lieId) {
    console.warn(`[alibi] the proof gate passed for ${id}, which is not the lie (${c.lieId}) in case ${c.id}`)
    return { ...quiet(s), note: { text: NOT_PROOF, kind: 'info' }, announce: NOT_PROOF, cue: null }
  }
  const had = s.placed[st.author]
  const { placed, locked, released } = afterProof(ctx, s.placed)
  const lit = Object.fromEntries(Object.entries(s.lit).map(([k, v]) => [k, v.filter(x => x !== id)]))
  const text = `That account cracks. Then where was ${nameOf(c, st.author)}?`
  const extra = released ? ` ${released === 1 ? 'One placement' : `${released} placements`} did not fit the true accounts and went back.` : ''
  return {
    ...quiet(s), struck: id, placed, locked, lit, pins: [], history: [], selected: st.author,
    lifted: had ? { person: st.author, cell: had } : null,
    note: { text, kind: 'crack' }, announce: text + extra, cue: 'crack', cueN: s.cueN + 1,
  }
}

export function reduce(ctx: Ctx, s: GameState, a: Action): GameState {
  const { c } = ctx
  switch (a.t) {
    case 'select':
      return { ...quiet(s), selected: a.id, announce: `${nameOf(c, a.id)} selected.`, cue: null }
    case 'tile': return tapTile(ctx, s, a.cell)
    case 'lit': {
      const st = activeStatements(ctx, s.struck).find(x => x.id === a.id)
      if (!st) return s
      const cur = s.lit[st.author] ?? []
      const on = cur.includes(a.id)
      return {
        ...quiet(s), touched: true, lit: { ...s.lit, [st.author]: on ? cur.filter(x => x !== a.id) : [...cur, a.id] },
        announce: on ? 'Statement unlit.' : 'Statement lit.',
        cue: on ? null : 'lens', cueN: s.cueN + (on ? 0 : 1),
      }
    }
    case 'pin': return pin(ctx, s, a.id)
    case 'cite': return cite(ctx, s)
    case 'doubt': return doubt(ctx, s, a.id)
    case 'undo': {
      const last = s.history[s.history.length - 1]
      if (!last || s.outcome) return s
      return settle(ctx, { ...s, placed: last, history: s.history.slice(0, -1), lifted: null }, 'Undone.', 'lift')
    }
    case 'settleLift': return s.lifted ? { ...s, lifted: null } : s
  }
}

/** Tiles to crack on the plan: the placed speakers of the last recorded contradiction, and nobody unplaced. */
export const crackedTiles = (c: LieCase, s: Pick<GameState, 'cracked' | 'placed'>): Set<string> => crackTiles(c, s.cracked, s.placed)
