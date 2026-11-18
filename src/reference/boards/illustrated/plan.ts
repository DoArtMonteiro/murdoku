// The plan the illustrated board draws: the Night Plan derivation (shared, tested)
// followed by one refinement. A door whose far side (the side it does NOT swing
// into) opens onto a furniture cell is moved to another gap of the same pair of
// rooms where both sides are free; when there is no such gap the door stays.
import type { Puzzle } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { buildPlan, type Door, type Edge, type Plan } from '../nightplan/plan'

const key = (e: { axis: string; line: number; pos: number }) => `${e.axis}${e.line}.${e.pos}`

export function doorEdgeOf(plan: Plan, d: Door): Edge | undefined {
  return plan.edges.find(e => e.axis === d.axis && e.line === d.line && e.pos === d.pos)
}

/** Doors whose non-swing side holds a piece of (non-rug) furniture. */
export function doorsOntoFurniture(plan: Plan): Door[] {
  const occ = occupied(plan)
  return plan.doors.filter(d => {
    if (d.pocket) return false
    const e = doorEdgeOf(plan, d)
    if (!e) return false
    const far = d.swing === -1 ? e.p : e.m
    return !!far && occ.has(`${far[0]},${far[1]}`)
  })
}

function occupied(plan: Plan): Set<string> {
  const occ = new Set<string>()
  for (const fu of plan.furniture) {
    if (fu.type === 'rug') continue
    const { w, h } = furnitureFootprint(fu)
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) occ.add(`${fu.row + dr},${fu.col + dc}`)
  }
  return occ
}

export function illustratedPlan(puzzle: Puzzle, floor: number, cellPx: number): Plan {
  const plan = buildPlan(puzzle, floor, cellPx)
  const bad = doorsOntoFurniture(plan)
  if (!bad.length) return plan
  const occ = occupied(plan)
  const idOf = (c: readonly [number, number] | null) => (c ? plan.roomAt[c[0]][c[1]] : null)
  const used = new Set([...plan.doors.map(key), ...plan.windows.map(key)])
  const doors = plan.doors.map(d => ({ ...d }))
  const swingCells = new Set<string>()
  const swingOf = (d: Door): [number, number] => (d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line])
  for (const d of doors) if (!d.pocket) swingCells.add(swingOf(d).join(','))
  for (const old of bad) {
    const idx = doors.findIndex(d => d.axis === old.axis && d.line === old.line && d.pos === old.pos)
    const e = doorEdgeOf(plan, old)
    if (idx < 0 || !e || !e.m || !e.p) continue
    const swingRoom = idOf(old.swing === -1 ? e.m : e.p)
    const a = idOf(e.m), b = idOf(e.p)
    // other gaps between the same two rooms, both sides free, centre-most first
    const cands = plan.edges.filter(x => x.kind === 'int' && !used.has(key(x)) && x.m && x.p &&
      ((idOf(x.m) === a && idOf(x.p) === b) || (idOf(x.m) === b && idOf(x.p) === a)) &&
      !occ.has(`${x.m[0]},${x.m[1]}`) && !occ.has(`${x.p[0]},${x.p[1]}`))
    const mid = (x: Edge) => Math.abs(x.pos - (e.pos))
    cands.sort((x, y) => mid(x) - mid(y) || x.line - y.line || x.pos - y.pos)
    for (const c of cands) {
      const swing: -1 | 1 = idOf(c.m) === swingRoom ? -1 : 1
      const nd: Door = { axis: c.axis, line: c.line, pos: c.pos, swing, front: false }
      const sc = swingOf(nd).join(',')
      if (swingCells.has(sc)) continue
      swingCells.delete(swingOf(old).join(','))
      swingCells.add(sc)
      used.delete(key(old)); used.add(key(c))
      doors[idx] = nd
      break
    }
  }
  return { ...plan, doors, frontDoor: plan.frontDoor }
}
