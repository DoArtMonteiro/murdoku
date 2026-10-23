import { DOOR_OPENING, FRAME_PROTRUSION } from './units'
import { MODEL_BOUNDS } from './catalog.generated'
import type { Box3 } from './resolve'

/**
 * Measured extents of doorwayOpen.glb before the loader recentres its pivot.
 * The asset has two rectangular jambs and a head, with no face casing.
 */
export const DOOR_FRAME_WIDTH = 0.485999972
export const DOOR_FRAME_DEPTH = 0.089099996
export const DOOR_FRAME_SECTION = 0.02835
export const DOOR_FRAME_CLEAR_HEIGHT = 0.98118174
export const DOOR_FRAME_TOP = 1.00953174

/** The V3 rough opening leaves 0.02 units outside the measured frame. */
export const DOOR_INSTALL_ALLOWANCE = (MODEL_BOUNDS.doorwayOpen.size[0] + 0.02 - DOOR_FRAME_WIDTH) / 2
/** Half the measured jamb section covers the rough-opening edge. */
export const DOOR_FINISH_OVERLAP = DOOR_FRAME_SECTION / 2
/** Maximum thickness of a face casing slab. Its outer edge projects 0.01 past the wall. */
export const DOOR_FACE_CASING_DEPTH = FRAME_PROTRUSION

export type DoorMemberRole = 'liner' | 'jamb' | 'head' | 'casing'
export type DoorFace = 'negative' | 'positive'

export interface DoorMember {
  role: DoorMemberRole
  box: Box3
  /** Casing members identify the wall face they finish. */
  face?: DoorFace
}

export interface DoorGeometryInput {
  /** Axis along which the opening runs. */
  axis: 'x' | 'z'
  /** Centre along the opening axis, in world units. */
  centre: number
  /** Wall line coordinate on the perpendicular axis, in world units. */
  wallAt: number
  /** Structural rough-opening width, in world units. */
  roughWidth: number
  /** Structural wall thickness, in world units. */
  wallThickness: number
  /** Structural opening head. Kept as metadata for low/cutaway walls. */
  structuralHead?: number
}

export interface DoorGeometry {
  members: DoorMember[]
  bounds: Box3
  /** Structural rough opening, before finish members are applied. */
  roughOpening: { centre: number; width: number; box: Box3 }
  /** Finished walk-through volume between the two jamb inner edges. */
  passage: { width: number; height: number; box: Box3 }
  structuralHead: number
  jambs: {
    outerWidth: number
    clearWidth: number
    outerFrom: number
    innerFrom: number
    innerTo: number
    outerTo: number
  }
}

function axisBox(axis: 'x' | 'z', wallAt: number, from: number, to: number, y0: number, y1: number, depth: number): Box3 {
  const halfDepth = depth / 2
  return axis === 'x'
    ? { min: [from, y0, wallAt - halfDepth], max: [to, y1, wallAt + halfDepth] }
    : { min: [wallAt - halfDepth, y0, from], max: [wallAt + halfDepth, y1, to] }
}

function faceBox(
  axis: 'x' | 'z',
  wallAt: number,
  from: number,
  to: number,
  y0: number,
  y1: number,
  wallThickness: number,
  face: DoorFace,
): Box3 {
  // Casing sits directly on the wall face and projects 0.01 outward. The
  // measured jamb may overlap that face finish by 0.00455; this is the hidden
  // construction overlap that keeps the trim from floating off the wall.
  const wallFace = wallAt + (face === 'negative' ? -wallThickness / 2 : wallThickness / 2)
  const inner = wallFace
  const outer = wallAt + (face === 'negative' ? -(wallThickness / 2 + DOOR_FACE_CASING_DEPTH) : wallThickness / 2 + DOOR_FACE_CASING_DEPTH)
  const depthFrom = Math.min(inner, outer)
  const depthTo = Math.max(inner, outer)
  return axis === 'x'
    ? { min: [from, y0, depthFrom], max: [to, y1, depthTo] }
    : { min: [depthFrom, y0, from], max: [depthTo, y1, to] }
}

function unionBoxes(boxes: readonly Box3[]): Box3 {
  if (boxes.length === 0) throw new Error('door geometry requires at least one member')
  return {
    min: [
      Math.min(...boxes.map(box => box.min[0])),
      Math.min(...boxes.map(box => box.min[1])),
      Math.min(...boxes.map(box => box.min[2])),
    ],
    max: [
      Math.max(...boxes.map(box => box.max[0])),
      Math.max(...boxes.map(box => box.max[1])),
      Math.max(...boxes.map(box => box.max[2])),
    ],
  }
}

/**
 * Resolve a door as measured members around the authored rough opening.
 *
 * Jambs retain the GLB's section, height and depth. Liners occupy the small
 * installation allowance inside the rough opening. Face casing then covers
 * that junction, overlaps the wall edge by half a jamb section, and projects
 * beyond both wall faces. There is no bottom casing member across the passage.
 */
export function resolveDoorGeometry(input: DoorGeometryInput): DoorGeometry {
  if (input.roughWidth <= 2 * (DOOR_INSTALL_ALLOWANCE + DOOR_FRAME_SECTION)) {
    throw new Error(`door rough opening ${input.roughWidth} is too narrow for measured jambs`)
  }
  if (input.wallThickness <= 0) throw new Error('door wall thickness must be positive')

  const roughFrom = input.centre - input.roughWidth / 2
  const roughTo = input.centre + input.roughWidth / 2
  const outerFrom = roughFrom + DOOR_INSTALL_ALLOWANCE
  const outerTo = roughTo - DOOR_INSTALL_ALLOWANCE
  const innerFrom = outerFrom + DOOR_FRAME_SECTION
  const innerTo = outerTo - DOOR_FRAME_SECTION
  const structuralHead = input.structuralHead ?? DOOR_OPENING.head
  // The interior frame remains a full-height doorway in a cutaway wall. The
  // casing also covers the measured 1.03 structural head with overlap.
  const casingTop = Math.max(DOOR_OPENING.head, structuralHead, DOOR_FRAME_TOP) + DOOR_FINISH_OVERLAP
  const casingBottom = DOOR_FRAME_CLEAR_HEIGHT + DOOR_FINISH_OVERLAP
  const casingFrom = roughFrom - DOOR_FINISH_OVERLAP
  const casingTo = roughTo + DOOR_FINISH_OVERLAP
  const casingInnerFrom = outerFrom + DOOR_FINISH_OVERLAP
  const casingInnerTo = innerTo + DOOR_FINISH_OVERLAP
  const members: DoorMember[] = []
  const member = (role: DoorMemberRole, from: number, to: number, y0: number, y1: number, depth: number) => {
    members.push({ role, box: axisBox(input.axis, input.wallAt, from, to, y0, y1, depth) })
  }

  // Side returns close the installation allowance inside the structural reveal.
  member('liner', roughFrom, outerFrom, 0, DOOR_FRAME_TOP, input.wallThickness)
  member('liner', outerTo, roughTo, 0, DOOR_FRAME_TOP, input.wallThickness)
  if (structuralHead > DOOR_FRAME_TOP) {
    member('liner', roughFrom, roughTo, DOOR_FRAME_TOP, structuralHead, input.wallThickness)
  }

  // The measured frame itself, adapted to the declared rough-opening width.
  member('jamb', outerFrom, innerFrom, 0, DOOR_FRAME_CLEAR_HEIGHT, DOOR_FRAME_DEPTH)
  member('jamb', innerTo, outerTo, 0, DOOR_FRAME_CLEAR_HEIGHT, DOOR_FRAME_DEPTH)
  member('head', outerFrom, outerTo, DOOR_FRAME_CLEAR_HEIGHT, DOOR_FRAME_TOP, DOOR_FRAME_DEPTH)

  // Face casing is deliberately independent of the liner/jamb depth. Three
  // Thin slabs on each face finish the seam. Their inner edge leaves half a
  // measured section of jamb exposed as a reveal; the depth overlap is hidden
  // inside the wood finish, while casing pieces remain disjoint from each other.
  for (const face of ['negative', 'positive'] as const) {
    members.push({ role: 'casing', face, box: faceBox(input.axis, input.wallAt, casingFrom, casingInnerFrom, 0, casingBottom, input.wallThickness, face) })
    members.push({ role: 'casing', face, box: faceBox(input.axis, input.wallAt, casingInnerTo, casingTo, 0, casingBottom, input.wallThickness, face) })
    members.push({ role: 'casing', face, box: faceBox(input.axis, input.wallAt, casingFrom, casingTo, casingBottom, casingTop, input.wallThickness, face) })
  }

  const roughOpening = {
    centre: input.centre,
    width: input.roughWidth,
    box: axisBox(input.axis, input.wallAt, roughFrom, roughTo, 0, structuralHead, input.wallThickness),
  }
  const passage = {
    width: innerTo - innerFrom,
    height: DOOR_FRAME_CLEAR_HEIGHT,
    box: axisBox(input.axis, input.wallAt, innerFrom, innerTo, 0, DOOR_FRAME_CLEAR_HEIGHT, input.wallThickness),
  }
  return {
    members,
    bounds: unionBoxes(members.map(item => item.box)),
    roughOpening,
    passage,
    structuralHead,
    jambs: { outerWidth: outerTo - outerFrom, clearWidth: innerTo - innerFrom, outerFrom, innerFrom, innerTo, outerTo },
  }
}
