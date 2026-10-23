import type { AuthoredCaseSpec } from '../../core/authored'
import { veryEasy1 } from './very-easy-1'
import { veryEasy2 } from './very-easy-2'
import { hard1 } from './hard-1'
import { hard6, expert4, expert9, master1, master3, master4 } from './frozen-layouts'

// Every hand-authored case, keyed by the catalog slug it replaces
// (see catalog.ts's plan(): `${slug(difficulty)}-${index + 1}`).
// A slot with no entry here falls back to the procedural generator.
//
// hard-6, expert-4, expert-9, master-1, master-3 and master-4 are layouts frozen
// from the generator (frozen-layouts.ts): their hand-built 3D scenes pin the
// exact furniture and solution cells, and re-deriving them from a seed after a
// change to the clue semantics moved those cells out from under the scenes.
export const AUTHORED_CASES: Record<string, AuthoredCaseSpec> = {
  [veryEasy1.slug]: veryEasy1,
  [veryEasy2.slug]: veryEasy2,
  [hard1.slug]: hard1,
  [hard6.slug]: hard6,
  [expert4.slug]: expert4,
  [expert9.slug]: expert9,
  [master1.slug]: master1,
  [master3.slug]: master3,
  [master4.slug]: master4,
}
