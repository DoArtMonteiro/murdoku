import type { PlanRect } from './schema'

const EPS = 1e-8

/** Width of the usable seam between two clear rectangles. */
export function circulationConnectionWidth(a: PlanRect, b: PlanRect): number {
  const overlapX = Math.min(a[2], b[2]) - Math.max(a[0], b[0])
  const overlapZ = Math.min(a[3], b[3]) - Math.max(a[1], b[1])
  const sharesXEdge = Math.abs(a[2] - b[0]) <= EPS || Math.abs(b[2] - a[0]) <= EPS
  const sharesZEdge = Math.abs(a[3] - b[1]) <= EPS || Math.abs(b[3] - a[1]) <= EPS
  if (sharesXEdge && overlapZ > EPS) return overlapZ
  if (sharesZEdge && overlapX > EPS) return overlapX
  if (overlapX > EPS && overlapZ > EPS) return Math.max(overlapX, overlapZ)
  return 0
}

/** Two clear rectangles connect through a seam of the required width. */
export function circulationRectsConnect(a: PlanRect, b: PlanRect, minimumWidth = EPS): boolean {
  const width = circulationConnectionWidth(a, b)
  return width > EPS && width >= minimumWidth - EPS
}

/** Indices reachable from rectangle zero in the authored circulation graph. */
export function connectedCirculationRects(rects: PlanRect[], minimumConnectionWidth = EPS): Set<number> {
  if (!rects.length) return new Set()
  const connected = new Set<number>([0])
  const pending = [0]
  while (pending.length) {
    const current = pending.pop()!
    for (let candidate = 0; candidate < rects.length; candidate++) {
      if (connected.has(candidate)
        || !circulationRectsConnect(rects[current], rects[candidate], minimumConnectionWidth)) continue
      connected.add(candidate)
      pending.push(candidate)
    }
  }
  return connected
}
