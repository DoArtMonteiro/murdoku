// Rulings: when the player cites statements as "can't all be true", the engine decides. Pure.
// The bench is silent: nothing here looks at the placement to find contradictions for the player. A citation is
// judged against the statements alone (plus the victim's scene facts, which are always evidence), and a ruling
// never says which of the cited statements is false.
import { countSolutions } from '../core/engine'
import type { Cell, Puzzle } from '../core/types'
import type { LieCase, Statement } from './model'
import { findMinimalCores, isMinimalContradiction, satisfiable } from './verify'
import { tileKey } from './lens'
import type { Placed } from './lens'

/** What the engine says about a cited set. */
export type Ruling = 'minimal' | 'redundant' | 'satisfiable'

/** A recorded contradiction: statement ids in reading order. */
export type LedgerRow = readonly string[]

const byId = (c: LieCase, id: string): Statement | undefined => c.statements.find(s => s.id === id)

/** Cited ids that can be cited at all: known, and not a scene fact (those are always included, never pinned). */
export function citable(c: LieCase, ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const s = byId(c, id)
    if (!s || s.scene || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** Reading order, the order statements appear in the case. */
export const inReadingOrder = (c: LieCase, ids: readonly string[]): string[] =>
  c.statements.filter(s => ids.includes(s.id)).map(s => s.id)

/**
 * Unsatisfiable and minimal: every cited statement is needed (dropping any one makes the rest satisfiable).
 * Unsatisfiable but not minimal: some statement is along for the ride. Otherwise they can all be true.
 * The victim's scene facts are always part of the question; the engine-backed checks are the case verifier's own.
 */
export function rule(c: LieCase, ids: readonly string[]): Ruling {
  const cited = citable(c, ids)
  if (satisfiable(c, cited)) return 'satisfiable'
  return isMinimalContradiction(c, cited) ? 'minimal' : 'redundant'
}

/** Stable identity of a recorded contradiction. */
export const contradictionKey = (ids: readonly string[]): string => [...ids].sort().join('|')

/**
 * The doubt gate. Reads the ledger and nothing else: the recorded contradictions that contain `id` must be at
 * least two and meet in exactly that one statement. Every true statement is jointly satisfiable, so any
 * recorded contradiction holds the lie; two that meet only in `id` therefore make `id` the lie.
 */
export function proofGate(ledger: readonly LedgerRow[], id: string): boolean {
  return gateVerdict(ledger, id) === 'ok'
}

/**
 * Why a doubt is, or is not, founded. Still the ledger only:
 * 'ok' the contradictions naming it meet in it and nowhere else; 'none' no contradiction names it; 'one' the ledger
 * holds a single contradiction; 'shared' they share other statements too; 'only-one' just one of several names it.
 */
export type Verdict = 'ok' | 'none' | 'one' | 'shared' | 'only-one'
export function gateVerdict(ledger: readonly LedgerRow[], id: string): Verdict {
  const rows = ledger.filter(r => r.includes(id))
  if (rows.length === 0) return 'none'
  if (ledger.length === 1) return 'one'
  if (rows.length < 2) return 'only-one'
  const common = rows[0].filter(x => rows.every(r => r.includes(x)))
  return common.length === 1 && common[0] === id ? 'ok' : 'shared'
}

/** How many recorded contradictions each statement is in. */
export const rowCounts = (rows: readonly LedgerRow[]): Map<string, number> => {
  const n = new Map<string, number>()
  for (const r of rows) for (const id of r) n.set(id, (n.get(id) ?? 0) + 1)
  return n
}

/** The ledger already holds enough to prove a statement. This says that they can accuse, never which statement. */
export function canProve(ledger: readonly LedgerRow[]): boolean {
  return [...new Set(ledger.flat())].some(id => gateVerdict(ledger, id) === 'ok')
}

const coreCache = new WeakMap<LieCase, string[][]>()
/** Every minimal contradiction of the case (up to four statements). Cached per case. */
export function coresOf(c: LieCase): string[][] {
  let cores = coreCache.get(c)
  if (!cores) coreCache.set(c, cores = findMinimalCores(c, 4))
  return cores
}

/**
 * The help ladder's picks: statements of the minimal contradictions the player has not recorded yet, the first
 * contradiction's first, each in reading order. The lie is never among them, and neither is anything else its author
 * said, so a suspect picked from here is never the liar. The lie is read only to leave it out.
 */
export function helpCandidates(c: LieCase, ledger: readonly LedgerRow[]): string[] {
  const recorded = new Set(ledger.map(contradictionKey))
  const liarId = byId(c, c.lieId)?.author
  const out: string[] = []
  for (const core of coresOf(c)) {
    if (recorded.has(contradictionKey(core))) continue
    const ids = core.filter(id => id !== c.lieId && !byId(c, id)?.scene && byId(c, id)?.author !== liarId)
    for (const id of inReadingOrder(c, ids)) if (!out.includes(id)) out.push(id)
  }
  return out
}

/** Tiles of the cited statements' speakers who are already on the plan. Unplaced claims get no crack. */
export function crackTiles(c: LieCase, ids: readonly string[], placed: Placed): Set<string> {
  const out = new Set<string>()
  for (const id of ids) {
    const a = byId(c, id)?.author
    if (a && placed[a]) out.add(tileKey(placed[a]))
  }
  return out
}

/**
 * Of these placed people, who is already where the true statements put them? Taken one by one: a token stays when
 * the true statements can still all hold with it and the tokens kept so far where they stand. (A row and a column
 * clue per token pins the person to the tile.) Used when the lie is proved, so no honest token that was placed on
 * a guess can lock the true plan out of reach.
 */
export function keepConsistent(c: LieCase, placed: Placed, who: readonly string[]): string[] {
  const kept: string[] = []
  const pin = (id: string, cell: Cell) => [
    { clue: { kind: 'row' as const, person: id, row: cell.row }, text: '' },
    { clue: { kind: 'col' as const, person: id, col: cell.col }, text: '' },
  ]
  for (const id of who) {
    if (!placed[id]) continue
    const trial = [...kept, id]
    const p: Puzzle = { ...c.puzzle, clues: [...c.puzzle.clues, ...trial.flatMap(x => pin(x, placed[x]))] }
    if (countSolutions(p, 1) > 0) kept.push(id)
  }
  return kept
}
