// Frozen copies of the two cases the slice is judged on (hard-2, very-easy-3), taken from the
// baked catalogue. The logic tests pin cells and chains, so they must not move when the
// catalogue is re-baked or replaced by a new generator.
import type { Puzzle } from '../../../src/core/types'
import cases from './cases.json'

const all = cases as unknown as Record<string, Puzzle>
export const hard: Puzzle = all['hard-2']
export const easy: Puzzle = all['very-easy-3']
