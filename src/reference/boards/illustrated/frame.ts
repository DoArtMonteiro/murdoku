// Board geometry: the numeral gutter, the lot of lawn around the sheet, and the
// cell size. Shared by the board, the tests and the layout contract.
/** Numeral gutter: 0.335u + 20 px, enough for the shell's numeral boxes (see shell/Plan.tsx). */
export const GUTTER_K = 20
export const GUTTER_C = 0.335
/** Darkening behind the shell's numeral pills: at most 12%, feathered over 0.3u on each side; no panel, no edge. */
export const GUTTER_SHADE = 0.12

/** Lot width in cells: 0.6u on phones (so the grid can reach >= 44 px cells at 390 wide), growing to 1.1u on desktop. */
export function lotCells(minSide: number): number {
  return Math.max(0.6, Math.min(1.1, 0.6 + ((minSide - 390) / 310) * 0.5))
}

export interface Frame {
  u: number
  /** Lot width in px (outside the gutter). */
  lot: number
  /** Gutter thickness in px. */
  gut: number
  /** Margin from the sheet edge to the grid, px. */
  m: number
  /** Sheet (grid + margins) size and offset inside the box. */
  S: number
  sx: number
  sy: number
}

export function frameFor(width: number, height: number, n: number): Frame {
  const min = Math.min(width, height)
  const g = lotCells(min)
  let u = Math.max(1, Math.floor((min - 2 * GUTTER_K) / (n + 2 * (GUTTER_C + g))))
  const dims = (uu: number) => {
    const lot = Math.round(g * uu)
    const gut = Math.ceil(GUTTER_C * uu) + GUTTER_K
    return { lot, gut, m: lot + gut, S: n * uu + 2 * (lot + gut) }
  }
  while (u > 1 && dims(u).S > min) u--
  const { lot, gut, m, S } = dims(u)
  return { u, lot, gut, m, S, sx: Math.floor((width - S) / 2), sy: Math.floor((height - S) / 2) }
}
