import type { ResolvedObject } from './resolve'
import { resolvedObjectVisibilityBoxes } from './stairVisibility'
import type { Vec3 } from './units'

/** A world-space line represented by its two endpoints. */
export type Vec3Segment = [Vec3, Vec3]

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/**
 * Build the annotation used by the exploded storey view to reconnect a lower
 * stair flight with the upper arrival. The stair model is kept at its real
 * height. Only the annotation receives the companion offset and spans the
 * remaining gap to the supplied upper-floor height.
 *
 * The first four segments are the two vertical traces and their lower and
 * upper crossbars. Remaining segments are a camera-facing side profile of the
 * measured stair visibility boxes. The profile is deliberately omitted when
 * the visibility helper has no individual tread boxes, such as the unmeasured
 * corner flight, so this helper never turns a stair into a rectangular prism.
 */
export function explodedConnectionSegments(
  lower: ResolvedObject,
  lowerOffsetY: number,
  upperY: number,
): Vec3Segment[] {
  const boxes = resolvedObjectVisibilityBoxes(lower)
  const top = boxes.reduce((highest, box) => box.max[1] > highest.max[1] ? box : highest)
  const alongX = lower.facing === 'E' || lower.facing === 'W'
  const climbsPositive = lower.facing === 'E' || lower.facing === 'S'
  const alongAxis = alongX ? 0 : 2
  const acrossAxis = alongX ? 2 : 0

  const footprintMin = alongX ? lower.footprint.minZ : lower.footprint.minX
  const footprintMax = alongX ? lower.footprint.maxZ : lower.footprint.maxX
  const runMin = alongX ? lower.footprint.minX : lower.footprint.minZ
  const runMax = alongX ? lower.footprint.maxX : lower.footprint.maxZ
  const arrivalEdge = climbsPositive ? runMax : runMin
  const lowerTopY = top.max[1] + lowerOffsetY
  const segments: Vec3Segment[] = []

  const pointOnFlight = (along: number, y: number, across: number): Vec3 => (
    alongX ? [along, y, across] : [across, y, along]
  )
  const segment = (a: Vec3, b: Vec3): Vec3Segment => [a, b]

  // The connectors use the resolved footprint so their plan position follows
  // the measured object, including scenes whose stair is not the reference
  // case. Each endpoint is a fresh tuple to keep resolved data immutable.
  for (const across of [footprintMin, footprintMax]) {
    segments.push(segment(
      pointOnFlight(arrivalEdge, lowerTopY, across),
      pointOnFlight(arrivalEdge, upperY, across),
    ))
  }
  segments.push(segment(
    pointOnFlight(arrivalEdge, lowerTopY, footprintMin),
    pointOnFlight(arrivalEdge, lowerTopY, footprintMax),
  ))
  segments.push(segment(
    pointOnFlight(arrivalEdge, upperY, footprintMin),
    pointOnFlight(arrivalEdge, upperY, footprintMax),
  ))

  // A straight flight has one measured visibility box per tread. Draw only
  // the side facing the fixed camera, with each top edge and each measured
  // riser. This follows the real step envelope without drawing an AABB.
  if (boxes.length > 1) {
    const ordered = [...boxes].sort((a, b) => {
      const centreA = (a.min[alongAxis] + a.max[alongAxis]) / 2
      const centreB = (b.min[alongAxis] + b.max[alongAxis]) / 2
      return (climbsPositive ? 1 : -1) * (centreA - centreB)
    })
    const floorY = lower.box.min[1] + lowerOffsetY
    for (const [index, box] of ordered.entries()) {
      const start = clamp(box.min[alongAxis], runMin, runMax)
      const end = clamp(box.max[alongAxis], runMin, runMax)
      const across = clamp(box.max[acrossAxis], footprintMin, footprintMax)
      const topY = box.max[1] + lowerOffsetY
      const low = climbsPositive ? start : end
      const high = climbsPositive ? end : start
      segments.push(segment(
        pointOnFlight(low, topY, across),
        pointOnFlight(high, topY, across),
      ))
      if (index === 0) {
        segments.push(segment(
          pointOnFlight(low, floorY, across),
          pointOnFlight(low, topY, across),
        ))
      } else {
        const previous = ordered[index - 1]
        const previousY = previous.max[1] + lowerOffsetY
        segments.push(segment(
          pointOnFlight(low, previousY, across),
          pointOnFlight(low, topY, across),
        ))
      }
    }
  }

  return segments
}
