// The five sweep configurations. Tier numbers are the gate's thresholds; they are
// parameters, not truths (see the sweep report for how they were chosen).

import type { DepthTier } from './gate'
import type { DepthSpec } from './generator'

const base = { maxForcedAtStart: 1, maxStatementsMean: 2.5, maxStatementsPerPerson: 3, maxCoordinateShare: 0.25, minLiveSuspects: 3, requireAnchored: false } as const

export const DEPTH_SPECS: Record<'A' | 'B' | 'C' | 'D' | 'E', DepthSpec> = {
  // full-density single floor: 5 people on 5x5
  A: { name: 'A', layout: { size: 5, floors: 1, rooms: 3 }, people: 5, difficulty: 'Hard', tier: { name: 'A', minNeedsSearch: 4, minCrossSteps: 3, minChainDepth: 3, ...base } },
  B: { name: 'B', layout: { size: 6, floors: 1, rooms: 4 }, people: 6, difficulty: 'Hard', tier: { name: 'B', minNeedsSearch: 5, minCrossSteps: 4, minChainDepth: 4, ...base } },
  C: { name: 'C', layout: { size: 8, floors: 1, rooms: 5 }, people: 6, difficulty: 'Expert', tier: { name: 'C', minNeedsSearch: 5, minCrossSteps: 4, minChainDepth: 4, ...base } },
  D: { name: 'D', layout: { size: 8, floors: 2, rooms: 4 }, people: 6, difficulty: 'Master', tier: { name: 'D', minNeedsSearch: 5, minCrossSteps: 4, minChainDepth: 4, ...base } },
  E: { name: 'E', layout: { size: 7, floors: 1, rooms: 5 }, people: 7, difficulty: 'Master', tier: { name: 'E', minNeedsSearch: 6, minCrossSteps: 5, minChainDepth: 5, ...base } },
}

export type { DepthTier }
