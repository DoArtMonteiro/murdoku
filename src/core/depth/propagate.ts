// ============================================================================
// Pairwise consistency propagation with a classified trace.
//
// This computes the same fixed point as reference/story/deduce.ts: a square
// leaves a suspect's list when some OTHER suspect has no square left that is
// compatible with it (different row, different column, and every clue linking
// the two holds). Order does not change a fixed point, so "this propagation
// ends with one square per suspect" is exactly "deduceChain(p).pure".
//
// It is rewritten here, not reused, for two reasons:
//   * speed: row/column support is an O(1) count lookup, so a candidate clue
//     set costs about a millisecond and the generator can test hundreds;
//   * classification: deduceChain labels every support removal 'pair' and does
//     not keep the other suspect's domain, so "lane" and "relational" cannot be
//     told apart after the fact. Here the reason is decided at removal time.
//
// Reasons, decided at the moment a square is removed:
//   lane        the other suspect is already pinned to one square in that row or
//               column (the classic "someone stands there" elimination).
//   laneSet     the other suspect is not pinned, but every square they still
//               have shares a row or column with this one. Still row/column
//               only, no clue about either of them was needed.
//   relational  the other suspect has squares in different rows and columns,
//               but none that satisfies the clue(s) linking the two. A
//               relational clue was decisive.
// The lane rules run to a fixed point BEFORE each relational sweep, so a
// 'relational' removal is never something the lane rules could already do.
// ============================================================================

import type { Ctx, PairTest } from './model'

export type Reason = 'lane' | 'laneSet' | 'relational'

export interface Removal {
  idx: number
  reason: Reason
  /** Person index whose pinned square / remaining squares caused it. */
  by: number
  /** True when this removal rests (directly or through `by`) on a relational removal. */
  relDerived: boolean
}

/**
 * How a suspect was pinned:
 *   own        their own clues already left one square.
 *   lane       row/column elimination against pinned suspects only.
 *   laneSet    row/column elimination, including "all their squares share a row".
 *   crossTrans row/column elimination only, but against suspects whose squares
 *              were themselves narrowed by a relational clue. A chain step.
 *   cross      a relational clue directly removed squares this pin needed.
 */
export type StepVia = 'own' | 'lane' | 'laneSet' | 'crossTrans' | 'cross'

export interface PinStep {
  n: number
  person: number
  cell: number
  via: StepVia
  /** Relational sweep during which the pin happened (0 = lane rules, before any sweep). */
  round: number
  /** Squares this suspect lost on the way, in order. */
  removals: Removal[]
}

export interface Rel {
  a: number
  b: number
  /** Holds when person a stands at ia and person b at ib. */
  test: PairTest
}

export interface PropResult {
  solved: boolean
  contradiction: boolean
  dom: Uint8Array[]
  cnt: Int32Array
  steps: PinStep[]
  /** Relational sweeps that removed something. */
  rounds: number
}

/**
 * 'ac'        full pairwise consistency (what deduceChain computes).
 * 'anchored'  forward chaining only: a square is removed because of a suspect
 *             who is ALREADY PINNED to one square (lane or clue). No reasoning
 *             about a suspect's remaining options as a set. This is the way a
 *             player solves without holding hypotheticals, so "solved in
 *             anchored mode" is a much stronger statement than "pure".
 */
export type PropMode = 'ac' | 'anchored'

export function propagate(ctx: Ctx, dom0: readonly Uint8Array[], rels: readonly Rel[], trace: boolean, mode: PropMode = 'ac'): PropResult {
  const P = dom0.length
  const { N, NC, rowOf, colOf } = ctx
  const dom = dom0.map(d => d.slice())
  const cnt = new Int32Array(P)
  for (let p = 0; p < P; p++) { let n = 0; for (let i = 0; i < NC; i++) n += dom[p][i]; cnt[p] = n }

  // pairRel[a][b]: tests oriented from a's point of view (ia = a's square, ib = b's).
  const pairRel: PairTest[][][] = Array.from({ length: P }, () => Array.from({ length: P }, () => []))
  for (const r of rels) {
    pairRel[r.a][r.b].push(r.test)
    const t = r.test
    pairRel[r.b][r.a].push((ib, ia) => t(ia, ib))
  }
  const relPairs: [number, number][] = []
  for (let a = 0; a < P; a++) for (let b = 0; b < P; b++) if (pairRel[a][b].length) relPairs.push([a, b])

  const logs: Removal[][] = Array.from({ length: P }, () => [])
  const relTouched = new Uint8Array(P)
  const pinned = new Uint8Array(P)
  const steps: PinStep[] = []
  let rounds = 0
  let sweep = 0
  let contradiction = false

  const remove = (p: number, idx: number, reason: Reason, by: number): void => {
    dom[p][idx] = 0
    cnt[p]--
    if (cnt[p] === 0) contradiction = true
    if (trace) {
      const relDerived = reason === 'relational' || relTouched[by] === 1
      logs[p].push({ idx, reason, by, relDerived })
      if (relDerived) relTouched[p] = 1
    }
  }

  const soleCell = (p: number): number => { for (let i = 0; i < NC; i++) if (dom[p][i]) return i; return -1 }

  const recordPins = (): void => {
    for (let p = 0; p < P; p++) {
      if (cnt[p] !== 1 || pinned[p]) continue
      pinned[p] = 1
      if (!trace) continue
      const cell = soleCell(p)
      const log = logs[p]
      let via: StepVia
      if (log.length === 0) via = 'own'
      else {
        // Would this suspect still be pinned if the squares removed by a relational
        // clue were given back? Squares that a pinned suspect's row/column rules
        // out anyway do not count as given back.
        let restored = 1
        for (const rm of log) {
          if (rm.reason !== 'relational') continue
          let blocked = false
          for (let q = 0; q < P && !blocked; q++) {
            if (q === p || cnt[q] !== 1) continue
            const qc = soleCell(q)
            if (rowOf[qc] === rowOf[rm.idx] || colOf[qc] === colOf[rm.idx]) blocked = true
          }
          if (!blocked) restored++
        }
        if (restored > 1) via = 'cross'
        else if (relTouched[p]) via = 'crossTrans'
        else via = log.some(r => r.reason === 'laneSet') ? 'laneSet' : 'lane'
      }
      steps.push({ n: steps.length + 1, person: p, cell, via, round: sweep, removals: [...log] })
    }
  }

  // Scratch for lane support counts.
  const rowCnt = Array.from({ length: P }, () => new Int32Array(N))
  const colCnt = Array.from({ length: P }, () => new Int32Array(N))
  const inter = Array.from({ length: P }, () => new Int32Array(N * N))
  const total = new Int32Array(P)

  const laneClosure = (): void => {
    for (;;) {
      for (let b = 0; b < P; b++) {
        rowCnt[b].fill(0); colCnt[b].fill(0); inter[b].fill(0)
        total[b] = cnt[b]
        const d = dom[b]
        for (let i = 0; i < NC; i++) {
          if (!d[i]) continue
          rowCnt[b][rowOf[i]]++; colCnt[b][colOf[i]]++; inter[b][rowOf[i] * N + colOf[i]]++
        }
      }
      let changed = false
      for (let a = 0; a < P; a++) {
        const da = dom[a]
        for (let b = 0; b < P; b++) {
          if (a === b || (mode === 'anchored' && cnt[b] !== 1)) continue
          for (let i = 0; i < NC; i++) {
            if (!da[i]) continue
            const r = rowOf[i], c = colOf[i]
            // Counts are a snapshot taken at the top of this pass; mixing them with the
            // live cnt[b] would undercount after b lost squares mid-pass and remove
            // squares that are in fact supported.
            const compatible = total[b] - rowCnt[b][r] - colCnt[b][c] + inter[b][r * N + c]
            if (compatible <= 0) {
              remove(a, i, cnt[b] === 1 ? 'lane' : 'laneSet', b)
              changed = true
            }
          }
        }
      }
      recordPins()
      if (!changed || contradiction) return
    }
  }

  const relationalSweep = (): boolean => {
    let changed = false
    for (const [a, b] of relPairs) {
      if (mode === 'anchored' && cnt[b] !== 1) continue
      const tests = pairRel[a][b]
      const da = dom[a], db = dom[b]
      for (let i = 0; i < NC; i++) {
        if (!da[i]) continue
        const r = rowOf[i], c = colOf[i]
        let supported = false
        for (let j = 0; j < NC && !supported; j++) {
          if (!db[j] || rowOf[j] === r || colOf[j] === c) continue
          let ok = true
          for (const t of tests) if (!t(i, j)) { ok = false; break }
          if (ok) supported = true
        }
        if (!supported) { remove(a, i, 'relational', b); changed = true }
      }
      recordPins()
      if (contradiction) return changed
    }
    return changed
  }

  recordPins()
  for (;;) {
    laneClosure()
    if (contradiction || cnt.every(n => n === 1)) break
    sweep++
    if (!relationalSweep()) break
    rounds++
    if (contradiction) break
  }
  return { solved: !contradiction && cnt.every(n => n === 1), contradiction, dom, cnt, steps, rounds }
}
