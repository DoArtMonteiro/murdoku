import { generatePuzzle, reseed } from './generate'
import { buildAuthoredPuzzle } from './authored'
import { AUTHORED_CASES } from '../data/cases'
import type { Puzzle, Difficulty } from './types'

// ============================================================================
// The catalog builder: a stable, seeded set of puzzles. Generation is
// deterministic per seed, so the same catalog comes out every run.
//
// This module is NOT part of the app bundle. The 60 shipped cases are the
// canonical data in src/data/catalog.generated.json (see catalog.ts), produced
// once by scripts/bake-catalog.mjs from this code. After that the file is the
// source of truth: this generator may change freely for NEW cases (under new
// ids) without altering what players load or their saved progress.
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

/** Generate the whole catalog from scratch (~5 s of CPU). */
export function buildCatalog(): Puzzle[] {
  return plan().map(buildOne).filter((p): p is Puzzle => p !== null)
}

/** Generate a fresh one-off puzzle (for a "Random case" button). */
export function makeRandomPuzzle(difficulty: Difficulty): Puzzle {
  reseed(Date.now() ^ Math.floor(Math.random() * 1e9))
  return generatePuzzle(difficulty, `rnd-${Date.now()}`, 'Random Case')
}
