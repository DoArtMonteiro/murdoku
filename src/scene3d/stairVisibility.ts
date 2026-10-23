import type { Box3, ResolvedObject } from './resolve'

// Measured from the transformed POSITION geometry of the vendored stairs,
// stairsOpen and stairsOpenSingle GLBs. Each row is [start X, end X, top Y]
// in Kenney coordinates, rounded OUTWARD to the nearest 0.000001 unit.
// Treads overlap by 0.02: dividing the total run into 11 equal boxes is wrong.
// Filling each tread down to the floor conservatively encloses the closed
// risers and both open-flight support variants. Mesh coverage is proved by
// clipping every real GLB triangle into these X bands in stairVisibility.test.
const STRAIGHT_TREADS = [
  [0, 0.183949, 0.121776],
  [0.163948, 0.347898, 0.243552],
  [0.327897, 0.511846, 0.365327],
  [0.491845, 0.675795, 0.487103],
  [0.655794, 0.839744, 0.608879],
  [0.819743, 1.003692, 0.730654],
  [0.983691, 1.167641, 0.852430],
  [1.147640, 1.331589, 0.974205],
  [1.311588, 1.495538, 1.095981],
  [1.475537, 1.659487, 1.217757],
  [1.639486, 1.823435, 1.339532],
] as const

// The renderer centres the real mesh, not the catalogue's millimetre-rounded
// size. Preserve that measured pivot and conservatively cover its full width.
const PIVOT_X = 1.823434829711914 / 2
const HALF_WIDTH = 0.395

/** Visibility only. Collision, reachability and landing checks keep o.box. */
export function resolvedObjectVisibilityBoxes(object: ResolvedObject): Box3[] {
  if (object.kind !== 'stairs' || !['stairs', 'stairsOpen', 'stairsOpenSingle'].includes(object.model)
    || object.rotY % 90 !== 0) return [object.box]

  const angle = object.rotY * Math.PI / 180
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return STRAIGHT_TREADS.map(([start, end, height]) => {
    const corners = [start - PIVOT_X, end - PIVOT_X].flatMap(x => [-HALF_WIDTH, HALF_WIDTH].map(z => [
      object.position[0] + x * cos + z * sin,
      object.position[2] - x * sin + z * cos,
    ]))
    return {
      min: [Math.min(...corners.map(p => p[0])), object.position[1], Math.min(...corners.map(p => p[1]))],
      max: [Math.max(...corners.map(p => p[0])), object.position[1] + height, Math.max(...corners.map(p => p[1]))],
    }
  })
}
