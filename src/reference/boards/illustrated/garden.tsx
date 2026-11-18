// The lot around the house: everything outside the grid. Drawn in cell units
// (origin = top-left of cell (0,0)) so features can be anchored to the plan.
// Rules: nothing here may enter the numeral gutter (the top and left strips),
// nothing touches the exterior wall except steps and the path, and the grid
// itself is never drawn on.
import { Fragment, type ReactNode } from 'react'
import { darken, lighten, rng } from './color'
import { floorPaint } from './materials'
import type { Reg } from './reg'
import type { StyleKit, TreeKind } from './styles/types'
import { edgeHalf, pt, type Plan } from '../nightplan/plan'

const f = (v: number) => +v.toFixed(3)
const keyed = (list: ReactNode[]) => list.map((n, i) => <Fragment key={i}>{n}</Fragment>)
const INK = '#15110E'

export interface LotGeom {
  n: number
  u: number
  /** Box extents in cell units relative to the grid origin. */
  bx0: number; by0: number; bx1: number; by1: number
  /** Gutter strips (top and left) in cell units: x/y of the strip's outer edge and thickness. */
  gut: number
  gutOuter: number
}

interface Circle { x: number; y: number; r: number }

/** A canopy built from overlapping lobes in three tones, lit from the north-west, with a trunk dot. */
function lobed(c: Circle, tones: [string, string, string], seed: number, px: number, n = 7): ReactNode {
  const r = rng(seed)
  const { x, y, r: R } = c
  const els: ReactNode[] = []
  const ink = { stroke: INK, strokeOpacity: 0.35, strokeWidth: px }
  const lobes: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.5
    lobes.push({ x: x + Math.cos(a) * R * 0.56, y: y + Math.sin(a) * R * 0.56, r: R * (0.42 + r() * 0.1) })
  }
  // outer lobes (dark), mid ring (mid), inner and highlight lobes (light)
  lobes.forEach((l, i) => els.push(<circle key={`o${i}`} cx={f(l.x)} cy={f(l.y)} r={f(l.r)} fill={tones[0]} {...ink} />))
  for (let i = 0; i < n - 1; i++) {
    const a = ((i + 0.5) / (n - 1)) * Math.PI * 2 + r() * 0.4
    els.push(<circle key={`m${i}`} cx={f(x + Math.cos(a) * R * 0.38)} cy={f(y + Math.sin(a) * R * 0.38)} r={f(R * (0.34 + r() * 0.08))} fill={tones[1]} {...ink} />)
  }
  els.push(<circle key="c" cx={f(x - R * 0.12)} cy={f(y - R * 0.12)} r={f(R * 0.36)} fill={tones[1]} {...ink} />)
  els.push(<circle key="h1" cx={f(x - R * 0.26)} cy={f(y - R * 0.3)} r={f(R * 0.26)} fill={tones[2]} fillOpacity={0.95} {...ink} />)
  els.push(<circle key="h2" cx={f(x + R * 0.12)} cy={f(y - R * 0.38)} r={f(R * 0.17)} fill={tones[2]} fillOpacity={0.8} />)
  els.push(<circle key="t" cx={f(x + R * 0.04)} cy={f(y + R * 0.04)} r={0.06} fill="#3a2c1e" stroke={INK} strokeOpacity={0.5} strokeWidth={px} />)
  return <g>{els}</g>
}

function tree(_reg: Reg, kind: TreeKind, c: Circle, seed: number, px: number): ReactNode {
  const r = rng(seed)
  const { x, y, r: R } = c
  const els: ReactNode[] = []
  const dab = (n: number, rad: number, cols: string[], size: number) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad
      els.push(<circle key={`d${els.length}`} cx={f(x + Math.cos(a) * d)} cy={f(y + Math.sin(a) * d)} r={f(size * (0.6 + r() * 0.8))} fill={cols[Math.floor(r() * cols.length)]} fillOpacity={0.75} />)
    }
  }
  switch (kind) {
    case 'oak': return lobed(c, ['#1A3324', '#2B4D33', '#3E6A45'], seed, px, 8)
    case 'yew': return lobed(c, ['#12261b', '#1d3828', '#2a4b36'], seed, px, 7)
    case 'apple': {
      const base = lobed(c, ['#1f3f27', '#2f5a35', '#4a7a48'], seed, px, 7)
      dab(14, R * 0.8, ['#e8c8d0', '#f4e4e8'], R * 0.05)
      dab(7, R * 0.75, ['#b8322a'], R * 0.045)
      return <g>{base}{els}</g>
    }
    case 'birch': return lobed(c, ['#27503a', '#3b6e44', '#5f9a5c'], seed, px, 7)
    case 'olive': {
      const base = lobed(c, ['#34503f', '#4a6a54', '#7c9a80'], seed, px, 6)
      dab(22, R * 0.8, ['#c8d4c0', '#9fb8a0'], R * 0.04)
      return <g>{base}{els}</g>
    }
    case 'cypress':
      els.push(<circle key="b" cx={x} cy={y} r={f(R * 0.62)} fill="#143024" stroke={INK} strokeOpacity={0.5} strokeWidth={px * 1.5} />)
      for (let k = 0; k < 2; k++) els.push(<circle key={`r${k}`} cx={x} cy={y} r={f(R * (0.45 - k * 0.2))} fill={k ? '#1d4030' : '#183829'} />)
      for (let i = 0; i < 8; i++) els.push(<path key={`s${i}`} d={`M${f(x)} ${f(y)}L${f(x + Math.cos(i * 0.785) * R * 0.6)} ${f(y + Math.sin(i * 0.785) * R * 0.6)}`} stroke="#0c1c15" strokeOpacity={0.6} strokeWidth={px} />)
      return <g>{els}</g>
    case 'palm': {
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + 0.2
        const L = R * (0.9 + (i % 2) * 0.15)
        els.push(<path key={`f${i}`} d={`M${f(x)} ${f(y)}Q${f(x + Math.cos(a + 0.28) * L * 0.6)} ${f(y + Math.sin(a + 0.28) * L * 0.6)} ${f(x + Math.cos(a) * L)} ${f(y + Math.sin(a) * L)}Q${f(x + Math.cos(a - 0.28) * L * 0.6)} ${f(y + Math.sin(a - 0.28) * L * 0.6)} ${f(x)} ${f(y)}Z`} fill={i % 2 ? '#1f5a46' : '#2a6e55'} stroke={INK} strokeOpacity={0.4} strokeWidth={px} />)
        els.push(<path key={`v${i}`} d={`M${f(x)} ${f(y)}L${f(x + Math.cos(a) * L)} ${f(y + Math.sin(a) * L)}`} stroke="#12362b" strokeOpacity={0.7} strokeWidth={px * 1.2} />)
      }
      els.push(<circle key="h" cx={x} cy={y} r={f(R * 0.12)} fill="#4a3a28" />)
      return <g>{els}</g>
    }
  }
}

function hedgeRun( st: StyleKit, x0: number, y0: number, x1: number, y1: number, seed: number, px: number, w = 0.2): ReactNode {
  const r = rng(seed)
  const len = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.max(2, Math.round(len / (w * 0.7)))
  const g = st.garden
  const els: ReactNode[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    els.push(<circle key={`a${i}`} cx={f(x0 + (x1 - x0) * t + (r() - 0.5) * 0.04)} cy={f(y0 + (y1 - y0) * t + (r() - 0.5) * 0.04)} r={f(w * (0.55 + r() * 0.12))} fill={g.hedge} stroke={INK} strokeOpacity={0.35} strokeWidth={px} />)
  }
  for (let i = 0; i <= n; i++) {
    const t = (i + 0.4) / n
    els.push(<circle key={`b${i}`} cx={f(x0 + (x1 - x0) * t - w * 0.12)} cy={f(y0 + (y1 - y0) * t - w * 0.12)} r={f(w * 0.3)} fill={g.hedgeHi} fillOpacity={0.55} />)
  }
  return <g>{els}</g>
}

/** Flat stones along a polyline, each slightly different: the stone path. */
function stonePath(_reg: Reg, pts: [number, number][], color: string, seed: number, px: number, width = 0.4): ReactNode {
  const r = rng(seed)
  const els: ReactNode[] = []
  els.push(<path key="bed" d={`M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}`} fill="none" stroke="#0f1a12" strokeOpacity={0.55} strokeWidth={width + 0.12} strokeLinejoin="round" strokeLinecap="round" />)
  els.push(<path key="bed2" d={`M${pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L')}`} fill="none" stroke={darken(color, 0.55)} strokeWidth={width + 0.04} strokeLinejoin="round" strokeLinecap="round" />)
  let k = 0
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1]
    const len = Math.hypot(bx - ax, by - ay)
    const dx = (bx - ax) / len, dy = (by - ay) / len
    let t = 0
    while (t < len) {
      const L = 0.2 + r() * 0.14
      const cx = ax + dx * (t + L / 2), cy = ay + dy * (t + L / 2)
      const w = width * (0.9 + r() * 0.12)
      const c = r() < 0.5 ? lighten(color, r() * 0.14) : darken(color, r() * 0.14)
      const jx = (r() - 0.5) * 0.03
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI + (r() - 0.5) * 3
      els.push(
        <rect key={k++} x={f(-L / 2 + 0.012)} y={f(-w / 2)} width={f(L - 0.024)} height={f(w)} rx={0.04} fill={c} stroke={INK} strokeOpacity={0.5} strokeWidth={px * 1.2}
          transform={`translate(${f(cx + jx)} ${f(cy)}) rotate(${f(ang)})`} />,
      )
      t += L
    }
  }
  return <g>{els}</g>
}

function flowerBed(reg: Reg, st: StyleKit, x: number, y: number, w: number, h: number, seed: number, px: number): ReactNode {
  const r = rng(seed)
  const g = st.garden
  const els: ReactNode[] = [<rect key="bed" x={f(x)} y={f(y)} width={f(w)} height={f(h)} rx={Math.min(w, h) / 2.4} fill={g.bed} stroke={INK} strokeOpacity={0.5} strokeWidth={px * 1.2} />]
  const area = w * h
  const nShrub = Math.max(1, Math.round(Math.max(w, h) / 0.5))
  for (let i = 0; i < nShrub; i++) {
    const t = (i + 0.5) / nShrub
    const cx = w > h ? x + w * t : x + w / 2, cy = w > h ? y + h / 2 : y + h * t
    els.push(<circle key={`s${i}`} cx={f(cx)} cy={f(cy)} r={f(Math.min(w, h) * 0.34)} fill={reg.dome(g.hedge)} stroke={INK} strokeOpacity={0.4} strokeWidth={px} />)
  }
  const nF = Math.max(4, Math.round(area * 28))
  for (let i = 0; i < nF; i++) {
    const fx = x + 0.04 + r() * (w - 0.08), fy = y + 0.04 + r() * (h - 0.08)
    els.push(<circle key={`f${i}`} cx={f(fx)} cy={f(fy)} r={f(0.017 + r() * 0.014)} fill={g.flowers[Math.floor(r() * Math.min(2, g.flowers.length))]} fillOpacity={0.92} />)
  }
  return <g>{els}</g>
}

/** Everything outside the grid. Returns the base layer (under the house) and a light layer (over it). */
export function renderGarden(plan: Plan, reg: Reg, st: StyleKit, lot: LotGeom, seed: number): { base: ReactNode; light: ReactNode; shadow: ReactNode } {
  const { n, u, bx0, by0, bx1, by1, gut, gutOuter } = lot
  const px = 1 / u
  const g = st.garden
  const r = rng(seed)
  const base: ReactNode[] = []
  const shadows: ReactNode[] = []
  const light: ReactNode[] = []

  // 1. ground
  base.push(<rect key="lawn" x={f(bx0)} y={f(by0)} width={f(bx1 - bx0)} height={f(by1 - by0)} fill={floorPaint(reg, { mat: 'lawn', a: g.lawn, b: g.lawnDark }, u)} />)
  // mottling: large soft patches of darker and lighter grass
  for (let i = 0; i < 14; i++) {
    const cx = bx0 + r() * (bx1 - bx0), cy = by0 + r() * (by1 - by0)
    base.push(<ellipse key={`p${i}`} cx={f(cx)} cy={f(cy)} rx={f(0.5 + r() * 0.9)} ry={f(0.4 + r() * 0.7)} fill={r() < 0.6 ? g.lawnDark : lighten(g.lawn, 0.08)} fillOpacity={0.35} />)
  }

  // 2. the front door decides where the path goes
  const fd = plan.frontDoor
  type Side = 'E' | 'S' | 'W' | 'N'
  let doorSide: Side | null = null
  let doorPt: [number, number] = [0, 0]
  const wallHalf = (axis: 'h' | 'v', line: number, pos: number) => {
    const e = plan.edges.find(x => x.axis === axis && x.line === line && x.pos === pos)
    return e ? edgeHalf(e) : 0.135
  }
  if (fd) {
    const half = wallHalf(fd.axis, fd.line, fd.pos)
    if (fd.axis === 'v') doorSide = fd.line >= n ? 'E' : fd.line <= 0 ? 'W' : null
    else doorSide = fd.line >= n ? 'S' : fd.line <= 0 ? 'N' : null
    doorPt = pt(fd.axis, fd.line, fd.pos + 0.5, (doorSide === 'E' || doorSide === 'S' ? 1 : -1) * half)
  }
  // path polyline (cells): from the door out to the box edge
  let path: [number, number][] = []
  const stepD = 0.78
  if (doorSide === 'E') {
    const sx = doorPt[0] + stepD
    const midX = n + 0.2 + (bx1 - n) * 0.45
    path = [[sx, doorPt[1]], [midX, doorPt[1]], [midX, by1 + 0.3]]
  } else if (doorSide === 'S') {
    const sy = doorPt[1] + stepD
    path = [[doorPt[0], sy], [doorPt[0], by1 + 0.3]]
  }
  const pathBox = (pad = 0.34) => path.length > 1 ? path.slice(0, -1).map((p, i) => {
    const q = path[i + 1]
    return { x0: Math.min(p[0], q[0]) - pad, y0: Math.min(p[1], q[1]) - pad, x1: Math.max(p[0], q[0]) + pad, y1: Math.max(p[1], q[1]) + pad }
  }) : []
  const pboxes = pathBox()
  const onPath = (x: number, y: number, rad: number) => pboxes.some(b => x + rad > b.x0 && x - rad < b.x1 && y + rad > b.y0 && y - rad < b.y1)

  // 3. foundation beds (south and east faces only: top / left meet the gutter), skipping door and bay spots
  const ext = plan.edges.filter(e => e.kind === 'ext' || e.kind === 'extx')
  const bedRects: { x: number; y: number; w: number; h: number }[] = []
  const bayEdges = new Set<string>()
  if (g.features.includes('bay')) {
    const wins = plan.windows.filter(w => (w.axis === 'h' && w.line >= n) || (w.axis === 'v' && w.line >= n))
    wins.slice(0, 2).forEach(w => bayEdges.add(`${w.axis}${w.line}.${w.pos}`))
  }
  const doorEdge = fd ? `${fd.axis}${fd.line}.${fd.pos}` : ''
  const bedDepth = 0.34
  const bedGap = 0.12
  for (const side of ['S', 'E'] as const) {
    const run = ext.filter(e => (side === 'S' ? e.axis === 'h' && e.line >= n : e.axis === 'v' && e.line >= n)).sort((a, b) => a.pos - b.pos)
    let start: number | null = null
    let prev = -2
    const flush = (end: number) => {
      if (start === null || end - start < 0.8) { start = null; return }
      const a = start + 0.08, b = end - 0.08
      const half = 0.135
      if (side === 'S') bedRects.push({ x: a, y: n + half + bedGap, w: b - a, h: bedDepth })
      else bedRects.push({ x: n + half + bedGap, y: a, w: bedDepth, h: b - a })
      start = null
    }
    for (const e of run) {
      const key = `${e.axis}${e.line}.${e.pos}`
      const blocked = key === doorEdge || bayEdges.has(key)
      if (blocked) { flush(prev + 1); prev = -2; continue }
      if (start === null || e.pos !== prev + 1) { flush(prev + 1); start = e.pos }
      prev = e.pos
    }
    flush(prev + 1)
  }
  // glasshouse (Victorian): against the east face, on the rows farthest from the path
  let gh: { x: number; y: number; w: number; h: number } | null = null
  if (g.features.includes('glasshouse')) {
    const runs = ext.filter(e => e.axis === 'v' && e.line >= n && `${e.axis}${e.line}.${e.pos}` !== doorEdge).map(e => e.pos).sort((a, b) => a - b)
    if (runs.length >= 2) {
      const cand = { x: n + 0.2, y: runs[0] + 0.24, w: 0.62, h: Math.min(1.5, runs.filter(v => v < runs[0] + 2).length * 0.75 + 0.1) }
      if (!pboxes.some(b => cand.x + cand.w > b.x0 && cand.x < b.x1 && cand.y + cand.h > b.y0 && cand.y < b.y1)) gh = cand
    }
  }
  if (gh) {
    const G = gh
    for (let i = bedRects.length - 1; i >= 0; i--) {
      const b = bedRects[i]
      if (b.x < G.x + G.w + 0.05 && b.x + b.w > G.x - 0.05 && b.y < G.y + G.h + 0.05 && b.y + b.h > G.y - 0.05) {
        // keep the part of an east bed that lies below the glasshouse
        if (b.h > b.w && b.y + b.h > G.y + G.h + 0.6) bedRects[i] = { ...b, y: G.y + G.h + 0.15, h: b.y + b.h - (G.y + G.h + 0.15) }
        else bedRects.splice(i, 1)
      }
    }
  }
  for (const b of bedRects.filter(b => !onPath(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) / 2))) base.push(flowerBed(reg, st, b.x, b.y, b.w, b.h, seed + Math.round(b.x * 100 + b.y * 10), px))
  // beds interrupted by the path: trim them to either side of the path crossing
  for (const b of bedRects.filter(b => onPath(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) / 2))) {
    const horiz = b.w > b.h
    const lo = horiz ? b.x : b.y, hi = horiz ? b.x + b.w : b.y + b.h
    const cuts = pboxes.filter(pb => (horiz ? pb.y1 > b.y && pb.y0 < b.y + b.h : pb.x1 > b.x && pb.x0 < b.x + b.w))
    let segs: [number, number][] = [[lo, hi]]
    for (const c of cuts) {
      const [c0, c1] = horiz ? [c.x0, c.x1] : [c.y0, c.y1]
      segs = segs.flatMap(([a, z]) => (c1 <= a || c0 >= z ? [[a, z] as [number, number]] : [[a, Math.min(z, c0)], [Math.max(a, c1), z]].filter(([p, q]) => q - p > 0.35) as [number, number][]))
    }
    for (const [a, z] of segs) base.push(horiz ? flowerBed(reg, st, a, b.y, z - a, b.h, seed + Math.round(a * 50), px) : flowerBed(reg, st, b.x, a, b.w, z - a, seed + Math.round(a * 50), px))
  }

  // 4. path + steps
  if (doorSide && fd) {
    base.push(stonePath(reg, path, g.path, seed + 7, px))
    const dirx = doorSide === 'E' ? 1 : doorSide === 'W' ? -1 : 0
    const diry = doorSide === 'S' ? 1 : doorSide === 'N' ? -1 : 0
    // porch slab against the wall, then two treads down to the path
    const half = wallHalf(fd.axis, fd.line, fd.pos)
    const treads: ReactNode[] = []
    const slabD = 0.46, slabW = 0.96
    const slabC: [number, number] = dirx ? [fd.line + dirx * (half + slabD / 2), fd.pos + 0.5] : [fd.pos + 0.5, fd.line + diry * (half + slabD / 2)]
    {
      const w = dirx ? slabD : slabW, h = dirx ? slabW : slabD
      treads.push(<g key="slab" data-porch data-porch-cx={f(slabC[0])} data-porch-cy={f(slabC[1])}>
        <rect x={f(slabC[0] - w / 2)} y={f(slabC[1] - h / 2)} width={f(w)} height={f(h)} fill={reg.sheen(lighten(g.steps, 0.04))} stroke={INK} strokeOpacity={0.6} strokeWidth={px * 1.5} />
        <rect x={f(slabC[0] - w / 2 + 0.04)} y={f(slabC[1] - h / 2 + 0.04)} width={f(w - 0.08)} height={f(h - 0.08)} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={px} />
        {dirx ? <path d={`M${f(slabC[0])} ${f(slabC[1] - h / 2 + 0.05)}V${f(slabC[1] + h / 2 - 0.05)}`} stroke={INK} strokeOpacity={0.3} strokeWidth={px} /> : <path d={`M${f(slabC[0] - w / 2 + 0.05)} ${f(slabC[1])}H${f(slabC[0] + w / 2 - 0.05)}`} stroke={INK} strokeOpacity={0.3} strokeWidth={px} />}
      </g>)
    }
    for (let k = 0; k < 2; k++) {
      const d0 = half + slabD + k * 0.13
      const cx = dirx ? fd.line + dirx * (d0 + 0.065) : fd.pos + 0.5
      const cy = diry ? fd.line + diry * (d0 + 0.065) : fd.pos + 0.5
      const w = dirx ? 0.13 : slabW, h = dirx ? slabW : 0.13
      const c = lighten(g.steps, 0.02 * (1 - k) + 0.05)
      treads.push(<rect key={`t${k}`} x={f(cx - w / 2)} y={f(cy - h / 2)} width={f(w)} height={f(h)} fill={reg.sheen(c)} stroke={INK} strokeOpacity={0.55} strokeWidth={px * 1.2} />)
    }
    base.push(<g key="steps">{keyed(treads)}</g>)
    // iron lantern on a post beside the steps
    const lamp = pt(fd.axis, fd.line, fd.pos + 0.5 + (fd.axis === 'v' ? -0.62 : 0.62), (doorSide === 'E' || doorSide === 'S' ? 1 : -1) * (half + 0.4))
    if (g.features.includes('lamp-post')) {
      base.push(
        <g key="post" data-lamp-post>
          <circle cx={f(lamp[0])} cy={f(lamp[1])} r={0.13} fill="#1a1a1c" stroke={INK} strokeOpacity={0.8} strokeWidth={px * 1.5} />
          <circle cx={f(lamp[0])} cy={f(lamp[1])} r={0.085} fill={reg.dome('#3a3a3e')} stroke={g.steps} strokeOpacity={0.8} strokeWidth={px * 1.5} />
          <circle cx={f(lamp[0])} cy={f(lamp[1])} r={0.05} fill="#ffe2a0" />
          {[0, 1, 2, 3].map(k => <path key={k} d={`M${f(lamp[0] + Math.cos(k * 1.5708 + 0.785) * 0.085)} ${f(lamp[1] + Math.sin(k * 1.5708 + 0.785) * 0.085)}L${f(lamp[0] + Math.cos(k * 1.5708 + 0.785) * 0.13)} ${f(lamp[1] + Math.sin(k * 1.5708 + 0.785) * 0.13)}`} stroke="#1a1a1c" strokeWidth={px * 2} />)}
        </g>,
      )
      light.push(<circle key="postglow" cx={f(lamp[0])} cy={f(lamp[1])} r={1.3} fill={reg.glow('#ffb65a', 0.4)} />)
    }
  }

  // 5. light spilling from windows onto the lawn (south and east faces)
  for (const w of plan.windows) {
    const atS = w.axis === 'h' && w.line >= n, atE = w.axis === 'v' && w.line >= n
    if (!atS && !atE) continue
    const id = reg.once('gspill', i => (
      <radialGradient key={i} id={i}><stop offset="0" stopColor="#ffcf8a" stopOpacity={0.36} /><stop offset="0.6" stopColor="#ffcf8a" stopOpacity={0.12} /><stop offset="1" stopColor="#ffcf8a" stopOpacity={0} /></radialGradient>
    ))
    const cx = atS ? w.pos + 0.5 : n + 0.25, cy = atS ? n + 0.25 : w.pos + 0.5
    light.push(<ellipse key={`sp${w.axis}${w.pos}${w.line}`} cx={f(cx)} cy={f(cy)} rx={atS ? 0.8 : 0.95} ry={atS ? 0.95 : 0.8} fill={reg.url(id)} />)
  }

  // the house's own cast shadow on the lawn: its footprint, offset south-east
  for (const room of plan.rooms) {
    if (room.exterior) continue
    shadows.push(<path key={`hs${room.id}`} d={room.cells.map(([rr, cc]) => `M${cc} ${rr}h1v1h-1Z`).join('')}/>)
  }

  // 6. features
  const feat = (k: string) => g.features.includes(k as StyleKit['garden']['features'][number])
  const occupied: Circle[] = []
  const place = (c: Circle) => { occupied.push(c) }
  const rects: { x0: number; y0: number; x1: number; y1: number }[] = [...bedRects.map(b => ({ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }))]
  const free = (c: Circle) => {
    if (onPath(c.x, c.y, c.r * 0.9)) return false
    if (occupied.some(o => Math.hypot(o.x - c.x, o.y - c.y) < (o.r + c.r) * 0.82)) return false
    if (rects.some(b => c.x + c.r > b.x0 && c.x - c.r < b.x1 && c.y + c.r > b.y0 && c.y - c.r < b.y1)) return false
    // never inside the grid, the gutter strips, or touching the house
    if (c.x + c.r > -0.2 && c.x - c.r < n + 0.2 && c.y + c.r > -0.2 && c.y - c.r < n + 0.2) return false
    if (c.y - c.r < gutOuter + gut + 0.06 && c.x + c.r > gutOuter - 0.06 && c.x - c.r < n + 0.06 && c.y + c.r > gutOuter - 0.06) return false
    if (c.x - c.r < gutOuter + gut + 0.06 && c.y + c.r > gutOuter - 0.06 && c.y - c.r < n + 0.06 && c.x + c.r > gutOuter - 0.06) return false
    return true
  }
  const lotW = bx1 - bx0
  void lotW

  if (gh) {
    const G = gh
    rects.push({ x0: G.x - 0.05, y0: G.y - 0.05, x1: G.x + G.w + 0.05, y1: G.y + G.h + 0.05 })
    shadows.push(<rect key="gs" x={f(G.x)} y={f(G.y)} width={G.w} height={G.h} rx={0.03} />)
    {
      const nM = Math.max(3, Math.round(G.h / 0.25))
      base.push(
        <g key="glasshouse" data-glasshouse>
          <rect x={f(G.x)} y={f(G.y)} width={G.w} height={G.h} rx={0.03} fill="#16303a" stroke="#c9d6d0" strokeOpacity={0.85} strokeWidth={px * 2} />
          <rect x={f(G.x + 0.04)} y={f(G.y + 0.04)} width={f(G.w - 0.08)} height={f(G.h - 0.08)} fill={reg.glow('#9FB4D8', 0.3, 0.12)} />
          {/* mullions every 0.25u, a ridge down the middle, hip lines at the ends */}
          {Array.from({ length: nM - 1 }, (_, i) => <path key={`m${i}`} d={`M${f(G.x)} ${f(G.y + ((i + 1) * G.h) / nM)}h${G.w}`} stroke="#c9d6d0" strokeOpacity={0.75} strokeWidth={px * 2} />)}
          <path d={`M${f(G.x + G.w / 2)} ${f(G.y)}v${G.h}`} stroke="#e8f0ec" strokeOpacity={0.95} strokeWidth={px * 3} />
          <path d={`M${f(G.x)} ${f(G.y)}L${f(G.x + G.w / 2)} ${f(G.y + 0.16)}L${f(G.x + G.w)} ${f(G.y)}M${f(G.x)} ${f(G.y + G.h)}L${f(G.x + G.w / 2)} ${f(G.y + G.h - 0.16)}L${f(G.x + G.w)} ${f(G.y + G.h)}`} fill="none" stroke="#c9d6d0" strokeOpacity={0.6} strokeWidth={px * 1.5} />
          {/* door on the house side */}
          <rect x={f(G.x - 0.02)} y={f(G.y + G.h / 2 - 0.12)} width={0.06} height={0.24} fill="#2a1c12" stroke="#c9d6d0" strokeOpacity={0.8} strokeWidth={px * 1.5} />
          {[0.2, 0.5, 0.8].map((t, i) => <circle key={`gp${i}`} cx={f(G.x + 0.18 + (i % 2) * 0.26)} cy={f(G.y + G.h * t)} r={0.08} fill="#2f6a46" stroke={INK} strokeOpacity={0.4} strokeWidth={px} />)}
        </g>,
      )
    }
    light.push(<rect key="ghlight" x={f(G.x)} y={f(G.y)} width={G.w} height={G.h} rx={0.03} fill={reg.glow('#9FB4D8', 0.14, 0.05)} />)
  }

  // bay windows
  if (bayEdges.size) {
    for (const key of bayEdges) {
      const m = /^([hv])(\d+)\.(\d+)$/.exec(key)!
      const axis = m[1] as 'h' | 'v', line = +m[2], pos = +m[3]
      const half = 0.135
      const c = pos + 0.5
      const poly = axis === 'h'
        ? `M${f(c - 0.5)} ${f(line + half)}L${f(c - 0.34)} ${f(line + half + 0.26)}L${f(c + 0.34)} ${f(line + half + 0.26)}L${f(c + 0.5)} ${f(line + half)}Z`
        : `M${f(line + half)} ${f(c - 0.5)}L${f(line + half + 0.26)} ${f(c - 0.34)}L${f(line + half + 0.26)} ${f(c + 0.34)}L${f(line + half)} ${f(c + 0.5)}Z`
      shadows.push(<path key={`bs${key}`} d={poly} />)
      const inset = axis === 'h'
        ? `M${f(c - 0.4)} ${f(line + half + 0.02)}L${f(c - 0.28)} ${f(line + half + 0.2)}L${f(c + 0.28)} ${f(line + half + 0.2)}L${f(c + 0.4)} ${f(line + half + 0.02)}Z`
        : `M${f(line + half + 0.02)} ${f(c - 0.4)}L${f(line + half + 0.2)} ${f(c - 0.28)}L${f(line + half + 0.2)} ${f(c + 0.28)}L${f(line + half + 0.02)} ${f(c + 0.4)}Z`
      base.push(
        <g key={`bay${key}`}>
          <path d={poly} fill={reg.sheen(st.wall.ext)} stroke={INK} strokeOpacity={0.65} strokeWidth={px * 1.5} />
          <path d={poly} fill="none" stroke={st.wall.trim} strokeOpacity={0.6} strokeWidth={px * 1.5} />
          <path d={inset} fill="#1d2a3a" stroke={st.wall.trim} strokeOpacity={0.8} strokeWidth={px * 1.5} />
          <path d={inset} fill="#9fb4d8" fillOpacity={0.18} />
        </g>,
      )
      rects.push(axis === 'h' ? { x0: c - 0.55, y0: line, x1: c + 0.55, y1: line + 0.5 } : { x0: line, y0: c - 0.55, x1: line + 0.5, y1: c + 0.55 })
    }
  }

  // fountain / pool / well / urns
  const rightFree = bx1 - n
  if (feat('pool')) {
    // a rectangular pool in the south margin, left of the path
    const pw = Math.min(2.8, n * 0.5), ph = 0.78
    const px0 = 0.1, py0 = n + 0.52
    if (py0 + ph + 0.2 < by1 && !pboxes.some(b => px0 + pw + 1.4 > b.x0 && px0 < b.x1 && py0 + ph > b.y0 && py0 < b.y1)) {
      rects.push({ x0: px0 - 0.4, y0: py0 - 0.3, x1: px0 + pw + 1.5, y1: py0 + ph + 0.3 })
      shadows.push(<rect key="ps" x={f(px0)} y={f(py0)} width={pw} height={ph} rx={0.05} />)
      base.push(
        <g key="pool">
          <rect x={f(px0 - 0.14)} y={f(py0 - 0.14)} width={f(pw + 1.35)} height={f(ph + 0.28)} rx={0.04} fill={floorPaint(reg, { mat: 'deck', a: '#6d5f4a' }, u)} stroke={INK} strokeOpacity={0.55} strokeWidth={px * 1.5} />
          <rect x={f(px0)} y={f(py0)} width={pw} height={ph} rx={0.04} fill="#1E5B6B" stroke="#c8ccd0" strokeOpacity={0.8} strokeWidth={px * 2} />
          <rect x={f(px0 + 0.05)} y={f(py0 + 0.05)} width={f(pw - 0.1)} height={f(ph - 0.1)} rx={0.03} fill={reg.glow('#7ad0e0', 0.55, 0.12)} />
          {[0.2, 0.45, 0.7].map((t, i) => <path key={i} d={`M${f(px0 + pw * t - 0.2)} ${f(py0 + 0.2 + i * 0.16)}q0.1 -0.05 0.2 0t0.2 0`} stroke="#d8f4f8" strokeOpacity={0.35} strokeWidth={px * 1.5} fill="none" />)}
          {[0, 1].map(i => (
            <g key={`lo${i}`}><rect x={f(px0 + pw + 0.3 + i * 0.4)} y={f(py0 + 0.05)} width={0.28} height={0.66} rx={0.05} fill="#d8d4c8" stroke={INK} strokeOpacity={0.55} strokeWidth={px} /><rect x={f(px0 + pw + 0.33 + i * 0.4)} y={f(py0 + 0.08)} width={0.22} height={0.2} rx={0.04} fill="#b8b4a8" /></g>
          ))}
        </g>,
      )
    }
  }
  if (feat('fountain')) {
    const c: Circle = { x: n + rightFree * 0.5 - 0.05, y: -0.25 + (0), r: 0.42 }
    // sits in the right margin, level with the upper rows; keep off the path
    c.x = n + Math.min(0.9, rightFree * 0.5); c.y = Math.min(1.0, n * 0.2)
    if (free(c)) {
      place(c)
      shadows.push(<circle key="fs" cx={f(c.x)} cy={f(c.y)} r={c.r} />)
      base.push(
        <g key="fountain">
          <circle cx={f(c.x)} cy={f(c.y)} r={c.r} fill={reg.sheen(g.steps)} stroke={INK} strokeOpacity={0.6} strokeWidth={px * 1.5} />
          <circle cx={f(c.x)} cy={f(c.y)} r={f(c.r - 0.07)} fill="#1d5a68" stroke="#0e2f38" strokeWidth={px * 1.5} />
          <circle cx={f(c.x)} cy={f(c.y)} r={f(c.r - 0.14)} fill={reg.glow('#8fe0ea', 0.5, 0.05)} />
          <circle cx={f(c.x)} cy={f(c.y)} r={0.07} fill={g.steps} stroke={INK} strokeOpacity={0.5} strokeWidth={px} />
          {[0.18, 0.28].map(rr => <circle key={rr} cx={f(c.x)} cy={f(c.y)} r={rr} fill="none" stroke="#d8f4f8" strokeOpacity={0.35} strokeWidth={px * 1.2} />)}
        </g>,
      )
    }
  }
  if (feat('well')) {
    const c: Circle = { x: n + Math.min(0.85, rightFree * 0.5), y: n * 0.28, r: 0.3 }
    if (free(c)) {
      place(c)
      shadows.push(<circle key="ws" cx={f(c.x)} cy={f(c.y)} r={c.r} />)
      base.push(<g key="well"><circle cx={f(c.x)} cy={f(c.y)} r={c.r} fill={reg.sheen('#7a766a')} stroke={INK} strokeOpacity={0.6} strokeWidth={px * 1.5} /><circle cx={f(c.x)} cy={f(c.y)} r={0.2} fill="#0d1215" /><path d={`M${f(c.x - 0.3)} ${f(c.y)}H${f(c.x + 0.3)}`} stroke="#4a3a28" strokeWidth={0.05} /></g>)
    }
  }
  if (feat('urn')) {
    const spots: [number, number][] = fd && doorSide === 'E' ? [[doorPt[0] + 0.42, doorPt[1] - 0.66], [doorPt[0] + 0.42, doorPt[1] + 0.66]] : fd && doorSide === 'S' ? [[doorPt[0] - 0.66, doorPt[1] + 0.42], [doorPt[0] + 0.66, doorPt[1] + 0.42]] : []
    spots.forEach(([x, y], i) => {
      shadows.push(<circle key={`us${i}`} cx={f(x)} cy={f(y)} r={0.14} />)
      base.push(<g key={`urn${i}`}><circle cx={f(x)} cy={f(y)} r={0.14} fill={reg.dome('#8a8578')} stroke={INK} strokeOpacity={0.55} strokeWidth={px * 1.2} /><circle cx={f(x)} cy={f(y)} r={0.09} fill={reg.dome(g.hedge)} /></g>)
    })
  }
  if (feat('topiary')) {
    const spots: [number, number][] = [[-0.0, 0], [0, 0]]
    void spots
  }

  // loungers handled with the pool. Pots for cottage/med
  // 7. trees: candidate anchors around the lot, filtered for room
  const anchors: Circle[] = []
  const band = gutOuter
  const R0 = 0.42
  // corners and mid-edge positions inside the lawn bands
  const tlx = bx0 + (gutOuter - bx0) * 0.5, tly = by0 + (gutOuter - by0) * 0.5
  anchors.push({ x: tlx, y: tly, r: Math.min(R0, (gutOuter - bx0) * 0.46) })
  anchors.push({ x: bx1 - (bx1 - n) * 0.5, y: tly, r: Math.min(0.6, (bx1 - n) * 0.34) })
  anchors.push({ x: tlx, y: by1 - (by1 - n) * 0.5, r: Math.min(0.6, (by1 - n) * 0.34) })
  anchors.push({ x: bx1 - (bx1 - n) * 0.38, y: by1 - (by1 - n) * 0.5, r: Math.min(0.62, (by1 - n) * 0.34) })
  anchors.push({ x: tlx + 1.9, y: tly, r: Math.min(R0 * 0.85, (gutOuter - by0) * 0.46) })
  anchors.push({ x: tlx, y: tly + 2.2, r: Math.min(R0 * 0.85, (gutOuter - bx0) * 0.46) })
  anchors.push({ x: bx1 - (bx1 - n) * 0.5, y: n * 0.55, r: Math.min(0.5, (bx1 - n) * 0.3) })
  anchors.push({ x: n * 0.4, y: by1 - (by1 - n) * 0.45, r: Math.min(0.55, (by1 - n) * 0.3) })
  void band
  const kinds = g.trees
  let ti = 0
  const treeEls: ReactNode[] = []
  for (const a of anchors) {
    if (a.r < 0.2) continue
    const kind = kinds[ti % kinds.length]
    const c: Circle = kind === 'cypress' ? { ...a, r: Math.min(a.r, 0.34) } : { ...a }
    if (!free(c)) continue
    ti++
    place(c)
    shadows.push(<circle key={`ts${ti}`} cx={f(c.x)} cy={f(c.y)} r={c.r} />)
    treeEls.push(<g key={`tr${ti}`} data-tree={kind} data-cx={f(c.x)} data-cy={f(c.y)} data-r={f(c.r)}>{tree(reg, kind, c, seed + ti * 31, px)}</g>)
    if (ti >= 7) break
  }

  // 8. the lot boundary
  const edge = g.edge
  const inset = 0.09
  const ex0 = bx0 + inset, ey0 = by0 + inset, ex1 = bx1 - inset, ey1 = by1 - inset
  const gate = path.length ? path[path.length - 1] : null
  const fenceSegs: [number, number, number, number][] = []
  const addSide = (x0: number, y0: number, x1: number, y1: number) => {
    // cut a gate gap where the path leaves the lot
    if (gate && (Math.abs(gate[1] - y0) < 0.6 || Math.abs(gate[0] - x0) < 0.6) && ((y0 === y1 && gate[0] > Math.min(x0, x1) && gate[0] < Math.max(x0, x1)) || (x0 === x1 && gate[1] > Math.min(y0, y1) && gate[1] < Math.max(y0, y1)))) {
      if (y0 === y1) { fenceSegs.push([x0, y0, gate[0] - 0.38, y1], [gate[0] + 0.38, y0, x1, y1]) } else { fenceSegs.push([x0, y0, x1, gate[1] - 0.38], [x0, gate[1] + 0.38, x1, y1]) }
    } else fenceSegs.push([x0, y0, x1, y1])
  }
  addSide(ex0, ey0, ex1, ey0); addSide(ex1, ey0, ex1, ey1); addSide(ex0, ey1, ex1, ey1); addSide(ex0, ey0, ex0, ey1)
  const fence: ReactNode[] = []
  fenceSegs.forEach(([x0, y0, x1, y1], si) => {
    if (x1 - x0 < 0.01 && y1 - y0 < 0.01) return
    if (edge === 'hedge') { fence.push(<g key={si}>{hedgeRun(st, x0, y0, x1, y1, seed + si * 5, px, 0.22)}</g>); return }
    if (edge === 'low-wall') {
      fence.push(<path key={si} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={INK} strokeOpacity={0.6} strokeWidth={0.13} strokeLinecap="square" />)
      fence.push(<path key={`w${si}`} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={g.steps} strokeWidth={0.1} strokeLinecap="square" />)
      fence.push(<path key={`h${si}`} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke="#fff" strokeOpacity={0.14} strokeWidth={0.03} strokeLinecap="square" transform="translate(-0.025 -0.025)" />)
      return
    }
    // iron fence or picket: a rail plus evenly spaced pickets
    const col = edge === 'iron-fence' ? '#1a1a1c' : '#cfc7b2'
    fence.push(<path key={si} d={`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`} stroke={col} strokeOpacity={edge === 'iron-fence' ? 0.95 : 0.9} strokeWidth={0.022} />)
    const len = Math.hypot(x1 - x0, y1 - y0)
    const k = Math.max(2, Math.round(len / 0.16))
    for (let i = 0; i <= k; i++) {
      const t = i / k
      const fx = x0 + (x1 - x0) * t, fy = y0 + (y1 - y0) * t
      const post = i % 5 === 0
      fence.push(<circle key={`${si}-${i}`} cx={f(fx)} cy={f(fy)} r={post ? 0.04 : 0.016} fill={col} stroke={post ? INK : 'none'} strokeWidth={px} />)
    }
  })
  if (gate) {
    // gate: two stone piers with caps and the leaves swung open into the lot
    const horizontal = Math.abs(gate[1] - ey1) < 0.6 || Math.abs(gate[1] - ey0) < 0.6
    const gy0 = horizontal ? (Math.abs(gate[1] - ey1) < 0.6 ? ey1 : ey0) : gate[1]
    const gx0 = horizontal ? gate[0] : (Math.abs(gate[0] - ex1) < 0.6 ? ex1 : ex0)
    for (const d of [-0.38, 0.38]) {
      const px1 = horizontal ? gx0 + d : gx0, py1 = horizontal ? gy0 : gy0 + d
      fence.push(<g key={`pier${d}`}><rect x={f(px1 - 0.075)} y={f(py1 - 0.075)} width={0.15} height={0.15} fill={reg.sheen(g.steps)} stroke={INK} strokeOpacity={0.7} strokeWidth={px * 1.5} /><rect x={f(px1 - 0.045)} y={f(py1 - 0.045)} width={0.09} height={0.09} fill={lighten(g.steps, 0.15)} stroke={INK} strokeOpacity={0.4} strokeWidth={px} /></g>)
      const inward = horizontal ? (gy0 === ey1 ? -1 : 1) : (gx0 === ex1 ? -1 : 1)
      const tipx = horizontal ? px1 + (d > 0 ? -0.05 : 0.05) : px1 + inward * 0.3, tipy = horizontal ? py1 + inward * 0.3 : py1 + (d > 0 ? -0.05 : 0.05)
      fence.push(<path key={`leaf${d}`} d={`M${f(px1)} ${f(py1)}L${f(tipx)} ${f(tipy)}`} stroke={edge === 'iron-fence' ? '#1a1a1c' : g.steps} strokeWidth={0.03} strokeLinecap="round" />)
    }
  }
  base.push(<g key="fence" data-edge={edge}>{keyed(fence)}</g>)

  // gate lamps / pots
  if (feat('pots')) {
    const spots: [number, number][] = [[n + 0.62, 0.35], [-0.05, n + 0.62]]
    spots.forEach(([x, y], i) => {
      const c: Circle = { x, y, r: 0.15 }
      if (!free(c)) return
      place(c)
      base.push(<g key={`pot${i}`}><circle cx={f(x)} cy={f(y)} r={0.15} fill={reg.dome('#9a5538')} stroke={INK} strokeOpacity={0.5} strokeWidth={px} /><circle cx={f(x)} cy={f(y)} r={0.1} fill={reg.dome(g.hedge)} />{[0, 1, 2, 3, 4].map(k => <circle key={k} cx={f(x + Math.cos(k * 1.25) * 0.05)} cy={f(y + Math.sin(k * 1.25) * 0.05)} r={0.022} fill={g.flowers[k % g.flowers.length]} />)}</g>)
    })
  }
  if (feat('vines')) {
    // climbing growth along the exterior south and east wall foot
    const dots: ReactNode[] = []
    const rv = rng(seed + 99)
    for (let i = 0; i < 40; i++) {
      const t = rv() * (n - 0.4) + 0.2
      const onS = i % 2 === 0
      const x = onS ? t : n + 0.17 + rv() * 0.06, y = onS ? n + 0.17 + rv() * 0.06 : t
      if (onS ? t > (path[0]?.[0] ?? 99) - 0.5 && t < (path[0]?.[0] ?? 99) + 0.5 && doorSide === 'S' : doorSide === 'E' && Math.abs(t - (doorPt[1] ?? 0)) < 0.6) continue
      dots.push(<circle key={i} cx={f(x)} cy={f(y)} r={0.03 + rv() * 0.03} fill={rv() < 0.7 ? '#2f6a3a' : st.garden.flowers[0]} fillOpacity={0.9} />)
    }
    base.push(<g key="vines">{dots}</g>)
  }

  // shadows of the house on the lawn: a soft SE drop beneath the walls
  const shadow = <g key="shadows" fill="#000">{keyed(shadows)}</g>
  return {
    base: <g data-layer="garden">{keyed(base)}<g data-layer="trees">{keyed(treeEls)}</g></g>,
    light: <g data-layer="garden-light">{keyed(light)}</g>,
    shadow,
  }
}
