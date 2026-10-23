// Wall-mounted decor, windows, curtains and doors. Decor is placed by a
// deterministic planner (no randomness beyond hashed ids) on free wall faces:
// never in front of furniture, never on a door or window, never in a door's
// swing cell, never on a label. Everything lives within 0.23 cell of the wall
// line (0.14 beyond an interior wall face, 0.095 beyond an exterior one), so a
// cell's 0.6 x 0.6 centre zone is never touched.
//
// Decor kinds map onto a FurnitureType only when they could be mistaken for one
// ("sconce" reads as a lamp). A decor kind whose type is referenced by a clue of
// the puzzle is never placed (see `clueTypesOf`).
import type { ReactNode } from 'react'
import type { Furniture, FurnitureType, Puzzle } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { darken, hashStr, lighten } from './color'
import { roleOf } from './rooms'
import type { Reg } from './reg'
import type { Role, StyleKit } from './styles/types'
import { DOOR_GAP, WINDOW_GAP, doorGeom, edgeHalf, isWall, labelBox, pt, type Door, type Edge, type Label, type Plan, type Win } from '../nightplan/plan'

const f = (v: number) => +v.toFixed(3)
const INK = '#15110E'

/** Furniture types any clue of this puzzle talks about. Decor of such a type is never drawn. */
export function clueTypesOf(puzzle: Puzzle): Set<FurnitureType> {
  const out = new Set<FurnitureType>()
  for (const c of puzzle.clues) {
    const k = c.clue as { kind: string; furniture?: FurnitureType | FurnitureType[] }
    if (k.kind === 'onFurniture' || k.kind === 'besideFurniture' || k.kind === 'onlyOnFurniture') {
      if (typeof k.furniture === 'string') out.add(k.furniture)
    } else if (k.kind === 'besideAny' && Array.isArray(k.furniture)) k.furniture.forEach(t => out.add(t))
  }
  return out
}

export type DecorKind = 'hooks' | 'painting' | 'oval' | 'tapestry' | 'fan' | 'canvas' | 'niche' | 'mirror' | 'sconce' | 'fireplace' | 'plates'
/** Which furniture type a decor kind could be mistaken for. */
export const DECOR_AS_TYPE: Partial<Record<DecorKind, FurnitureType>> = { sconce: 'lamp' }

export interface DecorItem {
  kind: DecorKind
  /** Edge the item hangs on, the room-side sign and the cell it faces. */
  edge: Edge
  side: -1 | 1
  cell: readonly [number, number]
  /** Centre along the wall, in cell units. */
  along: number
  /** Available depth beyond the inner wall face. */
  depth: number
  half: number
  roomId: string
  seed: number
  /** World point of the light this item emits (if any) and its glow colour. */
  glow?: { x: number; y: number; color: string; r: number; a: number }
}

const ek = (axis: string, line: number, pos: number) => `${axis}${line}.${pos}`

export interface Geo {
  occ: Set<string>
  doorEdges: Set<string>
  windowEdges: Set<string>
  swingCells: Set<string>
  roleOf: Map<string, Role>
}

export function buildGeo(plan: Plan): Geo {
  const occ = new Set<string>()
  for (const fu of plan.furniture) {
    if (fu.type === 'rug') continue
    const { w, h } = furnitureFootprint(fu)
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) occ.add(`${fu.row + dr},${fu.col + dc}`)
  }
  const swingCells = new Set<string>()
  for (const d of plan.doors) {
    const [r, c] = d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
    swingCells.add(`${r},${c}`)
    // the cells on both sides of the door are keep-clear for decor
    const [r2, c2] = d.axis === 'h' ? [d.swing === -1 ? d.line : d.line - 1, d.pos] : [d.pos, d.swing === -1 ? d.line : d.line - 1]
    swingCells.add(`${r2},${c2}`)
  }
  return {
    occ,
    doorEdges: new Set(plan.doors.map(d => ek(d.axis, d.line, d.pos))),
    windowEdges: new Set(plan.windows.map(w => ek(w.axis, w.line, w.pos))),
    swingCells,
    roleOf: new Map(plan.rooms.map(r => [r.id, roleOf(r.name)])),
  }
}

const PAINT: Record<StyleKit['id'], DecorKind> = {
  victorian: 'painting', artdeco: 'fan', tudor: 'tapestry', modernist: 'canvas', mediterranean: 'niche',
}

/** How many of each decor a room of this role receives. */
function wishes(role: Role, st: StyleKit): DecorKind[] {
  const d = st.decor
  const art = PAINT[st.id]
  const out: DecorKind[] = []
  const sconce = d.sconce !== 'none'
  switch (role) {
    case 'hall': case 'landing': if (sconce) out.push('sconce'); out.push(art); if (d.mirror) out.push('mirror'); if (st.id === 'victorian' || st.id === 'tudor') out.push('hooks'); break
    case 'living': if (d.fireplace) out.push('fireplace'); out.push(art, art); if (sconce) out.push('sconce'); if (d.mirror) out.push('mirror'); break
    case 'dining': if (d.fireplace) out.push('fireplace'); out.push(art); if (sconce) out.push('sconce'); break
    case 'study': out.push(art); if (d.fireplace && st.id === 'tudor') out.push('fireplace'); break
    case 'bed': out.push(st.id === 'victorian' ? 'oval' : art); if (d.mirror) out.push('mirror'); break
    case 'kitchen': if (st.id === 'tudor' && d.fireplace) out.push('fireplace'); if (d.shelf) out.push('plates'); break
    case 'bath': if (d.mirror) out.push('mirror'); break
    case 'pantry': if (st.id === 'tudor' && d.fireplace) out.push('fireplace'); if (d.shelf) out.push('plates'); break
    case 'conservatory': break
    default: break
  }
  return out
}

export function planDecor(plan: Plan, geo: Geo, st: StyleKit, blocked: Set<FurnitureType>, labels: Label[] = plan.labels): DecorItem[] {
  const out: DecorItem[] = []
  const labelBoxes = labels.map(l => labelBox(l))
  const cellRoom = (r: number, c: number) => plan.roomAt[r]?.[c] ?? null
  const rooms = [...plan.rooms].filter(r => !r.exterior).sort((a, b) => (a.id < b.id ? -1 : 1))
  const taken = new Set<string>()
  // light sources already on the plan: lamps and ranges, plus every sconce / fireplace placed so far
  const sources: [number, number][] = plan.furniture.filter(fu => fu.type === 'lamp' || fu.type === 'stove').map(fu => [fu.col + 0.5, fu.row + 0.5])
  for (const room of rooms) {
    const role = geo.roleOf.get(room.id) ?? 'other'
    const wants = wishes(role, st).filter(k => !blocked.has(DECOR_AS_TYPE[k] as FurnitureType))
    if (!wants.length) continue
    // candidate slots: wall faces of this room whose cell is free and clear
    type Slot = { edge: Edge; side: -1 | 1; cell: readonly [number, number]; half: number; depth: number; score: number }
    const slots: Slot[] = []
    for (const e of plan.edges) {
      if (!isWall(e)) continue
      const key = ek(e.axis, e.line, e.pos)
      if (geo.doorEdges.has(key) || geo.windowEdges.has(key)) continue
      for (const side of [-1, 1] as const) {
        const cell = side === -1 ? e.m : e.p
        if (!cell || cellRoom(cell[0], cell[1]) !== room.id) continue
        const ck = `${cell[0]},${cell[1]}`
        if (geo.occ.has(ck) || geo.swingCells.has(ck)) continue
        // top and left perimeter faces sit against the numeral gutter: decor stays on faces with real depth
        const half = edgeHalf(e)
        const depth = 0.23 - half
        // keep decor off labels
        const along = e.pos + 0.5
        const clash = labelBoxes.some(b => {
          const [x0, y0, x1, y1] = e.axis === 'h' ? [along - 0.45, e.line - half, along + 0.45, e.line + half] : [e.line - half, along - 0.45, e.line + half, along + 0.45]
          return b[0] < x1 && b[2] > x0 && b[1] < y1 && b[3] > y0
        })
        if (clash) continue
        const run = e.axis === 'h' ? cell[1] : cell[0]
        const mid = e.axis === 'h' ? (room.c0 + room.c1) / 2 : (room.r0 + room.r1) / 2
        const score = Math.abs(run - mid) * 0.4 + ((hashStr(`${room.id}${key}${side}`) % 1000) / 1000) * 1.2 + (e.kind === 'int' ? 0 : 0.35)
        slots.push({ edge: e, side, cell, half, depth, score })
      }
    }
    slots.sort((a, b) => a.score - b.score)
    for (const want of wants) {
      const pick = slots.find(s => {
        const ck = `${s.cell[0]},${s.cell[1]}:${s.edge.axis}${s.edge.line}`
        if (taken.has(ck)) return false
        // a fireplace needs real depth and an uncluttered neighbourhood
        if (want === 'fireplace' && s.depth < 0.09) return false
        // light sources keep apart: two pools never stack inside one cell centre zone
        if (want === 'fireplace' || want === 'sconce') {
          const sx = s.cell[1] + 0.5, sy = s.cell[0] + 0.5
          if (sources.some(([x, y]) => Math.hypot(x - sx, y - sy) < 1.75)) return false
        }
        return true
      })
      if (!pick) continue
      taken.add(`${pick.cell[0]},${pick.cell[1]}:${pick.edge.axis}${pick.edge.line}`)
      const along = pick.edge.pos + 0.5
      const item: DecorItem = {
        kind: want, edge: pick.edge, side: pick.side, cell: pick.cell, along, depth: pick.depth, half: pick.half,
        roomId: room.id, seed: hashStr(`${room.id}${want}${along}`),
      }
      if (want === 'fireplace' || want === 'sconce') {
        const [x, y] = pt(pick.edge.axis, pick.edge.line, along, pick.side * (pick.half + 0.04))
        item.glow = want === 'fireplace' ? { x, y, color: '#ff8a3a', r: 1.3, a: 0.34 } : { x, y, color: '#ffb65a', r: 1.3, a: 0.3 }
      }
      out.push(item)
      if (want === 'fireplace' || want === 'sconce') sources.push([pick.cell[1] + 0.5, pick.cell[0] + 0.5])
      // spread out: drop the slots right next to the one used
      for (let i = slots.length - 1; i >= 0; i--) {
        const s = slots[i]
        if (s === pick) { slots.splice(i, 1); continue }
        if (s.edge.axis === pick.edge.axis && s.edge.line === pick.edge.line && Math.abs(s.edge.pos - pick.edge.pos) <= (want === 'fireplace' ? 1 : 0)) slots.splice(i, 1)
      }
    }
  }
  return out
}

/** Frame: local x along the wall, local y into the room, origin at the inner wall face under `along`. */
function slotTransform(it: DecorItem): string {
  const e = it.edge
  const [px, py] = pt(e.axis, e.line, it.along, it.side * it.half)
  const rot = e.axis === 'h' ? (it.side === 1 ? 0 : 180) : (it.side === 1 ? -90 : 90)
  return `translate(${f(px)} ${f(py)}) rotate(${rot})`
}

function decorArt(it: DecorItem, reg: Reg, st: StyleKit, px: number): ReactNode {
  const pal = st.pal
  const line = { stroke: INK, strokeOpacity: 0.55, strokeWidth: px }
  switch (it.kind) {
    case 'fireplace': {
      const d = Math.max(0.08, it.depth - 0.005)
      const stone = st.id === 'tudor' ? '#77736a' : st.id === 'artdeco' ? '#c9a24a' : '#8c867a'
      return (<>
        <rect x={-0.46} y={-0.02} width={0.92} height={f(d + 0.02)} rx={0.015} fill={reg.sheen(stone)} {...line} />
        <rect x={-0.5} y={f(d - 0.03)} width={1.0} height={0.03} rx={0.01} fill={lighten(stone, 0.18)} {...line} />
        <rect x={-0.22} y={-0.05} width={0.44} height={f(d + 0.0)} rx={0.01} fill="#120c09" stroke={INK} strokeOpacity={0.8} strokeWidth={px} />
        <rect x={-0.18} y={-0.01} width={0.36} height={f(d - 0.03)} fill={reg.glow('#ff9a3a', 0.95, 0.35)} />
        <path d={`M-0.1 ${f(d - 0.035)}q0.03 -0.05 0.05 0 q0.03 -0.06 0.06 0 q0.03 -0.05 0.05 0`} fill="none" stroke="#ffd98a" strokeOpacity={0.8} strokeWidth={px * 1.2} />
        {[-0.3, 0.3].map(x => <rect key={x} x={f(x - 0.03)} y={0} width={0.06} height={f(d)} fill={darken(stone, 0.2)} fillOpacity={0.55} />)}
      </>)
    }
    case 'painting': {
      const gilt = pal.metal
      return (<>
        <rect x={-0.17} y={0} width={0.34} height={0.05} rx={0.006} fill={reg.sheen(gilt)} {...line} />
        <rect x={-0.15} y={0.01} width={0.3} height={0.03} fill={['#1d3a2f', '#3a2a22', '#26324a'][it.seed % 3]} />
        <path d="M-0.14 0.03 q0.06 -0.02 0.12 0 t0.12 -0.01" fill="none" stroke="#d8c98a" strokeOpacity={0.5} strokeWidth={px} />
      </>)
    }
    case 'oval':
      return (<>
        <ellipse cx={0} cy={0.045} rx={0.11} ry={0.04} fill={reg.sheen(pal.metal)} {...line} />
        <ellipse cx={0} cy={0.045} rx={0.085} ry={0.027} fill="#2b1d1a" />
        <ellipse cx={-0.02} cy={0.04} rx={0.03} ry={0.012} fill="#d8b890" fillOpacity={0.7} />
      </>)
    case 'tapestry':
      return (<>
        <rect x={-0.25} y={0} width={0.5} height={0.05} fill="#6e1f22" {...line} />
        <path d="M-0.22 0.025H0.22" stroke="#c9b98a" strokeOpacity={0.7} strokeWidth={px * 2} />
        {[-0.2, -0.1, 0, 0.1, 0.2].map(x => <path key={x} d={`M${x} 0.05v0.025`} stroke="#c9b98a" strokeOpacity={0.8} strokeWidth={px * 1.5} />)}
      </>)
    case 'fan': {
      const g = pal.metal
      return (<>
        <path d="M-0.22 0 A0.22 0.22 0 0 0 0.22 0 Z" fill={darken(g, 0.45)} {...line} transform="scale(1 0.42)" />
        {[-2, -1, 0, 1, 2].map(k => <path key={k} d={`M0 0L${f(Math.sin(k * 0.38) * 0.2)} ${f(Math.cos(k * 0.38) * 0.085)}`} stroke={g} strokeOpacity={0.9} strokeWidth={px * 1.4} />)}
      </>)
    }
    case 'canvas':
      return (<>
        <rect x={-0.22} y={0} width={0.44} height={0.035} fill="#e8e4d8" {...line} />
        <rect x={-0.2} y={0.006} width={0.14} height={0.022} fill="#c8553a" />
        <rect x={-0.04} y={0.006} width={0.1} height={0.022} fill="#2a4352" />
        <rect x={0.08} y={0.006} width={0.1} height={0.022} fill="#d8b24a" />
      </>)
    case 'niche':
      return (<>
        <path d="M-0.1 0.07 V0.03 A0.1 0.1 0 0 1 0.1 0.03 V0.07 Z" fill="#1e1a16" stroke="#9A5538" strokeWidth={px * 2} transform="translate(0 -0.0)" />
        <circle cx={0} cy={0.05} r={0.025} fill="#1F4E8C" stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
      </>)
    case 'mirror':
      return (<>
        <rect x={-0.3} y={0} width={0.6} height={0.04} rx={0.006} fill={reg.sheen(pal.metal)} {...line} />
        <rect x={-0.28} y={0.008} width={0.56} height={0.024} fill="#9fb4c8" fillOpacity={0.75} />
        <path d="M-0.2 0.03 L-0.1 0.008 M-0.05 0.03 L0.05 0.008" stroke="#fff" strokeOpacity={0.5} strokeWidth={px} />
      </>)
    case 'hooks':
      return (<>
        <rect x={-0.2} y={0} width={0.4} height={0.03} rx={0.008} fill={reg.sheen(pal.wood)} {...line} />
        {[-0.15, -0.05, 0.05, 0.15].map(x => <circle key={x} cx={x} cy={0.05} r={0.018} fill={pal.metal} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />)}
      </>)
    case 'plates':
      return (<>
        <rect x={-0.32} y={0} width={0.64} height={0.05} rx={0.008} fill={reg.sheen(pal.wood)} {...line} />
        {[-0.25, -0.12, 0.01, 0.14, 0.27].map(x => <circle key={x} cx={x} cy={0.025} r={0.02} fill={st.id === 'mediterranean' ? '#1F4E8C' : '#d8d2c0'} stroke={INK} strokeOpacity={0.4} strokeWidth={px} />)}
      </>)
    case 'sconce': {
      const kind = st.decor.sconce
      if (kind === 'fan') {
        return (<>
          <path d="M-0.08 0 A0.08 0.08 0 0 0 0.08 0 Z" fill={pal.metal} {...line} transform="scale(1 0.9)" />
          {[-1, 0, 1].map(k => <path key={k} d={`M0 0.0L${f(k * 0.05)} 0.075`} stroke="#fff3c8" strokeOpacity={0.9} strokeWidth={px * 1.5} />)}
        </>)
      }
      if (kind === 'candle') {
        return (<>
          <rect x={-0.035} y={0} width={0.07} height={0.04} rx={0.01} fill={pal.metal} {...line} />
          <ellipse cx={0} cy={0.07} rx={0.022} ry={0.035} fill="#ffd36a" /><ellipse cx={0} cy={0.065} rx={0.01} ry={0.02} fill="#fff6c8" />
        </>)
      }
      if (kind === 'niche') {
        return (<><path d="M-0.05 0.06 V0.03 A0.05 0.05 0 0 1 0.05 0.03 V0.06 Z" fill="#2a2018" stroke="#9A5538" strokeWidth={px * 1.5} /><circle cx={0} cy={0.045} r={0.016} fill="#ffcf6a" /></>)
      }
      return (<>
        <path d="M-0.075 0 A0.075 0.075 0 0 0 0.075 0 Z" fill={reg.sheen(pal.metal)} {...line} />
        <circle cx={0} cy={0.035} r={0.024} fill="#fff0b8" />
      </>)
    }
  }
}

export function renderDecor(items: DecorItem[], reg: Reg, st: StyleKit, px: number): ReactNode {
  return (
    <g data-layer="decor">
      {items.map((it, i) => (
        <g key={i} data-decor={it.kind} data-room={it.roomId} transform={slotTransform(it)}>{decorArt(it, reg, st, px)}</g>
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// windows, curtains, doors
// ---------------------------------------------------------------------------
export function renderWindows(plan: Plan, reg: Reg, st: StyleKit, px: number): ReactNode[] {
  const out: ReactNode[] = []
  plan.windows.forEach((w: Win, i) => {
    const e = plan.edges.find(x => x.axis === w.axis && x.line === w.line && x.pos === w.pos)!
    const h = edgeHalf(e)
    const g0 = w.pos + (1 - WINDOW_GAP) / 2, g1 = g0 + WINDOW_GAP
    // frame in a local system: x along the wall, y across it
    const [cx, cy] = pt(w.axis, w.line, (g0 + g1) / 2, 0)
    const rot = w.axis === 'h' ? 0 : 90
    const L = WINDOW_GAP, T = 2 * h
    const glass = st.glass
    const sillC = st.id === 'victorian' ? '#8a8578' : st.id === 'mediterranean' ? '#e8dfcf' : st.id === 'artdeco' ? '#c9a24a' : '#9a968a'
    const lattice: ReactNode[] = []
    if (st.lattice) {
      for (let k = -3; k <= 3; k++) {
        lattice.push(<path key={`a${k}`} d={`M${f(k * 0.07 - 0.12)} ${f(-T * 0.3)}L${f(k * 0.07 + 0.12)} ${f(T * 0.3)}`} stroke="#8a8a7a" strokeOpacity={0.6} strokeWidth={px} />)
        lattice.push(<path key={`b${k}`} d={`M${f(k * 0.07 + 0.12)} ${f(-T * 0.3)}L${f(k * 0.07 - 0.12)} ${f(T * 0.3)}`} stroke="#8a8a7a" strokeOpacity={0.6} strokeWidth={px} />)
      }
    }
    out.push(
      <g key={`w${i}`} data-window transform={`translate(${f(cx)} ${f(cy)}) rotate(${rot})`}>
        <rect x={f(-L / 2)} y={f(-h)} width={L} height={f(T)} fill={sillC} stroke={INK} strokeOpacity={0.6} strokeWidth={px * 1.2} />
        <rect x={f(-L / 2 + 0.03)} y={f(-h + 0.035)} width={f(L - 0.06)} height={f(T - 0.07)} fill={reg.url(reg.once(`win-${glass.slice(1)}`, id => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(glass, 0.25)} /><stop offset="0.5" stopColor={glass} /><stop offset="1" stopColor={darken(glass, 0.3)} />
          </linearGradient>
        )))} stroke={INK} strokeOpacity={0.6} strokeWidth={px} />
        {lattice}
        <path d={`M${f(-L / 2 + 0.04)} ${f(h - 0.045)}L${f(-L / 2 + 0.2)} ${f(-h + 0.045)}`} stroke="#cfe0ff" strokeOpacity={0.35} strokeWidth={px * 2} />
        <path d={`M${f(-0.02)} ${f(-h + 0.035)}V${f(h - 0.035)}M${f(0.02)} ${f(-h + 0.035)}V${f(h - 0.035)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
      </g>,
    )
  })
  return out
}

/** Curtains / shutters on the room side of each window. */
export function renderCurtains(plan: Plan, reg: Reg, st: StyleKit, px: number): ReactNode[] {
  const out: ReactNode[] = []
  plan.windows.forEach((w, i) => {
    const e = plan.edges.find(x => x.axis === w.axis && x.line === w.line && x.pos === w.pos)!
    const h = edgeHalf(e)
    // room side = the interior cell
    const mRoom = e.m ? plan.rooms.find(r => r.id === plan.roomAt[e.m![0]][e.m![1]]) : null
    const side: -1 | 1 = mRoom && !mRoom.exterior ? -1 : 1
    const g0 = w.pos + (1 - WINDOW_GAP) / 2, g1 = g0 + WINDOW_GAP
    const [px0, py0] = pt(w.axis, w.line, (g0 + g1) / 2, side * h)
    const rot = w.axis === 'h' ? (side === 1 ? 0 : 180) : (side === 1 ? -90 : 90)
    const c = st.curtain
    const depth = 0.075
    const panel = (x: number, wd: number) => (
      <g key={x}>
        <rect x={f(x)} y={0} width={f(wd)} height={depth} rx={0.012} fill={reg.band(c)} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
        {[0.25, 0.5, 0.75].map(t => <path key={t} d={`M${f(x + wd * t)} 0V${depth}`} stroke="#000" strokeOpacity={0.25} strokeWidth={px} />)}
      </g>
    )
    const half = WINDOW_GAP / 2
    out.push(
      <g key={`c${i}`} data-curtain transform={`translate(${f(px0)} ${f(py0)}) rotate(${rot})`}>
        <path d={`M${f(-half - 0.1)} ${f(depth + 0.01)}H${f(half + 0.1)}`} stroke={st.pal.metal} strokeWidth={0.02} strokeLinecap="round" />
        {panel(-half - 0.1, 0.17)}{panel(half - 0.07, 0.17)}
        {st.id === 'victorian' || st.id === 'artdeco' ? [-half + 0.03, half - 0.03].map(x => <circle key={x} cx={f(x)} cy={f(depth * 0.55)} r={0.016} fill={st.pal.metal} />) : null}
      </g>,
    )
  })
  return out
}

export function renderDoors(plan: Plan, st: StyleKit, px: number): ReactNode[] {
  const out: ReactNode[] = []
  const leaf = '#8A5A3C'
  const brass = '#D4A94B'
  plan.doors.forEach((d: Door, i) => {
    const g = doorGeom(d)
    const e = plan.edges.find(x => x.axis === d.axis && x.line === d.line && x.pos === d.pos)!
    const h = edgeHalf(e)
    const [cx, cy] = pt(d.axis, d.line, (g.gap[0] + g.gap[1]) / 2, 0)
    const rot = d.axis === 'h' ? 0 : 90
    const L = DOOR_GAP
    const threshold = (
      <g transform={`translate(${f(cx)} ${f(cy)}) rotate(${rot})`}>
        <rect x={f(-L / 2)} y={f(-h)} width={L} height={f(2 * h)} fill={darken(st.pal.wood, 0.1)} />
        <path d={`M${f(-L / 2)} ${f(-h)}H${f(L / 2)}M${f(-L / 2)} ${f(h)}H${f(L / 2)}`} stroke={st.pal.metal} strokeOpacity={0.85} strokeWidth={px * 2} />
        <rect x={f(-L / 2 - 0.03)} y={f(-h)} width={0.03} height={f(2 * h)} fill={st.wall.trim} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
        <rect x={f(L / 2)} y={f(-h)} width={0.03} height={f(2 * h)} fill={st.wall.trim} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
      </g>
    )
    if (d.pocket) {
      out.push(
        <g key={`d${i}`} data-door={d.front ? 'front-pocket' : 'pocket'}>
          {threshold}
          <g transform={`translate(${f(cx)} ${f(cy)}) rotate(${rot})`}>
            <rect x={f(-L / 2 + 0.04)} y={-0.035} width={f(L * 0.62)} height={0.07} fill={leaf} stroke={INK} strokeOpacity={0.6} strokeWidth={px} />
            <circle cx={f(-L / 2 + 0.04 + L * 0.62 - 0.05)} cy={0} r={0.016} fill={brass} />
          </g>
        </g>,
      )
      return
    }
    const along = (t: number): [number, number] => [g.hinge[0] + (g.tip[0] - g.hinge[0]) * t, g.hinge[1] + (g.tip[1] - g.hinge[1]) * t]
    const [kx, ky] = along(0.86)
    out.push(
      <g key={`d${i}`} data-door={d.front ? 'front' : 'inner'}>
        {threshold}
        <path d={`M${g.tip[0]} ${g.tip[1]}A${DOOR_GAP} ${DOOR_GAP} 0 0 ${g.sweep} ${g.jamb[0]} ${g.jamb[1]}`} fill="none" stroke="#e8dcc0" strokeOpacity={0.3} strokeDasharray="0.04 0.035" strokeWidth={px} />
        <path d={`M${g.hinge[0]} ${g.hinge[1]}L${g.tip[0]} ${g.tip[1]}`} stroke={INK} strokeOpacity={0.6} strokeWidth={0.075} strokeLinecap="butt" />
        <path d={`M${g.hinge[0]} ${g.hinge[1]}L${g.tip[0]} ${g.tip[1]}`} stroke={leaf} strokeWidth={0.056} strokeLinecap="butt" />
        <circle cx={f(kx)} cy={f(ky)} r={0.02} fill={brass} stroke={INK} strokeOpacity={0.5} strokeWidth={px * 0.8} />
        <circle cx={g.hinge[0]} cy={g.hinge[1]} r={0.022} fill={brass} stroke={INK} strokeOpacity={0.5} strokeWidth={px * 0.8} />
      </g>,
    )
  })
  return out
}

export function furnitureOfType(list: Furniture[], t: FurnitureType): Furniture[] { return list.filter(x => x.type === t) }
