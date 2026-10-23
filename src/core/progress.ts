import type { Puzzle } from './types'
import { cellFloor } from './types'
import { CASE_NOTES_KEY, IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY } from './ux'
import {
  CASE_STATE_KEY, FINGERPRINT_KEY, RECORDS_KEY, SOLVED_KEY, UPPER_FLOOR_KEY,
  isFiniteNumber, isPlainObject, readJson, readObject, readStringArray, removeKey, writeJson,
} from './storage'
import { LEGACY_FINGERPRINTS } from './legacyFingerprints'

// ============================================================================
// Saved progress, tied to the content it was earned on.
//
// Progress used to be keyed by case id alone ("hard-3"), but a case's content is
// generated and changes whenever the catalog does. A "solved" tick, a best time,
// a half-finished board or a hint count then silently described a DIFFERENT
// puzzle. Every case now has a fingerprint, a hash of everything that decides
// the answer (rooms, furniture, cast, clues, solution); progress for a case is
// discarded the moment its fingerprint differs from the one it was saved under.
// ============================================================================

/** cyrb53: a fast, well-mixed 53-bit string hash. Not cryptographic; it only has to notice change. */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

function canonicalClue(clue: object): [string, unknown][] {
  return Object.entries(clue).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * A hash of everything that decides a case's answer and the information the
 * player is given: board size, storeys, every room cell, every furniture piece's
 * type and footprint, the cast, each clue's logical content in card order, and
 * the solution. Cosmetic fields (hues, rotations, portraits, sentence wording,
 * the title) are deliberately left out: changing them does not change the
 * puzzle, so it must not wipe a player's progress.
 */
export function puzzleFingerprint(p: Puzzle): string {
  const canon = JSON.stringify({
    s: p.size,
    f: p.floors ?? 1,
    r: p.rooms.map(r => [r.id, r.name, r.floor ?? 0, r.cells.map(c => [c.row, c.col, c.floor ?? r.floor ?? 0])]),
    u: p.furniture.map(f => [f.type, f.row, f.col, f.w ?? 1, f.h ?? 1, f.floor ?? 0]),
    p: p.people.map(x => [x.id, x.name, !!x.isVictim]),
    c: p.clues.map(ct => canonicalClue(ct.clue)),
    x: p.people.map(x => {
      const cell = p.solution[x.id]
      return cell ? [x.id, cell.row, cell.col, cellFloor(cell)] : [x.id]
    }),
    v: p.victimId,
    m: p.murdererId,
  })
  return cyrb53(canon).toString(16).padStart(14, '0')
}

// --- per-case play state: hints spent, accusations spent, attempts -----------

export interface CaseState {
  /** Fingerprint of the content this state belongs to. */
  fp: string
  /** Suspects a hint has already placed; one hint = one entry, so it cannot be refilled by Clear or by re-entering. */
  hinted: string[]
  /** Wrong accusations spent in the current attempt. */
  wrong: number
  /** How many times the player has started the case over after it went cold. */
  attempts: number
  /**
   * The solution has been shown for this content. Sticky: a later solve of the
   * same fingerprint (after Start over) is not a solve and is never counted.
   */
  revealed: boolean
}

export const MAX_ACCUSATIONS = 3

function freshState(fp: string): CaseState { return { fp, hinted: [], wrong: 0, attempts: 0, revealed: false } }

function cleanState(raw: unknown, p: Puzzle, fp: string): CaseState {
  if (!isPlainObject(raw) || raw.fp !== fp) return freshState(fp)
  const ids = new Set(p.people.map(x => x.id))
  const hinted = Array.isArray(raw.hinted)
    ? [...new Set(raw.hinted.filter((x): x is string => typeof x === 'string' && ids.has(x)))]
    : []
  const wrong = isFiniteNumber(raw.wrong) ? Math.min(MAX_ACCUSATIONS, Math.max(0, Math.floor(raw.wrong))) : 0
  const attempts = isFiniteNumber(raw.attempts) ? Math.min(9999, Math.max(0, Math.floor(raw.attempts))) : 0
  return { fp, hinted, wrong, attempts, revealed: raw.revealed === true }
}

export function loadCaseState(p: Puzzle): CaseState {
  const fp = puzzleFingerprint(p)
  return cleanState(readObject(CASE_STATE_KEY)[p.id], p, fp)
}

export function saveCaseState(p: Puzzle, state: CaseState): void {
  const all = readObject(CASE_STATE_KEY)
  all[p.id] = state
  writeJson(CASE_STATE_KEY, all)
}

// --- solved ticks and records ----------------------------------------------

export interface CaseRecord { bestSeconds: number; hints: number }

export function loadSolved(): string[] { return readStringArray(SOLVED_KEY) }
export function saveSolved(ids: string[]): void { writeJson(SOLVED_KEY, ids) }

export function loadRecords(): Record<string, CaseRecord> {
  const out: Record<string, CaseRecord> = {}
  for (const [id, value] of Object.entries(readObject(RECORDS_KEY))) {
    if (isPlainObject(value) && isFiniteNumber(value.bestSeconds) && value.bestSeconds >= 0 && isFiniteNumber(value.hints) && value.hints >= 0) {
      out[id] = { bestSeconds: value.bestSeconds, hints: value.hints }
    }
  }
  return out
}

/** Keep the fastest run; `hintsUsed` is the number of hints that run spent. */
export function saveRecord(id: string, seconds: number, hintsUsed: number): void {
  const records = loadRecords()
  if (!records[id] || seconds < records[id].bestSeconds) records[id] = { bestSeconds: seconds, hints: hintsUsed }
  writeJson(RECORDS_KEY, records)
}

// --- reconciling saved progress with the catalog -----------------------------

/** Forget everything saved for one case: solved tick, record, notes, board, hints, accusations. */
export function purgeCaseProgress(id: string): void {
  const solved = readStringArray(SOLVED_KEY)
  if (solved.includes(id)) saveSolved(solved.filter(x => x !== id))

  const records = readObject(RECORDS_KEY)
  if (id in records) { delete records[id]; writeJson(RECORDS_KEY, records) }

  const states = readObject(CASE_STATE_KEY)
  if (id in states) { delete states[id]; writeJson(CASE_STATE_KEY, states) }

  const notes = readObject(CASE_NOTES_KEY)
  const noteMap = isPlainObject(notes.notes) ? notes.notes : null
  if (noteMap && id in noteMap) { delete noteMap[id]; writeJson(CASE_NOTES_KEY, notes) }

  for (const key of [IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY]) {
    const play = readJson(key)
    if (isPlainObject(play) && (play.id === id || play.puzzleId === id)) {
      removeKey(key)
      removeKey(UPPER_FLOOR_KEY)
    }
  }
}

/**
 * Compare every case against the fingerprint its saved progress was earned on
 * and purge the progress of any case whose content has changed.
 *
 * Progress written before fingerprints existed carries no fingerprint; it is
 * checked against LEGACY_FINGERPRINTS, the fingerprints of the catalog that
 * wrote it, so a case that did not change keeps its tick and a case that did
 * does not. Returns the ids that were purged.
 */
export function reconcileProgress(puzzles: readonly Puzzle[]): string[] {
  const known = readObject(FINGERPRINT_KEY)
  const next: Record<string, string> = {}
  const purged: string[] = []
  for (const p of puzzles) {
    const fp = puzzleFingerprint(p)
    const before = typeof known[p.id] === 'string' ? known[p.id] as string : LEGACY_FINGERPRINTS[p.id]
    if (before !== undefined && before !== fp) {
      purgeCaseProgress(p.id)
      purged.push(p.id)
    }
    next[p.id] = fp
  }
  if (JSON.stringify(known) !== JSON.stringify(next)) writeJson(FINGERPRINT_KEY, next)
  return purged
}
