// ============================================================================
// Reference-case contract (R1).
//
// One reference case (very-easy-1, "Midnight Delivery") is played in two
// competing board variants that share EVERYTHING except the picture of the
// house: the same useGame() state, the same shell (dossier, tools, accusation,
// coordinates, tokens, accessible grid). A board only draws the house.
//
// Geometry rule shared by both variants: the plan is axis-aligned. Row r runs
// horizontally on screen, column c vertically, row 0 at the top, column 0 at
// the left. Cell (r, c) occupies the screen rectangle
//   x ∈ [x0 + c·cellW, x0 + (c+1)·cellW),  y ∈ [y0 + r·cellH, y0 + (r+1)·cellH)
// inside the board's own box. The shell overlays numerals, tokens, washes and
// the DOM hit grid on exactly that rectangle grid, so a board MUST draw its
// floor so cells land there (a 3D board picks its camera to make this true).
// ============================================================================

import type { Puzzle } from '../core/types'

export type BoardVariant = 'nightplan' | 'plan3d' | 'illustrated'

/** Where the grid sits inside a board box of the given size. */
export interface BoardLayout {
  /** Left/top of cell (0,0) in CSS px, relative to the board box. */
  x0: number
  y0: number
  cellW: number
  cellH: number
}

export interface BoardProps {
  puzzle: Puzzle
  /** Storey to draw (0 = ground). The reference case has one storey. */
  floor: number
  /** Board box size in CSS px, chosen by the shell. */
  width: number
  height: number
  /** Must equal boardLayout(width, height, puzzle.size) of the same module. */
  layout: BoardLayout
  /** 'light' | 'dark' page theme; boards may ignore it. */
  theme: 'light' | 'dark'
}

/**
 * Each board module exports:
 *   export default function Board(props: BoardProps): JSX.Element
 *   export function boardLayout(width: number, height: number, n: number): BoardLayout
 * The board is purely visual: no pointer handlers, aria-hidden, no network
 * fetches outside /public, deterministic for a given (puzzle, size, theme).
 */
export type BoardLayoutFn = (width: number, height: number, n: number) => BoardLayout

/** The case both variants are judged on. */
export const REFERENCE_CASE_ID = 'very-easy-1'
