import type { ResolvedScene, Rect } from './resolve'
import type { Violation } from './validate'
import type { PlanRect } from './schema'
import { CELL } from './units'
import { planRectToWorld, validPlanRect, worldRectCoveredByFloor } from './floorGeometry'

const EPS = 1e-6
const contains = (outer: Rect, inner: Rect) => outer.minX <= inner.minX + EPS
  && outer.maxX >= inner.maxX - EPS && outer.minZ <= inner.minZ + EPS && outer.maxZ >= inner.maxZ - EPS
const overlaps = (a: Rect, b: Rect) => a.minX < b.maxX - EPS && a.maxX > b.minX + EPS
  && a.minZ < b.maxZ - EPS && a.maxZ > b.minZ + EPS

/** Checks the measured flight, its opening and the clear space at either end. */
export function validatePhysicalConnection(lower: ResolvedScene, upper: ResolvedScene): Violation[] {
  const issues: Violation[] = []
  const error = (code: Violation['code'], subject: string, message: string) => {
    issues.push({ code, subject, message, severity: 'error' })
  }
  const stair = lower.objects.find(object => object.kind === 'stairs')!
  if (!upper.stairwellBounds || !validPlanRect(upper.stairwellBounds, upper.n)) {
    error('stairwell-size-mismatch', 'stairwell', 'The physical stair opening is invalid')
    return issues
  }
  const well = planRectToWorld(upper.stairwellBounds)
  if (!contains(well, stair.footprint)) {
    error('stairwell-size-mismatch', 'stairwell', 'The opening does not contain the measured stair flight')
  }
  const alongX = stair.facing === 'E' || stair.facing === 'W'
  const forward = stair.facing === 'E' || stair.facing === 'S'
  const flight = stair.footprint
  const head = alongX ? (forward ? flight.maxX : flight.minX) : (forward ? flight.maxZ : flight.minZ)
  const edge = alongX ? (forward ? well.maxX : well.minX) : (forward ? well.maxZ : well.minZ)
  if (Math.abs(head - edge) > EPS) {
    error('stair-slab-blocked', 'stairwell', 'The opening edge must meet the final stair tread')
  }
  const approach = (top: boolean): Rect => {
    const direction = (forward ? 1 : -1) * (top ? 1 : -1)
    const end = top ? head : alongX ? (forward ? flight.minX : flight.maxX) : (forward ? flight.minZ : flight.maxZ)
    const start = Math.min(end, end + direction * 0.6)
    const finish = Math.max(end, end + direction * 0.6)
    return alongX ? { ...flight, minX: start, maxX: finish } : { ...flight, minZ: start, maxZ: finish }
  }
  for (const [scene, top] of [[lower, false], [upper, true]] as const) {
    const area = approach(top)
    const subject = top ? 'upper-landing' : 'lower-landing'
    if (!worldRectCoveredByFloor(scene, area)) error('stair-floor-mismatch', subject, 'The stair approach must have continuous floor')
    const object = scene.objects.find(o => o.kind === 'furniture' && !o.parentId && overlaps(o.footprint, area))
    const wall = scene.walls.find(w => w.kind !== 'foundation' && w.pieces.some(piece => overlaps(area, {
      minX: piece.min[0], maxX: piece.max[0], minZ: piece.min[2], maxZ: piece.max[2],
    })))
    if (object || wall) error('stair-landing-blocked', subject, `${object?.id ?? wall?.id} blocks the stair approach`)
  }
  if (!upper.circulation) {
    error('circulation-missing', 'upper-landing', 'Declare an architectural landing and circulation')
  } else if (!contains(planRectToWorld(upper.circulation.landing), approach(true))) {
    error('stair-landing-blocked', 'upper-landing', 'The declared landing must contain the full-width stair arrival')
  }
  if (issues.length) error('upper-floor-inaccessible', 'upper-storey', 'The stair connection is not physically usable')
  return issues
}

/** Indoor slabs or explicitly framed exterior bays support upper interior floor. */
export function validateUpperSupport(lower: ResolvedScene, upper: ResolvedScene): Violation[] {
  const issues: Violation[] = []
  const error = (code: Violation['code'], subject: string, message: string) => {
    issues.push({ code, severity: 'error', subject, message })
  }
  for (const problem of lower.exteriorSupportProblems ?? []) error('exterior-support-invalid', 'exterior-support', problem)
  for (const problem of upper.exteriorSupportProblems ?? []) error('exterior-support-invalid', 'exterior-support', problem)

  const supportedExteriorCells = new Set<string>()
  for (const bay of lower.exteriorSupportBays ?? []) {
    const [col0, row0, col1, row1] = bay.cells
    let grounded = true
    let upperSlabMatches = true
    let hasUpperFloor = false
    for (let row = row0; row <= row1; row++) for (let col = col0; col <= col1; col++) {
      if (!lower.floorPresent[row]?.[col]) {
        grounded = false
        error('exterior-support-ground-missing', bay.id + ':' + row + ',' + col,
          'Support bay ' + bay.id + ' has no ground at (' + row + ',' + col + ') to anchor its columns')
      } else if (lower.zoneKind[row][col] === 'interior') {
        grounded = false
        error('exterior-support-zone-mismatch', bay.id + ':' + row + ',' + col,
          'Support bay ' + bay.id + ' must stand on exterior or courtyard ground at (' + row + ',' + col + ')')
      }
      if (!upper.floorPresent[row]?.[col]) {
        upperSlabMatches = false
      } else {
        hasUpperFloor = true
        if (upper.zoneKind[row][col] !== 'interior') {
          upperSlabMatches = false
          error('exterior-support-zone-mismatch', bay.id + ':' + row + ',' + col,
            'Support bay ' + bay.id + ' may carry only upper interior floor at (' + row + ',' + col + ')')
        }
      }
    }
    const bayBounds: PlanRect = [col0, row0, col1 + 1, row1 + 1]
    if (upper.stairwellBounds && planRectsOverlap(bayBounds, upper.stairwellBounds)) {
      upperSlabMatches = false
      error('exterior-support-upper-mismatch', bay.id, 'Support bay ' + bay.id + ' intersects the upper stair opening')
    }
    if (!hasUpperFloor || !upperSlabMatches) {
      error('exterior-support-orphan', bay.id, 'Support bay ' + bay.id + ' does not match a complete upper interior slab')
    }
    if (grounded && upperSlabMatches && hasUpperFloor) {
      for (let row = row0; row <= row1; row++) for (let col = col0; col <= col1; col++) {
        supportedExteriorCells.add(row + ',' + col)
      }
    }
  }

  for (let row = 0; row < upper.n; row++) for (let col = 0; col < upper.n; col++) {
    if (!upper.floorPresent[row][col] || upper.zoneKind[row][col] !== 'interior') continue
    const supported = lower.floorPresent[row][col] && lower.zoneKind[row][col] === 'interior'
      && worldRectCoveredByFloor(lower, { minX: col * CELL, maxX: (col + 1) * CELL, minZ: row * CELL, maxZ: (row + 1) * CELL })
    const exteriorSupported = supportedExteriorCells.has(row + ',' + col)
    if (!supported && !exteriorSupported) issues.push({ code: 'upper-floor-unsupported', severity: 'error', subject: row + ',' + col,
      message: 'Upper interior (' + row + ',' + col + ') has no built support below' })
  }
  return issues
}

function planRectsOverlap(a: PlanRect, b: PlanRect): boolean {
  const EPS = 1e-6
  return a[0] < b[2] - EPS && a[2] > b[0] + EPS
    && a[1] < b[3] - EPS && a[3] > b[1] + EPS
}
