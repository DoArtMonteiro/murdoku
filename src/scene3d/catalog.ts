// ============================================================================
// ASSET CATALOGUE — what each Kenney model IS, physically and semantically.
//
// Geometry (sizes, grounding) is generated into catalog.generated.ts from the
// real glTF files. This file adds the part a bounding box cannot tell you:
// how a model is supported, what it can support, and which logical Murdoku
// furniture types it may stand in for.
//
// Surface heights below were MEASURED from the mesh (horizontal vertex planes,
// see scripts/kenney-catalog.mjs and the bookcase shelf study in
// docs/ISOMETRIC_SCENE_SYSTEM.md). A prop placed `on` a surface sits at exactly
// that height — there is no lift knob anywhere in the system.
// ============================================================================

import { MODEL_BOUNDS, type KenneyModel } from './catalog.generated'
import type { FurnitureType } from '../core/types'

/** How a model is held up. */
export type Support =
  | 'floor'    // stands on the floor
  | 'surface'  // must be placed `on` a parent surface (microwave, laptop, lamp)
  | 'flat'     // lies flat on the floor; no collision volume (rugs)
  | 'wall'     // fixed to a wall face (mirror, wall lamp, panelling)

export type SurfaceRole = 'counter' | 'table' | 'desk' | 'shelf' | 'nightstand' | 'stand'

export interface Surface {
  /** Height of the surface above the model's feet, Kenney units. */
  y: number
  role: SurfaceRole
}

export interface ModelMeta {
  support: Support
  /** Surfaces this model offers to children. */
  surfaces?: Record<string, Surface>
  /** Roles a `surface` prop accepts as its parent. */
  requires?: SurfaceRole[]
  /** Loose props may take a small yaw; furniture is always square to the walls. */
  loose?: boolean
  /** Logical Murdoku types this model may represent. */
  represents?: FurnitureType[]
  /** Tall objects hide what is behind them; the validator keeps their backs
   *  against back walls. Defaults to height > 0.7. */
  tall?: boolean
  /** Clearance the resolver keeps between this model's back and a wall it is
   *  placed against — for pieces whose usual child overhangs them (a TV on a
   *  TV cabinet is 0.02 deeper than the cabinet). */
  rearGap?: number
  /** Looks the same from every side (lamps, plants, coat stands): no back to expose. */
  symmetric?: boolean
}

const F = (represents?: FurnitureType[], extra: Partial<ModelMeta> = {}): ModelMeta =>
  ({ support: 'floor', represents, ...extra })
const P = (requires: SurfaceRole[], extra: Partial<ModelMeta> = {}): ModelMeta =>
  ({ support: 'surface', requires, ...extra })

/** Curated semantics for the models the scenes use. Anything absent falls
 *  back to `{ support: 'floor' }` and can represent nothing. */
export const MODEL_META: Partial<Record<KenneyModel, ModelMeta>> = {
  // ---- beds --------------------------------------------------------------
  bedDouble: F(['bed']),
  bedSingle: F(['bed']),
  bedBunk: F(['bed'], { tall: true }),
  pillow: P(['table', 'nightstand'], { loose: true }),
  // ---- seating -----------------------------------------------------------
  chair: F(['chair']),
  chairCushion: F(['chair']),
  chairDesk: F(['chair'], { tall: false }),
  chairModernCushion: F(['chair']),
  chairRounded: F(['chair']),
  stoolBar: F(['chair']),
  loungeChair: F(['chair', 'sofa']),
  loungeChairRelax: F(['chair', 'sofa']),
  loungeSofa: F(['sofa']),
  loungeSofaLong: F(['sofa']),
  loungeSofaCorner: F(['sofa']),
  loungeDesignSofa: F(['sofa']),
  loungeDesignChair: F(['chair', 'sofa']),
  bench: F(['chair']),
  benchCushion: F(['chair']),
  // ---- tables ------------------------------------------------------------
  table: F(['table'], { surfaces: { top: { y: 0.33, role: 'table' } } }),
  tableCloth: F(['table'], { surfaces: { top: { y: 0.33, role: 'table' } } }),
  tableCross: F(['table'], { surfaces: { top: { y: 0.35, role: 'table' } } }),
  tableRound: F(['table'], { surfaces: { top: { y: 0.37, role: 'table' } } }),
  tableCoffee: F(['table'], { surfaces: { top: { y: 0.23, role: 'table' } } }),
  tableCoffeeSquare: F(['table'], { surfaces: { top: { y: 0.23, role: 'table' } } }),
  sideTable: F(['table', 'lamp', 'clock'], { surfaces: { top: { y: 0.38, role: 'nightstand' } } }),
  sideTableDrawers: F(['table', 'lamp'], { surfaces: { top: { y: 0.38, role: 'nightstand' } } }),
  cabinetBed: F(['table', 'lamp'], { surfaces: { top: { y: 0.23, role: 'nightstand' } } }),
  cabinetBedDrawer: F(['table', 'lamp'], { surfaces: { top: { y: 0.26, role: 'nightstand' } } }),
  cabinetBedDrawerTable: F(['table', 'lamp'], { surfaces: { top: { y: 0.26, role: 'nightstand' } } }),
  desk: F(['desk'], { surfaces: { top: { y: 0.38, role: 'desk' } } }),
  deskCorner: F(['desk'], { surfaces: { top: { y: 0.38, role: 'desk' } } }),
  // ---- storage -----------------------------------------------------------
  bookcaseOpen: F(['bookshelf'], {
    tall: true,
    surfaces: {
      shelf1: { y: 0.13, role: 'shelf' }, shelf2: { y: 0.37, role: 'shelf' },
      shelf3: { y: 0.61, role: 'shelf' }, top: { y: 0.88, role: 'shelf' },
    },
  }),
  bookcaseClosed: F(['bookshelf'], { tall: true, surfaces: { top: { y: 0.85, role: 'shelf' } } }),
  bookcaseOpenLow: F(['bookshelf'], { surfaces: { top: { y: 0.4, role: 'shelf' } } }),
  bookcaseClosedWide: F(['bookshelf'], { tall: true, surfaces: { top: { y: 0.79, role: 'shelf' } } }),
  cabinetTelevision: F(['tv', 'table'], { surfaces: { top: { y: 0.31, role: 'stand' } }, rearGap: 0.02 }),
  cabinetTelevisionDoors: F(['tv', 'table'], { surfaces: { top: { y: 0.31, role: 'stand' } }, rearGap: 0.02 }),
  coatRackStanding: F(['lamp'], { symmetric: true }),
  // ---- kitchen -----------------------------------------------------------
  kitchenCabinet: F(['counter'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenCabinetDrawer: F(['counter'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenCabinetCornerInner: F(['counter'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenSink: F(['counter'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenStove: F(['stove'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenStoveElectric: F(['stove'], { surfaces: { top: { y: 0.45, role: 'counter' } } }),
  kitchenFridge: F(['fridge'], { tall: true }),
  kitchenFridgeLarge: F(['fridge'], { tall: true }),
  kitchenFridgeSmall: F(['fridge']),
  kitchenBar: F(['counter'], { surfaces: { top: { y: 0.42, role: 'counter' } } }),
  kitchenMicrowave: P(['counter']),
  kitchenCoffeeMachine: P(['counter']),
  kitchenBlender: P(['counter']),
  toaster: P(['counter']),
  // ---- props on surfaces ---------------------------------------------------
  lampRoundTable: P(['nightstand', 'table', 'desk', 'counter', 'shelf', 'stand'], { represents: ['lamp'] }),
  lampSquareTable: P(['nightstand', 'table', 'desk', 'counter', 'shelf', 'stand'], { represents: ['lamp'] }),
  laptop: P(['desk', 'table']),
  computerScreen: P(['desk']),
  computerKeyboard: P(['desk']),
  computerMouse: P(['desk']),
  books: P(['shelf', 'desk', 'table', 'nightstand'], { loose: true }),
  radio: P(['shelf', 'table', 'nightstand', 'stand', 'counter'], { represents: ['clock'] }),
  speakerSmall: P(['shelf', 'stand', 'table']),
  televisionVintage: P(['stand', 'table'], { represents: ['tv'] }),
  televisionModern: P(['stand', 'table'], { represents: ['tv'] }),
  plantSmall1: P(['shelf', 'table', 'desk', 'nightstand', 'counter', 'stand'], { represents: ['shrub'] }),
  plantSmall2: P(['shelf', 'table', 'desk', 'nightstand', 'counter', 'stand'], { represents: ['shrub'] }),
  plantSmall3: P(['shelf', 'table', 'desk', 'nightstand', 'counter', 'stand'], { represents: ['shrub'] }),
  // ---- floor props -----------------------------------------------------------
  lampRoundFloor: F(['lamp'], { tall: true, symmetric: true }),
  lampSquareFloor: F(['lamp'], { tall: true, symmetric: true }),
  // the kit has no bush: a potted plant stands in for logical shrubs too
  pottedPlant: F(['plant', 'shrub'], { symmetric: true }),
  trashcan: F([], { loose: true }),
  cardboardBoxClosed: F(['box'], { loose: true }),
  cardboardBoxOpen: F(['box'], { loose: true }),
  speaker: F(['clock'], { symmetric: true }),
  coatRack: { support: 'wall' },
  // ---- bathroom ----------------------------------------------------------------
  bathtub: F(['bathtub']),
  shower: F(['shower'], { tall: true }),
  showerRound: F(['shower'], { tall: true }),
  toilet: F(['toilet']),
  toiletSquare: F(['toilet']),
  bathroomSink: F([]),
  bathroomCabinetDrawer: F(['counter'], { surfaces: { top: { y: 0.53, role: 'counter' } } }),
  washer: F([]),
  dryer: F([]),
  // ---- Nature Kit subset (CC0, same author, 1-unit tiles, grounded at y = 0) ----
  tree_oak: F(['plant', 'shrub'], { tall: true, symmetric: true }),
  tree_small: F(['plant', 'shrub'], { tall: true, symmetric: true }),
  tree_default: F(['plant', 'shrub'], { tall: true, symmetric: true }),
  tree_detailed: F(['plant', 'shrub'], { tall: true, symmetric: true }),
  plant_bushDetailed: F(['shrub', 'plant'], { symmetric: true }),
  plant_bush: F(['shrub', 'plant'], { symmetric: true, loose: true }),
  plant_bushLarge: F(['shrub', 'plant'], { symmetric: true, loose: true }),
  plant_bushSmall: F(['shrub', 'plant'], { symmetric: true, loose: true }),
  flower_purpleA: F(['plant'], { symmetric: true, loose: true }),
  flower_redA: F(['plant'], { symmetric: true, loose: true }),
  flower_yellowA: F(['plant'], { symmetric: true, loose: true }),
  rock_smallA: F([], { symmetric: true, loose: true }),
  rock_smallB: F([], { symmetric: true, loose: true }),
  rock_smallFlatA: F([], { symmetric: true, loose: true }),
  stump_round: F([], { symmetric: true, loose: true }),
  log: F(['box'], { loose: true }),
  fence_simple: F([]),
  fence_simpleLow: F([]),
  grass_leafsLarge: { support: 'flat' },
  path_stone: { support: 'flat' },
  path_stoneCircle: { support: 'flat' },
  // ---- floor coverings -----------------------------------------------------------
  rugRectangle: { support: 'flat', represents: ['rug'] },
  rugRound: { support: 'flat', represents: ['rug'] },
  rugRounded: { support: 'flat', represents: ['rug'] },
  rugSquare: { support: 'flat', represents: ['rug'] },
  rugDoormat: { support: 'flat', represents: ['rug'] },
  // ---- wall-mounted ------------------------------------------------------------------
  lampWall: { support: 'wall' },
  bathroomMirror: { support: 'wall' },
  paneling: { support: 'wall' },
  kitchenCabinetUpper: { support: 'wall' },
  hoodLarge: { support: 'wall' },
  // ---- architecture (placed by the resolver, not by authors) ----------------------
  doorway: { support: 'floor' },
  doorwayOpen: { support: 'floor' },
  doorwayFront: { support: 'floor' },
  wallWindow: { support: 'floor' },
  wallDoorway: { support: 'floor' },
  stairs: { support: 'floor', tall: true },
  stairsOpen: { support: 'floor', tall: true },
  stairsCorner: { support: 'floor', tall: true },
}

const DEFAULT_META: ModelMeta = { support: 'floor' }

export function metaOf(model: KenneyModel): ModelMeta {
  const meta = MODEL_META[model] ?? DEFAULT_META
  const size = MODEL_BOUNDS[model].size
  return { ...meta, tall: meta.tall ?? size[1] > 0.7 }
}

export function isKenneyModel(name: string): name is KenneyModel {
  return name in MODEL_BOUNDS
}

/** Default model for a logical furniture type in a scene that has no
 *  authored spec (the procedural fallback). One choice per type, on purpose:
 *  an unauthored case must look consistent, not varied. */
export const DEFAULT_MODEL: Record<FurnitureType, KenneyModel> = {
  chair: 'chair',
  sofa: 'loungeSofa',
  bed: 'bedDouble',
  table: 'table',
  box: 'cardboardBoxClosed',
  rug: 'rugRectangle',
  plant: 'pottedPlant',
  shrub: 'pottedPlant',
  lamp: 'lampRoundFloor',
  counter: 'kitchenCabinet',
  tv: 'cabinetTelevision',
  bathtub: 'bathtub',
  bookshelf: 'bookcaseOpen',
  stove: 'kitchenStove',
  fridge: 'kitchenFridge',
  clock: 'speaker',
  desk: 'desk',
  toilet: 'toilet',
  shower: 'showerRound',
}
