// ============================================================================
// Deduction chain for the reconstruction (R2).
//
// Replays, from the REAL puzzle data and nothing else, the order in which a
// careful player pins every suspect to a square. It never reads
// `puzzle.solution` to decide a step: it only uses the documented clue
// semantics (docs/CLUE_SEMANTICS.md) through the engine's own predicates
// (`unaryClueHolds`, `clueHolds`), then the tests assert that the chain it
// reaches equals the stored solution.
//
// Inference rules, in the order they are tried:
//   1. own clues      - a suspect's own clues leave exactly one legal square.
//   2. lanes          - everyone stands in a different row and column, so a
//                       square in the row/column of someone already pinned is gone.
//   3. pair           - a square is dropped when another suspect would be left
//                       with no square that is compatible with it.
//   4. relational     - same test, for clues that mention a second person.
// If those stall (never on the shipped catalogue's easy cases), the chain falls
// back to one honest "trial" step per remaining suspect, so it always ends.
// ============================================================================

import type { Cell, ClueText, Puzzle } from '../../core/types'
import { cellFloor } from '../../core/types'
import { clueHolds, unaryLegalFor } from '../../core/engine'

export type DeductionVia = 'own' | 'lanes' | 'pair' | 'trial'

export interface Removal {
  cell: Cell
  /** Why this square left the suspect's list. */
  reason: 'lane' | 'pair'
  /** The suspect whose square (lane) or whose lack of options (pair) caused it. */
  by: string
}

export interface DeductionStep {
  /** 1-based position in the chain. */
  n: number
  person: string
  cell: Cell
  via: DeductionVia
  /** The suspect's own clues (the victim heading is left out), in card order. */
  clues: ClueText[]
  /** Squares the suspect's own clues allowed before anything else was known. */
  ownCandidates: Cell[]
  /** Squares removed from `ownCandidates` by earlier steps, with the cause. */
  removed: Removal[]
  /** Squares still open just before this step (ownCandidates minus removed). */
  openBefore: Cell[]
  /** Earlier suspects this step leans on (pinned squares that removed something). */
  dependsOn: string[]
}

export interface DeductionChain {
  steps: DeductionStep[]
  /** Final placement the chain reached. */
  placement: Record<string, Cell>
  /** True when every step was found by inference (no trial). */
  pure: boolean
}

const key = (c: Cell) => `${cellFloor(c)}:${c.row}:${c.col}`

function allCells(p: Puzzle): Cell[] {
  const out: Cell[] = []
  const floors = p.floors ?? 1
  for (let f = 0; f < floors; f++) for (let r = 0; r < p.size; r++) for (let c = 0; c < p.size; c++) out.push({ row: r, col: c, floor: f })
  return out
}

/** Two squares can hold two different people: different row AND different column (any storey). */
const compatible = (a: Cell, b: Cell) => a.row !== b.row && a.col !== b.col

export function deduceChain(p: Puzzle): DeductionChain {
  const everyone = p.people.map(x => x.id)
  const own = new Map<string, Cell[]>()
  for (const id of everyone) own.set(id, allCells(p).filter(c => unaryLegalFor(p, id, c)))

  const dom = new Map<string, Map<string, Cell>>()
  for (const id of everyone) dom.set(id, new Map(own.get(id)!.map(c => [key(c), c])))
  const removedLog = new Map<string, Removal[]>(everyone.map(id => [id, []]))
  const pinned = new Map<string, Cell>()
  const steps: DeductionStep[] = []
  let pure = true

  const relational = p.clues.filter(ct => !['victim'].includes(ct.clue.kind))
  const relationalPairs = relational
    .map(ct => ct.clue)
    .filter(cl => 'other' in cl || ('targetKind' in cl && cl.targetKind === 'person'))

  /** Would (a for A, b for B) violate a clue that links A and B (or every onlyOn clue)? */
  const pairOk = (A: string, a: Cell, B: string, b: Cell): boolean => {
    if (!compatible(a, b)) return false
    if (key(a) === key(b)) return false
    for (const cl of relationalPairs) {
      const other = 'other' in cl ? cl.other : (cl as { target: string }).target
      const linked = (cl.person === A && other === B) || (cl.person === B && other === A)
      if (!linked) continue
      if (!clueHolds(p, cl, { [A]: a, [B]: b })) return false
    }
    return true
  }

  const settle = (): void => {
    // Fixed point over lanes + pair support.
    let changed = true
    while (changed) {
      changed = false
      for (const [id, cell] of pinned) {
        for (const other of everyone) {
          if (other === id || pinned.has(other)) continue
          const d = dom.get(other)!
          for (const [k, c] of [...d]) {
            if (!compatible(c, cell) || key(c) === key(cell)) {
              d.delete(k); changed = true
              removedLog.get(other)!.push({ cell: c, reason: 'lane', by: id })
            }
          }
        }
      }
      for (const A of everyone) {
        if (pinned.has(A)) continue
        const dA = dom.get(A)!
        for (const [k, a] of [...dA]) {
          for (const B of everyone) {
            if (B === A) continue
            const dB = [...dom.get(B)!.values()]
            if (!dB.some(b => pairOk(A, a, B, b))) {
              dA.delete(k); changed = true
              removedLog.get(A)!.push({ cell: a, reason: 'pair', by: B })
              break
            }
          }
        }
      }
    }
  }

  const clueList = (id: string): ClueText[] => p.clues.filter(ct => ct.clue.person === id && ct.clue.kind !== 'victim')

  const pin = (id: string, cell: Cell, via: DeductionVia): void => {
    const removed = [...removedLog.get(id)!]
    const ownKeys = new Set(own.get(id)!.map(key))
    const gone = new Set(removed.map(r => key(r.cell)))
    const openBefore = own.get(id)!.filter(c => !gone.has(key(c)))
    const dependsOn = [...new Set(removed.map(r => r.by))].filter(b => pinned.has(b))
    steps.push({
      n: steps.length + 1, person: id, cell, via, clues: clueList(id),
      ownCandidates: own.get(id)!, removed: removed.filter(r => ownKeys.has(key(r.cell))), openBefore, dependsOn,
    })
    pinned.set(id, cell)
    dom.set(id, new Map([[key(cell), cell]]))
  }

  settle()
  let guard = 0
  while (pinned.size < everyone.length && guard++ < everyone.length * 4) {
    // The suspect with a single square left; ties go to card order (stable, readable).
    // Prefer the suspect whose own clues already say it all (nothing removed yet), then card order.
    const singles = everyone.filter(id => !pinned.has(id) && dom.get(id)!.size === 1)
    const next = singles.find(id => removedLog.get(id)!.length === 0) ?? singles[0]
    if (next) {
      const cell = [...dom.get(next)!.values()][0]
      const log = removedLog.get(next)!
      const via: DeductionVia = log.length === 0 ? 'own' : log.some(r => r.reason === 'pair') ? 'pair' : 'lanes'
      pin(next, cell, via)
      settle()
      continue
    }
    // Stalled: try each square of the most constrained suspect and keep the one
    // that can still be completed (an honest case split, reported as 'trial').
    pure = false
    const open = everyone.filter(id => !pinned.has(id)).sort((a, b) => dom.get(a)!.size - dom.get(b)!.size)
    const who = open[0]
    const works = [...dom.get(who)!.values()].filter(c => completes(p, who, c, pinned, dom))
    const pick = works[0] ?? [...dom.get(who)!.values()][0]
    if (!pick) break
    pin(who, pick, 'trial')
    settle()
  }

  return { steps, placement: Object.fromEntries(pinned), pure }
}

/** Can `who` at `cell`, with `pinned` fixed, be extended to a full placement inside the domains? */
function completes(p: Puzzle, who: string, cell: Cell, pinned: Map<string, Cell>, dom: Map<string, Map<string, Cell>>): boolean {
  const fixed: Record<string, Cell> = Object.fromEntries(pinned)
  fixed[who] = cell
  const rest = p.people.map(x => x.id).filter(id => !(id in fixed))
  const go = (i: number, cur: Record<string, Cell>): boolean => {
    if (i === rest.length) return p.clues.every(ct => clueHolds(p, ct.clue, cur))
    for (const c of dom.get(rest[i])!.values()) {
      if (Object.values(cur).some(o => !compatible(o, c) || key(o) === key(c))) continue
      if (go(i + 1, { ...cur, [rest[i]]: c })) return true
    }
    return false
  }
  return go(0, fixed)
}
