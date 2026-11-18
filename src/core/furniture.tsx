import React from 'react'
import type { FurnitureType } from './types'
import { frameOffset } from './furnitureGeometry'

/**
 * Uniform fill factor for each furniture type.
 *
 * RULE (2026): This value is a UNIFORM FILL FACTOR, not a size signifier.
 * Every piece nearly fills its footprint cell (~0.92). Real-world size
 * differences are communicated by HOW MANY SQUARES a piece occupies
 * (FURNITURE_FOOTPRINT) and by rooms being made of more squares — NOT by
 * shrinking the glyph inside a fixed square.
 *
 * A lamp is small because it is 1×1; a bed is large because it is 2×2.
 * At any scale value below 0.90 the icon reads as a toy on the board.
 *
 * REJECTED MODEL — do not reintroduce:
 * The previous code used scale as a "real-world size" signal: lamp 0.33,
 * plant 0.50, tv 0.60, sofa 0.95. The user explicitly rejected this:
 * "objects should be centered in the square and should occupy almost all of
 * the square; the perspective part is that the rooms should have more squares,
 * not the squares stay the same but objects are smaller."
 * Small variations (±0.03) are allowed only when a specific silhouette needs
 * a breath of padding (e.g. the rug's woven border reads better at 0.94 than
 * flush at 0.97). They must never encode real-world size.
 */
/**
 * How far a piece rises ABOVE its footprint, as a fraction of one cell height.
 *
 * This is the board's main depth cue, and it is deliberately separate from FILL.
 * Fill says how much FLOOR a piece covers; overhang says how TALL it stands. A
 * rug covers a lot of floor and rises not at all; a bookshelf covers one square
 * and towers over it. Without this every piece is clipped to its own square and
 * the board reads as a spreadsheet however well each icon is drawn — the
 * reference the user gave has a tree breaking out of its square and past the
 * board frame, and that overflow IS the three-dimensionality.
 *
 * Overhang goes UPWARD ONLY. A piece must keep standing on its own footprint;
 * growing sideways or downward would cover the floor it occupies and, worse,
 * would obscure the cell in FRONT of it — the cell nearest the player and the
 * one they are most likely to be reading.
 *
 * Values are ordered by real-world height, which is the one place real-world
 * scale legitimately belongs (FURNITURE_SCALE explains why it does not belong
 * in fill). Past roughly 0.45 a piece starts colliding with the row behind it.
 */
// MEASURED CEILING — do not raise these without re-rendering the board.
//
// The lift is applied as a UNIFORM scale from the piece's bottom edge
// (MapGrid's furniture overlay), because the artwork has a fixed aspect and a
// non-uniform stretch would visibly distort it. A uniform scale grows the
// piece SIDEWAYS as well as upward, by half the lift on each side — which is
// the one thing the paragraph above says must never happen.
//
// The old values ignored that. A plant at 0.40 scaled 1.43x and bled ~0.21
// cells into each neighbour; a 2x1 bookshelf at 0.44 rendered ~2.8 x 1.4
// cells and read as a four-square object, crossing room walls on the live
// board. Capping the lift at 0.20 holds the worst sideways bleed to ~0.10 of
// a cell — enough to read as height, small enough that it never reaches the
// neighbouring piece. MapGrid additionally zeroes the lift when the cell
// above belongs to a DIFFERENT room, so depth never crosses a wall.
export const FURNITURE_OVERHANG: Record<FurnitureType, number> = {
  // Floor level — nothing stands above the footprint.
  rug:       0.00,
  // Low pieces: a shallow lift separates them from the floor material.
  toilet:    0.06,
  box:       0.06,
  bathtub:   0.07,
  bed:       0.07,
  chair:     0.08,
  sofa:      0.08,
  table:     0.08,
  desk:      0.09,
  counter:   0.10,
  tv:        0.11,
  stove:     0.11,
  // Waist to shoulder.
  shrub:     0.13,
  lamp:      0.15,
  // Tall: these should visibly occlude the cell behind them.
  fridge:    0.18,
  shower:    0.18,
  clock:     0.19,
  plant:     0.19,
  bookshelf: 0.20,
}

export const FURNITURE_SCALE: Record<FurnitureType, number> = {
  rug:       0.94, // flat woven border benefits from slight inset
  bed:       0.92,
  sofa:      0.92,
  bathtub:   0.92,
  table:     0.92,
  counter:   0.92,
  bookshelf: 0.92,
  fridge:    0.92,
  desk:      0.92,
  shower:    0.92,
  stove:     0.92,
  chair:     0.92,
  toilet:    0.92,
  tv:        0.92,
  box:       0.92,
  clock:     0.92,
  plant:     0.92,
  shrub:     0.92,
  lamp:      0.92,
}

/**
 * Noire Illustration board miniatures.
 *
 * Drawing rules — oblique ("cabinet") projection, unified 2026 revision:
 *
 *  1. Nameable silhouette first. Every piece reads as a three-quarter object
 *     with visible VOLUME: a top slab and a front face below it.
 *  2. Confident contours. One deep-espresso outer line (`#1a1a1a`, ~3.2px in a
 *     100x100 viewBox) carries the shape; interior construction lines are thin
 *     and quiet so they never fight the silhouette at 40px cells.
 *  3. Flat noire colour with cabinet projection depth. The top plane carries the
 *     main fill; the front face is 10 units deep in the _D palette variant —
 *     12-18% darker, giving every object visible thickness without perspective
 *     convergence. Vertical edges are strictly vertical.
 *  4. Cast shadow. Each token drops a small directional shadow so it sits on the
 *     floor like a physical cardboard piece on a dark dossier.
 */
export interface FurnitureIconProps { size?: number }
export type FurnitureIcon = (props: FurnitureIconProps) => React.ReactElement

const S = (size?: number) => size
  ? { width: size, height: size }
  : { width: '100%', height: '100%' }

/** Deep espresso, never pure black: keeps the board warm under the amber key light. */
const INK = '#1a1a1a'

// Noire palette — the whole board is painted from this shelf and nothing else.
const WOOD_L = '#8A5A32'
const WOOD = '#6B4325'
const WOOD_D = '#3E2614'
const BONE = '#EFE3C2'
const BONE_D = '#CDBB92'
const LINEN = '#E0D0A6'
const BRASS = '#C9922E'
const BRASS_L = '#E7C070'
const BRASS_D = '#8A6220'
const OLIVE = '#63744A'
const OLIVE_L = '#87975F'
const OLIVE_D = '#3F4C2E'
const BLOOD = '#8C2D24'
const BLOOD_D = '#5E1E19'
const SLATE = '#6E7368'
const SLATE_L = '#8F9488'
const SLATE_D = '#474C43'
const PORC = '#CFCCB8'
const PORC_D = '#A5A492'
const CHAR = '#2E2E29'
const CHAR_L = '#45453D'
const GLASS = '#46564F'
const CLAY = '#A4573A'
const CLAY_D = '#743823'
const LEATHER = '#B08A55'
const LEATHER_L = '#CDA96D'

/** The one confident outer line every silhouette is built on. */
const OUT = {
  'data-furniture-contour': 'true',
  stroke: INK,
  strokeWidth: 3.2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** Secondary contour for parts that sit inside the silhouette. */
const OUT_IN = {
  stroke: INK,
  strokeWidth: 2.2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** Construction lines: seams, planks, grain. Quiet on purpose. */
const SEAM = {
  fill: 'none',
  stroke: INK,
  strokeOpacity: 0.5,
  strokeWidth: 1.6,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** Single warm catch-light, as if from the board's amber key. */
const SHEEN = {
  fill: 'none',
  stroke: '#D8B777', // DESIGN.md: miniature-highlight
  strokeOpacity: 0.3,
  strokeWidth: 1.8,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

const FOOT = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const }

/**
 * One near-flat body tone per piece plus the cast shadow. Two close stops, not a
 * showy ramp: enough to read as a moulded object, never enough to muddy the
 * flat-illustration language.
 *
 * Scale is read from FURNITURE_SCALE: artwork is centered at a uniform high fill
 * (~0.92) so each piece nearly fills its footprint. Real-world size is carried
 * by FURNITURE_FOOTPRINT (cells occupied), not by glyph scale. The drop shadow
 * sits outside the scale transform so it reads at consistent strength.
 *
 * `vb` controls the SVG viewBox. Default "0 0 100 100" for 1×1 and 2×2 pieces;
 * 2×1 pieces pass "0 0 200 100" so their canvas aspect matches the footprint and
 * preserveAspectRatio="xMidYMid meet" has nothing left to letterbox.
 *
 * Centring maths: the scale transform must centre on the viewBox, not assume a
 * 100×100 canvas. offsetX = (vbW/2)*(1−k), offsetY = (vbH/2)*(1−k). For the
 * default 100×100 this reduces to 50*(1−k) — identical to the old formula.
 */

function Frame({ prefix, size, tone, vb = '0 0 100 100', children }: {
  prefix: string
  size?: number
  tone: [string, string]
  /** SVG viewBox string. Default "0 0 100 100". Pass "0 0 200 100" for 2×1 pieces. */
  vb?: string
  children: React.ReactNode
}) {
  const k = FURNITURE_SCALE[prefix as FurnitureType] ?? 1
  const { x: ox, y: oy } = frameOffset(vb, k)
  return (
    <svg
      {...S(size)}
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-furniture-icon={prefix}
    >
      <defs>
        <linearGradient id={`${prefix}-tone`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={tone[0]} />
          <stop offset="1" stopColor={tone[1]} />
        </linearGradient>
        <filter id={`${prefix}-shadow`} x="-25%" y="-25%" width="155%" height="155%">
          <feDropShadow dx="1.6" dy="2.6" stdDeviation="1.5" floodColor="#120E0A" floodOpacity="0.55" />
        </filter>
      </defs>
      <g filter={`url(#${prefix}-shadow)`}>
        <g transform={`translate(${ox} ${oy}) scale(${k})`}>
          {children}
        </g>
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ seating */

/* CHAIR — low object, top-plane silhouette + 10-unit front-face extrusion below bottom edge */
const ArmchairIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="chair" size={size} tone={[LEATHER_L, LEATHER]}>
    {/* front face extrusion: the forward edge of the seat base */}
    <rect x="13" y="87" width="74" height="10" rx="3" fill={LEATHER} {...OUT} />
    {/* arm front edges */}
    <rect x="13" y="87" width="11" height="10" rx="2" fill={WOOD_D} {...OUT_IN} />
    <rect x="76" y="87" width="11" height="10" rx="2" fill={WOOD_D} {...OUT_IN} />
    {/* backrest and both arms carved as one horseshoe, seen from above-front */}
    <path d="M13 87V38c0-14 10-25 25-25h24c15 0 25 11 25 25v49H73V48H27v39Z" fill="url(#chair-tone)" {...OUT} />
    {/* back pillow */}
    <rect x="27" y="20" width="46" height="25" rx="9" fill={LEATHER_L} {...OUT_IN} />
    {/* seat cushion */}
    <rect x="26" y="48" width="48" height="37" rx="8" fill={LEATHER_L} {...OUT_IN} />
    {/* arm caps */}
    <rect x="15" y="42" width="11" height="43" rx="5" fill={LEATHER} {...OUT_IN} />
    <rect x="74" y="42" width="11" height="43" rx="5" fill={LEATHER} {...OUT_IN} />
    <path d="M50 52v30M32 68h36" {...SEAM} />
    <path d="M33 26h34" {...SHEEN} />
    <path d="M19 87v10M81 87v10" {...FOOT} />
  </Frame>
)

/* SOFA (side) — tall 1×2: the same three-seater turned to face EAST.
   Drawn, not rotated. A cabinet-projection piece carries its depth axis and its
   light direction in the artwork itself, so spinning the horizontal drawing 90deg
   turns those too and the result stops describing a real object — the sofa reads
   as an anonymous padded block. Here the back runs down the LEFT edge, the arms
   cap the north and south ends, and the front face still faces the viewer at the
   bottom, exactly as it does in every other piece on the board. */
const SofaSideIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="sofa" size={size} tone={[LEATHER_L, LEATHER]} vb="0 0 100 200">
    {/* front face extrusion along the near (south) end */}
    <rect x="8" y="186" width="84" height="10" rx="3" fill={LEATHER} {...OUT} />
    <path d="M16 186v10M84 186v10" {...FOOT} />
    {/* main body: back slab down the west edge, seat opening east */}
    <rect x="8" y="14" width="84" height="172" rx="20" fill="url(#sofa-tone)" {...OUT} />
    {/* back slab (west edge) */}
    <rect x="9" y="20" width="26" height="160" rx="8" fill={LEATHER} {...OUT_IN} />
    {/* three back pillows down the back */}
    <rect x="13" y="30" width="20" height="44" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="13" y="78" width="20" height="44" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="13" y="126" width="20" height="44" rx="6" fill={LEATHER_L} {...OUT_IN} />
    {/* three seat cushions, length running north-south */}
    <rect x="37" y="29" width="46" height="46" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="37" y="77" width="46" height="46" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="37" y="125" width="46" height="46" rx="6" fill={LEATHER_L} {...OUT_IN} />
    {/* arm caps at the north and south ends */}
    <rect x="37" y="10" width="46" height="14" rx="5" fill={LEATHER} {...OUT_IN} />
    <rect x="37" y="176" width="46" height="14" rx="5" fill={LEATHER} {...OUT_IN} />
    <path d="M46 40h28M46 88h28M46 136h28" {...SEAM} />
    <path d="M18 40h10M18 88h10M18 136h10" {...SHEEN} />
  </Frame>
)

/* SOFA — wide 2×1: three-seater with three seat cushions and three back pillows */
const SofaIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="sofa" size={size} tone={[LEATHER_L, LEATHER]} vb="0 0 200 100">
    {/* front face extrusion: the forward edge of the seat base */}
    <rect x="5" y="86" width="190" height="10" rx="3" fill={LEATHER} {...OUT} />
    {/* arm front-face edges */}
    <rect x="5" y="86" width="14" height="10" rx="2" fill={WOOD_D} {...OUT_IN} />
    <rect x="181" y="86" width="14" height="10" rx="2" fill={WOOD_D} {...OUT_IN} />
    {/* foot pegs */}
    <path d="M16 86v10M184 86v10" {...FOOT} />
    {/* main body: horseshoe seen from above-front, 190 units wide */}
    <path d="M5 86V36c0-13 9-22 22-22h146c13 0 22 9 22 22v50h-15V46H20v40Z" fill="url(#sofa-tone)" {...OUT} />
    {/* three back pillows */}
    <rect x="22" y="19" width="48" height="24" rx="7" fill={LEATHER_L} {...OUT_IN} />
    <rect x="76" y="19" width="48" height="24" rx="7" fill={LEATHER_L} {...OUT_IN} />
    <rect x="130" y="19" width="48" height="24" rx="7" fill={LEATHER_L} {...OUT_IN} />
    {/* three seat cushions */}
    <rect x="21" y="47" width="51" height="37" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="75" y="47" width="50" height="37" rx="6" fill={LEATHER_L} {...OUT_IN} />
    <rect x="128" y="47" width="51" height="37" rx="6" fill={LEATHER_L} {...OUT_IN} />
    {/* arm caps */}
    <rect x="6" y="40" width="14" height="44" rx="5" fill={LEATHER} {...OUT_IN} />
    <rect x="180" y="40" width="14" height="44" rx="5" fill={LEATHER} {...OUT_IN} />
    <path d="M28 65h36M82 65h36M136 65h36" {...SEAM} />
    <path d="M28 25h36M82 25h36M136 25h36" {...SHEEN} />
  </Frame>
)

/* -------------------------------------------------------------- bedroom set */

/* BED — low object, top-plane detail + front-face extrusion at bottom */
const BedIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="bed" size={size} tone={[WOOD_L, WOOD_D]}>
    {/* front face extrusion: the forward rail of the bed frame */}
    <rect x="9" y="87" width="82" height="9" rx="3" fill={WOOD_D} {...OUT} />
    {/* frame with a headboard at the top */}
    <rect x="9" y="5" width="82" height="82" rx="6" fill="url(#bed-tone)" {...OUT} />
    <rect x="13" y="8" width="74" height="16" rx="4" fill={WOOD_L} {...OUT_IN} />
    <path d="M20 12h60" {...SHEEN} />
    {/* mattress */}
    <rect x="14" y="26" width="72" height="58" rx="4" fill={BONE_D} {...OUT_IN} />
    {/* pillow */}
    <rect x="20" y="30" width="60" height="19" rx="7" fill={BONE} {...OUT_IN} />
    <path d="M50 32v15" {...SEAM} />
    {/* blanket with its sheet turned down */}
    <path d="M14 53h72v27a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" fill={BLOOD_D} {...OUT_IN} />
    <rect x="14" y="53" width="72" height="10" rx="2" fill={LINEN} {...OUT_IN} />
    <path d="M22 68v12M50 66v14M78 68v12" {...SEAM} />
    <path d="M20 58h58" {...SHEEN} />
  </Frame>
)

/* TABLE — wide 2×1: dining table with legs near ends, four place settings */
const TableIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="table" size={size} tone={[WOOD_L, WOOD]} vb="0 0 200 100">
    {/* front face: forward apron across full width */}
    <rect x="7" y="77" width="186" height="10" rx="3" fill={WOOD_D} {...OUT} />
    {/* four legs: two back legs visible through the top, two front legs below apron */}
    <rect x="12" y="12" width="14" height="75" rx="3" fill={WOOD_D} {...OUT_IN} />
    <rect x="174" y="12" width="14" height="75" rx="3" fill={WOOD_D} {...OUT_IN} />
    {/* front legs exposed below apron */}
    <rect x="12" y="77" width="14" height="9" rx="2" fill={WOOD_D} {...OUT_IN} />
    <rect x="174" y="77" width="14" height="9" rx="2" fill={WOOD_D} {...OUT_IN} />
    {/* tabletop spans full width */}
    <rect x="7" y="17" width="186" height="60" rx="9" fill="url(#table-tone)" {...OUT} />
    {/* inner surface lighter wood */}
    <rect x="18" y="25" width="164" height="44" rx="5" fill={WOOD_L} {...OUT_IN} />
    {/* plank grain lines across the full length */}
    <path d="M26 34h148M26 47h148M26 60h148" {...SEAM} />
    {/* four place settings: two left, two right */}
    {/* top-left: plate */}
    <ellipse cx="52" cy="41" rx="10" ry="8" fill={PORC} {...OUT_IN} />
    <ellipse cx="52" cy="41" rx="5" ry="4" fill={PORC_D} />
    {/* top-left: glass */}
    <circle cx="70" cy="36" r="5" fill={BRASS_L} {...OUT_IN} />
    {/* top-left: napkin */}
    <path d="M30 56h14l-2 6H32Z" fill={LINEN} {...OUT_IN} />
    {/* top-right: plate */}
    <ellipse cx="148" cy="41" rx="10" ry="8" fill={PORC} {...OUT_IN} />
    <ellipse cx="148" cy="41" rx="5" ry="4" fill={PORC_D} />
    {/* top-right: glass */}
    <circle cx="130" cy="36" r="5" fill={BRASS_L} {...OUT_IN} />
    {/* top-right: napkin */}
    <path d="M156 56h14l-2 6H158Z" fill={LINEN} {...OUT_IN} />
    {/* candle centrepiece */}
    <rect x="96" y="33" width="8" height="20" rx="2" fill={LINEN} {...OUT_IN} />
    <ellipse cx="100" cy="33" rx="4" ry="2" fill={LINEN} {...OUT_IN} />
    <circle cx="100" cy="31" r="2" fill={BRASS_L} {...OUT_IN} />
  </Frame>
)

/* BOX — low object, crate with lid + 10-unit front-face extrusion */
const BoxIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="box" size={size} tone={[WOOD_L, WOOD]}>
    {/* front face extrusion: forward face of crate body */}
    <rect x="12" y="82" width="76" height="10" rx="3" fill={WOOD_D} {...OUT} />
    {/* nailed crate body */}
    <rect x="12" y="18" width="76" height="64" rx="4" fill="url(#box-tone)" {...OUT} />
    {/* lid slightly proud */}
    <rect x="8" y="8" width="84" height="14" rx="4" fill={WOOD_D} {...OUT} />
    <rect x="17" y="28" width="66" height="14" rx="2" fill={WOOD_L} {...OUT_IN} />
    <rect x="17" y="48" width="66" height="14" rx="2" fill={WOOD_L} {...OUT_IN} />
    <rect x="17" y="68" width="66" height="10" rx="2" fill={WOOD_L} {...OUT_IN} />
    <path d="M18 28 82 82M82 28 18 82" {...SEAM} />
    <circle cx="20" cy="14" r="2.4" fill={BRASS} />
    <circle cx="80" cy="14" r="2.4" fill={BRASS} />
    <path d="M16 13h68" {...SHEEN} />
  </Frame>
)

/* RUG — flat exception: purely top-down, no extrusion */
const RugIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="rug" size={size} tone={[BLOOD, BLOOD_D]}>
    <rect x="8" y="12" width="84" height="76" rx="3" fill="url(#rug-tone)" {...OUT} />
    <rect x="15" y="19" width="70" height="62" rx="2" fill={WOOD_D} {...OUT_IN} />
    <rect x="22" y="26" width="56" height="48" rx="2" fill={BLOOD_D} stroke={BRASS_D} strokeWidth="1.6" />
    {/* woven medallion */}
    <path d="M50 30 74 50 50 70 26 50Z" fill={BRASS_D} {...OUT_IN} />
    <path d="M50 38 64 50 50 62 36 50Z" fill={LINEN} {...OUT_IN} />
    <path d="M28 32h8M64 32h8M28 68h8M64 68h8" stroke={BRASS} strokeWidth="2" strokeLinecap="round" />
    {/* knotted fringe, top and bottom */}
    <path d="M13 12V6M23 12V6M33 12V6M43 12V6M53 12V6M63 12V6M73 12V6M83 12V6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M13 88v6M23 88v6M33 88v6M43 88v6M53 88v6M63 88v6M73 88v6M83 88v6" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
  </Frame>
)

/* ----------------------------------------------------------------- greenery */

/* PLANT — organic; pot has visible front face + elliptical top opening */
const PlantIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="plant" size={size} tone={[CLAY, CLAY_D]}>
    <ellipse cx="50" cy="92" rx="26" ry="4" fill="#12140F" opacity="0.45" />
    {/* eight drawn leaves, each with its own midrib */}
    <path d="M48 58C34 50 24 36 22 20c16 4 27 18 30 36Z" fill={OLIVE} {...OUT} />
    <path d="M52 56c-2-19 3-34 14-44 5 17 1 33-10 46Z" fill={OLIVE_L} {...OUT} />
    <path d="M55 58c8-16 21-26 37-29-4 17-17 29-34 34Z" fill={OLIVE} {...OUT} />
    <path d="M45 62C31 60 18 62 8 68c13 9 27 8 39-1Z" fill={OLIVE_D} {...OUT} />
    <path d="M56 63c14-4 27-3 37 3-12 10-26 10-38 2Z" fill={OLIVE_D} {...OUT} />
    <path d="M46 55C40 43 30 34 17 30c3 14 13 24 28 30Z" fill={OLIVE_L} {...OUT} />
    <path d="M54 54c6-13 15-22 27-25-2 14-11 24-25 30Z" fill={OLIVE} {...OUT} />
    <path d="M50 60c-1-14-6-25-14-33 10 6 16 19 17 33Z" fill={OLIVE_D} {...OUT} />
    <path d="M27 26 46 57M64 20 52 55M85 32 57 56M14 68l30-4M88 68l-31-3" {...SEAM} />
    {/* terracotta pot: front face (darker) then top body */}
    <path d="M31 78h38l-4 14H35Z" fill={CLAY_D} {...OUT} />
    <path d="M31 68h38l-6 14H37Z" fill="url(#plant-tone)" {...OUT} />
    {/* elliptical top opening so it reads as a container from above-front */}
    <ellipse cx="50" cy="68" rx="19" ry="5" fill={CLAY} {...OUT} />
    <path d="M33 67h34" {...SHEEN} />
    <path d="M42 76l2 10M58 76l-2 10" {...SEAM} />
  </Frame>
)

/* SHRUB — organic; base has visible front face */
const ShrubIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="shrub" size={size} tone={[OLIVE, OLIVE_D]}>
    <ellipse cx="50" cy="90" rx="30" ry="5" fill="#12140F" opacity="0.45" />
    {/* a low succulent rosette: outer ring of blades, then inner ring */}
    <path d="M50 82C30 80 14 68 10 50c20-2 35 10 40 32Z" fill="url(#shrub-tone)" {...OUT} />
    <path d="M50 82c20-2 36-14 40-32-20-2-35 10-40 32Z" fill={OLIVE_D} {...OUT} />
    <path d="M48 72C34 64 26 48 28 30c15 8 21 25 20 42Z" fill={OLIVE} {...OUT} />
    <path d="M52 72c14-8 22-24 20-42-15 8-21 25-20 42Z" fill={OLIVE_L} {...OUT} />
    <path d="M50 68c-8-14-8-30 0-44 8 14 8 30 0 44Z" fill={OLIVE} {...OUT} />
    <path d="M46 76C30 74 18 66 12 56c14-4 27 2 34 20Z" fill={OLIVE_L} {...OUT} />
    <path d="M54 76c16-2 28-10 34-20-14-4-27 2-34 20Z" fill={OLIVE} {...OUT} />
    {/* base pot front face */}
    <rect x="36" y="82" width="28" height="10" rx="3" fill={OLIVE_D} {...OUT} />
    {/* base pot top plane */}
    <rect x="36" y="74" width="28" height="10" rx="3" fill={OLIVE} {...OUT_IN} />
    <path d="M50 74c-8-10-8-22 0-32 8 10 8 22 0 32Z" fill={OLIVE_D} {...OUT} />
    <path d="M20 54 47 74M80 54 53 74M34 38l13 30M66 38 53 68" {...SEAM} />
    <circle cx="50" cy="64" r="4" fill={BRASS} {...OUT_IN} />
  </Frame>
)

/* -------------------------------------------------------------- light & set */

/* LAMP — organic; base has visible front face + elliptical top */
const LampIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="lamp" size={size} tone={[BRASS_L, BRASS_D]}>
    {/* pooled light under the shade */}
    <ellipse cx="50" cy="48" rx="42" ry="32" fill={BRASS_L} opacity="0.16" />
    {/* drawn shade: tapered drum with a bright lower rim */}
    <path d="M25 52 34 14h32l9 38Z" fill="url(#lamp-tone)" {...OUT} />
    <ellipse cx="50" cy="52" rx="25" ry="7" fill={BRASS} {...OUT} />
    <ellipse cx="50" cy="14" rx="16" ry="4.5" fill={BRASS_D} {...OUT_IN} />
    <ellipse cx="50" cy="51" rx="17" ry="4" fill={LINEN} />
    <path d="M36 18h28M31 44c11 3 27 3 38 0" {...SHEEN} />
    {/* stem */}
    <path d="M50 56v20" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    <path d="M50 56v20" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
    {/* base front face (10 units deep) */}
    <path d="M32 88h36l-4-12H36Z" fill={BRASS_D} {...OUT} />
    {/* base top plane — elliptical so it reads as a rounded solid from above-front */}
    <ellipse cx="50" cy="76" rx="18" ry="5" fill={BRASS} {...OUT} />
    {/* base body */}
    <path d="M36 76h28l-4 12H40Z" fill={BRASS} {...OUT_IN} />
    {/* pull chain */}
    <path d="M62 54v8" stroke={INK} strokeWidth="1.6" />
    <circle cx="62" cy="64" r="2.6" fill={BRASS_L} {...OUT_IN} />
  </Frame>
)

/* ------------------------------------------------------------------ kitchen */

/* COUNTER — wide 2×1: long kitchen run with drawers left, sink centre, cupboards right */
const CounterIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="counter" size={size} tone={[WOOD_L, WOOD_D]} vb="0 0 200 100">
    {/* top slab across full width */}
    <rect x="8" y="8" width="184" height="10" rx="3" fill={SLATE_L} {...OUT} />
    {/* front face: the panel carrying all detail */}
    <rect x="8" y="18" width="184" height="74" rx="4" fill="url(#counter-tone)" {...OUT} />
    {/* stone worktop stripe at top of front face */}
    <rect x="8" y="18" width="184" height="14" rx="3" fill={SLATE} {...OUT_IN} />
    <path d="M16 23h168" {...SHEEN} />
    {/* left section: three-drawer stack */}
    <rect x="14" y="36" width="36" height="16" rx="3" fill={WOOD_L} {...OUT_IN} />
    <rect x="14" y="56" width="36" height="16" rx="3" fill={WOOD_L} {...OUT_IN} />
    <rect x="14" y="76" width="36" height="14" rx="3" fill={WOOD_L} {...OUT_IN} />
    <path d="M22 44h20M22 64h20M22 83h20" stroke={BRASS_L} strokeWidth="2.6" strokeLinecap="round" />
    {/* centre section: double sink */}
    <rect x="62" y="34" width="76" height="54" rx="4" fill={SLATE_D} {...OUT_IN} />
    <rect x="67" y="39" width="30" height="44" rx="3" fill={GLASS} {...OUT_IN} />
    <rect x="103" y="39" width="30" height="44" rx="3" fill={GLASS} {...OUT_IN} />
    <circle cx="100" cy="83" r="4" fill={SLATE_L} {...OUT_IN} />
    {/* mixer tap above centre of double sink */}
    <path d="M100 34V22c0-4 4-6 8-6h8" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M100 34V22c0-4 4-6 8-6h8" fill="none" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" />
    {/* right section: two cupboard doors */}
    <rect x="150" y="36" width="34" height="30" rx="3" fill={WOOD_L} {...OUT_IN} />
    <rect x="150" y="70" width="34" height="20" rx="3" fill={WOOD_L} {...OUT_IN} />
    <path d="M158 51h18M158 80h18" stroke={BRASS_L} strokeWidth="2.6" strokeLinecap="round" />
  </Frame>
)

/* STOVE — tall standing object: front elevation with burners + oven, shallow top slab */
const StoveIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="stove" size={size} tone={[SLATE_L, SLATE_D]}>
    {/* top slab — visible from above-front */}
    <rect x="8" y="6" width="84" height="10" rx="3" fill={SLATE_L} {...OUT} />
    {/* front face: the panel carrying all detail */}
    <rect x="8" y="16" width="84" height="76" rx="6" fill="url(#stove-tone)" {...OUT} />
    <rect x="13" y="21" width="74" height="46" rx="4" fill={CHAR} {...OUT_IN} />
    {/* four drawn burners with cast rings — detail on front face */}
    <circle cx="33" cy="36" r="12" fill={CHAR_L} {...OUT_IN} /><circle cx="33" cy="36" r="6" fill="none" stroke={BRASS} strokeWidth="2" />
    <circle cx="67" cy="36" r="12" fill={CHAR_L} {...OUT_IN} /><circle cx="67" cy="36" r="6" fill="none" stroke={BRASS} strokeWidth="2" />
    <circle cx="33" cy="58" r="12" fill={CHAR_L} {...OUT_IN} /><circle cx="33" cy="58" r="6" fill="none" stroke={BRASS} strokeWidth="2" />
    <circle cx="67" cy="58" r="12" fill={CHAR_L} {...OUT_IN} /><circle cx="67" cy="58" r="6" fill="none" stroke={BRASS} strokeWidth="2" />
    {/* oven door, handle and control knobs */}
    <rect x="13" y="72" width="74" height="16" rx="3" fill={SLATE_D} {...OUT_IN} />
    <path d="M20 78h60" stroke={BRASS_L} strokeWidth="3" strokeLinecap="round" />
    <circle cx="26" cy="87" r="2.6" fill={BRASS} /><circle cx="50" cy="87" r="2.6" fill={BRASS} /><circle cx="74" cy="87" r="2.6" fill={BRASS} />
  </Frame>
)

/* FRIDGE — tall standing object: front elevation with top slab */
const FridgeIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="fridge" size={size} tone={[PORC, PORC_D]}>
    {/* top slab */}
    <rect x="17" y="4" width="66" height="10" rx="4" fill={PORC_D} {...OUT} />
    {/* front face body */}
    <rect x="17" y="14" width="66" height="80" rx="6" fill="url(#fridge-tone)" {...OUT} />
    {/* freezer compartment */}
    <rect x="22" y="18" width="56" height="22" rx="3" fill={PORC} {...OUT_IN} />
    {/* fridge compartment */}
    <rect x="22" y="44" width="56" height="46" rx="3" fill={PORC} {...OUT_IN} />
    {/* divider seam */}
    <path d="M19 42h62" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    {/* long pull handles */}
    <path d="M69 22v12M69 50v20" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M69 22v12M69 50v20" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" />
    <rect x="28" y="76" width="16" height="8" rx="2" fill={BRASS_D} {...OUT_IN} />
    <path d="M26 20h34" {...SHEEN} />
  </Frame>
)

/* ----------------------------------------------------------- study & living */

/* TV — tall standing object: screen on front face, shallow top slab */
const TvIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="tv" size={size} tone={[CHAR_L, CHAR]}>
    {/* top slab */}
    <rect x="8" y="8" width="84" height="10" rx="4" fill={CHAR_L} {...OUT} />
    {/* front face: valve-set cabinet — rounded corners for the period set */}
    <rect x="8" y="18" width="84" height="74" rx="10" fill="url(#tv-tone)" {...OUT} />
    {/* cathode-ray screen: clean rounded rect, not a warped path */}
    <rect x="16" y="26" width="68" height="40" rx="6" fill={GLASS} {...OUT_IN} />
    <path d="M24 32c16-3 36-3 52 0" {...SHEEN} />
    <path d="M24 60c16 3 36 3 52 0" {...SHEEN} />
    {/* speaker grille */}
    <rect x="16" y="70" width="46" height="16" rx="3" fill={CHAR} {...OUT_IN} />
    <path d="M22 78h34" stroke={BRASS_D} strokeWidth="2" strokeLinecap="round" />
    {/* channel knob and volume knob */}
    <circle cx="72" cy="76" r="6" fill={BRASS} {...OUT_IN} />
    <circle cx="84" cy="76" r="4" fill={BRASS_D} {...OUT_IN} />
    {/* cabinet foot rail */}
    <rect x="16" y="88" width="68" height="4" rx="2" fill={CHAR_L} {...OUT_IN} />
  </Frame>
)

/* BOOKSHELF — wide 2×1: long case with two bays, three shelves each, globe + stacked books */
const BookshelfIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="bookshelf" size={size} tone={[WOOD_L, WOOD_D]} vb="0 0 200 100">
    {/* top slab spanning full width */}
    <rect x="7" y="4" width="186" height="10" rx="3" fill={WOOD_L} {...OUT} />
    {/* front face body */}
    <rect x="7" y="14" width="186" height="80" rx="4" fill="url(#bookshelf-tone)" {...OUT} />
    {/* inner dark recess */}
    <rect x="14" y="20" width="172" height="68" rx="2" fill={WOOD_D} {...OUT_IN} />
    {/* centre divider */}
    <rect x="97" y="20" width="6" height="68" rx="1" fill={WOOD_L} {...OUT_IN} />
    {/* three shelf boards — left bay */}
    <path d="M14 42h83M14 64h83" stroke={WOOD_L} strokeWidth="4" strokeLinecap="round" />
    <path d="M14 42h83M14 64h83" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    {/* three shelf boards — right bay */}
    <path d="M103 42h83M103 64h83" stroke={WOOD_L} strokeWidth="4" strokeLinecap="round" />
    <path d="M103 42h83M103 64h83" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    {/* left bay — upper shelf spines */}
    <rect x="18" y="23" width="8" height="18" fill={BLOOD} {...OUT_IN} />
    <rect x="28" y="21" width="7" height="20" fill={BRASS} {...OUT_IN} />
    <rect x="37" y="24" width="9" height="17" fill={OLIVE} {...OUT_IN} />
    <rect x="48" y="22" width="8" height="19" fill={LINEN} {...OUT_IN} />
    <rect x="58" y="23" width="9" height="18" fill={BLOOD_D} {...OUT_IN} />
    <rect x="69" y="21" width="7" height="20" fill={BRASS_L} {...OUT_IN} />
    <rect x="78" y="24" width="8" height="17" fill={OLIVE_D} {...OUT_IN} />
    {/* left bay — lower shelf spines */}
    <rect x="18" y="46" width="9" height="17" fill={OLIVE_L} {...OUT_IN} />
    <rect x="29" y="44" width="7" height="19" fill={BLOOD} {...OUT_IN} />
    <rect x="38" y="47" width="9" height="16" fill={BRASS} {...OUT_IN} />
    <rect x="49" y="45" width="8" height="18" fill={LINEN} {...OUT_IN} />
    <rect x="59" y="46" width="9" height="17" fill={OLIVE} {...OUT_IN} />
    <rect x="70" y="44" width="7" height="19" fill={BLOOD_D} {...OUT_IN} />
    <rect x="79" y="47" width="8" height="16" fill={BRASS_L} {...OUT_IN} />
    {/* left bay — bottom shelf: stacked flat books + inkwell */}
    <rect x="18" y="68" width="36" height="7" rx="1.5" fill={BRASS_D} {...OUT_IN} />
    <rect x="21" y="75" width="32" height="5" rx="1.5" fill={LINEN} {...OUT_IN} />
    <circle cx="76" cy="74" r="7" fill={GLASS} {...OUT_IN} />
    <path d="M70 74h12M76 67v14" {...SEAM} />
    {/* right bay — upper shelf spines */}
    <rect x="107" y="23" width="8" height="18" fill={BLOOD_D} {...OUT_IN} />
    <rect x="117" y="21" width="7" height="20" fill={OLIVE} {...OUT_IN} />
    <rect x="126" y="24" width="9" height="17" fill={BRASS_L} {...OUT_IN} />
    <rect x="137" y="22" width="8" height="19" fill={BLOOD} {...OUT_IN} />
    <rect x="147" y="23" width="9" height="18" fill={LINEN} {...OUT_IN} />
    <rect x="158" y="21" width="7" height="20" fill={BRASS} {...OUT_IN} />
    <rect x="167" y="24" width="8" height="17" fill={OLIVE_L} {...OUT_IN} />
    {/* right bay — lower shelf spines */}
    <rect x="107" y="46" width="9" height="17" fill={BRASS} {...OUT_IN} />
    <rect x="118" y="44" width="7" height="19" fill={LINEN} {...OUT_IN} />
    <rect x="127" y="47" width="9" height="16" fill={BLOOD_D} {...OUT_IN} />
    <rect x="138" y="45" width="8" height="18" fill={OLIVE_D} {...OUT_IN} />
    <rect x="148" y="46" width="9" height="17" fill={BRASS_L} {...OUT_IN} />
    <rect x="159" y="44" width="7" height="19" fill={OLIVE} {...OUT_IN} />
    <rect x="168" y="47" width="8" height="16" fill={BLOOD} {...OUT_IN} />
    {/* right bay — bottom shelf: stacked flat books + globe */}
    <rect x="107" y="68" width="36" height="7" rx="1.5" fill={WOOD_D} {...OUT_IN} />
    <rect x="110" y="75" width="32" height="5" rx="1.5" fill={BRASS_D} {...OUT_IN} />
    <circle cx="165" cy="74" r="9" fill={GLASS} {...OUT_IN} />
    <path d="M157 74h16M165 65v18" {...SEAM} />
  </Frame>
)

/* DESK — tall standing object (pedestal): front face carries drawers and writing surface */
const DeskIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="desk" size={size} tone={[WOOD_L, WOOD]}>
    {/* top slab — visible from above-front */}
    <rect x="6" y="8" width="88" height="10" rx="4" fill={WOOD_L} {...OUT} />
    {/* front face: pedestal desk elevation */}
    <rect x="6" y="18" width="88" height="74" rx="5" fill="url(#desk-tone)" {...OUT} />
    {/* blotter / writing surface on front face */}
    <rect x="12" y="24" width="46" height="36" rx="3" fill={OLIVE_D} {...OUT_IN} />
    <rect x="17" y="29" width="36" height="26" rx="2" fill={LINEN} {...OUT_IN} />
    <path d="M23 37h24M23 44h20M23 51h15" stroke={WOOD} strokeWidth="1.6" strokeLinecap="round" />
    {/* drawer bank */}
    <rect x="64" y="24" width="24" height="15" rx="2" fill={WOOD_D} {...OUT_IN} />
    <rect x="64" y="43" width="24" height="15" rx="2" fill={WOOD_D} {...OUT_IN} />
    <path d="M70 31h12M70 50h12" stroke={BRASS_L} strokeWidth="2.6" strokeLinecap="round" />
    {/* pen, inkwell, telephone cradle */}
    <path d="M14 68l26 5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <circle cx="52" cy="70" r="6" fill={CHAR} {...OUT_IN} />
    <rect x="64" y="64" width="24" height="10" rx="3" fill={CHAR_L} {...OUT_IN} />
    {/* base rail at bottom of front face */}
    <rect x="6" y="84" width="88" height="8" rx="3" fill={WOOD_D} {...OUT_IN} />
  </Frame>
)

/* CLOCK — tall standing object: front elevation with hood, dial, trunk, pendulum */
const ClockIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="clock" size={size} tone={[WOOD_L, WOOD_D]}>
    {/* top slab of the hood */}
    <rect x="22" y="4" width="56" height="10" rx="4" fill={WOOD_L} {...OUT} />
    {/* hood finial */}
    <path d="M30 14h40l-6-8H36Z" fill={WOOD_D} {...OUT} />
    {/* main trunk front face */}
    <path d="M22 14h56v68c0 8-6 12-14 12H36c-8 0-14-4-14-12Z" fill="url(#clock-tone)" {...OUT} />
    {/* dial surround */}
    <circle cx="50" cy="36" r="22" fill={WOOD_D} {...OUT_IN} />
    <circle cx="50" cy="36" r="17" fill={LINEN} {...OUT_IN} />
    {/* chapter ring tick marks */}
    <path d="M50 22v4M50 46v4M36 36h4M60 36h4M40 26l3 3M60 26l-3 3M40 46l3-3M60 46l-3-3" stroke={WOOD} strokeWidth="1.6" strokeLinecap="round" />
    {/* clock hands */}
    <path d="M50 36V25M50 36l8 6" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="50" cy="36" r="2.6" fill={BLOOD} />
    {/* trunk window with pendulum bob */}
    <rect x="34" y="62" width="32" height="24" rx="3" fill={GLASS} {...OUT_IN} />
    <path d="M50 62v14" stroke={BRASS_D} strokeWidth="2" />
    <circle cx="50" cy="79" r="6" fill={BRASS} {...OUT_IN} />
  </Frame>
)

/* ----------------------------------------------------------------- bathroom */

/* BATHTUB — wide 2×1: genuinely elongated basin seen from above-front */
const BathtubIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="bathtub" size={size} tone={[PORC, PORC_D]} vb="0 0 200 100">
    {/* front face extrusion: forward rim across full width */}
    <rect x="8" y="80" width="184" height="10" rx="6" fill={PORC_D} {...OUT} />
    {/* outer tub body: wide oval with tight radius ends */}
    <rect x="8" y="16" width="184" height="64" rx="22" fill="url(#bathtub-tone)" {...OUT} />
    {/* inner porcelain rim */}
    <rect x="16" y="22" width="168" height="52" rx="16" fill={PORC_D} {...OUT_IN} />
    {/* basin interior — water fill colour */}
    <rect x="22" y="27" width="156" height="42" rx="13" fill={GLASS} {...OUT_IN} />
    {/* water sheen across the long basin */}
    <path d="M30 38c30-5 110-5 140 0" {...SHEEN} />
    {/* chrome soap rail running along the inside rim near the head end */}
    <path d="M24 50h28" fill="none" stroke={BRASS_L} strokeWidth="3" strokeLinecap="round" />
    {/* mixer tap assembly at head end (left) */}
    <path d="M40 16V8c0-3 3-5 6-5h6" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M40 16V8c0-3 3-5 6-5h6" fill="none" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" />
    {/* hot and cold tap handles flanking the spout */}
    <circle cx="24" cy="10" r="4.5" fill={BRASS_L} {...OUT_IN} />
    <circle cx="60" cy="10" r="4.5" fill={BRASS_L} {...OUT_IN} />
    {/* overflow cover near head end */}
    <ellipse cx="40" cy="23" rx="5" ry="3" fill={PORC} {...OUT_IN} />
    {/* drain at foot end */}
    <ellipse cx="168" cy="62" rx="7" ry="4.5" fill={SLATE_D} {...OUT_IN} />
    <circle cx="168" cy="62" r="2.5" fill={SLATE_L} />
  </Frame>
)

/* TOILET — low object: cistern top slab + bowl with front-face extrusion */
const ToiletIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="toilet" size={size} tone={[PORC, PORC_D]}>
    {/* cistern: top slab */}
    <rect x="24" y="4" width="52" height="8" rx="3" fill={PORC_D} {...OUT} />
    {/* cistern front face with lever */}
    <rect x="24" y="12" width="52" height="22" rx="5" fill="url(#toilet-tone)" {...OUT} />
    <rect x="30" y="16" width="40" height="12" rx="3" fill={PORC_D} {...OUT_IN} />
    <path d="M76 18h7" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    <path d="M76 18h7" stroke={BRASS} strokeWidth="2" strokeLinecap="round" />
    {/* bowl body from above-front */}
    <path d="M20 46c0-8 7-13 15-13h30c8 0 15 5 15 13v14c0 18-13 28-30 28S20 78 20 60Z" fill="url(#toilet-tone)" {...OUT} />
    {/* front face extrusion of bowl forward edge */}
    <path d="M20 60c0 18 13 28 30 28s30-10 30-28v8c0 14-13 22-30 22S20 82 20 68Z" fill={PORC_D} {...OUT_IN} />
    <ellipse cx="50" cy="60" rx="26" ry="20" fill={PORC_D} {...OUT_IN} />
    <ellipse cx="50" cy="60" rx="18" ry="13" fill={GLASS} {...OUT_IN} />
    <ellipse cx="50" cy="57" rx="8" ry="4" fill={PORC} opacity="0.7" />
    <path d="M28 44c12-6 32-6 44 0" {...SHEEN} />
  </Frame>
)

/* SHOWER — tall standing object: glass screen front elevation + tray with front face */
const ShowerIcon: FurnitureIcon = ({ size }) => (
  <Frame prefix="shower" size={size} tone={[PORC, PORC_D]}>
    {/* top slab above glass screen */}
    <rect x="10" y="6" width="80" height="8" rx="3" fill={PORC_D} {...OUT} />
    {/* glass screen front face */}
    <rect x="10" y="14" width="80" height="58" rx="3" fill={GLASS} opacity="0.5" {...OUT_IN} />
    <path d="M18 18v50M32 18v50" stroke={PORC} strokeOpacity="0.35" strokeWidth="2" />
    {/* tray front face extrusion */}
    <rect x="8" y="80" width="84" height="12" rx="4" fill={PORC_D} {...OUT} />
    {/* tray top surface */}
    <rect x="8" y="70" width="84" height="12" rx="4" fill="url(#shower-tone)" {...OUT} />
    <rect x="14" y="72" width="72" height="8" rx="2" fill={PORC_D} {...OUT_IN} />
    <circle cx="50" cy="76" r="4.5" fill={SLATE_D} {...OUT_IN} />
    {/* riser and rose head */}
    <path d="M78 68V22c0-6-4-10-10-10H56" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M78 68V22c0-6-4-10-10-10H56" fill="none" stroke={BRASS} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="48" cy="14" rx="15" ry="7" fill={BRASS} {...OUT} />
    <ellipse cx="48" cy="13" rx="9" ry="3.4" fill={BRASS_L} {...OUT_IN} />
    <circle cx="40" cy="18" r="1.6" fill={SLATE_D} /><circle cx="48" cy="19" r="1.6" fill={SLATE_D} /><circle cx="56" cy="18" r="1.6" fill={SLATE_D} />
    {/* falling water — muted glass-tinted strokes */}
    <path d="M38 26c-1 10-2 20-2 32" stroke={GLASS} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M48 26c0 12-1 22-1 34" stroke={GLASS} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M58 26c1 10 2 20 3 30" stroke={GLASS} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
    {/* soap niche */}
    <rect x="16" y="52" width="14" height="12" rx="2" fill={LINEN} {...OUT_IN} />
    <rect x="16" y="56" width="14" height="4" rx="1" fill={PORC} {...OUT_IN} />
  </Frame>
)

export const FURNITURE_ICON: Record<FurnitureType, FurnitureIcon> = {
  chair: ArmchairIcon,
  sofa: SofaIcon,
  bed: BedIcon,
  table: TableIcon,
  box: BoxIcon,
  rug: RugIcon,
  plant: PlantIcon,
  shrub: ShrubIcon,
  lamp: LampIcon,
  counter: CounterIcon,
  tv: TvIcon,
  bathtub: BathtubIcon,
  bookshelf: BookshelfIcon,
  stove: StoveIcon,
  fridge: FridgeIcon,
  clock: ClockIcon,
  desk: DeskIcon,
  toilet: ToiletIcon,
  shower: ShowerIcon,
}

/**
 * SIDE-VIEW artwork, for pieces that the generator turns to face east or west.
 *
 * A cabinet-projection drawing cannot be rotated. The top plane, the front face
 * and the light direction are baked into the paths, so a quarter turn rotates
 * all three and the object stops describing anything real — the sofa was the
 * clearest casualty, reading as a featureless padded block whenever it sat on a
 * vertical wall. A piece listed here is DRAWN in its turned orientation instead,
 * and MapGrid skips the CSS rotation for it entirely.
 *
 * Rotation 90 uses this art as drawn (facing east); 270 mirrors it horizontally,
 * which is a legitimate operation because a mirror preserves the top plane and
 * the front face. Rotations 0 and 180 keep the front artwork in FURNITURE_ICON.
 *
 * A type with no entry here falls back to the old rotate-the-drawing behaviour,
 * so this table can be filled in one piece at a time.
 */
export const FURNITURE_ICON_SIDE: Partial<Record<FurnitureType, FurnitureIcon>> = {
  sofa: SofaSideIcon,
}

export const FURNITURE_NAME: Record<FurnitureType, string> = {
  chair: 'Chair',
  sofa: 'Sofa',
  bed: 'Bed',
  table: 'Table',
  box: 'Box',
  rug: 'Rug',
  plant: 'Plant',
  shrub: 'Shrub',
  lamp: 'Lamp',
  counter: 'Counter',
  tv: 'TV',
  bathtub: 'Bathtub',
  bookshelf: 'Bookshelf',
  stove: 'Stove',
  fridge: 'Fridge',
  clock: 'Clock',
  desk: 'Desk',
  toilet: 'Toilet',
  shower: 'Shower',
}
