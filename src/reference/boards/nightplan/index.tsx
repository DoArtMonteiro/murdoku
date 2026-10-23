// ============================================================================
// PROTOTYPE 1 — "Night Plan": a 2D architect's floor plan on a bone sheet.
// Spec: scratchpad/r1/F-spec.md (palette §1, sheet §3, walls/doors/windows §4,
// pictograms §5, light §7). Purely visual: aria-hidden, no handlers, no
// network, deterministic for (puzzle, floor, size). Theme is accepted but the
// sheet does not theme (§1.1).
// ============================================================================
import { memo, useId, useMemo } from 'react'
import type { BoardLayout, BoardProps } from '../../contract'
import { A, FLOOR_FILL, P, PLAN_FONT, VIGNETTE } from './palette'
import { buildPlan, doorGeom, edgeHalf, pt, wallPath, WINDOW_GAP, type Plan, type PlanRoom } from './plan'
import { PieceArt, PieceShadow } from './furniture'

/** Numeral margin top/left and trim margin right/bottom, in cells (F-spec §3). */
export const MARGIN_NUM = 0.6
export const MARGIN_TRIM = 0.4

/**
 * F-spec §3: u = floor(min(w,h)/(n+1)); sheet S=(n+1)u centred in the box; the
 * grid starts 0.6u in from the sheet's top-left (numeral margin), leaving a
 * 0.4u trim margin right and bottom.
 */
export function boardLayout(width: number, height: number, n: number): BoardLayout {
  const u = Math.max(1, Math.floor(Math.min(width, height) / (n + 1)))
  const S = (n + 1) * u
  const sx = Math.floor((width - S) / 2)
  const sy = Math.floor((height - S) / 2)
  const m = Math.round(MARGIN_NUM * u)
  return { x0: sx + m, y0: sy + m, cellW: u, cellH: u }
}

function hash(a: number, b: number, c: number): number {
  let h = 2166136261 ^ a
  h = Math.imul(h ^ b, 16777619)
  h = Math.imul(h ^ c, 16777619)
  h ^= h >>> 15
  return (Math.imul(h, 2246822519) >>> 0) / 4294967296
}

function roomPath(room: PlanRoom): string {
  return room.cells.map(([r, c]) => `M${c} ${r}h1v1h-1Z`).join('')
}

const hair = (opacity: number, w = 0.5) => ({ stroke: P.ink, strokeOpacity: opacity, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const })

function Floors({ plan }: { plan: Plan }) {
  return (
    <g shapeRendering="crispEdges">
      {plan.rooms.map(room => (
        <g key={room.id} data-room={room.name}>
          {room.kind === 'garden' && <path d={roomPath(room)} fill={P.paper} />}
          <path d={roomPath(room)} fill={FLOOR_FILL[room.kind]} fillOpacity={room.kind === 'garden' ? 0.6 : 1} />
        </g>
      ))}
    </g>
  )
}

function Stipple({ plan }: { plan: Plan }) {
  const dots: { x: number; y: number }[] = []
  for (const room of plan.rooms) {
    if (room.kind !== 'garden') continue
    for (const [r, c] of room.cells) {
      for (let i = 0; i < 7; i++) dots.push({ x: c + 0.1 + hash(r, c, i * 2) * 0.8, y: r + 0.1 + hash(r, c, i * 2 + 1) * 0.8 })
    }
  }
  return <g fill={P.ink} fillOpacity={0.25}>{dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={0.02} />)}</g>
}

function Lines({ plan }: { plan: Plan }) {
  const out: React.ReactElement[] = []
  plan.edges.forEach((e, i) => {
    const [x0, y0] = pt(e.axis, e.line, e.pos, 0)
    const [x1, y1] = pt(e.axis, e.line, e.pos + 1, 0)
    if (e.kind === 'seam') out.push(<path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} fill="none" {...hair(0.1)} />)
    else if (e.kind === 'soft') out.push(<path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} fill="none" strokeDasharray="3 3" {...hair(0.45, 1)} />)
    else if (e.kind === 'fence') {
      out.push(<path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} fill="none" {...hair(0.8, 1.5)} />)
      for (const t of [0, 0.5]) {
        const [px, py] = pt(e.axis, e.line, e.pos + t, 0)
        out.push(<rect key={`${i}p${t}`} x={px - 0.035} y={py - 0.035} width={0.07} height={0.07} fill={P.ink} />)
      }
    }
  })
  return <g>{out}</g>
}

function Pools({ plan, id }: { plan: Plan; id: string }) {
  const lamps = plan.furniture.filter(f => f.type === 'lamp')
  if (!lamps.length) return null
  return (
    <g style={{ mixBlendMode: 'multiply' }}>
      {lamps.map((f, i) => {
        const rid = plan.roomAt[f.row]?.[f.col]
        const room = plan.rooms.find(r => r.id === rid)
        return (
          <g key={i} clipPath={room ? `url(#${id}-room-${room.id})` : undefined}>
            <circle cx={f.col + 0.5} cy={f.row + 0.5} r={1.6} fill={`url(#${id}-pool)`} />
          </g>
        )
      })}
    </g>
  )
}

function Labels({ plan, u, mode }: { plan: Plan; u: number; mode: 'wall' | 'floor' }) {
  const list = plan.labels.filter(l => (mode === 'wall' ? l.mode === 'wall' : l.mode !== 'wall'))
  if (!list.length) return null
  const onWall = mode === 'wall'
  return (
    <g fontFamily={PLAN_FONT} fill={onWall ? P.paper : P.ink} fillOpacity={onWall ? 1 : A.label}>
      {list.map(l => (
        <text
          key={l.roomId} data-label={l.text} data-label-mode={l.mode} x={l.x} y={l.y} textAnchor="middle" fontSize={l.fs / u}
          transform={l.rot ? `rotate(${l.rot} ${l.x} ${l.cy})` : undefined}
          style={{ letterSpacing: `${l.ls}em` }}
          {...(l.halo || l.mode === 'fence' ? { stroke: P.paper, strokeWidth: 0.05, paintOrder: 'stroke' } : {})}
        >
          {l.text}
        </text>
      ))}
    </g>
  )
}

function Openings({ plan, sw }: { plan: Plan; sw: number }) {
  const els: React.ReactElement[] = []
  plan.windows.forEach((w, i) => {
    // architectural window: poché interrupted by a paper-filled frame (no floor tint
    // bleeding into the wall) with two thin parallel glass lines between jamb lines
    const g0 = w.pos + (1 - WINDOW_GAP) / 2, g1 = g0 + WINDOW_GAP
    const e = plan.edges.find(x => x.axis === w.axis && x.line === w.line && x.pos === w.pos)!
    const h = edgeHalf(e)
    const [ax, ay] = pt(w.axis, w.line, g0, -h)
    const [bx, by] = pt(w.axis, w.line, g1, h)
    const seg = (d: number, width: number) => {
      const [sx, sy] = pt(w.axis, w.line, g0, d)
      const [ex, ey] = pt(w.axis, w.line, g1, d)
      return <path d={`M${sx} ${sy}L${ex} ${ey}`} stroke={P.ink} strokeWidth={width} vectorEffect="non-scaling-stroke" fill="none" />
    }
    const jamb = (a: number) => {
      const [sx, sy] = pt(w.axis, w.line, a, -h)
      const [ex, ey] = pt(w.axis, w.line, a, h)
      return <path d={`M${sx} ${sy}L${ex} ${ey}`} stroke={P.ink} strokeWidth={1.5} vectorEffect="non-scaling-stroke" fill="none" />
    }
    els.push(
      <g key={`w${i}`} data-window>
        <rect x={Math.min(ax, bx)} y={Math.min(ay, by)} width={Math.abs(bx - ax)} height={Math.abs(by - ay)} fill={P.paper} />
        {seg(-h, 1.5)}{seg(h, 1.5)}{jamb(g0)}{jamb(g1)}{seg(-0.035, 1)}{seg(0.035, 1)}
      </g>,
    )
  })
  plan.doors.forEach((d, i) => {
    const g = doorGeom(d)
    if (d.pocket) {
      const line = (off: number) => {
        const [ax, ay] = pt(d.axis, d.line, g.gap[0], off)
        const [bx, by] = pt(d.axis, d.line, g.gap[1], off)
        return <path d={`M${ax} ${ay}L${bx} ${by}`} stroke={P.ink} strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
      }
      els.push(<g key={`d${i}`} data-door={d.front ? 'front-pocket' : 'pocket'}>{line(-0.04)}{line(0.04)}</g>)
      return
    }
    els.push(
      <g key={`d${i}`} data-door={d.front ? 'front' : 'inner'}>
        <path d={`M${g.tip[0]} ${g.tip[1]}A0.6 0.6 0 0 ${g.sweep} ${g.jamb[0]} ${g.jamb[1]}`} fill="none" stroke={P.ink} strokeOpacity={A.arc} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={`M${g.hinge[0]} ${g.hinge[1]}L${g.tip[0]} ${g.tip[1]}`} stroke={P.ink} strokeWidth={Math.min(2, sw)} vectorEffect="non-scaling-stroke" strokeLinecap="butt" />
      </g>,
    )
  })
  return <g>{els}</g>
}

function Ticks({ n }: { n: number }) {
  const o = 0.135, L = 0.1
  let d = ''
  for (let k = 0; k <= n; k++) {
    d += `M${k} ${-o}V${-o - L}M${k} ${n + o}V${n + o + L}M${-o} ${k}H${-o - L}M${n + o} ${k}H${n + o + L}`
  }
  return <path d={d} fill="none" {...hair(0.25, 1)} />
}

function BoardImpl({ puzzle, floor, width: w0, height: h0, layout }: BoardProps) {
  const width = Math.max(0, w0), height = Math.max(0, h0)
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = `np${rid}`
  const u = layout.cellW
  const n = puzzle.size
  const plan = useMemo(() => buildPlan(puzzle, floor, u), [puzzle, floor, u])
  const walls = useMemo(() => wallPath(plan), [plan])
  const sw = u < 60 ? 1.5 : 2

  const S = (n + 1) * u
  const m = Math.round(MARGIN_NUM * u)
  const sx = layout.x0 - m
  const sy = layout.y0 - m
  const cx = sx + S / 2, cy = sy + S / 2

  const rugs = plan.furniture.filter(f => f.type === 'rug')
  const rest = plan.furniture.filter(f => f.type !== 'rug')

  return (
    <div aria-hidden="true" data-board="nightplan" style={{ position: 'relative', width, height, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: sx, top: sy, width: S, height: S, boxShadow: 'var(--shadow-elevated, 0 18px 50px -12px rgba(0,0,0,.9))' }} />
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} focusable="false">
        <defs>
          <radialGradient id={`${id}-pool`}>
            <stop offset="0" stopColor={P.amber} stopOpacity={A.pool} />
            <stop offset="1" stopColor={P.amber} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={S * 0.70711}>
            <stop offset="0.778" stopColor={VIGNETTE} stopOpacity={0} />
            <stop offset="1" stopColor={VIGNETTE} stopOpacity={A.vignette} />
          </radialGradient>
          {plan.rooms.map(r => (
            <clipPath key={r.id} id={`${id}-room-${r.id}`}><path d={roomPath(r)} /></clipPath>
          ))}
          <style>{`.np-sil, .np-sil * { fill: ${P.ink} !important; stroke: none !important; }`}</style>
        </defs>

        {/* sheet */}
        <rect x={sx} y={sy} width={S} height={S} fill={P.paper} />
        <rect x={sx + 0.5} y={sy + 0.5} width={S - 1} height={S - 1} fill="none" stroke={P.ink} strokeOpacity={A.trim} strokeWidth={1} />

        <g transform={`translate(${layout.x0} ${layout.y0}) scale(${u})`}>
          <Floors plan={plan} />
          <Stipple plan={plan} />
          <Lines plan={plan} />
          {rugs.map((f, i) => <PieceArt key={`rug${i}`} f={f} sw={sw} />)}
          <Pools plan={plan} id={id} />
          <Labels plan={plan} u={u} mode="floor" />
          {rest.map((f, i) => <PieceShadow key={`s${i}`} f={f} sw={sw} />)}
          {rest.map((f, i) => <PieceArt key={`a${i}`} f={f} sw={sw} />)}
          <path d={walls} fill={P.wall} data-walls />
          <Openings plan={plan} sw={sw} />
          <Labels plan={plan} u={u} mode="wall" />
          <Ticks n={n} />
        </g>

        {/* graphite vignette, over the drawing, under tokens/numerals (shell layers) */}
        <rect x={sx} y={sy} width={S} height={S} fill={`url(#${id}-vig)`} style={{ mixBlendMode: 'multiply' }} />
      </svg>
    </div>
  )
}

const Board = memo(BoardImpl)
export default Board
