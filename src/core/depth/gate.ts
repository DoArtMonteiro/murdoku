// ============================================================================
// The depth gate: is this case solved by cross-person reasoning, within limits
// a human can read? Pure: it takes a Puzzle and a tier, touches no state.
//
// Checks, in the brief's words:
//   unique          engine.countSolutions(p, 2) === 1
//   pure            reference/story/deduce.deduceChain(p).pure (no trial steps)
//   forcedAtStart   <= tier.maxForcedAtStart (default 1)
//   needsSearch     >= tier.minNeedsSearch (people singles propagation cannot place)
//   cross steps     >= tier.minCrossSteps. Counted from depth/propagate.ts:
//                   a step is "cross" when a relational clue directly removed
//                   squares the pin needed (see StepVia). Lane-only 'pair'
//                   removals ("everything he can still reach shares a row")
//                   are classified separately and NOT counted.
//   statements      mean clues per person <= 2.5 (and <= maxStatementsPerPerson on any one card) (the victim heading is not a
//                   statement), and everybody has at least one
//   coordinates     row + col clues <= tier.maxCoordinateShare of clues (edge/corner
//                   are not coordinates); direction clues <= tier.maxDirectionShare
//   murderer        murdererId === engine.findMurderer(p); kinds restricted to
//                   the allowed list; suspects not leaked by cards alone
//
// Cheap checks (everything from the propagation) run first. The engine's own
// solver and deduceChain are the slow part on wide domains, so by default they
// run only when the cheap checks pass ('onPass'); pass engine: 'always' to get
// every verdict (used for the shipped catalogue).
// ============================================================================

import type { Puzzle } from '../types'
import { countSolutions, findMurderer } from '../engine'
import { deduceChain } from '../../reference/story/deduce'
import { analyzePuzzle } from './analyze'
import type { DepthAnalysis } from './analyze'
import { DEPTH_KINDS } from './pool'

export interface DepthTier {
  name: string
  minNeedsSearch: number
  /** M: chain steps that need a relational clue. */
  minCrossSteps: number
  /** Longest dependency chain (see DepthAnalysis.chainDepth): a relay, not a star around one pin. */
  minChainDepth: number
  maxForcedAtStart: number
  maxStatementsMean: number
  /** Readability: no single card may carry more than this many statements. */
  maxStatementsPerPerson: number
  maxCoordinateShare: number
  /** Direction clues over all clues: they read like coordinates when they dominate. */
  maxDirectionShare: number
  /**
   * Require the case to be solvable by forward chaining from pinned suspects
   * (see PropMode 'anchored'). Stricter than `pure`; off for the brief's literal gate.
   */
  requireAnchored: boolean
  /** Suspects not exonerated by their own cards (and not paired with another suspect). */
  minLiveSuspects: number
}

export type GateFailureCode =
  | 'kind' | 'unique' | 'pure' | 'propagation-mismatch' | 'forcedAtStart' | 'needsSearch' | 'cross' | 'chain'
  | 'statements' | 'statements-max' | 'anchored' | 'person-without-clue' | 'coordinates' | 'direction-share' | 'murderer' | 'leak-confined' | 'leak-live'

export interface GateFailure { code: GateFailureCode; detail: string }

export interface EngineChecks {
  solutions: number
  solveMs: number
  chainPure: boolean
  chainMs: number
  murdererOk: boolean
}

export interface GateResult {
  pass: boolean
  failures: GateFailure[]
  analysis: DepthAnalysis
  /** Absent when the engine checks were skipped. */
  engine?: EngineChecks
}

export interface GateOptions {
  /** 'onPass' (default): engine checks only if the cheap checks pass. */
  engine?: 'always' | 'onPass' | 'never'
}

export function depthGate(p: Puzzle, tier: DepthTier, opts: GateOptions = {}): GateResult {
  const mode = opts.engine ?? 'onPass'
  const a = analyzePuzzle(p)
  const failures: GateFailure[] = []
  const fail = (code: GateFailureCode, detail: string) => failures.push({ code, detail })

  const badKinds = [...new Set(p.clues.map(c => c.clue.kind).filter(k => !DEPTH_KINDS.has(k)))]
  if (badKinds.length) fail('kind', `kinds outside the allowed list: ${badKinds.join(', ')}`)
  if (!a.pure || !a.matchesSolution) fail('pure', a.pure ? 'propagation ends on squares that are not the stored solution' : 'propagation stalls: some suspect needs a trial step')
  if (a.forcedAtStart > tier.maxForcedAtStart) fail('forcedAtStart', `${a.forcedAtStart} suspects are pinned by their own clues (max ${tier.maxForcedAtStart})`)
  if (a.needsSearch < tier.minNeedsSearch) fail('needsSearch', `needsSearch ${a.needsSearch} < ${tier.minNeedsSearch}`)
  // In the anchored class the cross steps that count are the forward-chain ones: a step the
  // pairwise run labels 'cross' because of an unpinned suspect's options may not be one there.
  const cross = tier.requireAnchored ? a.anchoredCross : a.crossDirect
  if (cross < tier.minCrossSteps) fail('cross', `${cross} cross-person steps < ${tier.minCrossSteps}`)
  if (a.chainDepth < tier.minChainDepth) fail('chain', `longest inference chain ${a.chainDepth} < ${tier.minChainDepth}`)
  if (a.statementsMean > tier.maxStatementsMean) fail('statements', `${a.statementsMean.toFixed(2)} statements per person > ${tier.maxStatementsMean}`)
  if (a.statementsMax > tier.maxStatementsPerPerson) fail('statements-max', `one person carries ${a.statementsMax} statements (max ${tier.maxStatementsPerPerson})`)
  if (tier.requireAnchored && !a.anchored) fail('anchored', 'not solvable by forward chaining from pinned suspects alone')
  if (a.statementsMin < 1) fail('person-without-clue', 'a person has no clue')
  if (a.coordinateShare > tier.maxCoordinateShare) fail('coordinates', `row/col clues are ${(a.coordinateShare * 100).toFixed(0)}% of clues (max ${tier.maxCoordinateShare * 100}%)`)
  if (a.directionShare > tier.maxDirectionShare) fail('direction-share', `direction clues are ${(a.directionShare * 100).toFixed(0)}% of clues (max ${tier.maxDirectionShare * 100}%)`)
  if (a.confinedSuspects > 0) fail('leak-confined', `${a.confinedSuspects} suspect(s) are confined to the victim's room by their own cards`)
  if (a.liveSuspects < tier.minLiveSuspects) fail('leak-live', `only ${a.liveSuspects} suspects stay possible murderers from the cards alone (min ${tier.minLiveSuspects})`)

  let engine: EngineChecks | undefined
  if (mode === 'always' || (mode === 'onPass' && failures.length === 0)) {
    const t0 = performance.now()
    const solutions = countSolutions(p, 2)
    const t1 = performance.now()
    const chain = deduceChain(p)
    const t2 = performance.now()
    const murdererOk = findMurderer(p) === p.murdererId && findMurderer(p) !== null
    engine = { solutions, solveMs: t1 - t0, chainPure: chain.pure, chainMs: t2 - t1, murdererOk }
    if (solutions !== 1) fail('unique', `countSolutions(p, 2) = ${solutions}`)
    if (!chain.pure) fail('pure', 'deduceChain needs a trial step')
    if (chain.pure !== a.pure) fail('propagation-mismatch', `deduceChain.pure=${chain.pure} but depth propagation pure=${a.pure}`)
    if (!murdererOk) fail('murderer', `murdererId ${p.murdererId} is not the one suspect found alone with the victim`)
  }
  return { pass: failures.length === 0, failures, analysis: a, engine }
}
