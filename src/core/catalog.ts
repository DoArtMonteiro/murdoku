import { generatePuzzle, reseed } from './generate'
import { buildAuthoredPuzzle } from './authored'
import { AUTHORED_CASES } from '../data/cases'
import type { Puzzle, Difficulty } from './types'
import { reconcileProgress } from './progress'
import { CATALOG_KEY_PREFIX, isPlainObject, keysWithPrefix, removeKey } from './storage'

// ============================================================================
// The catalog: a stable, seeded set of puzzles. Because generation is
// deterministic per seed, the same catalog is produced every run; we also cache
// it in localStorage so reloads are instant and ids stay stable for progress.
// ============================================================================

// The curve is deliberately fattest in the middle: Very Easy exists to teach
// the rules once, while Medium/Hard is where a player who likes the game
// actually lives. Master (8x8, no direct room clues) is the long tail.
const SPEC: { difficulty: Difficulty; count: number }[] = [
  { difficulty: 'Very Easy', count: 8 },
  { difficulty: 'Easy', count: 10 },
  { difficulty: 'Medium', count: 12 },
  { difficulty: 'Hard', count: 12 },
  { difficulty: 'Expert', count: 10 },
  { difficulty: 'Master', count: 8 },
]

// v12: the L.A. Noire redesign muted the per-suspect ACCENTS palette in
// generate.ts. Cached catalogs embed the generated colours, so without this
// bump every returning player would keep the old candy palette from cache.
// v13: the catalog grew from 27 to 60 cases and gained the Master tier, and the
// generator's directness floor changed which clues Expert boards draw from. A
// cached v12 list would pin returning players to the old, smaller catalog.
// v14: boards grew (6x6 through 10x10), the suspect count is no longer tied to
// the board size, and furniture now carries a w/h footprint. A cached v13 list
// would pin returning players to small boards full of 1x1 furniture.
// v15: Hard/Expert/Master cases are now two-floor. Global row/col exclusivity
// means upstairs suspects block the same rows/cols as downstairs ones. New clue
// kinds (floor, above, below) added. Cached v14 puzzles lack floor data.
// v16: Two-floor generation enabled. Information-driven greedy clue selection
// (Phase A arithmetic scoring + Phase B cap-2 solver). Expert and Master
// board sizes normalised to 8×8 (two floors × 8×8 ≈ single-floor 10×10 area).
// v17: Added notRoom and notSameRoomAs negation clue kinds.
// v18: Rooms are now far larger — an explicit per-tier room count replaces the
// size-derived ladder, taking two-floor tiers from ~9.8 to 16.0 cells per room
// so a board reads as a floor plan rather than a grid of cubicles. Cached v17
// puzzles have the old cramped room layouts.
// v19: Room names are now assigned by fit (outdoor-on-edge rule, size bands,
// floor preferences). splitRects is balanced (MIN_ROOM_DIM=2, centred cuts).
// Furniture gets wall-based rotation: wall-huggers face inward, seating faces
// the room centroid with anti-adjacency guard. 2×1 wall-huggers may swap to
// 1×2 footprint when placed on a vertical wall. Cached v18 boards have old
// random names, no rotation, and occasional 1-cell slivers.
// v20: very-easy-2 ("The Empty Chair") is now hand-authored instead of
// procedurally generated — the pilot for src/data/cases/. Cached v19 lists
// still hold the old generated version.
// v21: very-easy-1 ("Midnight Delivery") is now hand-authored — the vertical
// slice the isometric-dollhouse presentation is designed and screenshotted
// against. Cached v20 lists still hold the old procedural version.
// v22: very-easy-1's furniture density increased (19 pieces, 3+ per room)
// after an art review called the rooms under-furnished. Cached v21 lists
// still hold the sparser version.
// v23: very-easy-1's rugs removed — at Kenney's native sprite size a rug
// covers far more than its cell and is the most saturated thing on the
// board, which is why the scene read as "giant red squares" rather than a
// room. Cached v22 lists still hold them.
// v25: hard-1 became the authored two-storey reference and authored clue
// pruning became stable. Cached v24 data can contain the old generated case
// or a seed-dependent clue set.
// v26: puzzle-truth fix. "Directly below the <room>" was printed for people on
// the top storey (a room that does not exist), "Beside" now means beside a piece
// you are not standing on, in your own room, and "the lamp" is only used when
// the house has exactly one. Every clue set and the "edge"/"corner" wording
// changed; hard-6, expert-4, expert-9 and master-1/3/4 keep their layouts as
// frozen authored cases. Each case now carries a content fingerprint
// (progress.ts) so saved progress cannot attach itself to a different puzzle.
const KEY = `${CATALOG_KEY_PREFIX}26`
let puzzles: Puzzle[] = []

function slug(s: string) { return s.toLowerCase().replace(/\s+/g, '-') }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return Math.abs(h) }
function roman(n: number): string {
  const map: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  for (const [v, r] of map) while (n >= v) { out += r; n -= v }
  return out
}

const UNIQUE_TITLES = [
  'Midnight Delivery', 'The Empty Chair', 'A Fatal Rehearsal', 'Checkmate',
  'The Broken Vase', 'The Locked Study', 'The Uninvited', 'A Cold Reception',
  'The Last Nightcap', 'Death Before Dinner', 'The Silent Guest', 'No Way Out',
  'The Final Curtain', 'A Grave Mistake', 'The Vanishing Act',
  'The Missing Key', 'Ashes in the Study', 'The Seventh Guest',
  'A Toast to Murder', 'The Torn Letter', 'Shadows in the Hall',
  'The Poisoned Pen', 'One Last Waltz', 'The Butler’s Secret',
  'Whispers Upstairs', 'The Cracked Mirror', 'A Debt Repaid',
  // Added with the 60-case catalog. One title per case, so this list must stay
  // at least as long as the sum of SPEC counts or titles begin to repeat.
  'The Second Shot', 'Nobody Left', 'A Quiet Alibi', 'The Wrong Coat',
  'Ashes at Midnight', 'The Last Train', 'Room Without a Door', 'The Cold Kettle',
  'A Name in Pencil', 'The Unlit Lamp', 'Three Empty Glasses', 'The Late Arrival',
  'A Story Rehearsed', 'The Missing Hour', 'Nothing Was Taken', 'The Open Window',
  'A Witness Recants', 'The Locked Pantry', 'Dust on the Sill', 'The Borrowed Knife',
  'A Clock Stopped', 'The Second Study', 'No One Heard', 'The Spare Key',
  'A Quiet Confession', 'The Torn Ledger', 'Shadows at the Door', 'The Last Guest',
  'A Debt Unsettled', 'The Silent Kitchen', 'Two Sets of Prints', 'The Final Alibi',
  'Nobody Was Home',
]

/** Every case the catalog will contain, in order, before any is generated. */
function plan(): { difficulty: Difficulty; index: number; caseNumber: number }[] {
  const specs: { difficulty: Difficulty; index: number; caseNumber: number }[] = []
  let n = 1
  for (const { difficulty, count } of SPEC) {
    for (let i = 0; i < count; i++) specs.push({ difficulty, index: i, caseNumber: n++ })
  }
  return specs
}

function buildOne(spec: { difficulty: Difficulty; index: number; caseNumber: number }): Puzzle | null {
  const caseSlug = `${slug(spec.difficulty)}-${spec.index + 1}`
  const caseNo = `Case No. ${roman(spec.caseNumber)}`
  try {
    const authored = AUTHORED_CASES[caseSlug]
    const p = authored ? buildAuthoredPuzzle(authored, caseNo) : (() => {
      reseed(hash(spec.difficulty) + spec.index * 7919 + 13)
      return generatePuzzle(spec.difficulty, caseSlug, caseNo)
    })()
    // Guarantee distinct titles. Case numbers come from the plan, so a rare
    // failed seed leaves a gap rather than renumbering everything after it.
    p.title = UNIQUE_TITLES[(spec.caseNumber - 1) % UNIQUE_TITLES.length]
    return p
  } catch { return null }
}

function build(): Puzzle[] {
  return plan().map(buildOne).filter((p): p is Puzzle => p !== null)
}

/**
 * A cached puzzle is untrusted input (an older build, a hand edit, a truncated
 * write). This is a structural check only: enough to be sure the game can
 * render and index it without throwing. Content correctness is the generator's
 * job; a cache that fails here is simply thrown away and rebuilt.
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

function readCache(): Puzzle[] | null {
  try {
    const cached = localStorage.getItem(KEY)
    if (!cached) return null
    const parsed: unknown = JSON.parse(cached)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(looksLikePuzzle)) return parsed
    removeKey(KEY) // unreadable or the wrong shape: rebuild rather than brick the app
    return null
  } catch {
    removeKey(KEY)
    return null
  }
}

/** Drop every catalog cache written by an earlier version; each bump used to leak ~400 KB. */
function purgeOldCatalogs(): void {
  for (const key of keysWithPrefix(CATALOG_KEY_PREFIX)) if (key !== KEY) removeKey(key)
}

function adopt(list: Puzzle[]): void {
  puzzles = list
  purgeOldCatalogs()
  // Progress is tied to the content it was earned on: forget it for any case
  // whose content differs from what the progress was saved against.
  reconcileProgress(list)
}

function writeCache(list: Puzzle[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

/** Synchronous build. Kept for tests and for any caller that cannot await. */
export function initCatalog(): void {
  if (puzzles.length) return
  const cached = readCache()
  if (cached) { adopt(cached); return }
  adopt(build())
  writeCache(puzzles)
}

/**
 * Build the catalog without freezing the tab.
 *
 * A cold 60-case build costs a few seconds of solid CPU, and doing it inside
 * render meant the player stared at a blank page until it finished. Generating
 * one case per macrotask hands control back to the browser between cases, so
 * the shell paints immediately and progress can be shown. A warm cache still
 * resolves on the first tick.
 */
export async function initCatalogAsync(
  onProgress?: (done: number, total: number) => void,
): Promise<Puzzle[]> {
  if (puzzles.length) return puzzles
  const cached = readCache()
  if (cached) { adopt(cached); return puzzles }

  const specs = plan()
  const list: Puzzle[] = []
  for (const spec of specs) {
    const built = buildOne(spec)
    if (built) list.push(built)
    onProgress?.(list.length, specs.length)
    // Yield to the event loop so input and paint are not starved.
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  adopt(list)
  writeCache(puzzles)
  return puzzles
}

export function getAllPuzzles(): Puzzle[] {
  if (!puzzles.length) initCatalog()
  return puzzles
}

export function getPuzzleById(id: string): Puzzle | undefined {
  return getAllPuzzles().find(p => p.id === id)
}

/** Generate a fresh one-off puzzle (for a "Random case" button). */
export function makeRandomPuzzle(difficulty: Difficulty): Puzzle {
  reseed(Date.now() ^ Math.floor(Math.random() * 1e9))
  return generatePuzzle(difficulty, `rnd-${Date.now()}`, 'Random Case')
}
