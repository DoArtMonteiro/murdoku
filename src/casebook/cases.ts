// Where the slice gets its puzzle. It takes a Puzzle, not a catalogue
// position: a case can be injected here (a new generator, a test fixture) and
// the slice never learns where it came from.
import type { Puzzle } from '../core/types'
import { getPuzzleById } from '../core/catalog'

export const DEFAULT_CASE = 'hard-2'

/** The cases the picker offers: one deep two-floor case, one shallow control. */
export const PICKER_CASES: ReadonlyArray<{ id: string; note: string }> = [
  { id: 'hard-2', note: 'Deep: two floors, chained deductions.' },
  { id: 'very-easy-3', note: 'Shallow: a gentle control case.' },
]

const injected = new Map<string, Puzzle>()

export function registerCase(p: Puzzle): void { injected.set(p.id, p) }
export function resolveCase(id: string): Puzzle | undefined { return injected.get(id) ?? getPuzzleById(id) }
