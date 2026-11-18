// ============================================================================
// plan3d layout + camera (F-spec §3 / §11).
//
// The board is a tilted plan: an orthographic camera at azimuth 0 (screen-x =
// grid column, screen-up = north = row 0) and elevation 72 degrees. An
// orthographic camera maps the ground plane y = 0 affinely, with one cell
// column = cellW px and one cell row = cellW * sin(elevation) px, so the cell
// rectangles of contract.ts fall out of the camera and nothing is fitted.
// The camera is built FROM the layout (elevation = asin(cellH / cellW)), so the
// layout the shell overlays and the picture can never disagree.
// ============================================================================

import * as THREE from 'three'
import type { BoardLayout } from '../../contract'

export const ELEVATION_DEG = 72
const SIN_EL = Math.sin((ELEVATION_DEG * Math.PI) / 180)
/** Paper margin (cells): numerals go top/left, a trim margin right/bottom. */
export const MARGIN_NW = 0.6
export const MARGIN_SE = 0.4

export function boardLayout(width: number, height: number, n: number): BoardLayout {
  const span = n + MARGIN_NW + MARGIN_SE
  let u = Math.max(1, Math.floor(Math.min(width / span, height / (span * SIN_EL))))
  // cellH is an integer, so rounding up can overshoot the box by a pixel or two: step u down
  while (u > 1 && span * Math.round(u * SIN_EL) > height) u--
  const cellH = Math.max(1, Math.round(u * SIN_EL))
  return {
    x0: Math.floor((width - span * u) / 2) + Math.round(MARGIN_NW * u),
    y0: Math.floor((height - span * cellH) / 2) + Math.round(MARGIN_NW * cellH),
    cellW: u,
    cellH,
  }
}

/** Elevation implied by a layout's cell aspect (72 degrees for boardLayout()). */
export function elevationOf(layout: BoardLayout): number {
  return Math.asin(Math.min(1, Math.max(0.05, layout.cellH / layout.cellW)))
}

/** The paper sheet in CSS px (the grid plus its margins). */
export function sheetRect(layout: BoardLayout, n: number) {
  const { x0, y0, cellW, cellH } = layout
  return {
    left: x0 - MARGIN_NW * cellW,
    top: y0 - MARGIN_NW * cellH,
    right: x0 + (n + MARGIN_SE) * cellW,
    bottom: y0 + (n + MARGIN_SE) * cellH,
  }
}

/**
 * Orthographic camera whose frustum is the board box in px / cellW (world
 * units are cells; x = column, z = row, y = up). `lookAt` is arranged so that
 * the ground point (c, 0, r) lands on x0 + c*cellW, y0 + r*cellH.
 */
export function makePlanCamera(layout: BoardLayout, width: number, height: number, n: number): THREE.OrthographicCamera {
  const { x0, y0, cellW, cellH } = layout
  const el = elevationOf(layout)
  const cam = new THREE.OrthographicCamera(
    -width / 2 / cellW, width / 2 / cellW, height / 2 / cellW, -height / 2 / cellW, 0.1, 400,
  )
  // ground point at the centre of the box
  const tx = n / 2 - (x0 + (n * cellW) / 2 - width / 2) / cellW
  const tz = n / 2 - (y0 + (n * cellH) / 2 - height / 2) / cellH
  const d = 100
  cam.position.set(tx, Math.sin(el) * d, tz + Math.cos(el) * d)
  cam.up.set(0, 1, 0)
  cam.lookAt(tx, 0, tz)
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld(true)
  return cam
}

/** Project a world point (cells) to CSS px in the board box through the camera. */
export function projectToBox(cam: THREE.OrthographicCamera, width: number, height: number, x: number, y: number, z: number): [number, number] {
  const v = new THREE.Vector3(x, y, z).project(cam)
  return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height]
}
