// Room-name placement for the illustrated board. One rule, the same on every
// viewport: a name sits on the NORTH wall of its room when it has one (left-aligned,
// 0.08 cell in from the run's start), else south, else a side wall (reading bottom
// to top), else the lot fence below / right of the grid. The anchor wall does not
// depend on the cell size: a long name is abbreviated on the same wall before the
// label moves to another one.
//
// Labels are painted in an overlay ABOVE the token layer (see BoardLabels in index),
// so a token may sit under a label's edge but a label is never hidden. The plate is
// centred on the wall line and is at most (0.69 em + 2 px) tall: the part that sticks
// out of the wall never reaches a 0.5 x 0.5 cell centre, and it covers a sliver of a
// token box (about 4% at u = 32), never enough to hide a portrait.
import { DOOR_GAP, WINDOW_GAP, edgeHalf, isWall, type Edge, type Label, type Plan, type PlanRoom } from '../nightplan/plan'

export const LABEL_MIN_FS = 10
const LS = 0.04       // tracking, em (textLength fits the glyphs exactly)
const CHAR = 0.66     // average caps advance, em (serif / sans caps; textLength squeezes the rest)
const PAD = 0.05      // clearance between two label boxes, cells
const INSET = 0.08    // clearance from a run end or a door / window gap, cells

type Side = 'N' | 'S' | 'W' | 'E'
interface Run { side: Side; axis: 'h' | 'v'; line: number; a: number; b: number; half: number; key: string }

const box = (l: Label): [number, number, number, number] => (l.rot === 0
  ? [l.x - l.w / 2, l.cy - l.capH / 2, l.x + l.w / 2, l.cy + l.capH / 2]
  : [l.x - l.capH / 2, l.cy - l.w / 2, l.x + l.capH / 2, l.cy + l.w / 2])

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
  return v
}

/** Free stretches of one wall run once door and window gaps (plus clearance) are removed. */
function freeIntervals(run: Run, gaps: [number, number][]): [number, number][] {
  let out: [number, number][] = [[run.a, run.b]]
  for (const [g0, g1] of gaps) {
    out = out.flatMap(([a, b]) => (g1 + INSET <= a || g0 - INSET >= b ? [[a, b] as [number, number]] : [[a, Math.min(b, g0 - INSET)], [Math.max(a, g1 + INSET), b]].filter(([p, q]) => q - p > 0.05) as [number, number][]))
  }
  return out
}

export function placeLabels(plan: Plan, u: number): Label[] {
  const n = plan.n
  // font: 11 px on large cells; on phones max(10 px, 0.24u), never above 11.5 px
  const fs = u >= 60 ? 11 : Math.min(11.5, Math.max(10.5, Math.round(0.24 * u * 10) / 10))
  // plate height: capitals (0.69 em, >= 7 px at u = 32) plus 1 px of plate above and below
  const capH = (0.69 * fs + 2) / u
  const char = u < 48 ? 0.58 : CHAR // small cells: the same caps, set a touch condensed (textLength squeezes the glyphs)
  const widthOf = (text: string) => text.length * (char + LS) * fs / u

  const gapsAt = new Map<string, [number, number][]>()
  const addGap = (axis: string, line: number, pos: number, w: number) => {
    const k = `${axis}${line}.${pos}`
    const g0 = pos + (1 - w) / 2
    ;(gapsAt.get(k) ?? gapsAt.set(k, []).get(k)!).push([g0, g0 + w])
  }
  for (const d of plan.doors) addGap(d.axis, d.line, d.pos, DOOR_GAP)
  for (const w of plan.windows) addGap(w.axis, w.line, w.pos, WINDOW_GAP)

  const roomRuns = (room: PlanRoom): Run[] => {
    const runs: Run[] = []
    const mine = (e: Edge, plus: boolean) => {
      const c = plus ? e.p : e.m
      return !!c && plan.roomAt[c[0]][c[1]] === room.id
    }
    const kinds: { axis: 'h' | 'v'; plus: boolean; side: Side }[] = [
      { axis: 'h', plus: true, side: 'N' }, { axis: 'h', plus: false, side: 'S' },
      { axis: 'v', plus: true, side: 'W' }, { axis: 'v', plus: false, side: 'E' },
    ]
    for (const { axis, plus, side } of kinds) {
      const es = plan.edges.filter(e => e.axis === axis && isWall(e) && mine(e, plus))
      const lines = [...new Set(es.map(e => e.line))].sort((x, y) => x - y)
      for (const line of lines) {
        // the left perimeter (x = 0) belongs to the shell's numeral pills
        if (axis === 'v' && line === 0) continue
        const row = es.filter(e => e.line === line).sort((x, y) => x.pos - y.pos)
        let cur: Run | null = null
        for (const e of row) {
          const half = edgeHalf(e)
          if (cur && Math.abs(cur.b - e.pos) < 1e-6 && cur.half === half) cur.b = e.pos + 1
          else { cur = { side, axis, line, a: e.pos, b: e.pos + 1, half, key: `${axis}${line}${side}` }; runs.push(cur) }
        }
      }
    }
    return runs
  }
  const gapsOf = (run: Run) => {
    const out: [number, number][] = []
    for (let p = Math.floor(run.a); p < run.b; p++) for (const g of gapsAt.get(`${run.axis}${run.line}.${p}`) ?? []) out.push(g)
    return out.sort((x, y) => x[0] - y[0])
  }

  const placed: Label[] = []
  // two names on one wall line keep a gap of max(6 px, half a label height) so they never read as one phrase
  // (the plate is 0.03 wider than the text on each side, so measured plate-to-plate the gap is the same)
  const gapAlong = Math.max(6 / u, capH / 2) + 0.06
  const hits = (l: Label) => placed.some(p => {
    const a = box(l), b = box(p)
    const px = l.rot === 0 ? gapAlong : PAD, py = l.rot === 0 ? PAD : gapAlong
    const qx = p.rot === 0 ? gapAlong : PAD, qy = p.rot === 0 ? PAD : gapAlong
    const gx = Math.max(px, qx), gy = Math.max(py, qy)
    return a[0] < b[2] + gx && a[2] > b[0] - gx && a[1] < b[3] + gy && a[3] > b[1] - gy
  })
  const mk = (room: PlanRoom, text: string, run: Run, centre: number): Label => {
    const w = widthOf(text)
    const rot = run.axis === 'h' ? 0 : -90
    // the plaque is centred on the wall line (outer walls sit a hair outward, as the thick poche does)
    const cx = run.axis === 'v' ? run.line : 0
    return run.axis === 'h'
      ? { roomId: room.id, text, x: centre, y: run.line + capH / 2, cy: run.line, rot: 0, fs, ls: LS, mode: 'wall', w, capH }
      : { roomId: room.id, text, x: cx, y: centre + capH / 2, cy: centre, rot, fs, ls: LS, mode: 'wall', w, capH }
  }

  const order = [...plan.rooms].sort((a, b) => a.r0 - b.r0 || a.c0 - b.c0 || (a.id < b.id ? -1 : 1))
  const byRoom = new Map<string, Label>()
  for (const room of order) {
    const runs = roomRuns(room)
    const sideRank: Record<Side, number> = { N: 0, S: 1, W: 2, E: 3 }
    // north first, then south, west, east; on a side prefer the run nearest the room's own edge, longest first
    runs.sort((x, y) => sideRank[x.side] - sideRank[y.side] || (x.side === 'S' ? y.line - x.line : x.line - y.line) || (y.b - y.a) - (x.b - x.a) || x.a - y.a)
    let pick: Label | null = null
    // walk walls in rank order; for each wall try the full name, then the abbreviations
    const sides: Side[] = ['N', 'S', 'W', 'E']
    for (const side of sides) {
      const cand = runs.filter(r => r.side === side)
      if (!cand.length) continue
      for (const text of variants(room.name)) {
        for (const run of cand) {
          const w = widthOf(text)
          for (const [a, b] of freeIntervals(run, gapsOf(run))) {
            if (b - a < w + 0.06) continue
            const centre = a + INSET + w / 2 // left-aligned in the interval
            const lab = mk(room, text, run, centre)
            if (!hits(lab)) { pick = lab; break }
            // nudge along the interval before giving up on it
            for (let k = 1; k * 0.05 <= b - a - w - 0.1 && !pick; k++) {
              const c2 = centre + k * 0.05
              if (c2 + w / 2 > b - INSET + 0.02) break
              const l2 = mk(room, text, run, c2)
              if (!hits(l2)) pick = l2
            }
            if (pick) break
          }
          if (pick) break
        }
        if (pick) break
      }
      if (pick) break
    }
    if (!pick) {
      // outdoor room with no wall of its own: the lot fence below or right of the grid (outside the grid, so no token can be under it)
      for (const text of variants(room.name)) {
        const w = widthOf(text)
        const bottom = plan.edges.filter(e => e.axis === 'h' && e.line === n && e.p === null && e.m && plan.roomAt[e.m[0]][e.m[1]] === room.id).sort((x, y) => x.pos - y.pos)
        if (bottom.length) {
          const a = bottom[0].pos, b = bottom[bottom.length - 1].pos + 1
          if (b - a >= w + 0.2) {
            const l = { roomId: room.id, text, x: a + 0.15 + w / 2, y: n + 0.08 + capH / 2, cy: n + 0.08, rot: 0 as const, fs, ls: LS, mode: 'fence' as const, w, capH }
            if (!hits(l)) { pick = l; break }
          }
        }
      }
    }
    if (!pick) {
      // or the lot fence to the right of the grid, reading bottom to top
      for (const text of variants(room.name)) {
        const w = widthOf(text)
        const right = plan.edges.filter(e => e.axis === 'v' && e.line === n && e.p === null && e.m && plan.roomAt[e.m[0]][e.m[1]] === room.id).sort((x, y) => x.pos - y.pos)
        if (right.length) {
          const a = right[0].pos, b = right[right.length - 1].pos + 1
          if (b - a >= w + 0.2) {
            const l: Label = { roomId: room.id, text, x: n + 0.08, y: a + 0.15 + w / 2 + capH / 2, cy: a + 0.15 + w / 2, rot: -90, fs, ls: LS, mode: 'fence', w, capH }
            if (!hits(l)) { pick = l; break }
          }
        }
      }
    }
    if (!pick) {
      // last resort: tucked in the room's top band with a dark halo (flagged so the renderer paints it on a plate)
      const text = variants(room.name)[variants(room.name).length - 1]
      const w = widthOf(text)
      pick = { roomId: room.id, text, x: Math.min(n - w / 2 - 0.05, room.c0 + 0.1 + w / 2), y: room.r0 + 0.1 + capH, cy: room.r0 + 0.1 + capH / 2, rot: 0, fs, ls: LS, mode: 'floor', w, capH, halo: true }
    }
    placed.push(pick)
    byRoom.set(room.id, pick)
  }
  return plan.rooms.map(r => byRoom.get(r.id)!)
}

export const labelBoxOf = box
