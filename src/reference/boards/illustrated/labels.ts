// Room-name placement for the illustrated board. A name sits INSIDE its room, horizontal, in the strip of a cell
// row that hugs a wall (the room's north wall first, then its south wall): a corner or an edge of the interior,
// never the middle of a cell, where a token sits. The plate is (0.69 em + 2 px) tall and is placed between the wall
// face and the cell centre, so its far edge stays short of every cell centre it passes.
//
// Hard rules, at every cell size: the whole plate lies inside the room's own cells; it never covers a cell centre;
// it never touches another plate (at least 6 px apart); it stays out of the cell a door swings into. Softer
// preferences, in this order: the full name over an abbreviation, clear of furniture, clear of door and window
// gaps, against a real wall, the north wall, the top-left corner.
//
// Labels are painted in an overlay ABOVE the token layer (see BoardLabels in index), so a name is never hidden by a
// token. The price is that a token standing in the strip under a plate loses the top of its portrait; the strip is
// the smallest the type size allows (see the legibility tests for the measured worst case).
import { DOOR_GAP, WINDOW_GAP, edgeHalf, isWall, type Edge, type Label, type Plan, type PlanRoom } from '../nightplan/plan'
import { furnitureFootprint } from '../../../core/types'

/** Smallest room-name type, px, at every cell size (11 px at 8 x 8 on a 390 px phone, where a cell is 37 px). */
export const LABEL_MIN_FS = 11
const LS = 0.04       // tracking, em (textLength fits the glyphs exactly)
const CHAR = 0.62     // average caps advance, em; textLength squeezes or spreads the real glyphs to the measured width
const PLATE_PAD = 0.03 // plate beyond the text on each side, cells
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
export const labelPlateOf = (l: Label): Box => [l.x - l.w / 2 - PLATE_PAD, l.cy - l.capH / 2, l.x + l.w / 2 + PLATE_PAD, l.cy + l.capH / 2]

/** Type size, px, for a cell size. */
export const labelFontPx = (u: number) => (u < 50 ? LABEL_MIN_FS : u < 64 ? 12 : 13)

/** Readable short forms, tried after the full name and before a blunt truncation. */
const SHORT: Record<string, string[]> = {
  'ENTRANCE HALL': ['ENTRANCE', 'HALL'], 'LIVING ROOM': ['LIVING', 'LOUNGE'], 'DINING ROOM': ['DINING', 'DINE'],
  BEDROOM: ['BED'], BATHROOM: ['BATH'], HALLWAY: ['HALL'], KITCHEN: ['KITCH', 'COOK'], CONSERVATORY: ['CONSERV.', 'GLASS'],
  'FRONT YARD': ['YARD'], PANTRY: ['PANTRY', 'LARDER'], LANDING: ['LANDING', 'LAND.'],
}

export function variants(name: string): string[] {
  const up = name.toUpperCase()
  const words = up.split(/\s+/)
  const v = [up]
  for (const c of SHORT[up] ?? []) if (!v.includes(c)) v.push(c)
  if (words.length > 1) {
    const noRoom = words.filter(w => w !== 'ROOM').join(' ')
    const last = words[words.length - 1]
    for (const c of [noRoom, last, words[0]]) if (c.length >= 3 && !v.includes(c)) v.push(c)
  }
  const cut = up.slice(0, 5) + '.'
  if (up.length > 6 && !v.includes(cut)) v.push(cut)
  // the last resorts: a bare three letters, then two
  for (const k of [3, 2]) { const t = up.replace(/[^A-Z0-9]/g, '').slice(0, k); if (up.length > k && t.length === k && !v.includes(t)) v.push(t) }
  return v
}

interface Run { row: number; a: number; b: number }

/** `keepClear`: boxes (cells) no plate may touch, such as the shell's evidence markers (see keepClear.ts). */
export function placeLabels(plan: Plan, u: number, keepClear: readonly Box[] = []): Label[] {
  const n = plan.n
  const fs = labelFontPx(u)
  // plate height: capitals (0.69 em) plus 1 px of plate above and below
  const capH = (0.69 * fs + 2) / u
  const widthOf = (text: string) => text.length * (CHAR + LS) * fs / u
  const gap = GAP_PX / u

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
    let best = null as { score: number; label: Label } | null
    const vs = variants(room.name)
    for (const relaxSwing of [false, true]) {
      for (let vi = 0; vi < vs.length; vi++) {
        // a later abbreviation can never beat a placement that is already cheaper than its own penalty
        if (best && best.score <= 3 * vi) break
        const text = vs[vi]
        const w = widthOf(text)
        for (const run of runs) {
          const r = run.row
          const left = run.a + halfAt('v', run.a, r) + 0.03 + PLATE_PAD
          const right = run.b - halfAt('v', run.b, r) - 0.03 - PLATE_PAD
          if (right - left < w - 1e-6) continue
          const xs: number[] = []
          for (let x = left; x <= right - w + 1e-6; x += 0.25) xs.push(x)
          if (xs[xs.length - 1] < right - w - 1e-6) xs.push(right - w)
          for (const north of [true, false]) {
            for (const x0 of xs) {
              const px0 = x0 - PLATE_PAD, px1 = x0 + w + PLATE_PAD
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
              let score = 3 * vi + (text.length <= 3 ? 6 : 0)
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
                best = { score, label: { roomId: room.id, text, x: x0 + w / 2, y: cy + capH / 2, cy, rot: 0, fs, ls: LS, mode: 'floor', w, capH } }
              }
            }
          }
        }
      }
      if (best) break
    }
    // no strip fits at all (cannot happen on a catalogue plan; keeps the call total): the room's own top-left corner
    const label = best?.label ?? (() => {
      const text = vs[vs.length - 1], w = widthOf(text)
      const cy = room.r0 + 0.12 + capH / 2
      return { roomId: room.id, text, x: room.c0 + 0.15 + w / 2, y: cy + capH / 2, cy, rot: 0 as const, fs, ls: LS, mode: 'floor' as const, w, capH, halo: true }
    })()
    placed.push(labelPlateOf(label))
    byRoom.set(room.id, label)
  }
  return plan.rooms.map(r => byRoom.get(r.id)!)
}
