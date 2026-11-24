// Collisions: places where the accounts, taken together with where the player has put people, cannot all be true.
// Pure. It never reads puzzle.solution; it only evaluates statements against the current placement.
import type { Cell } from '../core/types'
import type { LieCase, Statement } from './model'
import { allTiles, holds, otherOf, tileKey, unaryAllows } from './lens'
import type { Placed } from './lens'

export interface Collision {
  /** The person whose account (or position) cannot be satisfied. */
  subject: string
  /** The subject first, then everyone they collide with. */
  people: string[]
  /** Every active statement by those people. */
  statementIds: string[]
  /** "row,col" tiles the subject's own statements allow, for the crack overlay. */
  tiles: string[]
}

/** A collision the detective wrote down. Kept even after the placement that caused it is undone. */
export interface JournalEntry { people: string[]; statementIds: string[] }

/** Stable identity of a collision: the sorted set of people. */
export const collisionKey = (people: readonly string[]): string => [...people].sort().join('|')

const MAX_EXACT = 10
/** Per subject, how many different groups are reported at most. */
const MAX_GROUPS = 4

/**
 * Every smallest-first group of placed people that already leaves the subject no tile, keeping only groups that
 * contain no smaller group (a group is dropped when a subset of it already blocks). So two different people who
 * each break the same account give two collisions, and a person who merely happens to be placed too gives none.
 */
function minimalBlockers(candidates: string[], leavesTile: (subset: string[]) => boolean): string[][] {
  if (candidates.length > MAX_EXACT) {
    // Too many to enumerate: drop people one by one while the tile stays impossible.
    let keep = [...candidates]
    for (const id of [...candidates].reverse()) {
      const trial = keep.filter(k => k !== id)
      if (!leavesTile(trial)) keep = trial
    }
    return [keep]
  }
  const found: string[][] = []
  const walk = (size: number, start: number, acc: string[]): void => {
    if (found.length >= MAX_GROUPS) return
    if (acc.length === size) {
      if (found.some(f => f.every(id => acc.includes(id)))) return
      if (!leavesTile(acc)) found.push(acc)
      return
    }
    for (let i = start; i < candidates.length; i++) walk(size, i + 1, [...acc, candidates[i]])
  }
  for (let size = 0; size <= candidates.length && found.length < MAX_GROUPS; size++) walk(size, 0, [])
  return found
}

/**
 * Collisions in the current placement, in the order of c.puzzle.people.
 * `active` is the statements not yet struck.
 *
 * Unplaced X: no tile with a free row and column satisfies X's unary statements and every relational statement
 * between X and a placed person (X's own, or the placed person's statement about X). The blockers are a smallest
 * group of placed people that already leaves X no tile, so the collision names only the accounts that actually
 * clash. When several different groups each do it, each is its own collision (at most four per subject).
 *
 * Placed X: an active statement of X is broken by the current placement.
 */
export function findCollisions(c: LieCase, active: readonly Statement[], placed: Placed): Collision[] {
  const p = c.puzzle
  const out: Collision[] = []
  const placedIds = p.people.map(x => x.id).filter(id => placed[id])
  const byAuthor = (id: string) => active.filter(s => s.author === id)

  for (const x of p.people) {
    const X = x.id
    const own = byAuthor(X)
    const base: Cell[] = allTiles(p).filter(t => own.every(s => otherOf(s.clue) ? true : unaryAllows(p, s, t)))
    const tiles = base.map(tileKey)

    if (!placed[X]) {
      const others = placedIds.filter(id => id !== X)
      // relational statements that tie X to someone, whoever wrote them
      const rel = active.filter(s => {
        const o = otherOf(s.clue)
        return !!o && (s.author === X || o === X)
      })
      const partner = (s: Statement) => (s.author === X ? otherOf(s.clue)! : s.author)
      // Is there a tile for X once only `subset` is placed?
      const leavesTile = (subset: string[]): boolean => {
        const rows = new Set(subset.map(id => placed[id].row)), cols = new Set(subset.map(id => placed[id].col))
        const sub: Placed = {}
        for (const id of subset) sub[id] = placed[id]
        return base.some(t => {
          if (rows.has(t.row) || cols.has(t.col)) return false
          const trial: Placed = { ...sub, [X]: t }
          return rel.every(s => !subset.includes(partner(s)) || holds(p, s, trial))
        })
      }
      if (leavesTile(others)) continue
      // only people who take at least one of X's tiles away can be part of the collision
      const takes = (id: string): boolean => base.some(t => {
        if (placed[id].row === t.row || placed[id].col === t.col) return true
        const trial: Placed = { [id]: placed[id], [X]: t }
        return rel.some(s => partner(s) === id && !holds(p, s, trial))
      })
      for (const blockers of minimalBlockers(others.filter(takes), leavesTile)) {
        const people = [X, ...blockers]
        out.push({
          subject: X,
          people,
          statementIds: active.filter(s => people.includes(s.author)).map(s => s.id),
          tiles,
        })
      }
    } else {
      const broken = own.filter(s => !holds(p, s, placed))
      if (!broken.length) continue
      const refs: string[] = []
      for (const s of broken) {
        const o = otherOf(s.clue)
        if (o && !refs.includes(o)) refs.push(o)
      }
      const people = [X, ...refs]
      const ids = new Set(broken.map(s => s.id))
      for (const s of active) if (refs.includes(s.author)) ids.add(s.id)
      out.push({ subject: X, people, statementIds: active.filter(s => ids.has(s.id)).map(s => s.id), tiles })
    }
  }
  return out
}

/** Collisions worth recording: two or more people, so a lone misplacement never reads as accounts clashing. */
export const recordable = (list: readonly Collision[]): Collision[] => list.filter(k => k.people.length >= 2)

/** People who appear in every one of the rows (empty when there are none). */
export function commonPeople(rows: readonly (readonly string[])[]): string[] {
  if (!rows.length) return []
  return rows[0].filter(id => rows.every(r => r.includes(id)))
}
