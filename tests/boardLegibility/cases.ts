// Every case the illustrated board can show: the 60 baked cases, the 12 generated deep cases, the two bundled
// deep fixtures (D-189, B-95) and the frozen hard-2 / very-easy-3 fixtures.
import baked from '../../src/data/catalog.generated.json'
import type { Puzzle } from '../../src/core/types'
import { deep, leadCases } from '../../src/casebook/deep'
import { easy, hard } from '../casebook/fixtures'

const seen = new Set<string>()
export const ALL_CASES: Puzzle[] = [...(baked as unknown as Puzzle[]), ...leadCases(), ...deep(), hard, easy].filter(p => {
  if (seen.has(p.id)) return false
  seen.add(p.id)
  return true
})

export const floorsOf = (p: Puzzle) => Array.from({ length: p.floors ?? 1 }, (_, i) => i)

/** Cell sizes the board is drawn at: 30 (the smallest phone grid) to 92 (past the largest the slice draws). */
export const SIZES = Array.from({ length: 63 }, (_, i) => 30 + i)
