// Style system types. A StyleKit is everything that makes one architectural
// style look different from another: floor materials per room role, wall
// treatment, furniture silhouettes (via `id` switches in furniture.tsx),
// decor kit, exterior kit and palette. Pure data, no React.

export type StyleId = 'victorian' | 'artdeco' | 'tudor' | 'modernist' | 'mediterranean'

export type Role =
  | 'hall' | 'living' | 'dining' | 'kitchen' | 'bath' | 'bed' | 'study'
  | 'pantry' | 'conservatory' | 'landing' | 'yard' | 'garden' | 'porch' | 'other'

export type MatId =
  | 'chequer' | 'planks' | 'herring' | 'quarry' | 'flags' | 'mosaic' | 'terrazzo'
  | 'marble' | 'carpet' | 'slabs' | 'azulejo' | 'hydraulic' | 'brick' | 'plaster'
  | 'lawn' | 'deck' | 'gravel' | 'cobble'

export interface FloorSpec {
  mat: MatId
  /** Base colour; a/b/c meaning depends on the material (see materials.tsx). */
  a: string
  b?: string
  c?: string
  /** Optional inlaid border band hugging the room's walls. */
  band?: { color: string; line?: string; w: number }
  /** Decorative floor inlay drawn between cells (never in a centre zone). */
  inlay?: 'diamonds' | 'sunburst' | 'none'
}

/** Furniture colours. Every piece is drawn from these so a style stays coherent. */
export interface Pal {
  wood: string        // main case wood
  woodHi: string      // lighter wood (tops, inlays)
  fabric: string      // main upholstery / bedding
  fabric2: string     // second upholstery colour
  accent: string      // cushions, trims
  metal: string       // brass / chrome / copper trim
  leaf: string        // foliage
  leaf2: string
  stone: string       // marble / stone tops
  enamel: string      // appliance enamel (stove / fridge / tub)
  glass: string       // lamp shade / glass
}

export interface WallKit {
  ext: string
  int: string
  trim: string
  /** Texture drawn over the exterior wall poche. */
  extTex: 'brick' | 'stone' | 'timber' | 'plaster' | 'glass' | 'whitewash' | 'lacquer'
  /** Texture over interior walls. */
  intTex: 'dado' | 'plaster' | 'lacquer' | 'thin' | 'whitewash'
  /** Brass / gold used for the trim hairline on lacquer walls. */
  line?: string
}

export type TreeKind = 'oak' | 'yew' | 'palm' | 'cypress' | 'birch' | 'apple' | 'olive'

export interface GardenKit {
  lawn: string
  lawnDark: string
  hedge: string
  hedgeHi: string
  path: string
  bed: string
  flowers: string[]
  trees: TreeKind[]
  /** Perimeter treatment of the lot. */
  edge: 'iron-fence' | 'hedge' | 'low-wall' | 'picket' | 'stone-wall'
  /** Signature exterior features. */
  features: ('lamp-post' | 'urn' | 'glasshouse' | 'fountain' | 'pool' | 'well' | 'topiary' | 'loungers' | 'bay' | 'vines' | 'pots')[]
  steps: string
}

export interface StyleKit {
  id: StyleId
  /** Portuguese caption, as in the owner's reference. */
  label: string
  labelEn: string
  floors: Record<Role, FloorSpec>
  pal: Pal
  wall: WallKit
  /** Ambient night-fill strength (bible 2: 0.18, raised for pale floors). */
  nightFill: number
  garden: GardenKit
  /** Curtain colour at windows. */
  curtain: string
  /** Window glass tint. */
  glass: string
  /** Leaded diamond lattice in windows (Tudor). */
  lattice?: boolean
  /** Decor kit enabled for this style. */
  decor: {
    fireplace: boolean
    sconce: 'gas' | 'fan' | 'candle' | 'none' | 'niche'
    painting: boolean
    curtains: boolean
    rails: boolean
    mirror: boolean
    shelf: boolean
  }
  /** Serif / sans stack for the room plaques. */
  font: string
}
