// The play state of One False Alibi as one pure reducer, so the rules can be tested without a browser.
// Nothing here reads puzzle.solution: the case closes when the placement satisfies every true statement
// (puzzle.clues), which is the same thing, decided by the engine.
import type { Cell } from '../core/types'
import { isSolution } from '../core/engine'
import type { Collision, JournalEntry } from './collide'
import { collisionKey, findCollisions, recordable } from './collide'
import type { Placed } from './lens'
import { usedLines } from './lens'
import type { LieCase, Statement } from './model'
import type { Saved } from './save'
import type { Cue } from './sound'

export interface Ctx {
  c: LieCase
  /** Direction A, for comparison: only true statements, no doubting, no collisions. */
  truthOnly: boolean
}

export const MAX_STRIKES = 2
export const LEDGER_MAX = 4

export interface GameState {
  placed: Placed
  selected: string
  /** Lit statement ids, per author. */
  lit: Record<string, string[]>
  /** The lie, once doubted correctly. */
  struck: string | null
  /** Statements doubted wrongly. */
  stands: string[]
  strikes: number
  /** 'proved' when the plan is closed, 'cold' after the second wrong doubt. */
  outcome: 'proved' | 'cold' | null
  journal: JournalEntry[]
  history: Placed[]
  /** The token just lifted off by the doubt (cosmetic: already gone from `placed`; the view keeps it on the plan until the lift has played). */
  lifted: { person: string; cell: Cell } | null
  announce: string
  cue: Cue | null
  /** Changes on every action that produced a cue, so an identical cue twice in a row still plays. */
  cueN: number
}

export type Action =
  | { t: 'select'; id: string }
  | { t: 'tile'; cell: Cell }
  | { t: 'lit'; id: string }
  | { t: 'doubt'; id: string }
  | { t: 'undo' }
  | { t: 'settleLift' }

export const nameOf = (c: LieCase, id: string): string => c.story.cast[id]?.name ?? c.puzzle.people.find(x => x.id === id)?.name ?? id

/** Suspects in case order, then the victim, who is always last. */
export function orderedPeople(c: LieCase): string[] {
  const ids = c.puzzle.people.map(x => x.id)
  return [...ids.filter(id => id !== c.puzzle.victimId), c.puzzle.victimId]
}

/** The statements the player is reading now: the lie is gone from the true-only direction and once struck. */
export function activeStatements(ctx: Ctx, struck: string | null): Statement[] {
  const { c, truthOnly } = ctx
  return c.statements.filter(s => (truthOnly ? s.id !== c.lieId : s.id !== struck))
}

export const liar = (c: LieCase): string => c.statements.find(s => s.id === c.lieId)?.author ?? c.puzzle.murdererId

/** Act 1 (hunting the lie) or Act 2 (reconstructing). Direction A is always Act 2. */
export const actOf = (ctx: Ctx, s: Pick<GameState, 'struck'>): 1 | 2 => (ctx.truthOnly || s.struck ? 2 : 1)

/** Collisions that matter right now. Only in Act 1 of the lie-hunting direction, and only two people or more. */
export function liveCollisions(ctx: Ctx, s: Pick<GameState, 'placed' | 'struck'>): Collision[] {
  if (actOf(ctx, s) !== 1) return []
  return recordable(findCollisions(ctx.c, activeStatements(ctx, s.struck), s.placed))
}

/** Rows of the Contradictions ledger as shown: the latest four, each subject first. */
export const ledgerRows = (journal: readonly JournalEntry[]): JournalEntry[] => journal.slice(-LEDGER_MAX)

/** True when everyone is placed, in their own row and column, every true statement holds, and (in Act 1) the lie has been struck. */
export function isClosed(ctx: Ctx, s: Pick<GameState, 'placed' | 'struck'>): boolean {
  const { c } = ctx
  if (!ctx.truthOnly && !s.struck) return false
  const people = c.puzzle.people
  if (!people.every(x => s.placed[x.id])) return false
  const rows = new Set(people.map(x => s.placed[x.id].row)), cols = new Set(people.map(x => s.placed[x.id].col))
  if (rows.size !== people.length || cols.size !== people.length) return false
  return isSolution(c.puzzle, s.placed)
}

export function initState(ctx: Ctx, saved: Saved | null): GameState {
  const first = orderedPeople(ctx.c)[0]
  const base: GameState = {
    placed: saved?.placed ?? {}, selected: first, lit: {},
    struck: ctx.truthOnly ? null : saved?.struck ?? null,
    stands: ctx.truthOnly ? [] : saved?.stands ?? [],
    strikes: ctx.truthOnly ? 0 : saved?.strikes ?? 0,
    outcome: null, journal: ctx.truthOnly ? [] : saved?.journal ?? [],
    history: [], lifted: null, announce: '', cue: null, cueN: 0,
  }
  if (base.strikes >= MAX_STRIKES) return { ...base, outcome: 'cold' }
  return isClosed(ctx, base) ? { ...base, outcome: 'proved' } : base
}

export const toSaved = (s: GameState): Saved =>
  ({ placed: s.placed, struck: s.struck, stands: s.stands, strikes: s.strikes, journal: s.journal })

const personAt = (placed: Placed, cell: Cell): string | undefined =>
  Object.keys(placed).find(id => placed[id].row === cell.row && placed[id].col === cell.col)

const rowCol = (c: Cell): string => `row ${c.row + 1}, column ${c.col + 1}`

/**
 * After the placement or the strike changes: write down any new collision, and close the case if the plan is complete.
 * `message` is what the change itself says; a collision or the closing is added to it.
 */
function settle(ctx: Ctx, s: GameState, message: string, cue: Cue): GameState {
  let journal = s.journal
  let announce = message
  let out = cue
  if (actOf(ctx, s) === 1 && !s.outcome) {
    const known = new Set(journal.map(j => collisionKey(j.people)))
    const fresh = liveCollisions(ctx, s).filter(k => !known.has(collisionKey(k.people)))
    if (fresh.length) {
      journal = [...journal, ...fresh.map(k => ({ people: k.people, statementIds: k.statementIds }))]
      announce = `${announce} These accounts can't all be true.`
      out = 'collision'
    }
  }
  const next: GameState = { ...s, journal, announce, cue: out, cueN: s.cueN + 1 }
  if (!next.outcome && isClosed(ctx, next)) {
    return { ...next, outcome: 'proved', announce: `${announce} The plan holds. Case closed.`, cue: 'bell' }
  }
  return next
}

function tapTile(ctx: Ctx, s: GameState, cell: Cell): GameState {
  const { c } = ctx
  if (s.outcome) return s
  const occupant = personAt(s.placed, cell)
  if (occupant === s.selected) {
    const placed = { ...s.placed }
    delete placed[occupant]
    return settle(ctx, { ...s, placed, history: [...s.history, s.placed], lifted: null }, `${nameOf(c, occupant)} picked up.`, 'lift')
  }
  if (occupant) return { ...s, selected: occupant, announce: `${nameOf(c, occupant)} selected.`, cue: null }
  const { rows, cols } = usedLines(s.placed, s.selected)
  if (rows.has(cell.row) || cols.has(cell.col)) {
    const holder = Object.keys(s.placed).find(id => id !== s.selected && (s.placed[id].row === cell.row || s.placed[id].col === cell.col))
    return { ...s, announce: `That ${rows.has(cell.row) ? 'row' : 'column'} already holds ${holder ? nameOf(c, holder) : 'someone'}. One person per row and column.`, cue: null }
  }
  const placed = { ...s.placed, [s.selected]: { row: cell.row, col: cell.col } }
  return settle(ctx, { ...s, placed, history: [...s.history, s.placed], lifted: null },
    `${nameOf(c, s.selected)} placed, ${rowCol(cell)}.`, 'place')
}

function doubt(ctx: Ctx, s: GameState, id: string): GameState {
  const { c } = ctx
  if (ctx.truthOnly || s.struck || s.outcome) return s
  const st = c.statements.find(x => x.id === id)
  if (!st || st.scene || s.stands.includes(id)) return s
  if (id === c.lieId) {
    const had = !!s.placed[st.author]
    const placed = { ...s.placed }
    delete placed[st.author]
    const lit = { ...s.lit, [st.author]: (s.lit[st.author] ?? []).filter(x => x !== id) }
    return settle(ctx, { ...s, struck: id, placed, lit, history: [], lifted: had ? { person: st.author, cell: s.placed[st.author] } : null, selected: st.author },
      'That account cracks. Then where were you, really?', 'crack')
  }
  const strikes = s.strikes + 1
  const stands = [...s.stands, id]
  const lit = { ...s.lit, [st.author]: (s.lit[st.author] ?? []).filter(x => x !== id) }
  const cold = strikes >= MAX_STRIKES
  return {
    ...s, stands, strikes, lit, outcome: cold ? 'cold' : null,
    announce: cold ? "That account stands. Two false doubts: the case has gone cold." : 'That account stands.',
    cue: 'stand', cueN: s.cueN + 1,
  }
}

export function reduce(ctx: Ctx, s: GameState, a: Action): GameState {
  const { c } = ctx
  switch (a.t) {
    case 'select':
      return { ...s, selected: a.id, announce: `${nameOf(c, a.id)} selected.`, cue: null }
    case 'tile': return tapTile(ctx, s, a.cell)
    case 'lit': {
      const st = activeStatements(ctx, s.struck).find(x => x.id === a.id)
      if (!st) return s
      const cur = s.lit[st.author] ?? []
      const on = cur.includes(a.id)
      return {
        ...s, lit: { ...s.lit, [st.author]: on ? cur.filter(x => x !== a.id) : [...cur, a.id] },
        announce: on ? 'Statement unlit.' : 'Statement lit.',
        cue: on ? null : 'lens', cueN: s.cueN + (on ? 0 : 1),
      }
    }
    case 'doubt': return doubt(ctx, s, a.id)
    case 'undo': {
      const last = s.history[s.history.length - 1]
      if (!last || s.outcome) return s
      return settle(ctx, { ...s, placed: last, history: s.history.slice(0, -1), lifted: null }, 'Undone.', 'lift')
    }
    case 'settleLift': return s.lifted ? { ...s, lifted: null } : s
  }
}
