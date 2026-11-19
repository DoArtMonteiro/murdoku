// Supposition: put ONE suspect down as a ghost and see, one hop only, what that
// leaves every other suspect. Own statements, minus the ghost's row and column,
// minus the statements that tie the two people together. Nothing propagates
// further and the solution is never read, so a contradiction is one the player
// found for themselves.
import type { Cell, Puzzle } from '../core/types'
import { clueHolds, unaryLegalFor } from '../core/engine'
import { allCells, cellKey } from './cells'
import { otherPerson } from './lens'

export interface Supposition { person: string; cell: Cell }

export interface SupposeReport {
  /** Remaining legal cells for every other person. */
  remaining: Record<string, Cell[]>
  /**
   * People tied to the ghost by a statement that names one of the two. The
   * constraint binds both ways, so a statement of the ghost that names them counts too.
   */
  linked: string[]
  /** People left with no square at all. */
  contradictions: string[]
  /** False when the ghost's own statements already rule its square out. */
  ghostLegal: boolean
}

export function suppose(p: Puzzle, ghost: Supposition): SupposeReport {
  const g = ghost.person
  const gp = { [g]: ghost.cell }
  // Statements that bind two people: an explicit "other", or "the only one on X".
  const pairwise = p.clues.map(c => c.clue).filter(c => otherPerson(c) !== undefined || c.kind === 'onlyOnFurniture')
  const linkedSet = new Set<string>()
  const remaining: Record<string, Cell[]> = {}
  const cells = allCells(p)

  for (const o of p.people) {
    if (o.id === g) continue
    const ties = pairwise.filter(c =>
      (c.person === o.id && (otherPerson(c) === g || c.kind === 'onlyOnFurniture'))
      || (c.person === g && (otherPerson(c) === o.id || c.kind === 'onlyOnFurniture')))
    if (ties.some(c => otherPerson(c) !== undefined)) linkedSet.add(o.id)
    remaining[o.id] = cells.filter(c =>
      c.row !== ghost.cell.row && c.col !== ghost.cell.col
      && unaryLegalFor(p, o.id, c)
      && ties.every(t => clueHolds(p, t, { ...gp, [o.id]: c })))
  }
  return {
    remaining,
    linked: [...linkedSet],
    contradictions: Object.keys(remaining).filter(id => remaining[id].length === 0),
    ghostLegal: unaryLegalFor(p, g, ghost.cell),
  }
}

export const remainingKeys = (r: SupposeReport, personId: string): Set<string> =>
  new Set((r.remaining[personId] ?? []).map(cellKey))
