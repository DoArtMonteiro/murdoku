// ============================================================================
// Depth-first case generator.
//
// The shipped generator adds the clues that shrink candidate sets most until the
// solver says "unique", then prunes. That ends with strong, direct clues on
// every person, so propagation of unary clues and rows/columns solves the case.
//
// This generator inverts the order. It starts from EVERY true clue the engine
// understands, then removes clues from strongest to weakest, keeping a removal
// only while pairwise propagation (propagate.ts) still pins every suspect with
// no trial step. What survives is a minimal set, and because the strong unary
// clues are tried for removal first, what is left leans on relational clues:
// direction (north/south/east/west of someone, with and without steps),
// "same room as", "not in the same room as", plus whatever weak unary clues the
// cast still needs.
//
// "Solved by propagation" implies uniqueness (each suspect ends on one square
// and the stored solution is always inside every domain), so the engine's slow
// backtracking solver is never in the search loop. It runs once, in the gate, on
// a finished candidate.
// ============================================================================

import type { Clue, ClueText, Difficulty, Person, Puzzle } from '../types'
import { ACCENTS, clueToText } from '../generate'
import { findMurderer, roomIdAt } from '../engine'
import { buildLayout } from './layout'
import type { Layout, LayoutSpec } from './layout'
import { buildCtx, isRelational, unaryMask } from './model'
import type { Ctx } from './model'
import { propagate } from './propagate'
import type { PropMode, Rel } from './propagate'
import { analyzePuzzle, ownDomains, relsOf } from './analyze'
import type { DepthAnalysis } from './analyze'
import { buildPool } from './pool'
import { depthGate } from './gate'
import type { DepthTier, GateFailure, GateResult } from './gate'
import { hashSeed, makeRng } from './rng'
import type { Rng } from './rng'

export interface DepthSpec {
  name: string
  layout: LayoutSpec
  /** Victim plus suspects. */
  people: number
  difficulty: Difficulty
  tier: DepthTier
}

/** Knobs of the clue-removal order. Defaults were chosen from the sweep, see the report. */
export interface Recipe {
  /** Gaussian-ish noise added to every clue's removal priority; more = more varied sets. */
  noise: number
  /** Added to the priority of relational clues (higher = removed earlier = rarer). */
  relationalPenalty: number
  /**
   * What "still solved" means while pruning. 'ac' = pairwise consistency (the
   * gate's `pure`). 'anchored' = forward chaining from pinned suspects only,
   * the stricter, human-friendlier class.
   */
  mode: PropMode
}

export const DEFAULT_RECIPE: Recipe = { noise: 1.2, relationalPenalty: 0, mode: 'ac' }

export interface DepthCandidate {
  seed: number
  /** The finished, gate-approved case; null when this candidate was rejected. */
  puzzle: Puzzle | null
  /** The assembled case when it got as far as the gate, accepted or not (for diagnosis). */
  draft?: Puzzle
  /** Why not: a stage name or the gate's failure codes. Empty when accepted. */
  rejected: string[]
  /** Gate failures with detail, when the candidate got as far as the gate. */
  failures: GateFailure[]
  analysis?: DepthAnalysis
  gate?: GateResult
  /** Removal orders tried (or the attempt that succeeded). */
  attempts: number
  /** Accepted by the very first removal order. */
  firstTry: boolean
  ms: number
}

const NAMES = [
  'Alexander', 'Bella', 'Carol', 'Dalia', 'Evangeline', 'Viraj', 'Marco',
  'Priya', 'Nadia', 'Tomas', 'Greta', 'Idris', 'Lena', 'Oscar', 'Yuki',
]
const TITLES = [
  'The Silent Guest', 'A Cold Reception', 'Death Before Dinner', 'The Locked Study',
  'Midnight Delivery', 'The Last Nightcap', 'No Way Out', 'The Uninvited',
  'A Fatal Rehearsal', 'The Empty Chair', 'Checkmate', 'The Broken Vase',
]

function makePeople(n: number, rng: Rng, seed: number): Person[] {
  const names = rng.shuffle(NAMES).slice(0, n)
  const accents = rng.shuffle(ACCENTS)
  return names.map((name, i) => ({ id: `p${i}`, name, avatarSeed: `${name}-${seed}-${i}`, accent: accents[i % accents.length] }))
}

/**
 * Seat the cast: distinct rows and columns, both storeys occupied on a two-floor
 * house, and exactly one suspect sharing the victim's room (so findMurderer
 * names one). Returns the house as a clue-less Puzzle, or null.
 */
function seat(layout: Layout, spec: DepthSpec, rng: Rng, seed: number): Puzzle | null {
  const N = layout.size
  const people = makePeople(spec.people, rng, seed)
  const victim = rng.pick(people)
  victim.isVictim = true
  const base: Puzzle = {
    id: `depth-${spec.name.toLowerCase()}-${seed}`,
    title: '',
    caseNumber: `Depth ${spec.name}-${seed}`,
    difficulty: spec.difficulty,
    size: layout.size,
    rooms: layout.rooms,
    roomOf: layout.roomOf,
    ...(layout.roomOfByFloor ? { roomOfByFloor: layout.roomOfByFloor, floors: layout.floors } : {}),
    furniture: layout.furniture,
    people,
    clues: [],
    solution: {},
    victimId: victim.id,
    murdererId: '',
    flavor: '',
  }
  const range = [...Array(N).keys()]
  for (let attempt = 0; attempt < 400; attempt++) {
    const rows = rng.shuffle(range)
    const cols = rng.shuffle(range)
    const floors = people.map(() => (layout.floors === 2 ? rng.int(2) : 0))
    if (layout.floors === 2 && (!floors.includes(0) || !floors.includes(1))) continue
    const place: Puzzle['solution'] = {}
    people.forEach((person, i) => {
      place[person.id] = layout.floors === 2 ? { row: rows[i], col: cols[i], floor: floors[i] } : { row: rows[i], col: cols[i] }
    })
    const murderer = findMurderer(base, place)
    if (!murderer) continue
    base.solution = place
    base.murdererId = murderer
    return base
  }
  return null
}

interface Entry {
  clue: Clue
  person: number
  relational: boolean
  mask: Uint8Array | null
  /** Squares a unary clue leaves its person (0 for relational clues). */
  legal: number
  rel: Rel | null
  priority: number
}

/** Removal priority: higher = tried for removal earlier. */
function strength(clue: Clue, legalFraction: number): number {
  switch (clue.kind) {
    case 'row': case 'col': return 12 // coordinates go first: the gate caps them at 25%
    case 'direction': return clue.steps ? 1.2 : 0.6
    case 'sameRoomAs': return 1.0
    case 'notSameRoomAs': return 0.3
    default: return -Math.log2(Math.max(legalFraction, 1 / 256))
  }
}

function buildEntries(ctx: Ctx, pool: Clue[], recipe: Recipe, rng: Rng): Entry[] {
  return pool.map(clue => {
    const relational = isRelational(clue)
    const mask = relational ? null : unaryMask(ctx, clue)
    let legal = 0
    if (mask) for (let i = 0; i < ctx.NC; i++) legal += mask[i]
    const rels = relational ? relsOf(ctx, [clue]) : []
    const noise = (rng.next() + rng.next() + rng.next() - 1.5) * 2 * recipe.noise
    return {
      clue,
      person: ctx.idxOf.get(clue.person)!,
      relational,
      mask,
      legal,
      rel: rels[0] ?? null,
      priority: strength(clue, legal / ctx.NC) + (relational ? recipe.relationalPenalty : 0) + noise,
    }
  })
}

/**
 * Remove clues in priority order, keeping a removal only when propagation still
 * pins everyone. Every person keeps at least one clue of their own.
 * Returns the surviving entries, or null when even the whole pool does not solve.
 */
function pruneByPropagation(ctx: Ctx, entries: Entry[], mode: PropMode): Entry[] | null {
  const P = ctx.ids.length
  const keep = entries.map(() => true)
  const perPerson = new Int32Array(P)
  for (const e of entries) perPerson[e.person]++

  const domsFor = (): Uint8Array[] => {
    const doms = ctx.ids.map(() => new Uint8Array(ctx.NC).fill(1))
    entries.forEach((e, i) => {
      if (!keep[i] || !e.mask) return
      const d = doms[e.person]
      for (let c = 0; c < ctx.NC; c++) d[c] &= e.mask[c]
    })
    return doms
  }
  const relsNow = (): Rel[] => entries.flatMap((e, i) => (keep[i] && e.rel ? [e.rel] : []))

  if (!propagate(ctx, domsFor(), relsNow(), false, mode).solved) return null

  const order = entries.map((_, i) => i).sort((a, b) => entries[b].priority - entries[a].priority)
  for (const i of order) {
    const e = entries[i]
    if (perPerson[e.person] <= 1) continue
    keep[i] = false
    if (propagate(ctx, domsFor(), relsNow(), false, mode).solved) perPerson[e.person]--
    else keep[i] = true
  }
  return entries.filter((_, i) => keep[i])
}

/**
 * Prune, look at what is left, and when it breaks a gate limit ban the clue that
 * causes it and prune again. Pruning alone yields a MINIMAL set, not a deep one:
 * a strong unary clue that was needed for solvability stays. Banning it forces
 * the solution onto relational clues instead, which is the whole point.
 * A ban that leaves the pool unsolvable is undone and never retried.
 */
function shapeClues(
  ctx: Ctx, base: Puzzle, entries: Entry[], tier: DepthTier, rng: Rng, seed: number,
  maskCache: Map<Clue, Uint8Array>, mode: PropMode,
): Entry[] | null {
  const banned = new Set<Entry>()
  const frozen = new Set<Entry>()
  let lastBan: Entry | null = null
  let best: Entry[] | null = null
  for (let iter = 0; iter < 40; iter++) {
    const kept = pruneByPropagation(ctx, entries.filter(e => !banned.has(e)), mode)
    if (!kept) {
      if (!lastBan) return best
      banned.delete(lastBan); frozen.add(lastBan); lastBan = null
      continue
    }
    best = kept
    const a = analyzePuzzle(finish(base, kept.map(e => e.clue), seed), { maskCache })
    const doms = ownDomains(ctx, kept.map(e => e.clue), c => maskCache.get(c)!)
    const ownCount = doms.map(d => d.reduce((x, y) => x + y, 0))
    const unaryOf = (pi: number) => kept.filter(e => e.person === pi && e.mask && !frozen.has(e)).sort((x, y) => x.legal - y.legal)

    // The same cross-step count the gate uses for this tier.
    const cross = tier.requireAnchored ? a.anchoredCross : a.crossDirect
    let group: Entry[] = []
    const suspects = ctx.ids.map((_, i) => i).filter(i => ctx.ids[i] !== base.victimId)
    if (a.confinedSuspects > 0) {
      group = suspects.flatMap(pi => unaryOf(pi))
    } else if (a.forcedAtStart > tier.maxForcedAtStart) {
      group = ctx.ids.flatMap((_, pi) => (ownCount[pi] === 1 ? unaryOf(pi) : []))
    } else if (a.coordinateShare > tier.maxCoordinateShare) {
      group = kept.filter(e => (e.clue.kind === 'row' || e.clue.kind === 'col') && !frozen.has(e))
    } else if (a.liveSuspects < tier.minLiveSuspects) {
      group = kept.filter(e => e.clue.kind === 'sameRoomAs' && !frozen.has(e))
      if (!group.length) group = ctx.ids.flatMap((_, pi) => unaryOf(pi))
    } else if (a.statementsMax > tier.maxStatementsPerPerson) {
      const load = (pi: number) => kept.filter(e => e.person === pi).length
      const heavy = ctx.ids.map((_, i) => i).sort((x, y) => load(y) - load(x))[0]
      group = kept.filter(e => e.person === heavy && !frozen.has(e))
    } else if (a.chainDepth < tier.minChainDepth && a.needsSearch >= tier.minNeedsSearch && cross >= tier.minCrossSteps) {
      // Too flat: lots of people hang straight off the entry pin. Cut the clues that
      // tie someone to a person with a pinned-by-own-clues square, so the rest relay.
      const entry = ctx.ids.map((_, i) => i).filter(i => ownCount[i] === 1)
      group = kept.filter(e => e.relational && !frozen.has(e) && (entry.includes(e.person) || (e.rel && entry.includes(e.rel.b))))
    } else if (a.needsSearch < tier.minNeedsSearch || cross < tier.minCrossSteps) {
      group = ctx.ids.flatMap((_, pi) => unaryOf(pi).filter(e => e.clue.kind !== 'row' && e.clue.kind !== 'col'))
        .sort((x, y) => x.legal - y.legal)
    }
    if (!group.length) return kept
    const top = group.slice(0, 2)
    lastBan = rng.pick(top)
    banned.add(lastBan)
  }
  return best
}

function flavorFor(p: Puzzle): string {
  const victim = p.people.find(x => x.id === p.victimId)!
  const room = p.rooms.find(r => r.id === roomIdAt(p, p.solution[p.victimId]))!
  return `${victim.name} was found dead in the ${room.name}. Everyone has an alibi — but the clues never lie. Place each person, and the one left alone with ${victim.name} is your killer.`
}

/** Assemble the finished Puzzle: clue texts worded by generate.ts's own clueToText. */
function finish(base: Puzzle, chosen: Clue[], seed: number): Puzzle {
  const ordered = [...chosen].sort((a, b) => base.people.findIndex(x => x.id === a.person) - base.people.findIndex(x => x.id === b.person))
  const texts: ClueText[] = ordered.map(clue => ({ clue, text: clueToText(base, clue) }))
  const victim: Clue = { kind: 'victim', person: base.victimId }
  const rngTitle = makeRng(hashSeed(`title-${seed}`))
  return {
    ...base,
    clues: [...texts, { clue: victim, text: clueToText(base, victim) }],
    title: rngTitle.pick(TITLES),
    flavor: flavorFor(base),
    source: 'generated',
  }
}

export interface GenerateOptions {
  recipe?: Recipe
  /** Removal orders to try on one house before giving up (default 4). */
  attempts?: number
  /** Passed to the gate. Default 'fast': engine.countSolutions can take minutes on a depth case (fastCount.ts). */
  solver?: 'engine' | 'fast'
  /** Passed to the gate; 'onPass' (default) verifies accepted cases with the engine. */
  engine?: 'always' | 'onPass' | 'never'
}

export function generateDepthCase(spec: DepthSpec, seed: number, opts: GenerateOptions = {}): DepthCandidate {
  const t0 = performance.now()
  const done = (c: Omit<DepthCandidate, 'seed' | 'ms' | 'failures' | 'attempts' | 'firstTry'> & { failures?: GateFailure[]; attempts?: number; firstTry?: boolean }): DepthCandidate =>
    ({ seed, ms: performance.now() - t0, failures: [], attempts: 0, firstTry: false, ...c })
  const rng = makeRng(hashSeed(`${spec.name}:${seed}`))
  const layout = buildLayout(spec.layout, hashSeed(`layout:${spec.name}:${seed}`))
  if (!layout) return done({ puzzle: null, rejected: ['layout'] })
  const base = seat(layout, spec, rng, seed)
  if (!base) return done({ puzzle: null, rejected: ['seat'] })

  const recipe = opts.recipe ?? DEFAULT_RECIPE
  const attempts = Math.max(1, opts.attempts ?? 4)
  const ctx = buildCtx(base)
  const pool = buildPool(base)
  let last: { puzzle: Puzzle; gate: GateResult } | null = null
  for (let attempt = 1; attempt <= attempts; attempt++) {
    // A fresh removal order on the SAME house and cast. Pruning is greedy, so a
    // different order finds a different (often smaller) irredundant set.
    const entries = buildEntries(ctx, pool, recipe, rng)
    const maskCache = new Map<Clue, Uint8Array>()
    for (const e of entries) if (e.mask) maskCache.set(e.clue, e.mask)
    const kept = shapeClues(ctx, base, entries, spec.tier, rng, seed, maskCache, recipe.mode)
    if (!kept) { if (!last) continue; break }
    const puzzle = finish(base, kept.map(e => e.clue), seed)
    const cheap = depthGate(puzzle, spec.tier, { engine: 'never' })
    last = { puzzle, gate: cheap }
    if (!cheap.pass) continue
    // Cheap checks passed: confirm with the engine (solver, deduceChain, murderer).
    const gate = depthGate(puzzle, spec.tier, { engine: opts.engine ?? 'onPass', solver: opts.solver ?? 'fast' })
    if (gate.pass) return done({ puzzle, rejected: [], analysis: gate.analysis, gate, draft: puzzle, attempts: attempt, firstTry: attempt === 1 })
    last = { puzzle, gate }
    break
  }
  if (!last) return done({ puzzle: null, rejected: ['pool-unsolvable'], attempts })
  const { puzzle, gate } = last
  return done({ puzzle: null, rejected: [...new Set(gate.failures.map(f => f.code))], failures: gate.failures, analysis: gate.analysis, gate, draft: puzzle, attempts })
}
