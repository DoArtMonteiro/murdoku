// ============================================================================
// Depth analysis of one puzzle: how it is solved, not just whether it can be.
//
// Everything here is derived from the puzzle's clues and the engine's own clue
// predicates. `puzzle.solution` is read only to (a) check the propagation
// reached it and (b) find the victim's room for the murderer-leak checks.
// ============================================================================

import type { Clue, Puzzle } from '../types'
import { buildCtx, isRelational, otherPerson, pairTest, unaryMask } from './model'
import type { Ctx } from './model'
import { propagate } from './propagate'
import type { PinStep, PropResult, Rel, StepVia } from './propagate'

export interface StepSummary {
  n: number
  person: string
  via: StepVia
  round: number
}

export interface DepthAnalysis {
  people: number
  /** Clues other than the victim heading. */
  clues: number
  /** Pairwise propagation ends with one square for everyone (= deduceChain(p).pure). */
  pure: boolean
  /** ... and each of those squares is the stored solution. */
  matchesSolution: boolean

  // singles metrics: same definitions as puzzleValidate.difficultyMetrics
  forcedAtStart: number
  forcedBySingles: number
  needsSearch: number
  /** Fewest squares any one suspect has after their own clues. */
  minOwnCandidates: number
  meanOwnCandidates: number

  // chain shape
  /** Order in which pairwise consistency (the 'ac' run) pins people. It may use a suspect's unpinned options; see anchoredSteps for the forward chain. */
  steps: StepSummary[]
  /** Forward-chaining order (every elimination leans on an already pinned suspect); empty when the case is not anchored-solvable. */
  anchoredSteps: StepSummary[]
  /** Steps where a relational clue directly removed squares the pin needed. */
  crossDirect: number
  /** Steps that are row/column only but lean on suspects narrowed by a relational clue. */
  crossTrans: number
  laneSetSteps: number
  laneSteps: number
  ownSteps: number
  /** Relational sweeps that made progress. */
  rounds: number
  /**
   * Longest dependency chain: a person's depth is 1 + the deepest person whose
   * pinned square a relational removal (or, failing that, any removal) of theirs
   * leaned on. The entry pin is depth 0. A star around one pin is depth 1; a
   * relay A to B to C to D to E is depth 4.
   */
  chainDepth: number
  /**
   * Solved by forward chaining alone: every elimination comes from a suspect who
   * is already pinned (no reasoning about a suspect's leftover options as a set).
   */
  anchored: boolean
  /** Steps of the anchored run that needed a relational clue (what the gate counts when `requireAnchored` is set). */
  anchoredCross: number

  // readability
  statementsMean: number
  statementsMax: number
  statementsMin: number
  /** row + col clues over all clues. */
  coordinateShare: number
  kindMix: Record<string, number>
  relationalClues: number

  // murderer leaks, reading cards alone
  /** Suspects whose own cards do not rule them out of the victim's room and who are not paired with another suspect. */
  liveSuspects: number
  /** Suspects whose own cards confine them to the victim's actual room. */
  confinedSuspects: number
  /** ... counting only the cases where the victim's own cards also confine the victim to that one room (the leak a reader can actually see). */
  confinedKnown: number
}

/** Per-person squares left by their own (unary) clues. */
export function ownDomains(ctx: Ctx, clues: readonly Clue[], maskOf: (c: Clue) => Uint8Array): Uint8Array[] {
  const doms = ctx.ids.map(() => new Uint8Array(ctx.NC).fill(1))
  for (const clue of clues) {
    if (clue.kind === 'victim' || isRelational(clue)) continue
    const pi = ctx.idxOf.get(clue.person)
    if (pi === undefined) continue
    const mask = maskOf(clue)
    const d = doms[pi]
    for (let i = 0; i < ctx.NC; i++) d[i] &= mask[i]
  }
  return doms
}

export function relsOf(ctx: Ctx, clues: readonly Clue[]): Rel[] {
  const rels: Rel[] = []
  for (const clue of clues) {
    if (!isRelational(clue)) continue
    const other = otherPerson(clue)
    const a = ctx.idxOf.get(clue.person)
    const b = other === null ? undefined : ctx.idxOf.get(other)
    const test = pairTest(ctx, clue)
    if (a !== undefined && b !== undefined && test) rels.push({ a, b, test })
  }
  return rels
}

/**
 * forcedAtStart / forcedBySingles / needsSearch, as puzzleValidate.ts defines
 * them: a person is "forced" when singles propagation (own clues + row/column
 * exclusion by already placed people, nothing else) leaves them one square.
 */
export function singlesMetrics(ctx: Ctx, doms: readonly Uint8Array[]): { forcedAtStart: number; forcedBySingles: number; needsSearch: number } {
  const P = doms.length
  const cells = doms.map(d => { const out: number[] = []; for (let i = 0; i < ctx.NC; i++) if (d[i]) out.push(i); return out })
  const forcedAtStart = cells.filter(c => c.length === 1).length
  const placed = new Map<number, number>()
  let progress = true
  while (progress) {
    progress = false
    for (let p = 0; p < P; p++) {
      if (placed.has(p)) continue
      const usable = cells[p].filter(c => ![...placed.values()].some(q => ctx.rowOf[q] === ctx.rowOf[c] || ctx.colOf[q] === ctx.colOf[c]))
      if (usable.length === 1) { placed.set(p, usable[0]); progress = true }
    }
  }
  return { forcedAtStart, forcedBySingles: placed.size, needsSearch: P - placed.size }
}

function roomSet(ctx: Ctx, dom: Uint8Array): Set<number> {
  const out = new Set<number>()
  for (let i = 0; i < ctx.NC; i++) if (dom[i]) out.add(ctx.roomOfCell[i])
  return out
}

/** Dependency depth of the anchored chain, see DepthAnalysis.chainDepth. */
export function chainDepth(steps: readonly PinStep[]): number {
  const order = new Map(steps.map((s, i) => [s.person, i]))
  const depth = new Map<number, number>()
  let best = 0
  steps.forEach((s, i) => {
    const before = (by: number) => (order.get(by) ?? Infinity) < i
    const rel = s.removals.filter(r => r.reason === 'relational' && before(r.by)).map(r => r.by)
    const any = rel.length ? rel : s.removals.filter(r => before(r.by)).map(r => r.by)
    const d = any.length ? 1 + Math.max(...any.map(b => depth.get(b) ?? 0)) : 0
    depth.set(s.person, d)
    best = Math.max(best, d)
  })
  return best
}

export function summariseSteps(ctx: Ctx, steps: readonly PinStep[]): StepSummary[] {
  return steps.map(s => ({ n: s.n, person: ctx.ids[s.person], via: s.via, round: s.round }))
}

export interface AnalyzeOptions {
  /** Reuse unary masks across calls (keyed by clue object). */
  maskCache?: Map<Clue, Uint8Array>
}

export function analyzePuzzle(p: Puzzle, opts: AnalyzeOptions = {}): DepthAnalysis {
  const ctx = buildCtx(p)
  const cache = opts.maskCache ?? new Map<Clue, Uint8Array>()
  const maskOf = (c: Clue): Uint8Array => {
    let m = cache.get(c)
    if (!m) { m = unaryMask(ctx, c); cache.set(c, m) }
    return m
  }
  const clues = p.clues.map(c => c.clue)
  const real = clues.filter(c => c.kind !== 'victim')
  const doms = ownDomains(ctx, clues, maskOf)
  const rels = relsOf(ctx, clues)
  const res: PropResult = propagate(ctx, doms, rels, true)
  const anch: PropResult = propagate(ctx, doms, rels, true, 'anchored')

  const singles = singlesMetrics(ctx, doms)
  const counts = doms.map(d => { let n = 0; for (let i = 0; i < ctx.NC; i++) n += d[i]; return n })

  const placementOk = res.solved && ctx.ids.every((id, pi) => {
    const sol = p.solution[id]
    if (!sol) return false
    const idx = (sol.floor ?? 0) * ctx.N * ctx.N + sol.row * ctx.N + sol.col
    return res.dom[pi][idx] === 1
  })

  const count = (via: StepVia) => res.steps.filter(s => s.via === via).length

  const perPerson = new Map(ctx.ids.map(id => [id, 0]))
  for (const c of real) perPerson.set(c.person, (perPerson.get(c.person) ?? 0) + 1)
  const stmts = [...perPerson.values()]
  const kindMix: Record<string, number> = {}
  for (const c of real) kindMix[c.kind] = (kindMix[c.kind] ?? 0) + 1

  // Murderer leaks from cards alone.
  const vi = ctx.idxOf.get(p.victimId)!
  const victimCell = p.solution[p.victimId]
  const victimIdx = (victimCell.floor ?? 0) * ctx.N * ctx.N + victimCell.row * ctx.N + victimCell.col
  const victimRoom = ctx.roomOfCell[victimIdx]
  const victimRooms = roomSet(ctx, doms[vi])
  const paired = new Set<string>()
  for (const c of real) {
    if (c.kind === 'sameRoomAs' && c.person !== p.victimId && c.other !== p.victimId) { paired.add(c.person); paired.add(c.other) }
  }
  let live = 0
  let confined = 0
  for (const id of ctx.ids) {
    if (id === p.victimId) continue
    const rooms = roomSet(ctx, doms[ctx.idxOf.get(id)!])
    const overlaps = [...rooms].some(r => victimRooms.has(r))
    if (rooms.size === 1 && rooms.has(victimRoom)) confined++
    if (overlaps && !paired.has(id)) live++
  }

  return {
    people: p.people.length,
    clues: real.length,
    pure: res.solved,
    matchesSolution: placementOk,
    ...singles,
    minOwnCandidates: Math.min(...counts),
    meanOwnCandidates: counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length),
    steps: summariseSteps(ctx, res.steps),
    anchoredSteps: anch.solved ? summariseSteps(ctx, anch.steps) : [],
    crossDirect: count('cross'),
    crossTrans: count('crossTrans'),
    laneSetSteps: count('laneSet'),
    laneSteps: count('lane'),
    ownSteps: count('own'),
    rounds: res.rounds,
    chainDepth: chainDepth((anch.solved ? anch : res).steps),
    anchored: anch.solved,
    anchoredCross: anch.steps.filter(s => s.via === 'cross').length,
    statementsMean: real.length / Math.max(1, p.people.length),
    statementsMax: Math.max(...stmts),
    statementsMin: Math.min(...stmts),
    coordinateShare: real.length ? real.filter(c => c.kind === 'row' || c.kind === 'col').length / real.length : 0,
    kindMix,
    relationalClues: real.filter(isRelational).length,
    liveSuspects: live,
    confinedSuspects: confined,
    confinedKnown: victimRooms.size === 1 && victimRooms.has(victimRoom) ? confined : 0,
  }
}
