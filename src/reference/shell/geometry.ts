import type { BoardLayout, BoardLayoutFn } from '../contract'

/** Width/height of the numeral plaques (px). Numerals are never smaller than 12 px type. */
export const NUM_BAND = 18

/**
 * Used until the board module has loaded. Same sheet geometry as F-spec section 3:
 * u = floor(min/(n+1)), numeral margin 0.6u top/left, 0.4u trim bottom/right,
 * sheet centred in the box.
 */
export const fallbackLayout: BoardLayoutFn = (width, height, n) => {
  const u = Math.max(1, Math.floor(Math.min(width, height) / (n + 1)))
  const sheet = (n + 1) * u
  return { x0: Math.floor((width - sheet) / 2 + 0.6 * u), y0: Math.floor((height - sheet) / 2 + 0.6 * u), cellW: u, cellH: u }
}

export interface PlanGeometry {
  /** Outer plan frame (the board box plus the numeral band), a square. */
  size: number
  /** Board box offset inside the frame and its size. */
  ox: number
  oy: number
  bw: number
  bh: number
  /** The layout the board was (and must be) given for the box (bw, bh). */
  layout: BoardLayout
  /** Grid rectangle in frame coordinates. */
  gx: number
  gy: number
  gw: number
  gh: number
}

/**
 * The shell owns the numerals, so it guarantees a NUM_BAND-wide margin left of
 * and above the grid. If the board already leaves that much room the box is the
 * whole frame; otherwise the box shrinks and shifts by exactly the deficit.
 * Board-agnostic: it only calls the board's own boardLayout().
 */
export function planGeometry(size: number, n: number, fn: BoardLayoutFn): PlanGeometry {
  let bw = size, bh = size, ox = 0, oy = 0
  let layout = fn(bw, bh, n)
  for (let i = 0; i < 3; i++) {
    const needL = Math.max(0, NUM_BAND - layout.x0)
    const needT = Math.max(0, NUM_BAND - layout.y0)
    if (needL === ox && needT === oy) break
    ox = needL; oy = needT
    bw = size - ox; bh = size - oy
    layout = fn(bw, bh, n)
  }
  return {
    size, ox, oy, bw, bh, layout,
    gx: ox + layout.x0, gy: oy + layout.y0,
    gw: layout.cellW * n, gh: layout.cellH * n,
  }
}

/** Largest square that fits the available space (never negative). */
export function fitSquare(w: number, h: number): number {
  return Math.max(0, Math.floor(Math.min(w, h)))
}

/** Sprite math shared with src/components/SuspectCard.tsx (4×2 contact sheet). */
export function portraitStyle(personId: string, chosen?: number): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } {
  const idx = chosen !== undefined && chosen >= 0 && chosen < 8 ? chosen : [...personId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 8
  const col = idx % 4
  const row = Math.floor(idx / 4)
  return {
    backgroundImage: 'url("/assets/contact-sheet.jpg")',
    backgroundSize: '400% 200%',
    backgroundPosition: `${col * 33.333}% ${row * 100}%`,
  }
}

export interface PhonePlan {
  /** Frame size handed to the board (it may be wider than the screen: the lot beyond the crop is dropped). */
  size: number
  /** Pixels cropped from each side of the frame (the lot, never the numeral pills or the porch). */
  cropL: number
  cropR: number
  cropT: number
  cropB: number
  /** Cell size the board's layout gives at `size`. */
  cell: number
}

/**
 * Phone sizing. Policy (also in tests/reference/story.shell.test.tsx): 6x6 and 7x7 keep 44 px cells at 390 wide,
 * 8x8 is accepted at 35 px or more at 390 and 32 px or more at 360 (WCAG 2.2 AA minimum: 24 px). The board is drawn
 * bigger than the screen and the decorative lot is cropped: left of the numeral pills, 1 u right of the grid (the
 * porch marker lives there), above the pills and half a cell below the grid. The plan grows until cells reach 44 px
 * (36 px for 8x8 or more: bigger cells would push the clue card under the tools) so the visible strip never exceeds the viewport.
 */
export function phonePlan(vpW: number, n: number, fn: BoardLayoutFn, minSize = 200): PhonePlan {
  const cap = n <= 7 ? 44 : vpW <= 375 ? 32 : 36
  const crop = (size: number): PhonePlan => {
    const g = planGeometry(size, n, fn)
    const u = g.layout.cellW
    return {
      size,
      cropL: Math.max(0, Math.floor(g.gx - (0.2 * u + 24))),
      cropR: Math.max(0, Math.floor(size - (g.gx + g.gw) - 1.0 * u)),
      cropT: Math.max(0, Math.floor(g.gy - (0.2 * u + 16) - 6)),
      cropB: Math.max(0, Math.floor(size - (g.gy + g.gh) - 0.5 * u)),
      cell: u,
    }
  }
  let best = crop(minSize)
  for (let s = minSize; s < vpW * 2; s += 2) {
    const c = crop(s)
    if (c.size - c.cropL - c.cropR > vpW) break
    best = c
    if (c.cell >= cap) break
  }
  return best
}
