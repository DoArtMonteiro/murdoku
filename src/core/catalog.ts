import type { Puzzle } from './types'
import bakedCatalog from '../data/catalog.generated.json'
import { reconcileProgress } from './progress'
import { CATALOG_KEY_PREFIX, isPlainObject, keysWithPrefix, removeKey } from './storage'

// ============================================================================
// The catalog: 60 puzzles, generated at build time.
//
// src/data/catalog.generated.json is the output of buildCatalog()
// (catalogBuild.ts) written by `npm run bake:catalog`. The generator never
// ships to the browser, so a first visit no longer spends ~5 s building the
// catalog behind a progress screen. tests/bakedCatalog.test.ts regenerates the
// catalog and fails unless it is byte-identical to the baked file, so ids,
// content and fingerprints (progress.ts) cannot drift from what the generator
// produces.
// ============================================================================

const puzzles: Puzzle[] = bakedCatalog as unknown as Puzzle[]
let adopted = false

/**
 * Structural check of an untrusted puzzle value: enough to be sure the game can
 * render and index it without throwing. Content correctness is the generator's
 * job. The runtime no longer reads puzzles from storage; tests use this to hold
 * the baked catalog to the same shape.
 */
export function looksLikePuzzle(x: unknown): x is Puzzle {
  if (!isPlainObject(x)) return false
  const n = x.size
  if (typeof x.id !== 'string' || !x.id || typeof n !== 'number' || !Number.isInteger(n) || n < 4 || n > 10) return false
  if (typeof x.title !== 'string' || typeof x.difficulty !== 'string') return false
  const gridOk = (g: unknown) => Array.isArray(g) && g.length === n && g.every(row => Array.isArray(row) && row.length === n && row.every(c => typeof c === 'string'))
  if (!gridOk(x.roomOf)) return false
  if (x.roomOfByFloor !== undefined && !(Array.isArray(x.roomOfByFloor) && x.roomOfByFloor.length >= 1 && x.roomOfByFloor.every(gridOk))) return false
  if (!Array.isArray(x.rooms) || !x.rooms.every(r => isPlainObject(r) && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.cells))) return false
  if (!Array.isArray(x.furniture) || !x.furniture.every(f => isPlainObject(f) && typeof f.type === 'string' && typeof f.row === 'number' && typeof f.col === 'number')) return false
  if (!Array.isArray(x.people) || x.people.length < 2 || !x.people.every(pp => isPlainObject(pp) && typeof pp.id === 'string' && typeof pp.name === 'string')) return false
  if (!Array.isArray(x.clues) || !x.clues.every(c => isPlainObject(c) && typeof c.text === 'string' && isPlainObject(c.clue) && typeof c.clue.kind === 'string' && typeof c.clue.person === 'string')) return false
  if (!isPlainObject(x.solution)) return false
  const solution = x.solution
  const placed = x.people.every(pp => {
    const c = solution[(pp as { id: string }).id]
    return isPlainObject(c) && typeof c.row === 'number' && typeof c.col === 'number'
  })
  return placed && typeof x.victimId === 'string' && typeof x.murdererId === 'string'
}

/**
 * Drop every localStorage catalog cache (`murdoku_catalog_v*`). Earlier builds
 * generated the catalog in the browser and cached it there (~400 KB each); the
 * cache is no longer read, so it is only dead weight.
 */
function purgeOldCatalogs(): void {
  for (const key of keysWithPrefix(CATALOG_KEY_PREFIX)) removeKey(key)
}

/** Once per page load: drop dead caches and forget progress whose case content changed. */
export function initCatalog(): void {
  if (adopted) return
  adopted = true
  purgeOldCatalogs()
  // Progress is tied to the content it was earned on: forget it for any case
  // whose content differs from what the progress was saved against.
  reconcileProgress(puzzles)
}

/**
 * Resolves on the first tick. Kept async, with its progress callback, so the
 * shell code that used to show a build progress screen needs no change; with a
 * baked catalog there is nothing to wait for and the callback never fires.
 */
export async function initCatalogAsync(
  _onProgress?: (done: number, total: number) => void,
): Promise<Puzzle[]> {
  initCatalog()
  return puzzles
}

export function getAllPuzzles(): Puzzle[] {
  initCatalog()
  return puzzles
}

export function getPuzzleById(id: string): Puzzle | undefined {
  return getAllPuzzles().find(p => p.id === id)
}
