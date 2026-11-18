import type { CellMark, GameMode, Puzzle } from './types'
import { getPuzzleById } from './catalog'
import { puzzleFingerprint } from './progress'
import { SAVE_KEY_PREFIX, UPPER_FLOOR_KEY, isPlainObject, keysWithPrefix, readJson, removeKey } from './storage'
import { IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY, parseInProgress, parseMarksGrid } from './ux'
import type { InProgressSummary } from './ux'

// --- mid-solve autosave, one save per case and mode --------------------------
// `murdoku_save_v2:<case>:<mode>` holds one attempt, so working on one case never
// touches another. The single-slot keys of the previous format (main, legacy and
// upper storey) are still written as a mirror of the latest attempt: a build
// that only knows them keeps resuming after a rollback. Reads go through: when
// no v2 save exists (or the mirror is newer, e.g. a v2 write failed) the mirror
// is validated and imported on the spot. Nothing valid is ever deleted to migrate.
//
// Known limits. Two tabs on the same case and mode: the last write wins, there
// is no live sync. A previous-format build that ENDS an attempt (Clear, Win,
// Reveal, Start over) only removes the mirror, which this build cannot tell
// apart from the mirror moving on to another case, so the per-case save of
// that attempt comes back here. Progress such a build makes IS picked up: it
// never stamps the mirror with `savedAt`, every write of this build does.

export interface CaseSave {
  id: string
  mode: GameMode
  /** One grid per storey, ground floor first. */
  floors: CellMark[][][]
  elapsed: number
  selected: string | null
  /** Epoch ms of the write; 0 for a save the previous format wrote. */
  savedAt: number
}

const MIRROR_KEYS = [IN_PROGRESS_KEY, LEGACY_IN_PROGRESS_KEY] as const

export const saveKey = (id: string, mode: GameMode) => `${SAVE_KEY_PREFIX}${id}:${mode}`

function finite(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback
}

/** Storey grids that fit the case: right count and size, known people, each placed at most once. */
function parseFloors(value: unknown, puzzle: Puzzle): CellMark[][][] | null {
  const floors = puzzle.floors ?? 1
  if (!Array.isArray(value) || value.length < 1 || value.length > floors) return null
  const ids = new Set(puzzle.people.map(x => x.id))
  const seen = new Set<string>()
  const out: CellMark[][][] = []
  for (const f of value) {
    const grid = parseMarksGrid(f, puzzle.size, ids)
    if (!grid) return null
    for (const m of grid.flat()) {
      if (m.kind !== 'person') continue
      if (seen.has(m.person)) return null
      seen.add(m.person)
    }
    out.push(grid)
  }
  return out
}

function readV2(puzzle: Puzzle, mode: GameMode): CaseSave | null {
  const v = readJson(saveKey(puzzle.id, mode))
  if (!isPlainObject(v) || v.v !== 2 || v.id !== puzzle.id || v.mode !== mode) return null
  if (v.fp !== puzzleFingerprint(puzzle)) return null
  const floors = parseFloors(v.floors, puzzle)
  if (!floors) return null
  const selected = typeof v.selected === 'string' && puzzle.people.some(x => x.id === v.selected) ? v.selected : null
  return { id: puzzle.id, mode, floors, elapsed: finite(v.elapsed, 0), selected, savedAt: finite(v.savedAt, 0) }
}

/** A mirror entry; `stamped` is false when a build that predates per-case saves wrote it. */
type MirrorSave = CaseSave & { stamped: boolean }

/** The previous single-slot format's attempts at this case (main and legacy key may differ). */
function readMirror(puzzle: Puzzle): MirrorSave[] {
  const out: MirrorSave[] = []
  for (const key of MIRROR_KEYS) {
    const v = readJson(key)
    const summary = parseInProgress(v, [puzzle])
    if (!summary || !isPlainObject(v)) continue
    // A save made against different content is never applied to this case.
    if (typeof v.fp === 'string' && v.fp !== puzzleFingerprint(puzzle)) continue
    const ids = new Set(puzzle.people.map(x => x.id))
    const ground = parseMarksGrid(v.marks, puzzle.size, ids)
    if (!ground) continue
    const floors = [ground]
    // Upper storeys live under their own key, owned by case id; a suspect cannot stand on two storeys.
    const upper = readJson(UPPER_FLOOR_KEY)
    if ((puzzle.floors ?? 1) > 1 && isPlainObject(upper) && upper.id === puzzle.id) {
      const both = parseFloors([ground, upper.marks], puzzle)
      if (both) floors.push(both[1])
    }
    if (out.some(s => s.mode === summary.mode)) continue
    out.push({ id: puzzle.id, mode: summary.mode, floors, elapsed: summary.elapsedSeconds, selected: summary.selectedPerson, savedAt: finite(v.savedAt, 0), stamped: typeof v.savedAt === 'number' })
  }
  return out
}

function writeV2(puzzle: Puzzle, s: CaseSave): boolean {
  try {
    localStorage.setItem(saveKey(s.id, s.mode), JSON.stringify({ v: 2, id: s.id, mode: s.mode, fp: puzzleFingerprint(puzzle), floors: s.floors, elapsed: s.elapsed, selected: s.selected, savedAt: s.savedAt }))
    return true
  } catch { return false }
}

/** Adds `savedAt` to unstamped mirror entries of (id, mode), so an imported entry is not imported again. */
function stampMirror(id: string, mode: GameMode, savedAt: number): void {
  for (const key of MIRROR_KEYS) {
    const v = readJson(key)
    if (!isPlainObject(v) || (v.id ?? v.puzzleId) !== id || v.mode !== mode || typeof v.savedAt === 'number') continue
    try { localStorage.setItem(key, JSON.stringify({ ...v, savedAt })) } catch { /* the import above already holds it */ }
  }
}

/**
 * Whether the mirror holds an attempt at (id, mode) the per-case store lacks:
 * none there, an older one, or one a previous-format build wrote after it
 * (every write of this build stamps the mirror with `savedAt`; older builds never do).
 */
function mirrorIsNewer(old: MirrorSave, v2: CaseSave | null): boolean {
  return !v2 || !old.stamped || old.savedAt > v2.savedAt
}

/** The saved attempt at this case in this mode, importing a previous-format save if it is the only (or newer) one. */
export function readSave(puzzle: Puzzle, mode: GameMode): CaseSave | null {
  const v2 = readV2(puzzle, mode)
  const old = readMirror(puzzle).find(s => s.mode === mode)
  if (old && mirrorIsNewer(old, v2)) {
    // Played on in a previous-format build after this one last saved: that board is the newest.
    const imported: CaseSave = { id: old.id, mode: old.mode, floors: old.floors, elapsed: old.elapsed, selected: old.selected, savedAt: old.stamped ? old.savedAt : (v2 ? Date.now() : 0) }
    if (writeV2(puzzle, imported) && !old.stamped) stampMirror(old.id, old.mode, imported.savedAt)
    return imported
  }
  return v2
}

/** Saves an attempt. Returns false when the per-case save could not be written (quota, storage off). */
export function writeSave(puzzle: Puzzle, s: Omit<CaseSave, 'savedAt'>): boolean {
  const save = { ...s, savedAt: Date.now() }
  const ok = writeV2(puzzle, save)
  // The mirror may still hold another attempt the per-case store has not got
  // (a previous-format save, or one whose per-case write failed): import it
  // first, and if that cannot be stored, leave the mirror holding it.
  let mirrorHoldsOther = false
  for (const key of MIRROR_KEYS) {
    const v = readJson(key)
    const id = isPlainObject(v) ? v.id ?? v.puzzleId : undefined
    const mode = isPlainObject(v) ? v.mode : undefined
    if (typeof id !== 'string' || (mode !== 'classic' && mode !== 'detective') || (id === s.id && mode === s.mode)) continue
    const other = getPuzzleById(id)
    if (!other) continue
    readSave(other, mode)
    const held = readMirror(other).find(x => x.mode === mode)
    if (held && mirrorIsNewer(held, readV2(other, mode))) mirrorHoldsOther = true
  }
  // Mirror for builds that only read the single slot. Best effort: it is a copy.
  if (!mirrorHoldsOther) try {
    const raw = JSON.stringify({ id: s.id, mode: s.mode, marks: s.floors[0], elapsed: s.elapsed, hints: 0, selected: s.selected, fp: puzzleFingerprint(puzzle), savedAt: save.savedAt })
    for (const key of MIRROR_KEYS) localStorage.setItem(key, raw)
    if (s.floors.length > 1) localStorage.setItem(UPPER_FLOOR_KEY, JSON.stringify({ id: s.id, marks: s.floors[1] }))
    else removeKey(UPPER_FLOOR_KEY)
  } catch { /* the per-case save above is the one that counts */ }
  return ok
}

/**
 * Drops the attempt at case `id` in `mode` (every mode when omitted). A mirror
 * key holding another attempt is left alone; one nobody can read is dropped.
 */
export function removeSave(id: string, mode?: GameMode): void {
  for (const key of keysWithPrefix(`${SAVE_KEY_PREFIX}${id}:`)) {
    if (!mode || key === saveKey(id, mode)) removeKey(key)
  }
  for (const key of MIRROR_KEYS) {
    const v = readJson(key)
    const owner = isPlainObject(v) ? v.id ?? v.puzzleId : undefined
    if (typeof owner !== 'string' || (owner === id && (!mode || (v as { mode?: unknown }).mode === mode))) removeKey(key)
  }
  const upper = readJson(UPPER_FLOOR_KEY)
  const upperOwner = isPlainObject(upper) ? upper.id : undefined
  const stillMirrored = MIRROR_KEYS.some(k => { const v = readJson(k); return isPlainObject(v) && (v.id ?? v.puzzleId) === id })
  if (typeof upperOwner !== 'string' || (upperOwner === id && !stillMirrored)) removeKey(UPPER_FLOOR_KEY)
}

/** Mode of the most recent saved attempt at this case, or null. */
export function savedModeFor(puzzle: Puzzle): GameMode | null {
  const saves = (['classic', 'detective'] as const).map(m => readSave(puzzle, m)).filter((s): s is CaseSave => !!s)
  saves.sort((a, b) => b.savedAt - a.savedAt)
  return saves[0]?.mode ?? null
}

/** Saved attempts per case id, newest first; a case with no saved attempt has no entry. */
export type SavedAttempts = Record<string, InProgressSummary[]>

const summary = (s: CaseSave): InProgressSummary => ({
  id: s.id, mode: s.mode, elapsedSeconds: Math.floor(s.elapsed), selectedPerson: s.selected,
  placedCount: s.floors.reduce((n, f) => n + f.flat().filter(m => m.kind === 'person').length, 0),
})

/**
 * Every saved attempt the home screen can offer, counted on every storey, and
 * the most recent one (the Continue strip). Reads go through `readSave`, so a
 * previous-format save is imported here exactly as opening its case would.
 */
export function summarizeSaves(puzzles: readonly Puzzle[]): { latest: InProgressSummary | null; byCase: SavedAttempts } {
  const ids = new Set(keysWithPrefix(SAVE_KEY_PREFIX).map(k => k.slice(SAVE_KEY_PREFIX.length).split(':')[0]))
  for (const key of MIRROR_KEYS) {
    const v = readJson(key)
    const id = isPlainObject(v) ? v.id ?? v.puzzleId : undefined
    if (typeof id === 'string') ids.add(id)
  }
  const all: CaseSave[] = []
  for (const id of ids) {
    const puzzle = puzzles.find(p => p.id === id)
    if (!puzzle) continue
    for (const mode of ['classic', 'detective'] as const) {
      const s = readSave(puzzle, mode)
      if (s) all.push(s)
    }
  }
  all.sort((a, b) => b.savedAt - a.savedAt)
  const byCase: SavedAttempts = {}
  for (const s of all) (byCase[s.id] ??= []).push(summary(s))
  return { latest: all[0] ? summary(all[0]) : null, byCase }
}
