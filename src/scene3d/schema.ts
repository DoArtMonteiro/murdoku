// ============================================================================
// SCENE SCHEMA — what an author may say about a case's house.
//
// This is the ARCHITECTURAL topology. It is authored separately from the
// puzzle topology (rooms / cells / clues in src/data/cases) and may cut across
// it freely: a Murdoku row can run living room → hallway → kitchen. The only
// contract between the two is `FurnitureSpec.logic`, which names the logical
// furniture item a visual object stands for, so clue targets stay honest.
//
// Coordinates are CELL UNITS: x runs along columns, z along rows, both from
// the grid's back corner (row 0, col 0). Wall lines normally sit on integer
// coordinates (cell boundaries) but need not — an alcove wall at x = 2.5 is
// legal. What is NOT possible in this schema, by design:
//   - per-object scale (every model renders at Kenney's real size),
//   - pixel offsets / lifts (props are placed ON a named parent surface),
//   - free-floating y (only `on` raises an object, by the parent's real height),
//   - walls without endpoints (every run has two, and the validator checks
//     each ends on another wall, the shell, or a declared free end).
// ============================================================================

import type { KenneyModel } from './catalog.generated'

/** Direction an object's FRONT faces. N = toward the back walls (−z),
 *  S = toward the camera (+z), E = +x (screen right), W = −x. */
export type Facing = 'N' | 'E' | 'S' | 'W'

export type ShellWall = 'north' | 'west' | 'south' | 'east'

/** Semantic height intents for structural partitions. */
export type WallHeight = 'low' | 'cutaway' | 'room-cutaway' | 'half' | 'full'

export interface OpeningSpec {
  /** Absolute coordinate of the opening's centre along the wall's axis, in cell units. */
  at: number
  /** Structural rough-opening width in cell units. Doors default to the measured frame plus installation allowance. */
  width?: number
  /**
   * door  — a Kenney open-door frame stands in the gap (reads as a doorway
   *         even in a cut-down partition).
   * open  — a plain gap: a wide pass-through between two zones.
   */
  kind: 'door' | 'open'
}

export interface WallSpec {
  id: string
  /** Axis-aligned run in cell units. from/to must share x or z. */
  from: [number, number]
  to: [number, number]
  /** Interior partitions are cut down by default ('low'); 'cutaway' keeps the
   *  legacy camera-facing cut, while 'room-cutaway' is tuned for room sides;
   *  'half' is a waist-high pony wall and 'full' is for walls with nothing
   *  playable behind them (the validator checks visibility). */
  height?: WallHeight
  /** An open guard has visible posts and a handrail but remains a walk barrier. */
  treatment?: 'solid' | 'railing'
  openings?: OpeningSpec[]
  /** Declare an endpoint that deliberately stops in open floor (a half wall,
   *  a counter return). Undeclared free ends are a validation error. */
  freeEnds?: Array<'from' | 'to'>
}

export interface ShellFeatureSpec {
  wall: 'north' | 'west'
  /** Centre of the feature along that wall, in cell units. */
  at: number
  kind: 'window' | 'door'
}

export interface AgainstSpec {
  /** 'north' | 'west' for the shell, or a WallSpec id. */
  wall: ShellWall | string
  /** Position of the object's centre along the wall axis, in cell units. */
  at: number
  /** For interior walls: which side of the wall the object stands on. */
  side?: Facing
  /** Extra clearance between the wall face and the object's back, Kenney units. */
  gap?: number
}

export interface OnSpec {
  parent: string
  /** Offset from the parent's footprint centre, in the PARENT's local frame
   *  (x = parent's width axis, z = parent's depth axis), Kenney units. */
  offset?: [number, number]
  /** Named surface on the parent (see catalog `surfaces`); defaults to 'top'. */
  surface?: string
}

export interface FurnitureSpec {
  id: string
  model: KenneyModel
  /** Logical furniture this object stands for: `${type}@${row},${col}`. Several
   *  visuals may share one logic id (a sink + cabinet run for one 'counter'). */
  logic?: string
  /** Front direction. Defaults to S, or away from the wall for `against`, or
   *  the parent's facing for `on`. */
  facing?: Facing
  /** Placement — exactly one of these. */
  at?: [number, number]
  against?: AgainstSpec
  on?: OnSpec
  /** Small extra yaw for loose props (a dropped parcel). Ignored for anything
   *  the catalog marks as furniture — furniture is square to the walls. */
  yaw?: number
}

export type FloorMaterial = 'wood' | 'tile' | 'grass' | 'stone' | 'dirt'

/**
 * interior  — finished floor of the building at y = 0, inside the shell.
 * exterior  — open ground OUTSIDE the building envelope: no shell wall on
 *             its grid edges, terrain TERRAIN_DROP below the floor, a
 *             foundation edge where it meets the building, a threshold at
 *             every opening into it.
 * courtyard — lowered ground INSIDE the shell (a walled garden): keeps the
 *             shell, gets the foundation edge and thresholds.
 */
export type ZoneKind = 'interior' | 'exterior' | 'courtyard'

export interface FloorZoneSpec {
  id: string
  /** Inclusive cell rectangle [col0, row0, col1, row1]. */
  cells: [number, number, number, number]
  material: FloorMaterial
  /** Defaults to 'interior' for wood/tile/stone and 'exterior' for grass/dirt. */
  kind?: ZoneKind
}

/** Inclusive logical-cell rectangle [col0, row0, col1, row1]. */
export type CellRect = [number, number, number, number]

/** Continuous plan rectangle [x0, z0, x1, z1] in cell units; maxima are exclusive. */
export type PlanRect = [number, number, number, number]

export type StoreyFootprintSpec =
  | { kind: 'full' }
  | { kind: 'cell-rects'; rects: CellRect[] }

/** A grounded post-and-beam bay carrying an upper interior slab over exterior ground. */
export interface ExteriorSupportBaySpec {
  id: string
  /** Inclusive lower-storey cells; each side may span at most three cells. */
  cells: CellRect
}

export interface CirculationSpec {
  /** Clear physical step-off area at the stair head. */
  landing: PlanRect
  /** Clear rectangles whose touching edges form the distribution route. */
  halls: Array<{ id: string; bounds: PlanRect }>
  /** Architectural access points; ids do not depend on logical room names. */
  roomAccessTargets: Array<{ id: string; bounds: PlanRect }>
}

export interface StairsSpec {
  model: 'stairs' | 'stairsOpen' | 'stairsOpenSingle' | 'stairsCorner'
  /** Footprint centre of the flight, cell units. */
  at: [number, number]
  /** Direction the flight CLIMBS toward (the top step is on that side). */
  facing: Facing
}

export interface SceneSpec {
  puzzleId: string
  /** Storey this scene draws; defaults to 0. */
  floor?: number
  shell?: { features?: ShellFeatureSpec[] }
  /** Where the circulation check starts: the front door. */
  entry?: { wall: 'north' | 'west'; at: number }
  walls: WallSpec[]
  furniture: FurnitureSpec[]
  /** Optional floor-covering models (rugs) — flat, no collision. */
  rugs?: Array<{ id: string; model: KenneyModel; at: [number, number]; facing?: Facing }>
  /** Floor material per cell rectangle; cells not covered are interior wood. */
  floors?: FloorZoneSpec[]
  /** Physical floor/site area on this storey. On the ground floor this can include
   *  exterior terrain; building support is the footprint intersected with interior zones.
   *  Omission preserves legacy full-board scenes. */
  storeyFootprint?: StoreyFootprintSpec
  /** Ground-storey post-and-beam frames supporting matching upper interior cells over exterior land. */
  exteriorSupportBays?: ExteriorSupportBaySpec[]
  /** Ground-floor only: the staircase to the storey above. */
  stairs?: StairsSpec
  /** Upper floors only: cells with no slab — the stair arrives here.
   *  Inclusive [col0, row0, col1, row1]; must match the ground stair footprint. */
  stairwell?: [number, number, number, number]
  /** V2 stair opening in continuous cell units, with exclusive maximum bounds. */
  stairwellBounds?: PlanRect
  /** Clear upper-storey route from the stair landing to architectural access targets. */
  circulation?: CirculationSpec
}
