// Room-name placement for the illustrated board. A name sits INSIDE its room, horizontal, in the strip of a cell
// row that hugs a wall (the room's north wall first, then its south wall): a corner or an edge of the interior,
// never the middle of a cell, where a token sits. The plate is (0.72 em + 2 px) tall (cap height plus most of the descenders
// of a title-case name) and is placed between the wall face and the cell centre, so its far edge stays short of
// every cell centre it passes. Names are set in Title Case in the interface face (Hanken Grotesk), in every style
// pack; `Label.text` stays the upper-case key, and labelsView.tsx draws displayLabel() of it.
//
// Hard rules, at every cell size: the whole plate lies inside the room's own cells; it never covers a cell centre;
// it never touches another plate (at least 6 px apart); it stays out of the cell a door swings into. Softer
// preferences, in this order: the full name (with the plate's padding dropped, then on a phone smaller than a 30 px
// cell, shrunk to 10 px) over an abbreviation, which is always a real word (Bath, Hall, Bed); clear of furniture, clear
// of door and window gaps, against a real wall, the north wall, the top-left corner.
//
// Labels are painted in an overlay ABOVE the token layer (see BoardLabels in index), so a plate must yield to a token:
// given the boxes of the occupied squares, the plate moves to another strip of its room that none of them touches
// (a shorter name if that is what fits). Only when the room has no such spot is the plate kept where it scores best
// and marked `faded`, which the overlay paints at 20% opacity. With nothing occupied the placement is the base one.
import { DOOR_GAP, WINDOW_GAP, edgeHalf, isWall, type Edge, type Label, type Plan, type PlanRoom } from '../nightplan/plan'
import { furnitureFootprint } from '../../../core/types'

/** Smallest room-name type, px, at every cell size (11 px at 8 x 8 on a 390 px phone, where a cell is 37 px). */
export const LABEL_MIN_FS = 11
/** Below this cell size (a 320 px phone), a name may drop to LABEL_TIGHT_FS before it is abbreviated. */
const TIGHT_BELOW_PX = 30
export const LABEL_TIGHT_FS = 10
const LS = 0.02       // tracking, em (textLength fits the glyphs exactly)
const PLATE_PAD = 0.03 // plate beyond the text on each side, cells
/** Badge of a token (the initial) hangs this far past the token's painted box, px: plates keep clear of it too. */
const BADGE_CLEAR_PX = 2
/** Hanken Grotesk 600 advance widths, em, measured in Chromium. */
const ADV: Record<string, number> = { A: 0.66, B: 0.61, C: 0.71, D: 0.68, E: 0.58, F: 0.56, G: 0.73, H: 0.69, I: 0.26, J: 0.55, K: 0.65, L: 0.5, M: 0.85, N: 0.69, O: 0.75, P: 0.56, Q: 0.78, R: 0.61, S: 0.57, T: 0.59, U: 0.66, V: 0.67, W: 0.97, X: 0.66, Y: 0.62, Z: 0.6, a: 0.54, b: 0.58, c: 0.52, d: 0.58, e: 0.54, f: 0.34, g: 0.52, h: 0.56, i: 0.24, j: 0.24, k: 0.55, l: 0.27, m: 0.84, n: 0.56, o: 0.57, p: 0.58, q: 0.58, r: 0.42, s: 0.47, t: 0.36, u: 0.56, v: 0.53, w: 0.75, x: 0.53, y: 0.53, z: 0.47, '.': 0.24, ' ': 0.26 }

/** The upper-case key of a label as it is drawn: "LIVING ROOM" -> "Living Room". */
export const displayLabel = (text: string): string => text.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase())
/** Width of a drawn name, em, tracking included. */
const emOf = (text: string): number => [...displayLabel(text)].reduce((w, ch) => w + (ADV[ch] ?? 0.58) + LS, 0)

/** A placed label: the shared Label plus the padding its plate was given (cells), which a tight plate drops to 0. */
export type PlacedLabel = Label & { pad?: number }
const GAP_PX = 6      // clear space between two plates, px
const WALL_CLEAR = 0.005 // clear space between a wall face and the plate, cells
const CENTRE_CLEAR_PX = 1.5 // a plate stays at least this far from every cell centre, px

type Box = [number, number, number, number]
const overlap = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
const area = (a: Box) => Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1])
const inter = (a: Box, b: Box): Box => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]

/** The text box of a label, cells: [x0, y0, x1, y1]. */
export const labelBoxOf = (l: Label): Box => [l.x - l.w / 2, l.cy - l.capH / 2, l.x + l.w / 2, l.cy + l.capH / 2]
/** The painted plate (text box plus its padding), cells. */
export const labelPlateOf = (l: Label): Box => { const pad = (l as PlacedLabel).pad ?? PLATE_PAD; return [l.x - l.w / 2 - pad, l.cy - l.capH / 2, l.x + l.w / 2 + pad, l.cy + l.capH / 2] }

/** Type size, px, for a cell size. */
export const labelFontPx = (u: number) => (u < 50 ? LABEL_MIN_FS : u < 64 ? 12 : 13)

/** Readable short forms, tried after the full name: always a real word, never a stub. */
const SHORT: Record<string, string[]> = {
  'ENTRANCE HALL': ['ENTRANCE', 'HALL'], 'LIVING ROOM': ['LIVING', 'LOUNGE'], 'DINING ROOM': ['DINING'],
  BEDROOM: ['BED'], BATHROOM: ['BATH'], HALLWAY: ['HALL'], CONSERVATORY: ['GLASS'], 'FRONT YARD': ['YARD'], PANTRY: ['LARDER'],
}
const NOT_A_NAME = new Set(['ROOM', 'HOUSE'])

export function variants(name: string): string[] {
  const up = name.toUpperCase()
  const words = up.split(/\s+/)
  const v = [up]
  for (const c of SHORT[up] ?? []) if (!v.includes(c)) v.push(c)
  if (words.length > 1) {
    const noRoom = words.filter(w => w !== 'ROOM').join(' ')
    const last = words[words.length - 1]
    for (const c of [noRoom, last, words[0]]) if (c.length >= 3 && !NOT_A_NAME.has(c) && !v.includes(c)) v.push(c)
  }
  return v
}

interface Run { row: number; a: number; b: number }

/** `keepClear`: boxes (cells) no plate may touch, such as the shell's evidence markers (see keepClear.ts). */
/** `occupied`: the painted boxes (cells) of squares holding a token, ghost or ring (see tokenGeometry.ts). */
export function placeLabels(plan: Plan, u: number, keepClear: readonly Box[] = [], occupiedIn: readonly Box[] = []): PlacedLabel[] {
  const n = plan.n
  const fs = labelFontPx(u)
  // plate height: capitals and most of the descenders of a title-case name (0.72 em), plus 1 px of plate above and below
  const capHOf = (size: number) => (0.72 * size + 2) / u
  const widthOf = (text: string, size: number) => emOf(text) * size / u
  const gap = GAP_PX / u
  // A token's badge hangs past its painted box: a plate keeps clear of that too.
  const m = BADGE_CLEAR_PX / u
  const occupied = occupiedIn.map(o => [o[0] - m, o[1] - m, o[2] + m, o[3] + m] as Box)
  // Before a name is abbreviated: the same name with the plate's padding dropped, then (a phone smaller than a 30 px
  // cell only) at 10 px. Each costs less than an abbreviation, which is a real word but not the room's name.
  const tiers = [{ size: fs, pad: PLATE_PAD, cost: 0 }, { size: fs, pad: 0, cost: 1 }, ...(u < TIGHT_BELOW_PX ? [{ size: LABEL_TIGHT_FS, pad: 0, cost: 2 }] : [])]

  const edgeAt = new Map<string, Edge>()
  for (const e of plan.edges) edgeAt.set(`${e.axis}${e.line}.${e.pos}`, e)
  const halfAt = (axis: 'h' | 'v', line: number, pos: number) => {
    const e = edgeAt.get(`${axis}${line}.${pos}`)
    return e && isWall(e) ? edgeHalf(e) : 0.03
  }
  const isWallAt = (axis: 'h' | 'v', line: number, pos: number) => { const e = edgeAt.get(`${axis}${line}.${pos}`); return !!e && isWall(e) }

  // furniture footprints (a rug is a floor covering: a plate over one hides nothing)
  const furn: Box[] = plan.furniture.filter(f => f.type !== 'rug').map(f => { const { w, h } = furnitureFootprint(f); return [f.col, f.row, f.col + w, f.row + h] as Box })
  // the cell each hinged door swings into, and the stretch of wall each door or window opens
  const swing: Box[] = []
  const openings: Box[] = []
  for (const d of plan.doors) {
    const [r, c] = d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
    if (!d.pocket) swing.push([c, r, c + 1, r + 1])
    const g0 = d.pos + (1 - DOOR_GAP) / 2
    openings.push(d.axis === 'h' ? [g0, d.line - 0.5, g0 + DOOR_GAP, d.line + 0.5] : [d.line - 0.5, g0, d.line + 0.5, g0 + DOOR_GAP])
  }
  for (const w of plan.windows) {
    const g0 = w.pos + (1 - WINDOW_GAP) / 2
    openings.push(w.axis === 'h' ? [g0, w.line - 0.45, g0 + WINDOW_GAP, w.line + 0.45] : [w.line - 0.45, g0, w.line + 0.45, g0 + WINDOW_GAP])
  }

  const runsOf = (room: PlanRoom): Run[] => {
    const out: Run[] = []
    for (let r = room.r0; r <= room.r1; r++) {
      let a = -1
      for (let c = 0; c <= n; c++) {
        const mine = c < n && plan.roomAt[r][c] === room.id
        if (mine && a < 0) a = c
        if (!mine && a >= 0) { out.push({ row: r, a, b: c }); a = -1 }
      }
    }
    return out
  }

  const placed: Box[] = []
  const order = [...plan.rooms].sort((a, b) => a.r0 - b.r0 || a.c0 - b.c0 || (a.id < b.id ? -1 : 1))
  const byRoom = new Map<string, Label>()

  for (const room of order) {
    const runs = runsOf(room)
    let best = null as { score: number; label: PlacedLabel } | null
    const vs = variants(room.name)
    for (const relaxSwing of [false, true]) {
      for (let vi = 0; vi < vs.length; vi++) {
        // a later abbreviation can never beat a placement that is already cheaper than its own penalty
        if (best && best.score <= 3 * vi) break
        const text = vs[vi]
        for (const tier of tiers) {
        const w = widthOf(text, tier.size), capH = capHOf(tier.size), pad = tier.pad
        for (const run of runs) {
          const r = run.row
          const left = run.a + halfAt('v', run.a, r) + 0.03 + pad
          const right = run.b - halfAt('v', run.b, r) - 0.03 - pad
          if (right - left < w - 1e-6) continue
          const xs: number[] = []
          for (let x = left; x <= right - w + 1e-6; x += 0.25) xs.push(x)
          if (xs[xs.length - 1] < right - w - 1e-6) xs.push(right - w)
          for (const north of [true, false]) {
            for (const x0 of xs) {
              const px0 = x0 - pad, px1 = x0 + w + pad
              const c0 = Math.max(run.a, Math.floor(px0)), c1 = Math.min(run.b - 1, Math.floor(px1 - 1e-6))
              let wallHalf = 0, walls = 0
              for (let c = c0; c <= c1; c++) {
                wallHalf = Math.max(wallHalf, halfAt('h', north ? r : r + 1, c))
                if (isWallAt('h', north ? r : r + 1, c)) walls++
              }
              const y0 = north ? r + wallHalf + WALL_CLEAR : r + 1 - wallHalf - WALL_CLEAR - capH
              const plate: Box = [px0, y0, px1, y0 + capH]
              // never over a cell centre: with the plate between a wall face and the middle of the row this is a
              // vertical test, run for every cell the plate spans
              if (plate[3] + CENTRE_CLEAR_PX / u > r + 0.5 && plate[1] - CENTRE_CLEAR_PX / u < r + 0.5) continue
              const hit = placed.some(p => overlap([plate[0] - gap, plate[1] - gap, plate[2] + gap, plate[3] + gap], p))
              if (hit || keepClear.some(k => overlap(plate, k))) continue
              if (!relaxSwing && swing.some(s => overlap(plate, s))) continue
              // soft costs
              let score = 3 * vi + tier.cost + (text.length <= 3 ? 6 : 0)
              // a plate over a token is the last resort: any clear spot, however short the name, beats it
              const hidden = occupied.reduce((s, o) => s + (overlap(plate, o) ? area(inter(plate, o)) : 0), 0)
              if (hidden > 0) score += 100 + 10 * hidden / area(plate)
              if (relaxSwing) score += 6
              score += 6 * furn.reduce((s, f) => s + (overlap(plate, f) ? area(inter(plate, f)) : 0), 0) / area(plate)
              score += 2 * openings.filter(o => overlap(plate, o)).length
              // two names back to back across a wall read as one phrase: keep a plate off the strip facing another plate
              if (placed.some(p => overlap([plate[0] - 0.2, plate[1] - 0.45, plate[2] + 0.2, plate[3] + 0.45], p))) score += 2
              if (walls === 0) score += 1.5
              else if (walls < c1 - c0 + 1) score += 0.5
              if (!north) score += 0.6
              score += 0.15 * (r - room.r0) + 0.1 * (x0 - left)
              if (!best || score < best.score - 1e-9) {
                const cy = (plate[1] + plate[3]) / 2
                best = { score, label: { roomId: room.id, text, x: x0 + w / 2, y: cy + capH / 2, cy, rot: 0, fs: tier.size, ls: LS, mode: 'floor', w, capH, pad, ...(hidden > 0 ? { faded: true } : {}) } }
              }
            }
          }
        }
        }
      }
      if (best && !best.label.faded) break
    }
    // no strip fits at all (cannot happen on a catalogue plan; keeps the call total): the room's own top-left corner
    const label = best?.label ?? (() => {
      const text = vs[vs.length - 1], w = widthOf(text, fs), capH = capHOf(fs)
      const cy = room.r0 + 0.12 + capH / 2
      const l = { roomId: room.id, text, x: room.c0 + 0.15 + w / 2, y: cy + capH / 2, cy, rot: 0 as const, fs, ls: LS, mode: 'floor' as const, w, capH, halo: true }
      return occupied.some(o => overlap(labelPlateOf(l), o)) ? { ...l, faded: true } : l
    })()
    placed.push(labelPlateOf(label))
    byRoom.set(room.id, label)
  }
  return plan.rooms.map(r => byRoom.get(r.id)!)
}
