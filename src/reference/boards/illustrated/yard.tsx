// In-grid outdoor rooms (yard, garden, porch): lawn is the floor material; this
// layer adds the things that make it a garden without putting an object on a
// cell: flower beds hugging the house wall (inside the outer 0.2 ring, so a
// centre zone stays lawn), the lot fence along the grid boundary, curbs between
// two outdoor rooms, and light spilling out of windows onto the grass.
import { Fragment, type ReactNode } from 'react'
import { darken, lighten, rng } from './color'
import type { Reg } from './reg'
import type { StyleKit } from './styles/types'
import { edgeHalf, pt, type Edge, type Plan } from '../nightplan/plan'
import type { Geo } from './decor'

const f = (v: number) => +v.toFixed(3)
const INK = '#15110E'

export function renderYard(plan: Plan, geo: Geo, reg: Reg, st: StyleKit, u: number, seed: number, blocked: ReadonlySet<string> = new Set()): ReactNode {
  const px = 1 / u
  const g = st.garden
  const out: ReactNode[] = []
  const r = rng(seed + 5)
  const isExt = (cell: readonly [number, number] | null) => !!cell && !!plan.rooms.find(x => x.id === plan.roomAt[cell[0]][cell[1]])?.exterior
  const doorKeys = geo.doorEdges

  // flower beds on the outdoor side of house walls
  for (const e of plan.edges) {
    if (e.kind !== 'extx') continue
    const key = `${e.axis}${e.line}.${e.pos}`
    if (doorKeys.has(key)) continue
    const outside = isExt(e.m) ? e.m! : e.p!
    if (geo.occ.has(`${outside[0]},${outside[1]}`)) continue
    const side = outside === e.m ? -1 : 1
    const half = edgeHalf(e)
    // window light shares the wall: skip beds where a window sits so the glow reads
    const depth = 0.15
    const a0 = e.pos + 0.1, a1 = e.pos + 0.9
    const near = side * (half + 0.03), far = side * (half + 0.03 + depth)
    const [x0, y0] = pt(e.axis, e.line, a0, Math.min(near, far)), [x1, y1] = pt(e.axis, e.line, a1, Math.max(near, far))
    const rx = Math.min(x0, x1), ry = Math.min(y0, y1), rw = Math.abs(x1 - x0), rh = Math.abs(y1 - y0)
    const els: ReactNode[] = [<rect key="b" x={f(rx)} y={f(ry)} width={f(rw)} height={f(rh)} rx={0.05} fill={g.bed} stroke={INK} strokeOpacity={0.45} strokeWidth={px} />]
    const k = 9
    for (let i = 0; i < k; i++) {
      const t = (i + 0.5) / k
      const cx = e.axis === 'h' ? rx + rw * t : rx + rw / 2, cy = e.axis === 'h' ? ry + rh / 2 : ry + rh * t
      els.push(<circle key={`f${i}`} cx={f(cx + (r() - 0.5) * 0.02)} cy={f(cy + (r() - 0.5) * 0.02)} r={f(0.024 + r() * 0.016)} fill={r() < 0.45 ? g.hedge : g.flowers[Math.floor(r() * g.flowers.length)]} />)
    }
    out.push(<g key={`bed${key}`} data-bed>{els}</g>)

    // window light onto the lawn
    const win = plan.windows.find(w => w.axis === e.axis && w.line === e.line && w.pos === e.pos)
    if (win) {
      const id = reg.once('yspill', i => (
        <radialGradient key={i} id={i}><stop offset="0" stopColor="#ffcf8a" stopOpacity={0.34} /><stop offset="1" stopColor="#ffcf8a" stopOpacity={0} /></radialGradient>
      ))
      const [wx, wy] = pt(e.axis, e.line, e.pos + 0.5, side * (half + 0.1))
      out.push(<circle key={`sp${key}`} cx={f(wx)} cy={f(wy)} r={0.75} fill={reg.url(id)} />)
    }
  }

  // ---- per-style outdoor kit: everything sits ON the cell seams and junctions (inside the 0.2 outer ring), so the
  // 0.6 x 0.6 centre zone of every cell stays plain ground. Flat ground details only (paving, edging, flat beds):
  // nothing here could be mistaken for a plant, shrub or any other clue furniture.
  void blocked
  const kitEls: ReactNode[] = []
  for (const room of plan.rooms) {
    if (!room.exterior) continue
    const role = room.name.toLowerCase()
    if (/porch|veranda|deck/.test(role)) continue
    const inR = (rr: number, cc: number) => plan.roomAt[rr]?.[cc] === room.id
    const free = (rr: number, cc: number) => inR(rr, cc) && !geo.occ.has(`${rr},${cc}`)
    const sid = st.id
    const every = sid === 'victorian' ? 3 : sid === 'artdeco' ? 2 : sid === 'modernist' ? 2 : 3
    const lineOn = (axis: 'v' | 'h', k: number) => {
      const rel = axis === 'v' ? k - room.c0 : k - room.r0
      if (sid === 'tudor') return false
      if (sid === 'mediterranean') return false
      if (sid === 'modernist' && axis === 'h') return false
      return rel > 0 && rel % every === 0
    }
    const pathCol = sid === 'victorian' ? '#6a6456' : sid === 'artdeco' ? '#a79d86' : sid === 'modernist' ? '#6a6c6a' : '#8a6a54'
    const edgeCol = sid === 'artdeco' ? '#C9A24A' : INK
    const w = sid === 'modernist' ? 0.12 : 0.14
    for (const [rr, cc] of room.cells) {
      // vertical seam to the east, horizontal seam to the south
      if (inR(rr, cc + 1) && lineOn('v', cc + 1) && free(rr, cc) && free(rr, cc + 1)) {
        kitEls.push(<g key={`kv${rr}.${cc}`}>
          <rect x={f(cc + 1 - w / 2)} y={rr} width={w} height={1} fill={pathCol} stroke={edgeCol} strokeOpacity={sid === 'artdeco' ? 0.8 : 0.4} strokeWidth={px} />
          {sid === 'modernist' && <rect x={f(cc + 1 - w / 2)} y={f(rr + 0.38)} width={w} height={0.24} rx={0.03} fill={lighten(pathCol, 0.12)} />}
        </g>)
      }
      if (inR(rr + 1, cc) && lineOn('h', rr + 1) && free(rr, cc) && free(rr + 1, cc)) {
        kitEls.push(<rect key={`kh${rr}.${cc}`} x={cc} y={f(rr + 1 - w / 2)} width={1} height={w} fill={pathCol} stroke={edgeCol} strokeOpacity={sid === 'artdeco' ? 0.8 : 0.4} strokeWidth={px} />)
      }
    }
    // perimeter edging along the room's own edge, in the outer ring
    for (const [rr, cc] of room.cells) {
      const sides: [boolean, string][] = [[!inR(rr - 1, cc), `M${cc} ${f(rr + 0.07)}h1`], [!inR(rr + 1, cc), `M${cc} ${f(rr + 0.93)}h1`], [!inR(rr, cc - 1), `M${f(cc + 0.07)} ${rr}v1`], [!inR(rr, cc + 1), `M${f(cc + 0.93)} ${rr}v1`]]
      for (const [on, d] of sides) {
        if (!on || sid === 'modernist') continue
        const col = sid === 'mediterranean' ? '#1F4E8C' : sid === 'artdeco' ? '#C9A24A' : sid === 'tudor' ? '#6a5a44' : st.garden.hedge
        kitEls.push(<path key={`ke${rr}.${cc}.${d}`} d={d} stroke={col} strokeOpacity={sid === 'victorian' ? 0.9 : 0.8} strokeWidth={sid === 'victorian' ? 0.07 : 0.05} strokeDasharray={sid === 'mediterranean' ? '0.1 0.04' : undefined} />)
      }
    }
    // junction ornaments: flat, radius <= 0.17 around the point where four cells meet
    for (let y = room.r0 + 1; y <= room.r1; y++) for (let x = room.c0 + 1; x <= room.c1; x++) {
      if (![[0, 0], [-1, 0], [0, -1], [-1, -1]].every(([dx, dy]) => inR(y + dy, x + dx))) continue
      const onPath = (sid === 'victorian' || sid === 'artdeco') && lineOn('v', x) && lineOn('h', y)
      const pick = onPath || ((x * 7 + y * 13 + room.r0) % 3 === 0 && sid !== 'victorian' && sid !== 'artdeco')
      if (!pick) continue
      if (!free(y, x) || !free(y - 1, x) || !free(y, x - 1) || !free(y - 1, x - 1)) continue
      const k = `kj${x}.${y}`
      if (sid === 'victorian') {
        kitEls.push(<g key={k}><circle cx={x} cy={y} r={0.17} fill={st.garden.bed} stroke={INK} strokeOpacity={0.5} strokeWidth={px} /><circle cx={x} cy={y} r={0.1} fill="none" stroke={st.garden.hedge} strokeWidth={0.035} />{[0, 1, 2, 3, 4].map(i => <circle key={i} cx={f(x + Math.cos(i * 1.2566) * 0.07)} cy={f(y + Math.sin(i * 1.2566) * 0.07)} r={0.022} fill={i % 2 ? '#e9d7a0' : '#b43a5a'} />)}</g>)
      } else if (sid === 'artdeco') {
        kitEls.push(<g key={k}><path d={`M${x} ${f(y - 0.17)}L${f(x + 0.17)} ${y}L${x} ${f(y + 0.17)}L${f(x - 0.17)} ${y}Z`} fill="#1C1C22" stroke="#C9A24A" strokeWidth={px * 2} /><path d={`M${x} ${f(y - 0.09)}L${f(x + 0.09)} ${y}L${x} ${f(y + 0.09)}L${f(x - 0.09)} ${y}Z`} fill="#0F5E55" /></g>)
      } else if (sid === 'tudor') {
        kitEls.push(<g key={k}><rect x={f(x - 0.16)} y={f(y - 0.16)} width={0.32} height={0.32} fill={st.garden.bed} stroke="#6a5a44" strokeWidth={px * 2} /><path d={`M${f(x - 0.16)} ${y}h0.32M${x} ${f(y - 0.16)}v0.32`} stroke="#6a5a44" strokeWidth={px * 2} />{[[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]].map(([dx, dy], i) => <circle key={i} cx={f(x + dx)} cy={f(y + dy)} r={0.035} fill={i % 2 ? '#7a9a5a' : '#c05a3a'} />)}</g>)
      } else if (sid === 'modernist') {
        kitEls.push(<g key={k}><circle cx={x} cy={y} r={0.16} fill="#3a3a3c" stroke={INK} strokeOpacity={0.4} strokeWidth={px} />{[0, 1, 2, 3, 4, 5, 6].map(i => <circle key={i} cx={f(x + Math.cos(i * 0.9) * 0.08)} cy={f(y + Math.sin(i * 0.9) * 0.08)} r={0.028} fill="#9aa19a" fillOpacity={0.8} />)}</g>)
      } else {
        kitEls.push(<g key={k}><circle cx={x} cy={y} r={0.17} fill="#d8d2c0" stroke="#1F4E8C" strokeWidth={px * 3} /><path d={`M${f(x - 0.1)} ${y}h0.2M${x} ${f(y - 0.1)}v0.2M${f(x - 0.07)} ${f(y - 0.07)}l0.14 0.14M${f(x + 0.07)} ${f(y - 0.07)}l-0.14 0.14`} stroke="#1F4E8C" strokeWidth={px * 2} /></g>)
      }
    }
  }
  out.push(<g key="kit" data-layer="yard-kit">{kitEls.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</g>)

  // a stepping-stone path from every door that opens onto an outdoor room, up to three cells long,
  // in a tone close to the lawn so the cell centres stay calm
  for (const d of plan.doors) {
    const e = plan.edges.find(x => x.axis === d.axis && x.line === d.line && x.pos === d.pos)
    if (!e || e.kind !== 'extx') continue
    const outCell = d.swing === -1 ? e.m : e.p
    if (!outCell || !isExt(outCell)) continue
    const half = edgeHalf(e)
    const dir: [number, number] = d.axis === 'h' ? [0, d.swing] : [d.swing, 0]
    // two shallow treads against the wall (inside the outer 0.2 ring)
    for (let k = 0; k < 2; k++) {
      const off = half + 0.01 + k * 0.08
      const [cx, cy] = pt(d.axis, d.line, d.pos + 0.5, d.swing * (off + 0.04))
      const w = d.axis === 'h' ? 0.8 : 0.08, h = d.axis === 'h' ? 0.08 : 0.8
      out.push(<rect key={`st${d.axis}${d.line}.${d.pos}.${k}`} x={f(cx - w / 2)} y={f(cy - h / 2)} width={w} height={h} fill={lighten(g.steps, 0.05 + k * 0.04)} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />)
    }
    let [rr, cc] = outCell
    const stones: ReactNode[] = []
    for (let step = 0; step < 3; step++) {
      if (rr < 0 || cc < 0 || rr >= plan.n || cc >= plan.n) break
      if (!isExt([rr, cc]) || geo.occ.has(`${rr},${cc}`)) break
      for (let k = 0; k < 3; k++) {
        const t = (k + 0.5) / 3
        const px0 = d.axis === 'h' ? cc + 0.5 : cc + (dir[0] === 1 ? t : 1 - t)
        const py0 = d.axis === 'h' ? rr + (dir[1] === 1 ? t : 1 - t) : rr + 0.5
        if (step === 0 && t < 0.3) continue
        const lw = 0.2 + r() * 0.06, wd = 0.34 + r() * 0.05
        const c = r() < 0.5 ? darken(g.path, 0.36 + r() * 0.1) : darken(g.path, 0.42)
        const [sw, sh] = d.axis === 'h' ? [wd, lw] : [lw, wd]
        stones.push(<rect key={`pp${rr}${cc}${k}`} x={f(px0 - sw / 2)} y={f(py0 - sh / 2)} width={f(sw)} height={f(sh)} rx={0.05} fill={c} stroke={INK} strokeOpacity={0.4} strokeWidth={px} />)
      }
      rr += dir[1]; cc += dir[0]
    }
    out.push(<g key={`path${d.axis}${d.line}.${d.pos}`} data-yard-path>{stones.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</g>)
  }

  // fence on the lot boundary, curbs between outdoor rooms
  const fence: ReactNode[] = []
  const seg = (e: Edge, inset: number) => {
    const sideIn = e.m ? -1 : 1
    void sideIn
    const edgeOut = e.axis === 'h' ? (e.line === 0 ? -1 : 1) : (e.line === 0 ? -1 : 1)
    const [x0, y0] = pt(e.axis, e.line, e.pos, -edgeOut * inset), [x1, y1] = pt(e.axis, e.line, e.pos + 1, -edgeOut * inset)
    return [x0, y0, x1, y1] as const
  }
  for (const e of plan.edges) {
    if (e.kind === 'fence') {
      const [x0, y0, x1, y1] = seg(e, 0.07)
      const edge = g.edge
      if (edge === 'hedge') {
        for (let i = 0; i < 4; i++) {
          const t = (i + 0.5) / 4
          fence.push(<circle key={`h${e.axis}${e.line}.${e.pos}.${i}`} cx={f(x0 + (x1 - x0) * t)} cy={f(y0 + (y1 - y0) * t)} r={0.075} fill={g.hedge} stroke={INK} strokeOpacity={0.35} strokeWidth={px} />)
          fence.push(<circle key={`hh${e.axis}${e.line}.${e.pos}.${i}`} cx={f(x0 + (x1 - x0) * t - 0.02)} cy={f(y0 + (y1 - y0) * t - 0.02)} r={0.035} fill={g.hedgeHi} fillOpacity={0.6} />)
        }
      } else if (edge === 'low-wall') {
        fence.push(<path key={`w${e.axis}${e.line}.${e.pos}`} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={INK} strokeOpacity={0.6} strokeWidth={0.11} strokeLinecap="butt" />)
        fence.push(<path key={`wi${e.axis}${e.line}.${e.pos}`} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={g.steps} strokeWidth={0.085} strokeLinecap="butt" />)
      } else {
        const col = edge === 'iron-fence' ? '#1a1a1c' : '#d8d0ba'
        fence.push(<path key={`r${e.axis}${e.line}.${e.pos}`} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={col} strokeOpacity={0.9} strokeWidth={0.022} />)
        for (let i = 0; i <= 5; i++) {
          const t = i / 5
          fence.push(<circle key={`p${e.axis}${e.line}.${e.pos}.${i}`} cx={f(x0 + (x1 - x0) * t)} cy={f(y0 + (y1 - y0) * t)} r={i === 0 || i === 5 ? 0.034 : 0.016} fill={col} stroke={i === 0 || i === 5 ? INK : 'none'} strokeWidth={px} />)
        }
      }
    } else if (e.kind === 'soft') {
      const [x0, y0] = pt(e.axis, e.line, e.pos, 0), [x1, y1] = pt(e.axis, e.line, e.pos + 1, 0)
      fence.push(<path key={`c${e.axis}${e.line}.${e.pos}`} d={`M${x0} ${y0}L${x1} ${y1}`} stroke={INK} strokeOpacity={0.5} strokeWidth={0.07} />)
      fence.push(<path key={`ci${e.axis}${e.line}.${e.pos}`} d={`M${x0} ${y0}L${x1} ${y1}`} stroke={g.steps} strokeOpacity={0.9} strokeWidth={0.05} />)
    }
  }
  out.push(<g key="fence" data-layer="yard-fence">{fence.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</g>)
  return <g data-layer="yard">{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</g>
}
