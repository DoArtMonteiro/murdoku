// In-progress save for the slice. A NEW key per case, `alibi_casebook_v1:<id>`;
// the slice never reads or writes a `murdoku_*` key. Everything is wrapped in
// try/catch (private mode, quota) and validated on load, so a stale or edited
// save can only ever be ignored.
import type { Cell, Puzzle } from '../core/types'
import { floorsOf, norm } from './cells'

export const SAVE_PREFIX = 'alibi_casebook_v1:'
export const saveKey = (caseId: string): string => `${SAVE_PREFIX}${caseId}`

export type Outcome = 'proved' | 'called' | 'cold' | null

export interface Saved {
  placement: Record<string, Cell>
  pencil: Record<string, string[]>
  strikes: number
  outcome: Outcome
  hintsUsed: number
  /** The true squares or alibis were shown: the case can no longer be "Proved". Persisted, so a reload cannot undo it. */
  revealed: boolean
}

export const emptySave = (): Saved => ({ placement: {}, pencil: {}, strikes: 0, outcome: null, hintsUsed: 0, revealed: false })

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const int = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x)

export function parseSave(p: Puzzle, raw: unknown): Saved {
  const out = emptySave()
  if (!isObj(raw)) return out
  const ids = new Set(p.people.map(x => x.id))
  const inRange = (c: unknown): c is Cell =>
    isObj(c) && int(c.row) && int(c.col) && c.row >= 0 && c.col >= 0 && c.row < p.size && c.col < p.size
    && (c.floor === undefined || (int(c.floor) && c.floor >= 0 && c.floor < floorsOf(p)))
  if (isObj(raw.placement)) {
    for (const [id, c] of Object.entries(raw.placement)) if (ids.has(id) && inRange(c)) out.placement[id] = norm(c)
  }
  if (isObj(raw.pencil)) {
    for (const [id, list] of Object.entries(raw.pencil)) {
      if (ids.has(id) && Array.isArray(list)) out.pencil[id] = list.filter((k): k is string => typeof k === 'string' && /^\d+:\d+:\d+$/.test(k))
    }
  }
  if (int(raw.strikes)) out.strikes = Math.max(0, Math.min(3, raw.strikes))
  if (raw.outcome === 'proved' || raw.outcome === 'called' || raw.outcome === 'cold') out.outcome = raw.outcome
  if (int(raw.hintsUsed)) out.hintsUsed = Math.max(0, raw.hintsUsed)
  if (raw.revealed === true) out.revealed = true
  return out
}

export function loadSave(p: Puzzle): Saved {
  try {
    const s = localStorage.getItem(saveKey(p.id))
    return s ? parseSave(p, JSON.parse(s)) : emptySave()
  } catch { return emptySave() }
}

export function writeSave(caseId: string, s: Saved): void {
  try { localStorage.setItem(saveKey(caseId), JSON.stringify(s)) } catch { /* storage unavailable: play on, unsaved */ }
}
