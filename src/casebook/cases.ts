// Where the slice gets its puzzle. It takes a Puzzle, not a catalogue
// position: a case can be injected here (a new generator, a test fixture) and
// the slice never learns where it came from. Baked cases are read through the
// read-only accessor, so the slice never runs the catalogue's progress
// reconciliation and never writes a `murdoku_*` key.
import type { Puzzle } from '../core/types'
import { getBakedPuzzles } from '../core/catalog'
import { deep, leadCases } from './deep'

/** Baked cases the picker keeps after the deep ones: a deep two-floor case and a shallow control. */
const BAKED_PICKS: ReadonlyArray<{ id: string; note: string }> = [
  { id: 'hard-2', note: 'Two floors, chained deductions.' },
  { id: 'very-easy-3', note: 'A gentle control case.' },
]

const injected = new Map<string, Puzzle>()

export function registerCase(p: Puzzle): void { injected.set(p.id, p) }

export function resolveCase(id: string): Puzzle | undefined {
  return injected.get(id) ?? leadCases().find(p => p.id === id) ?? deep().find(p => p.id === id) ?? getBakedPuzzles().find(p => p.id === id)
}

export interface PickerCase { id: string; title: string; note: string; deep: boolean }

const describe = (p: Puzzle): string =>
  `${p.size}×${p.size}, ${(p.floors ?? 1) > 1 ? 'two floors' : 'one floor'}, ${p.people.length - 1} suspects.`

/** Deep cases first, then the baked picks. */
export function pickerCases(): PickerCase[] {
  const lead = leadCases().map(p => ({ id: p.id, title: p.title, note: `Deep. ${describe(p)}`, deep: true }))
  const baked = BAKED_PICKS.flatMap(b => {
    const p = getBakedPuzzles().find(x => x.id === b.id)
    return p ? [{ id: p.id, title: p.title, note: b.note, deep: false }] : []
  })
  return [...lead, ...baked]
}
