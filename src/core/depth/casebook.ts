// ============================================================================
// The casebook batch: deep cases for the redesigned play screen.
//
// A case is generated from (config, seed, minChainDepth) with CASEBOOK_RECIPE. The baked
// file src/data/casebook.generated.json, written once by scripts/bake-casebook.mjs, is
// the canonical data the app loads: it is not regenerated, and tests/bakedCasebook.test.ts
// pins its digest and fingerprints. This module and the generator never ship, and a
// change here does not change the shipped cases.
//
// The plan is ordered as a ramp: shorter inference chains first, longer later
// (ties broken by board: single floor before two floors).
// ============================================================================

import type { Puzzle } from '../types'
import { DEPTH_SPECS } from './configs'
import { DEFAULT_RECIPE, generateDepthCase } from './generator'
import type { DepthSpec, Recipe } from './generator'

/** Removal-order knobs the casebook was generated with (see the sweep report). */
export const CASEBOOK_RECIPE: Recipe = { ...DEFAULT_RECIPE }
export const CASEBOOK_ATTEMPTS = 4

export interface CasebookEntry {
  id: string
  title: string
  config: 'B' | 'C' | 'D'
  seed: number
  /** The tier's minimum longest-chain, relaxed or kept per case so the batch can ramp. */
  minChainDepth: number
}

export const CASEBOOK_PLAN: readonly CasebookEntry[] = [
  { id: 'pt-01', title: 'Casebook Case 01', config: 'B', seed: 174, minChainDepth: 3 }, // chain depth 3
  { id: 'pt-02', title: 'Casebook Case 02', config: 'B', seed: 151, minChainDepth: 3 }, // chain depth 3
  { id: 'pt-03', title: 'Casebook Case 03', config: 'C', seed: 128, minChainDepth: 3 }, // chain depth 3
  { id: 'pt-04', title: 'Casebook Case 04', config: 'B', seed: 25, minChainDepth: 3 }, // chain depth 4
  { id: 'pt-05', title: 'Casebook Case 05', config: 'B', seed: 191, minChainDepth: 3 }, // chain depth 4
  { id: 'pt-06', title: 'Casebook Case 06', config: 'C', seed: 197, minChainDepth: 3 }, // chain depth 4
  { id: 'pt-07', title: 'Casebook Case 07', config: 'C', seed: 87, minChainDepth: 3 }, // chain depth 4
  { id: 'pt-08', title: 'Casebook Case 08', config: 'D', seed: 128, minChainDepth: 4 }, // chain depth 4
  { id: 'pt-09', title: 'Casebook Case 09', config: 'D', seed: 160, minChainDepth: 4 }, // chain depth 4
  { id: 'pt-10', title: 'Casebook Case 10', config: 'C', seed: 20, minChainDepth: 3 }, // chain depth 5
  { id: 'pt-11', title: 'Casebook Case 11', config: 'D', seed: 230, minChainDepth: 4 }, // chain depth 5
  { id: 'pt-12', title: 'Casebook Case 12', config: 'D', seed: 235, minChainDepth: 4 }, // chain depth 5
]

export function casebookSpec(entry: CasebookEntry): DepthSpec {
  const stock = DEPTH_SPECS[entry.config]
  return { ...stock, tier: { ...stock.tier, minChainDepth: entry.minChainDepth } }
}

/** Regenerate one case from its stored seed. Throws if the generator no longer accepts it. */
export function buildCasebookCase(entry: CasebookEntry, caseNumber: number): Puzzle {
  const c = generateDepthCase(casebookSpec(entry), entry.seed, { recipe: CASEBOOK_RECIPE, attempts: CASEBOOK_ATTEMPTS })
  if (!c.puzzle) throw new Error(`${entry.id}: seed ${entry.seed} (${entry.config}) is no longer accepted: ${c.rejected.join(', ')}`)
  return { ...c.puzzle, id: entry.id, title: entry.title, caseNumber: `Case No. ${caseNumber}` }
}

export function buildCasebook(): Puzzle[] {
  return CASEBOOK_PLAN.map((entry, i) => buildCasebookCase(entry, i + 1))
}
