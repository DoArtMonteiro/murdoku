// In-progress save for One False Alibi: `alibi_ofa_v2:<caseId>` (`:truth` appended for the hidden authoring harness,
// which has its own state). Version 1 saves (`alibi_ofa_v1:`) were a different game and are never read.
// It never reads or writes a `murdoku_*` or `alibi_casebook_*` key. Everything is wrapped in try/catch and validated on
// load; a save made on a different version of the case (fingerprint mismatch) is discarded, never applied.
// The phase is stored for people reading the save but never trusted: Act 2 is derived from the ledger.
import type { Cell } from '../core/types'
import { citable, contradictionKey, inReadingOrder, keepConsistent, proofGate, rule } from './collide'
import type { LedgerRow } from './collide'
import type { LieCase } from './model'

export const SAVE_PREFIX = 'alibi_ofa_v2:'
export const saveKey = (caseId: string, truthOnly: boolean): string => `${SAVE_PREFIX}${caseId}${truthOnly ? ':truth' : ''}`

/** Solved cases, a JSON array of case ids. */
export const SOLVED_KEY = 'alibi_ofa_solved_v1'

export interface Saved {
  placed: Record<string, Cell>
  /** The lie, once doubted with proof. */
  struck: string | null
  pins: string[]
  /** Honest people whose place is settled after the proof. */
  locked: string[]
  ledger: LedgerRow[]
  falseCitations: number
  phase: 'hunt' | 'rebuild'
}

export const emptySave = (): Saved => ({ placed: {}, struck: null, pins: [], locked: [], ledger: [], falseCitations: 0, phase: 'hunt' })

/** cyrb53: a fast, well-mixed 53-bit hash. It only has to notice change. */
function hash(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

export const fingerprint = (c: LieCase): string => hash(JSON.stringify({ s: c.statements, p: c.puzzle }))

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const int = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x)
const strings = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [])

export function parseSave(c: LieCase, truthOnly: boolean, raw: unknown): Saved {
  const out = emptySave()
  if (!isObj(raw) || raw.fp !== fingerprint(c)) return out
  const ids = new Set(c.puzzle.people.map(x => x.id))
  const n = c.puzzle.size
  const usedRows = new Set<number>(), usedCols = new Set<number>()
  if (isObj(raw.placed)) {
    for (const [id, cell] of Object.entries(raw.placed)) {
      if (!ids.has(id) || !isObj(cell) || !int(cell.row) || !int(cell.col)) continue
      if (cell.row < 0 || cell.col < 0 || cell.row >= n || cell.col >= n) continue
      // one person per row and column: a clashing entry can only be a stale or edited save
      if (usedRows.has(cell.row) || usedCols.has(cell.col)) continue
      usedRows.add(cell.row); usedCols.add(cell.col)
      out.placed[id] = { row: cell.row, col: cell.col }
    }
  }
  if (truthOnly) return out
  out.pins = citable(c, strings(raw.pins)).slice(0, 4)
  if (Array.isArray(raw.ledger)) {
    const seen = new Set<string>()
    for (const row of raw.ledger) {
      // a row only stays if the engine still calls it a minimal contradiction
      const ids = citable(c, strings(row))
      if (ids.length < 2 || ids.length > 4 || seen.has(contradictionKey(ids))) continue
      if (rule(c, ids) !== 'minimal') continue
      seen.add(contradictionKey(ids))
      out.ledger.push(inReadingOrder(c, ids))
    }
    out.ledger = out.ledger.slice(-24)
  }
  out.falseCitations = int(raw.falseCitations) ? Math.min(99, Math.max(0, raw.falseCitations)) : 0
  // Act 2 only if the saved ledger itself proves the lie
  if (raw.struck === c.lieId && proofGate(out.ledger, c.lieId)) {
    out.struck = c.lieId
    out.phase = 'rebuild'
    out.pins = []
    // locks are persisted, but only kept for honest, placed people the true statements still agree with
    const who = c.statements.find(s => s.id === c.lieId)?.author
    out.locked = keepConsistent(c, out.placed, strings(raw.locked).filter(id => id !== who && !!out.placed[id]))
  }
  return out
}

export function loadSave(c: LieCase, truthOnly: boolean): Saved {
  try {
    const s = localStorage.getItem(saveKey(c.id, truthOnly))
    return s ? parseSave(c, truthOnly, JSON.parse(s)) : emptySave()
  } catch { return emptySave() }
}

export function writeSave(c: LieCase, truthOnly: boolean, s: Saved): void {
  try { localStorage.setItem(saveKey(c.id, truthOnly), JSON.stringify({ ...s, fp: fingerprint(c) })) } catch { /* storage unavailable: play on, unsaved */ }
}

export function clearSave(c: LieCase, truthOnly: boolean): void {
  try { localStorage.removeItem(saveKey(c.id, truthOnly)) } catch { /* nothing to clear */ }
}

/** Ids of the cases the player has proved. */
export function loadSolved(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SOLVED_KEY) ?? '[]')
    return strings(raw)
  } catch { return [] }
}

export function markSolved(caseId: string): void {
  try {
    const now = loadSolved()
    if (!now.includes(caseId)) localStorage.setItem(SOLVED_KEY, JSON.stringify([...now, caseId]))
  } catch { /* the mark lasts this visit only */ }
}

/** The id to open now: the one asked for, else the first unsolved case in order, else the first. */
export function pickId(asked: string, order: readonly { id: string }[], solved: readonly string[]): string {
  if (asked) return asked
  return (order.find(e => !solved.includes(e.id)) ?? order[0])?.id ?? ''
}

/** The case after `current` worth opening: the next unsolved one in order (wrapping), else simply the next. Null for a lone case. */
export function nextId(current: string, order: readonly { id: string }[], solved: readonly string[]): string | null {
  const i = order.findIndex(e => e.id === current)
  if (i < 0) return null
  const after = [...order.slice(i + 1), ...order.slice(0, i)]
  return (after.find(e => !solved.includes(e.id)) ?? after[0])?.id ?? null
}
