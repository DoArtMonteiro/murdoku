import type { CSSProperties } from 'react'

/** Dark, clue-readable finishes for the mansion reconstruction board. */
export type RoomMaterial =
  | 'kitchen' | 'bathroom' | 'pantry' | 'living-room' | 'dining-room'
  | 'study' | 'office' | 'bedroom' | 'hallway' | 'front-yard' | 'garden' | 'porch'

/**
 * Each finish is an authored material tile — floorboards, encaustic checker,
 * stone courses, slate slabs, wool weave, clipped lawn — drawn as one SVG that
 * is stretched to exactly one board cell. Stretching one tile per cell (rather
 * than tiling a fixed pixel pattern) keeps the plank count and grout rhythm
 * identical from a 4x4 board through a 7x7 one, and stops a half-cut seam from
 * landing in the middle of a cell.
 *
 * Every base stays dark: the board's light X-mark and bone suspect tokens must
 * read the same way in all twelve rooms.
 */
const tile = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`

const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${body}</svg>`

/** Three courses of floorboards with staggered end joints and rubbed grain. */
const planks = (seam: string, a: string, b: string, grain: string) => wrap(`
  <rect width="100" height="100" fill="${seam}"/>
  <g>
    <rect x="0" y="1" width="61" height="31" fill="${a}"/>
    <rect x="63" y="1" width="37" height="31" fill="${b}"/>
    <rect x="0" y="34" width="29" height="31" fill="${b}"/>
    <rect x="31" y="34" width="69" height="31" fill="${a}"/>
    <rect x="0" y="67" width="73" height="32" fill="${a}"/>
    <rect x="75" y="67" width="25" height="32" fill="${b}"/>
  </g>
  <g stroke="${grain}" stroke-width="1" fill="none" opacity="0.5">
    <path d="M6 11h46M12 23h34M8 45h58M40 56h44M10 78h52M22 90h40"/>
  </g>
`)

/** The same boards run the other way for porches and hall runners. */
const boards = (seam: string, a: string, b: string, grain: string) => wrap(`
  <rect width="100" height="100" fill="${seam}"/>
  <g>
    <rect x="1" y="0" width="31" height="61" fill="${a}"/>
    <rect x="1" y="63" width="31" height="37" fill="${b}"/>
    <rect x="34" y="0" width="31" height="29" fill="${b}"/>
    <rect x="34" y="31" width="31" height="69" fill="${a}"/>
    <rect x="67" y="0" width="32" height="73" fill="${a}"/>
    <rect x="67" y="75" width="32" height="25" fill="${b}"/>
  </g>
  <g stroke="${grain}" stroke-width="1" fill="none" opacity="0.5">
    <path d="M11 6v46M23 12v34M45 8v58M56 40v44M78 10v52M90 22v40"/>
  </g>
`)

/** Encaustic checker: four tiles per cell with a hairline grout. */
const checker = (grout: string, a: string, b: string, inlay: string) => wrap(`
  <rect width="100" height="100" fill="${grout}"/>
  <rect x="1" y="1" width="47" height="47" fill="${a}"/>
  <rect x="52" y="1" width="47" height="47" fill="${b}"/>
  <rect x="1" y="52" width="47" height="47" fill="${b}"/>
  <rect x="52" y="52" width="47" height="47" fill="${a}"/>
  <g fill="${inlay}" opacity="0.36">
    <circle cx="24" cy="24" r="6"/>
    <circle cx="76" cy="76" r="6"/>
    <path d="M76 18l7 7-7 7-7-7zM24 68l7 7-7 7-7-7z"/>
  </g>
`)

/** Stone courses: staggered blocks with a deep mortar joint. */
const bricks = (mortar: string, a: string, b: string, chip: string) => wrap(`
  <rect width="100" height="100" fill="${mortar}"/>
  <g>
    <rect x="1" y="1" width="46" height="30" fill="${a}"/>
    <rect x="49" y="1" width="50" height="30" fill="${b}"/>
    <rect x="1" y="34" width="22" height="30" fill="${b}"/>
    <rect x="25" y="34" width="47" height="30" fill="${a}"/>
    <rect x="74" y="34" width="25" height="30" fill="${b}"/>
    <rect x="1" y="67" width="51" height="32" fill="${b}"/>
    <rect x="54" y="67" width="45" height="32" fill="${a}"/>
  </g>
  <g stroke="${chip}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.22">
    <path d="M8 22h14M58 12h18M30 44h16M80 56h12M12 76h20M62 90h16"/>
  </g>
`)

/** Wide slate slabs — quiet enough to sit under desks and porcelain. */
const slabs = (joint: string, a: string, b: string, bloom: string) => wrap(`
  <rect width="100" height="100" fill="${joint}"/>
  <rect x="1" y="1" width="63" height="47" fill="${a}"/>
  <rect x="66" y="1" width="33" height="47" fill="${b}"/>
  <rect x="1" y="51" width="33" height="48" fill="${b}"/>
  <rect x="36" y="51" width="63" height="48" fill="${a}"/>
  <g stroke="${bloom}" stroke-width="1" fill="none" opacity="0.18">
    <path d="M8 12h34M8 60h24M70 22h22M44 84h32"/>
  </g>
`)

/** Clipped lawn: blade tufts scattered over packed earth. */
const lawn = (base: string, patch: string, blade: string, earth: string) => wrap(`
  <rect width="100" height="100" fill="${base}"/>
  <g fill="${patch}" opacity="0.3">
    <ellipse cx="30" cy="34" rx="18" ry="12"/>
    <ellipse cx="76" cy="70" rx="16" ry="11"/>
  </g>
  <g fill="${earth}" opacity="0.28">
    <ellipse cx="82" cy="24" rx="9" ry="5"/>
    <ellipse cx="20" cy="82" rx="10" ry="5"/>
  </g>
  <g stroke="${blade}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.62">
    <path d="M12 26c1-6 3-10 6-13M18 26c1-5 1-9 0-13"/>
    <path d="M44 14c2-7 5-11 9-13M50 15c0-6-1-10-3-14"/>
    <path d="M72 40c-2-8-2-14 1-19M78 41c2-7 4-11 8-14"/>
    <path d="M26 58c-3-7-4-13-3-19M32 59c1-8 3-13 6-16"/>
    <path d="M58 66c2-6 5-10 9-12M64 67c-1-7-3-12-6-15"/>
    <path d="M88 58c-1-7 0-12 2-16"/>
    <path d="M14 90c0-8 1-13 4-17M20 91c3-6 6-10 10-12"/>
    <path d="M50 96c-2-7-2-12 0-17M56 95c2-6 5-10 9-12"/>
    <path d="M80 88c1-7 3-12 7-15M86 89c-1-6-3-10-6-13"/>
  </g>
`)

/**
 * Wool weave: a fine warp/weft grid. Deliberately no centre bloom — anything
 * that reads as one soft blob per cell turns a carpeted room into polka dots.
 */
const weave = (base: string, warp: string, weft: string, pile: string) => wrap(`
  <rect width="100" height="100" fill="${base}"/>
  <g stroke="${warp}" stroke-width="2" opacity="0.34">
    <path d="M8 0v100M25 0v100M42 0v100M58 0v100M75 0v100M92 0v100"/>
  </g>
  <g stroke="${weft}" stroke-width="2" opacity="0.3">
    <path d="M0 8h100M0 25h100M0 42h100M0 58h100M0 75h100M0 92h100"/>
  </g>
  <g stroke="${pile}" stroke-width="1" opacity="0.16">
    <path d="M0 16h100M0 50h100M0 84h100"/>
  </g>
`)

/** Mahogany parquet blocks laid in alternating grain. */
const parquet = (pitch: string, a: string, b: string, grain: string) => wrap(`
  <rect width="100" height="100" fill="${pitch}"/>
  <rect x="1" y="1" width="47" height="47" fill="${a}"/>
  <rect x="52" y="1" width="47" height="47" fill="${b}"/>
  <rect x="1" y="52" width="47" height="47" fill="${b}"/>
  <rect x="52" y="52" width="47" height="47" fill="${a}"/>
  <g stroke="${grain}" stroke-width="1.2" opacity="0.42">
    <path d="M1 13h47M1 25h47M1 37h47M52 64h47M52 76h47M52 88h47"/>
    <path d="M64 1v47M76 1v47M88 1v47M13 52v47M25 52v47M37 52v47"/>
  </g>
`)

// DAYLIGHT PALETTE — rebuilt around the Kenney sprites.
//
// The noire finishes were near-black by design, and the marks and tokens were
// tuned to read against them. Kenney's furniture is rendered under a bright
// key light on pale ground: dropping it onto an espresso floor read as two
// unrelated images stacked, and no amount of care with the SPRITES could fix a
// fight that was happening in the FLOOR.
//
// Values are sampled from the kit's own sample render: warm blond timber, off
// white tile, and a soft sage lawn. Everything sits between roughly 70% and
// 90% luminance so a piece's own contact shadow is what separates it from the
// ground — which is exactly what that shadow was drawn to do.
export const ROOM_MATERIALS: Record<RoomMaterial, CSSProperties> = {
  // Warm cream encaustic tile.
  kitchen: {
    backgroundColor: '#EFE6D8',
    backgroundImage: tile(checker('#EFE6D8', '#E2D4BE', '#F6F0E5', '#C9A063')),
  },
  // Cool off-white slabs.
  bathroom: {
    backgroundColor: '#E7EDEA',
    backgroundImage: tile(slabs('#E7EDEA', '#D6E0DB', '#F2F6F4', '#9FB3A8')),
  },
  // Pale birch shelving boards.
  pantry: {
    backgroundColor: '#EADFCC',
    backgroundImage: tile(boards('#EADFCC', '#D8C7AB', '#F3EBDC', '#B98A50')),
  },
  // Soft wool carpet.
  'living-room': {
    backgroundColor: '#E9DECE',
    backgroundImage: tile(weave('#E9DECE', '#DCCDB6', '#F2EADD', '#B08A62')),
  },
  // Honey parquet.
  'dining-room': {
    backgroundColor: '#E7CFA9',
    backgroundImage: tile(parquet('#E7CFA9', '#D3B283', '#F0DEC1', '#B07C42')),
  },
  // Blond library oak, wide boards.
  study: {
    backgroundColor: '#E3C79E',
    backgroundImage: tile(planks('#E3C79E', '#CDAA79', '#EDD9B8', '#A97A45')),
  },
  // Light grey office slate.
  office: {
    backgroundColor: '#E4E6E1',
    backgroundImage: tile(slabs('#E4E6E1', '#D2D6CE', '#EFF1ED', '#9AA189')),
  },
  // Warm bedroom floorboards.
  bedroom: {
    backgroundColor: '#EBD3AE',
    backgroundImage: tile(planks('#EBD3AE', '#D7B889', '#F4E4CA', '#B98E52')),
  },
  // Pale limestone courses.
  hallway: {
    backgroundColor: '#EDE7D8',
    backgroundImage: tile(bricks('#EDE7D8', '#DCD3BE', '#F5F1E7', '#BEB08B')),
  },
  // Sunlit clipped lawn.
  'front-yard': {
    backgroundColor: '#BFD199',
    backgroundImage: tile(lawn('#BFD199', '#AFC486', '#D3E0B4', '#8A7048')),
  },
  // Lusher planting beds.
  garden: {
    backgroundColor: '#B2C98C',
    backgroundImage: tile(lawn('#B2C98C', '#9FBB76', '#C8DAA6', '#7E663F')),
  },
  // Weathered porch timber.
  porch: {
    backgroundColor: '#E5DCC8',
    backgroundImage: tile(boards('#E5DCC8', '#D3C7AC', '#F0EADB', '#B0A277')),
  },
}

const ROOM_MATERIAL_BY_NAME: Record<string, RoomMaterial> = {
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  pantry: 'pantry',
  'living room': 'living-room',
  'dining room': 'dining-room',
  study: 'study',
  office: 'office',
  bedroom: 'bedroom',
  hallway: 'hallway',
  'front yard': 'front-yard',
  garden: 'garden',
  porch: 'porch',
}

export function roomMaterial(name: string): RoomMaterial {
  const normalized = name.trim().toLowerCase()
  if (normalized.includes('yard')) return 'front-yard'
  return ROOM_MATERIAL_BY_NAME[normalized] ?? 'living-room'
}

/**
 * Grain scale.
 *
 * The tile used to be stretched to exactly one cell, which made a single
 * floorboard as wide as a whole room: the board read as giant slabs rather
 * than as flooring seen from above. Repeating the tile four times per cell
 * (half width, half height) puts planks, grout and stone courses at furniture
 * scale instead of room scale, which is what a floor plan actually looks like.
 * The tiles are authored on a 100x100 viewBox with their pattern running to
 * the edges, so repeating does not introduce a visible join.
 */
const GRAIN = '50% 50%'

export function floorStyle(material: RoomMaterial): CSSProperties {
  return {
    ...ROOM_MATERIALS[material],
    backgroundSize: GRAIN,
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat',
  }
}

/**
 * The daylight palette inverts this: every finish now sits at 70-90% luminance,
 * so marks must be drawn DARK to read. Returning true here would keep painting
 * white X marks onto cream tile.
 */
export function isDarkFloor(_material: RoomMaterial): boolean {
  return false
}
