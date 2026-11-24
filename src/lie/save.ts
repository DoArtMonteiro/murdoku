// In-progress save for One False Alibi: `alibi_ofa_v1:<caseId>` (`:truth` appended for the comparison
// direction, which has its own state). It never reads or writes a `murdoku_*` or `alibi_casebook_*` key.
// Everything is wrapped in try/catch and validated on load; a save made on a different version of the case
// (fingerprint mismatch) is discarded, never applied.
import type { Cell } from '../core/types'
import type { JournalEntry } from './collide'
import type { LieCase } from './model'

export const SAVE_PREFIX = 'alibi_ofa_v1:'
export const saveKey = (caseId: string, truthOnly: boolean): string => `${SAVE_PREFIX}${caseId}${truthOnly ? ':truth' : ''}`

export interface Saved {
  placed: Record<string, Cell>
  /** The lie, once doubted correctly. */
  struck: string | null
  /** Statements doubted wrongly ("That account stands"). */
  stands: string[]
  strikes: number
  journal: JournalEntry[]
}

export const emptySave = (): Saved => ({ placed: {}, struck: null, stands: [], strikes: 0, journal: [] })

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
  const doubtable = new Set(c.statements.filter(s => !s.scene).map(s => s.id))
  if (raw.struck === c.lieId) out.struck = c.lieId
  out.stands = strings(raw.stands).filter(id => doubtable.has(id) && id !== c.lieId)
  out.strikes = Math.min(2, Math.max(out.stands.length, int(raw.strikes) ? Math.max(0, raw.strikes) : 0))
  if (Array.isArray(raw.journal)) {
    for (const e of raw.journal) {
      if (!isObj(e)) continue
      const people = strings(e.people).filter(id => ids.has(id))
      const stmts = new Set(c.statements.map(s => s.id))
      if (people.length >= 2) out.journal.push({ people, statementIds: strings(e.statementIds).filter(id => stmts.has(id)) })
    }
    out.journal = out.journal.slice(-8)
  }
  // the liar's token is lifted when the lie is struck; a save that still has it placed is inconsistent
  if (out.struck) delete out.placed[c.statements.find(s => s.id === c.lieId)?.author ?? '']
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
