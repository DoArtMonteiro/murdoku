// The house itself, in cell units: floors, rugs, light, furniture, walls,
// openings, decor and room plaques. Layer order (bottom to top):
//   floors -> inlays -> wall contact shadow -> rugs -> furniture shadows ->
//   furniture -> ambient night fill -> lamp / window glow -> walls -> windows,
//   curtains, doors -> wall decor -> room plaques.
import { Fragment, type ReactNode } from 'react'
import type { Furniture, FurnitureType, Puzzle } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { darken, hashStr, lightAlpha, lighten, mix, rng } from './color'
import { buildGeo, clueTypesOf, planDecor, renderCurtains, renderDecor, renderDoors, renderWindows, type DecorItem, type Geo } from './decor'
import { pieceArt, pieceShadow, rugRect } from './furniture'
import { floorBase, floorPaint } from './materials'
import { renderYard } from './yard'
import { isOutdoor, roleOf } from './rooms'
import type { Reg } from './reg'
import type { StyleKit } from './styles/types'
import { edgeHalf, pt, wallPath, type Label, type Plan, type PlanRoom } from '../nightplan/plan'
import { placeLabels } from './labels'

const f = (v: number) => +v.toFixed(3)
const keyed = (list: ReactNode[]) => list.map((n, i) => <Fragment key={i}>{n}</Fragment>)
const INK = '#15110E'

export const roomPath = (room: PlanRoom) => room.cells.map(([r, c]) => `M${c} ${r}h1v1h-1Z`).join('')

/** Boundary of a room as open segments (cells whose neighbour is another room). */
function outlinePath(room: PlanRoom, plan: Plan): string {
  const has = (r: number, c: number) => plan.roomAt[r]?.[c] === room.id
  let d = ''
  for (const [r, c] of room.cells) {
    if (!has(r - 1, c)) d += `M${c} ${r}h1`
    if (!has(r + 1, c)) d += `M${c} ${r + 1}h1`
    if (!has(r, c - 1)) d += `M${c} ${r}v1`
    if (!has(r, c + 1)) d += `M${c + 1} ${r}v1`
  }
  return d
}

// ---------------------------------------------------------------------------
// decorative rugs (a rug is a FurnitureType: never drawn if a clue talks about rugs)
// ---------------------------------------------------------------------------
interface RugPlan { x: number; y: number; w: number; h: number; roomId: string }

export function planRugs(plan: Plan, geo: Geo, st: StyleKit, blocked: Set<FurnitureType>): RugPlan[] {
  if (blocked.has('rug')) return []
  const out: RugPlan[] = []
  const trueSwing = new Set<string>()
  for (const d of plan.doors) {
    const [r, c] = d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
    trueSwing.add(`${r},${c}`)
  }
  const logicalRugRooms = new Set(plan.furniture.filter(x => x.type === 'rug').map(x => plan.roomAt[x.row]?.[x.col]))
  for (const room of plan.rooms) {
    if (room.exterior || logicalRugRooms.has(room.id)) continue
    const role = geo.roleOf.get(room.id)
    const inRoom = (r: number, c: number) => plan.roomAt[r]?.[c] === room.id
    if (role === 'hall') {
      // runner along the hall: a row of >= 4 free cells, away from the door swings
      for (let r = room.r0; r <= room.r1; r++) {
        let best: [number, number] | null = null
        let c = room.c0
        while (c <= room.c1) {
          if (!inRoom(r, c) || trueSwing.has(`${r},${c}`)) { c++; continue }
          let e = c
          while (e + 1 <= room.c1 && inRoom(r, e + 1) && !trueSwing.has(`${r},${e + 1}`)) e++
          if (e - c >= 3 && (!best || e - c > best[1] - best[0])) best = [c, e]
          c = e + 1
        }
        if (best && room.cells.filter(([rr]) => rr === r).length >= 4) {
          const [a, b] = best
          out.push({ x: a + 0.25, y: r + 0.2, w: b - a + 0.5, h: 0.6, roomId: room.id })
          break
        }
      }
      continue
    }
    if (role !== 'living' && role !== 'dining' && role !== 'study' && role !== 'bed') continue
    const anchors = plan.furniture.filter(fu => (fu.type === 'table' || fu.type === 'sofa' || fu.type === 'bed' || fu.type === 'desk') && inRoom(fu.row, fu.col))
    const pref: FurnitureType[] = role === 'bed' ? ['bed'] : role === 'study' ? ['desk', 'table'] : ['table', 'sofa']
    const anchor = pref.map(t => anchors.find(a => a.type === t)).find(Boolean) as Furniture | undefined
    if (!anchor) continue
    const { w, h } = furnitureFootprint(anchor)
    let x0 = anchor.col, y0 = anchor.row, x1 = anchor.col + w, y1 = anchor.row + h
    const m = 0.34
    // grow only into cells of the same room that carry no door swing
    const okCell = (r: number, c: number) => inRoom(r, c) && !trueSwing.has(`${r},${c}`)
    const canW = okCell(anchor.row, anchor.col - 1), canE = okCell(anchor.row, anchor.col + w)
    const canN = okCell(anchor.row - 1, anchor.col), canS = okCell(anchor.row + h, anchor.col)
    x0 -= canW ? m : -0.06; x1 += canE ? m : -0.06; y0 -= canN ? m : -0.06; y1 += canS ? m : -0.06
    if (anchor.type === 'bed') { x0 -= 0; }
    out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, roomId: room.id })
  }
  void st
  return out
}

// ---------------------------------------------------------------------------
// wall paints
// ---------------------------------------------------------------------------
function wallPaint(reg: Reg, st: StyleKit, kind: 'ext' | 'int', u: number): string {
  const px = 1 / u
  const w = st.wall
  const tex = kind === 'ext' ? w.extTex : w.intTex
  const base = kind === 'ext' ? w.ext : w.int
  const id = reg.once(`wall-${kind}-${st.id}`, i => {
    const r = rng(hashStr(i))
    const els: ReactNode[] = [<rect key="bg" width={1} height={1} fill={base} />]
    switch (tex) {
      case 'brick': {
        const rows = 16
        for (let j = 0; j < rows; j++) {
          els.push(<path key={`h${j}`} d={`M0 ${f((j + 1) / rows)}H1`} stroke={darken(base, 0.45)} strokeOpacity={0.7} strokeWidth={px} />)
          for (let k = 0; k < 4; k++) {
            const x = (k + (j % 2 ? 0.5 : 0)) / 4
            els.push(<path key={`v${j}-${k}`} d={`M${f(x)} ${f(j / rows)}V${f((j + 1) / rows)}`} stroke={darken(base, 0.45)} strokeOpacity={0.7} strokeWidth={px} />)
            if (r() < 0.4) els.push(<rect key={`b${j}-${k}`} x={f(x)} y={f(j / rows)} width={0.25} height={f(1 / rows)} fill={r() < 0.5 ? lighten(base, 0.12) : darken(base, 0.15)} fillOpacity={0.35} />)
          }
        }
        break
      }
      case 'stone': {
        // rubble masonry: irregular blocks
        for (let j = 0; j < 6; j++) {
          const y = j / 6
          let x = -r() * 0.1
          while (x < 1) {
            const wd = 0.12 + r() * 0.14
            els.push(<rect key={`s${j}-${x}`} x={f(x)} y={f(y)} width={f(wd)} height={f(1 / 6)} fill={r() < 0.5 ? lighten(base, r() * 0.14) : darken(base, r() * 0.14)} stroke={darken(base, 0.5)} strokeOpacity={0.6} strokeWidth={px} />)
            x += wd
          }
        }
        break
      }
      case 'lacquer':
        els.push(<rect key="g" width={1} height={1} fill="#fff" fillOpacity={0.025} />)
        for (let j = 0; j < 5; j++) els.push(<path key={j} d={`M0 ${f(r())}H1`} stroke="#fff" strokeOpacity={0.04} strokeWidth={px} />)
        break
      case 'whitewash':
        for (let j = 0; j < 20; j++) els.push(<circle key={j} cx={f(r())} cy={f(r())} r={f(0.02 + r() * 0.05)} fill={r() < 0.5 ? lighten(base, 0.2) : darken(base, 0.1)} fillOpacity={0.16} />)
        break
      case 'plaster': case 'timber':
        els.push(<path key="g1" d="M0.5 0V1M0 0.5H1" stroke="#3B2A1C" strokeOpacity={0.9} strokeWidth={0.035} />)
        els.push(<path key="g2" d="M0 0H1M0 1H1" stroke="#3B2A1C" strokeOpacity={0.9} strokeWidth={0.035} />)
        for (let j = 0; j < 10; j++) els.push(<circle key={j} cx={f(r())} cy={f(r())} r={f(0.02 + r() * 0.03)} fill={darken(base, 0.2)} fillOpacity={0.14} />)
        break
      default: // dado / thin / glass: flat with a whisper of grain
        for (let j = 0; j < 12; j++) els.push(<path key={j} d={`M${f(r())} ${f(r())}h${f(0.05 + r() * 0.1)}`} stroke={lighten(base, 0.25)} strokeOpacity={0.05} strokeWidth={px} />)
    }
    return <pattern key={i} id={i} patternUnits="userSpaceOnUse" width={1} height={1}>{els}</pattern>
  })
  return reg.url(id)
}

export interface HouseOut {
  node: ReactNode
  /** Room-name labels, drawn by BoardLabels in a layer above the tokens. */
  labels: Label[]
  decor: DecorItem[]
  rugs: number
}

export interface HouseCtx {
  plan: Plan
  puzzle: Puzzle
  st: StyleKit
  reg: Reg
  u: number
  mobile: boolean
}

export function renderHouse({ plan, puzzle, st, reg, u, mobile }: HouseCtx): HouseOut {
  const px = 1 / u
  const n = plan.n
  const geo = buildGeo(plan)
  const blocked = clueTypesOf(puzzle)
  const labelList = placeLabels(plan, u)
  const decor = planDecor(plan, geo, st, blocked, labelList)
  const rugs = planRugs(plan, geo, st, blocked)

  // ---- floors ---------------------------------------------------------------
  const floors: ReactNode[] = []
  const inlays: ReactNode[] = []
  for (const room of plan.rooms) {
    const role = roleOf(room.name)
    const spec = st.floors[role]
    const d = roomPath(room)
    const cid = reg.once(`room-${room.id}`, i => <clipPath key={i} id={i}><path d={d} /></clipPath>)
    floors.push(
      <g key={room.id} data-room={room.name} data-role={role} data-mat={spec.mat}>
        <path d={d} fill={floorPaint(reg, spec, u)} />
      </g>,
    )
    // border band: an inlaid strip hugging the walls (never reaches a centre zone: 0.13 < 0.2)
    if (spec.band && !isOutdoor(role)) {
      const o = outlinePath(room, plan)
      inlays.push(
        <g key={`band${room.id}`} clipPath={reg.url(cid)}>
          <path d={o} fill="none" stroke={spec.band.color} strokeOpacity={0.9} strokeWidth={spec.band.w * 2} strokeLinecap="square" />
          {spec.band.line && <path d={o} fill="none" stroke={spec.band.line} strokeOpacity={0.8} strokeWidth={px * 1.6} strokeLinecap="square" transform="translate(0 0)" />}
        </g>,
      )
    }
    if (spec.inlay === 'diamonds' && !isOutdoor(role)) {
      // gold diamonds on the cell corners inside the room: outside every centre zone
      const dd: string[] = []
      for (const [r, c] of room.cells) {
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = c + dx, y = r + dy
          const all = [[0, 0], [-1, 0], [0, -1], [-1, -1]].every(([ox, oy]) => plan.roomAt[y + oy]?.[x + ox] === room.id)
          if (!all) continue
          const key = `${x},${y}`
          if (dd.includes(key)) continue
          dd.push(key)
        }
      }
      inlays.push(
        <g key={`dia${room.id}`} fill={st.pal.metal} fillOpacity={0.75}>
          {dd.map(k => { const [x, y] = k.split(',').map(Number); return <path key={k} d={`M${x} ${f(y - 0.13)}L${f(x + 0.13)} ${y}L${x} ${f(y + 0.13)}L${f(x - 0.13)} ${y}Z`} /> })}
        </g>,
      )
    }
    if (spec.inlay === 'sunburst' && !isOutdoor(role)) {
      // a gold sunburst centred on the room, rays confined to the seams between centre zones
      const cx = (room.c0 + room.c1 + 1) / 2, cy = (room.r0 + room.r1 + 1) / 2
      const rays: ReactNode[] = []
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2
        rays.push(<path key={k} d={`M${f(cx + Math.cos(a) * 0.1)} ${f(cy + Math.sin(a) * 0.1)}L${f(cx + Math.cos(a) * 0.19)} ${f(cy + Math.sin(a) * 0.19)}`} stroke={st.pal.metal} strokeOpacity={0.85} strokeWidth={px * 2} />)
      }
      inlays.push(<g key={`sun${room.id}`} clipPath={reg.url(cid)}>{rays}<circle cx={f(cx)} cy={f(cy)} r={0.08} fill="none" stroke={st.pal.metal} strokeOpacity={0.8} strokeWidth={px * 1.5} /></g>)
    }
  }

  // ---- walls -----------------------------------------------------------------
  const walls = wallPath(plan)
  const extD = wallPath({ ...plan, edges: plan.edges.filter(e => e.kind === 'ext' || e.kind === 'extx') })
  const intD = wallPath({ ...plan, edges: plan.edges.filter(e => e.kind === 'int') })
    // ---- furniture ------------------------------------------------------------------
  const rest = plan.furniture.filter(x => x.type !== 'rug')
  const logicalRugs = plan.furniture.filter(x => x.type === 'rug')

  // ---- light ----------------------------------------------------------------------
  type Glow = { x: number; y: number; color: string; r: number; a: number; room: string | null }
  const glows: Glow[] = []
  const roomIdAt = (x: number, y: number) => plan.roomAt[Math.min(n - 1, Math.max(0, Math.floor(y)))]?.[Math.min(n - 1, Math.max(0, Math.floor(x)))] ?? null
  for (const fu of rest) {
    if (fu.type === 'lamp') glows.push({ x: fu.col + 0.5, y: fu.row + 0.5, color: st.id === 'victorian' ? '#ffb65a' : '#ffbe6a', r: 1.6, a: 0.34, room: plan.roomAt[fu.row]?.[fu.col] ?? null })
    if (fu.type === 'stove') glows.push({ x: fu.col + 0.5, y: fu.row + 0.5, color: '#ff7a2a', r: 1.2, a: 0.34, room: plan.roomAt[fu.row]?.[fu.col] ?? null })
  }
  for (const d of decor) if (d.glow) glows.push({ ...d.glow, room: d.roomId })
  for (const w of plan.windows) {
    const e = plan.edges.find(x => x.axis === w.axis && x.line === w.line && x.pos === w.pos)!
    const cell = e.m && plan.rooms.find(r => r.id === plan.roomAt[e.m![0]][e.m![1]] )?.exterior === false ? e.m : e.p
    const side = cell === e.m ? -1 : 1
    const [x, y] = pt(w.axis, w.line, w.pos + 0.5, side * (edgeHalf(e) + 0.05))
    glows.push({ x, y, color: '#9FB4D8', r: 0.9, a: 0.18, room: w.room })
  }

  const glowLayer = (list: Glow[], scale: number, key: string) => {
    const groups = new Map<string, Glow[]>()
    for (const g of list) { const k = g.room ?? roomIdAt(g.x, g.y) ?? ''; (groups.get(k) ?? groups.set(k, []).get(k)!).push(g) }
    return (
      <g key={key} data-layer={key}>
        {[...groups.entries()].map(([rid, gs]) => (
          <g key={rid} clipPath={rid ? reg.url(`${reg.uid}-room-${rid}`) : undefined}>
            {gs.map((g, i) => <circle key={i} cx={f(g.x)} cy={f(g.y)} r={g.r} fill={reg.pool(g.color, +(g.a * scale).toFixed(3))} />)}
          </g>
        ))}
      </g>
    )
  }
  // authored per floor: every pool lifts its floor by the same +0.15 L* in a cell centre
  const floorUnder = (g: Glow) => {
    const rm = plan.rooms.find(r => r.id === (g.room ?? roomIdAt(g.x, g.y)))
    const base = rm ? mix(floorBase(st.floors[roleOf(rm.name)]), '#1E2436', st.nightFill) : '#202020'
    return base
  }
  const lights = glows.filter(g => g.color !== '#9FB4D8').map(g => ({ ...g, a: Math.min(0.85, lightAlpha(floorUnder(g), g.color, 0.17)) }))
  const moon = glows.filter(g => g.color === '#9FB4D8')

  const nodes: ReactNode[] = []
  nodes.push(<g key="floors" data-layer="floors">{keyed(floors)}</g>)
  nodes.push(<g key="inlays" data-layer="inlays">{keyed(inlays)}</g>)
  nodes.push(<g key="yard">{renderYard(plan, geo, reg, st, u, hashStr(puzzle.id), blocked)}</g>)
  // contact shadow of the walls on the floor (and a skirting line)
  // soft shadows are stacked, slightly fatter silhouettes: no blur filter, so nothing is re-rasterised per frame on a phone
  nodes.push(
    <g key="wshadow" data-layer="wall-shadow" fill="#000" stroke="#000" strokeLinejoin="round" transform="translate(0.035 0.05)">
      <path d={walls} strokeWidth={0.1} opacity={0.08} /><path d={walls} strokeWidth={0.05} opacity={0.12} /><path d={walls} opacity={0.2} />
    </g>,
  )
  nodes.push(
    <g key="wao" data-layer="wall-ao" fill="none" stroke="#000" strokeLinejoin="round">
      <path d={walls} strokeWidth={0.3} opacity={0.07} /><path d={walls} strokeWidth={0.22} opacity={0.08} /><path d={walls} strokeWidth={0.14} opacity={0.09} />
    </g>,
  )
  nodes.push(<path key="skirt" d={walls} fill="none" stroke={st.wall.trim} strokeOpacity={0.28} strokeWidth={0.12} />)
  // rugs: logical rugs and decorative ones
  nodes.push(
    <g key="rugs" data-layer="rugs">
      {logicalRugs.map((fu, i) => <g key={`lr${i}`}>{pieceArt(reg, st, fu, px)}</g>)}
      {rugs.map((r, i) => <g key={`dr${i}`}>{rugRect(reg, st, r.x, r.y, r.w, r.h, px, hashStr(`${r.roomId}${i}`))}</g>)}
    </g>,
  )
  nodes.push(glowLayer(lights, 1, 'glow-floor'))
  nodes.push(
    <g key="shadows" data-layer="shadows" fill="#000" stroke="#000" strokeLinejoin="round" transform="translate(0.06 0.08)">
      <g strokeWidth={0.08} opacity={0.08}>{rest.map((fu, i) => <g key={i}>{pieceShadow(fu)}</g>)}</g>
      <g strokeWidth={0.04} opacity={0.12}>{rest.map((fu, i) => <g key={i}>{pieceShadow(fu)}</g>)}</g>
      <g opacity={0.14}>{rest.map((fu, i) => <g key={i}>{pieceShadow(fu)}</g>)}</g>
    </g>,
  )
  nodes.push(<g key="furniture" data-layer="furniture">{rest.map((fu, i) => <g key={i}>{pieceArt(reg, st, fu, px)}</g>)}</g>)
  // ambient night fill (bible lighting layer 1)
  nodes.push(<rect key="ambient" data-layer="ambient" x={0} y={0} width={n} height={n} fill="#1E2436" fillOpacity={st.nightFill} />)
  // glow (layer 2): clipped to each room. The pool itself lies on the floor, under the pieces, so a lamp's own
  // cell centre never gets a hotspot; a faint copy over the furniture lights the nearby pieces.
  nodes.push(glowLayer(lights, 0.2, 'glow'))
  nodes.push(glowLayer(moon, 1, 'moonglow'))
  // a broad, low warm wash per indoor room (the lamps' bounce off ceiling and walls)
  nodes.push(
    <g key="roomlight" data-layer="roomlight">
      {plan.rooms.filter(r => !r.exterior).map(r => (
        <g key={r.id} clipPath={reg.url(`${reg.uid}-room-${r.id}`)}>
          <ellipse cx={f((r.c0 + r.c1 + 1) / 2)} cy={f((r.r0 + r.r1 + 1) / 2)} rx={f((r.c1 - r.c0 + 1) * 0.75)} ry={f((r.r1 - r.r0 + 1) * 0.75)} fill={reg.glow('#ffb468', st.id === 'modernist' ? 0.05 : 0.09)} />
        </g>
      ))}
    </g>,
  )
  // walls
  nodes.push(
    <g key="walls" data-layer="walls">
      <path d={walls} fill="none" stroke={INK} strokeOpacity={0.7} strokeWidth={0.1} />
      <path d={walls} fill={st.wall.int} stroke={st.wall.trim} strokeOpacity={0.85} strokeWidth={0.08} paintOrder="stroke" />
      <path d={intD} fill={wallPaint(reg, st, 'int', u)} data-walls="int" />
      <path d={extD} fill={wallPaint(reg, st, 'ext', u)} data-walls="ext" />
      {st.wall.extTex === 'glass' && <ExtGlass plan={plan} px={px} color={st.wall.line ?? '#9FB4D8'} />}
      {st.wall.line && st.wall.intTex === 'lacquer' && <path d={walls} fill="none" stroke={st.wall.line} strokeOpacity={0.9} strokeWidth={px * 2} />}
    </g>,
  )
  nodes.push(<g key="windows" data-layer="windows">{keyed(renderWindows(plan, reg, st, px))}</g>)
  if (st.decor.curtains || st.id === 'tudor' || st.id === 'mediterranean') nodes.push(<g key="curtains" data-layer="curtains">{keyed(renderCurtains(plan, reg, st, px))}</g>)
  nodes.push(<g key="doors" data-layer="doors">{keyed(renderDoors(plan, st, px))}</g>)
  nodes.push(<g key="decorwall" data-layer="decor-wall">{renderDecor(decor, reg, st, px)}</g>)

  void mobile
  return { node: <g data-layer="house">{nodes}</g>, decor, rugs: rugs.length, labels: labelList }
}

/** Modernist exterior: a pale glass line with mullions down the middle of every outer wall. */
function ExtGlass({ plan, px, color }: { plan: Plan; px: number; color: string }) {
  const segs: string[] = []
  for (const e of plan.edges) {
    if (e.kind !== 'ext' && e.kind !== 'extx') continue
    const [x0, y0] = pt(e.axis, e.line, e.pos, 0), [x1, y1] = pt(e.axis, e.line, e.pos + 1, 0)
    segs.push(`M${x0} ${y0}L${x1} ${y1}`)
  }
  const ticks: string[] = []
  for (const e of plan.edges) {
    if (e.kind !== 'ext' && e.kind !== 'extx') continue
    for (const t of [0.0, 0.5]) {
      const [x, y] = pt(e.axis, e.line, e.pos + t, 0)
      ticks.push(e.axis === 'h' ? `M${x} ${y - 0.1}V${y + 0.1}` : `M${x - 0.1} ${y}H${x + 0.1}`)
    }
  }
  return (
    <g>
      <path d={segs.join('')} stroke={color} strokeOpacity={0.9} strokeWidth={0.05} fill="none" />
      <path d={segs.join('')} stroke="#1a2a36" strokeOpacity={0.9} strokeWidth={0.02} fill="none" />
      <path d={ticks.join('')} stroke="#e6e6e0" strokeOpacity={0.8} strokeWidth={px * 2} fill="none" />
    </g>
  )
}
