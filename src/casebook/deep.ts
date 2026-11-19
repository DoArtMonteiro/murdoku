// The deep cases that lead the picker. Today they are two accepted fixtures of
// the depth generator, copied into data/deep.json. When the generator's output
// file src/data/casebook.generated.json exists it replaces them, keyed pt-01 to
// pt-12; either source works and a malformed file is ignored, never fatal.
import type { Puzzle } from '../core/types'
import { looksLikePuzzle } from '../core/catalog'
import deepFixtures from './data/deep.json'

const generatedFiles = import.meta.glob<unknown>('../data/casebook.generated.json', { eager: true, import: 'default' })

/** The two bundled fixtures (D-189 two floors 8x8, B-95 one floor). */
export function deep(): Puzzle[] {
  return (deepFixtures as unknown[]).filter(looksLikePuzzle)
}

/** Accepts an array, a record keyed by case id, or `{ puzzles: [...] }`. */
export function parseGenerated(raw: unknown): Puzzle[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { puzzles?: unknown }).puzzles)
      ? (raw as { puzzles: unknown[] }).puzzles
      : raw && typeof raw === 'object'
        ? Object.entries(raw as Record<string, unknown>).map(([key, v]) => (v && typeof v === 'object' && !('id' in v) ? { ...v, id: key } : v))
        : []
  return list.filter(looksLikePuzzle)
}

/** Generated cases when the file is present and holds at least one valid puzzle, else the fixtures. */
export function leadCases(files: Record<string, unknown> = generatedFiles): Puzzle[] {
  const generated = Object.values(files).flatMap(parseGenerated)
  return generated.length ? generated : deep()
}
