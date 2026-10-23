// Illustrated furniture. Every logical piece is drawn exactly once inside its
// own footprint (inset >= 0.08 cell from the footprint edge), facing south in a
// local W x H box, then rotated into place with the same rule the Night Plan
// uses. The shape language per style follows the style bible, section 3: a
// Victorian chesterfield is not a modernist slab sofa, a Tudor settle is not a
// Deco kidney. The outline is one ink colour (#15110E at 55%), 1 px.
import type { ReactElement, ReactNode } from 'react'
import type { Furniture, FurnitureType } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { darken, hashStr, lighten, rng } from './color'
import type { Reg } from './reg'
import type { StyleKit } from './styles/types'

export const INK = '#15110E'
export const INSET = 0.08

export interface Pc {
  reg: Reg
  st: StyleKit
  W: number
  H: number
  px: number
  /** Stable seed for per-piece variation. */
  seed: number
  /** Rug only: local coordinates of the cell junctions that fall inside the rug. */
  jx?: number[]
  jy?: number[]
}

const f = (v: number) => +v.toFixed(3)
type Art = (p: Pc) => ReactNode

const ol = (p: Pc, w = 1) => ({ stroke: INK, strokeOpacity: 0.55, strokeWidth: p.px * w, strokeLinejoin: 'round' as const })

/** North-west highlight: a 1 px white line along the top and left edges of a rounded rect. */
function hl(p: Pc, x: number, y: number, w: number, h: number, r = 0.04): ReactNode {
  const rr = Math.min(r, w / 2, h / 2)
  return <path d={`M${f(x + 0.01)} ${f(y + h - rr)}V${f(y + rr)}Q${f(x + 0.01)} ${f(y + 0.01)} ${f(x + rr)} ${f(y + 0.01)}H${f(x + w - rr)}`} fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={p.px} strokeLinecap="round" />
}

function Rect(p: Pc, x: number, y: number, w: number, h: number, fill: string, r = 0.04, extra?: { hi?: boolean; sheen?: number; stroke?: boolean }) {
  return (
    <g>
      <rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} rx={r} fill={p.reg.sheen(fill, extra?.sheen ?? 1)} {...(extra?.stroke === false ? {} : ol(p))} />
      {extra?.hi === false ? null : hl(p, x, y, w, h, r)}
    </g>
  )
}

const inner = (p: Pc) => ({ x0: INSET, y0: INSET, x1: p.W - INSET, y1: p.H - INSET, cx: p.W / 2, cy: p.H / 2 })

// ---------------------------------------------------------------------------
// chair
// ---------------------------------------------------------------------------
const chair: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  switch (p.st.id) {
    case 'victorian':
      return (<>
        <path d={`M${f(cx - 0.27)} ${f(cy - 0.08)}Q${f(cx)} ${f(cy - 0.5)} ${f(cx + 0.27)} ${f(cy - 0.08)}`} fill="none" stroke={pal.woodHi} strokeWidth={0.075} strokeLinecap="round" />
        <path d={`M${f(cx - 0.27)} ${f(cy - 0.08)}Q${f(cx)} ${f(cy - 0.5)} ${f(cx + 0.27)} ${f(cy - 0.08)}`} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} transform="translate(0 -0.035)" />
        <circle cx={f(cx)} cy={f(cy + 0.06)} r={0.29} fill={pal.wood} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy + 0.06)} r={0.24} fill={p.reg.dome(pal.fabric)} {...ol(p)} />
        {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={f(cx + Math.cos(i * 1.2566 + 0.3) * 0.2)} cy={f(cy + 0.06 + Math.sin(i * 1.2566 + 0.3) * 0.2)} r={0.014} fill={pal.metal} />)}
      </>)
    case 'artdeco':
      return (<>
        <path d={`M${f(cx - 0.34)} ${f(cy + 0.02)}A0.34 0.34 0 0 1 ${f(cx + 0.34)} ${f(cy + 0.02)}`} fill="none" stroke={pal.fabric} strokeWidth={0.15} strokeLinecap="round" />
        <path d={`M${f(cx - 0.34)} ${f(cy + 0.02)}A0.34 0.34 0 0 1 ${f(cx + 0.34)} ${f(cy + 0.02)}`} fill="none" stroke={pal.metal} strokeOpacity={0.9} strokeWidth={p.px * 1.5} transform="translate(0 -0.075)" />
        <circle cx={f(cx)} cy={f(cy + 0.04)} r={0.26} fill={p.reg.dome(lighten(pal.fabric, 0.05))} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy + 0.04)} r={0.2} fill="none" stroke={pal.metal} strokeOpacity={0.5} strokeWidth={p.px} />
      </>)
    case 'tudor':
      return (<>
        {Rect(p, cx - 0.27, cy - 0.34, 0.54, 0.1, pal.wood, 0.02)}
        {[-0.14, 0, 0.14].map(d => <rect key={d} x={f(cx + d - 0.02)} y={f(cy - 0.32)} width={0.04} height={0.06} fill={darken(pal.wood, 0.3)} />)}
        {Rect(p, cx - 0.27, cy - 0.22, 0.54, 0.5, pal.woodHi, 0.03)}
        <rect x={f(cx - 0.2)} y={f(cy - 0.14)} width={0.4} height={0.36} rx={0.03} fill={p.reg.sheen(pal.fabric, 0.8)} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
      </>)
    case 'modernist':
      return (<>
        {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([dx, dy], i) => <circle key={i} cx={f(cx + dx)} cy={f(cy + dy)} r={0.035} fill={pal.metal} />)}
        <path d={`M${f(cx - 0.3)} ${f(cy + 0.04)}C${f(cx - 0.34)} ${f(cy - 0.36)} ${f(cx + 0.34)} ${f(cy - 0.36)} ${f(cx + 0.3)} ${f(cy + 0.04)}C${f(cx + 0.28)} ${f(cy + 0.32)} ${f(cx - 0.28)} ${f(cy + 0.32)} ${f(cx - 0.3)} ${f(cy + 0.04)}Z`} fill={p.reg.sheen(pal.fabric)} {...ol(p)} />
        <ellipse cx={f(cx)} cy={f(cy + 0.08)} rx={0.18} ry={0.15} fill={darken(pal.fabric, 0.12)} fillOpacity={0.55} />
      </>)
    default: // mediterranean rush seat
      return (<>
        {Rect(p, cx - 0.26, cy - 0.34, 0.52, 0.08, pal.wood, 0.02)}
        {Rect(p, cx - 0.27, cy - 0.2, 0.54, 0.5, pal.wood, 0.03, { hi: false })}
        <rect x={f(cx - 0.21)} y={f(cy - 0.14)} width={0.42} height={0.38} fill="#a8905a" />
        {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${f(cx - 0.21)} ${f(cy - 0.12 + i * 0.065)}H${f(cx + 0.21)}`} stroke={darken('#a8905a', 0.35)} strokeOpacity={0.5} strokeWidth={p.px} />)}
      </>)
  }
}

// ---------------------------------------------------------------------------
// sofa (long axis along x, back on the north side)
// ---------------------------------------------------------------------------
const sofa: Art = p => {
  const { x0, y0, x1, y1 } = inner(p)
  const { pal } = p.st
  const w = x1 - x0, h = y1 - y0
  const seats = Math.max(1, Math.round(w / 0.9))
  const cushions = (col: string, top: number) => Array.from({ length: seats }, (_, i) => {
    const sx = x0 + 0.22 + ((w - 0.44) * i) / seats
    const sw = (w - 0.44) / seats
    return <rect key={i} x={f(sx + 0.01)} y={f(top)} width={f(sw - 0.02)} height={f(y1 - top - 0.03)} rx={0.05} fill={p.reg.sheen(col)} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
  })
  switch (p.st.id) {
    case 'victorian': {
      const buttons: ReactNode[] = []
      const cols = Math.max(4, Math.round(w / 0.2))
      for (let i = 0; i < cols; i++) buttons.push(<circle key={`b${i}`} cx={f(x0 + 0.26 + ((w - 0.52) * (i + 0.5)) / cols)} cy={f(y0 + 0.14)} r={0.017} fill={darken(pal.fabric, 0.5)} />)
      return (<>
        <rect x={f(x0)} y={f(y0)} width={f(w)} height={f(h)} rx={0.1} fill={darken(pal.fabric, 0.2)} {...ol(p)} />
        <rect x={f(x0 + 0.2)} y={f(y0)} width={f(w - 0.4)} height={0.28} rx={0.06} fill={p.reg.sheen(pal.fabric)} {...ol(p)} />
        {buttons}
        {cushions(lighten(pal.fabric, 0.04), y0 + 0.28)}
        {[x0, x1 - 0.2].map((ax, i) => <rect key={i} x={f(ax)} y={f(y0)} width={0.2} height={f(h)} rx={0.09} fill={p.reg.band(pal.fabric)} {...ol(p)} />)}
        {hl(p, x0, y0, w, h, 0.1)}
      </>)
    }
    case 'artdeco':
      return (<>
        <path d={`M${f(x0)} ${f(y0 + 0.3)}Q${f(x0 + w / 2)} ${f(y0 - 0.22)} ${f(x1)} ${f(y0 + 0.3)}L${f(x1)} ${f(y1 - 0.12)}Q${f(x1)} ${f(y1)} ${f(x1 - 0.12)} ${f(y1)}H${f(x0 + 0.12)}Q${f(x0)} ${f(y1)} ${f(x0)} ${f(y1 - 0.12)}Z`} fill={p.reg.sheen(pal.fabric)} {...ol(p)} />
        <path d={`M${f(x0 + 0.12)} ${f(y0 + 0.34)}Q${f(x0 + w / 2)} ${f(y0 - 0.06)} ${f(x1 - 0.12)} ${f(y0 + 0.34)}`} fill="none" stroke={pal.metal} strokeOpacity={0.85} strokeWidth={p.px * 1.5} />
        {cushions(lighten(pal.fabric, 0.07), y0 + 0.36)}
      </>)
    case 'tudor':
      return (<>
        {Rect(p, x0, y0, w, 0.24, pal.wood, 0.02)}
        {Array.from({ length: Math.max(3, Math.round(w / 0.3)) }, (_, i) => <path key={i} d={`M${f(x0 + (w * (i + 1)) / Math.max(3, Math.round(w / 0.3)))} ${f(y0 + 0.02)}v0.2`} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />)}
        {Rect(p, x0, y0 + 0.24, w, h - 0.24, pal.woodHi, 0.03)}
        <rect x={f(x0 + 0.08)} y={f(y0 + 0.3)} width={f(w - 0.16)} height={f(h - 0.38)} rx={0.04} fill={p.reg.sheen(pal.fabric, 0.8)} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
      </>)
    case 'modernist':
      return (<>
        <rect x={f(x0 + 0.03)} y={f(y0 + 0.03)} width={f(w - 0.06)} height={f(h - 0.03)} rx={0.03} fill={darken(pal.fabric, 0.3)} {...ol(p)} />
        {Rect(p, x0, y0, w, 0.22, pal.fabric, 0.03)}
        {cushions(lighten(pal.fabric, 0.05), y0 + 0.22)}
        <rect x={f(x1 - 0.3)} y={f(y0 + 0.28)} width={0.22} height={0.18} rx={0.03} fill={p.st.pal.accent} fillOpacity={0.7} stroke={INK} strokeOpacity={0.35} strokeWidth={p.px} />
      </>)
    default:
      return (<>
        {Rect(p, x0, y0 + 0.04, w, h - 0.04, pal.wood, 0.04)}
        <rect x={f(x0 + 0.06)} y={f(y0 + 0.16)} width={f(w - 0.12)} height={f(h - 0.26)} rx={0.04} fill="#a79c86" stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${f(x0 + 0.1 + ((w - 0.2) * (i + 0.5)) / 6)} ${f(y0 + 0.17)}v${f(h - 0.28)}`} stroke={pal.fabric2} strokeOpacity={i % 2 ? 0.55 : 0.2} strokeWidth={0.04} />)}
        {[x0 + 0.1, x1 - 0.1].map((bx, i) => <rect key={i} x={f(bx - 0.08)} y={f(y0 + 0.14)} width={0.16} height={f(h - 0.22)} rx={0.07} fill={p.reg.band(pal.fabric2)} {...ol(p)} />)}
      </>)
  }
}

// ---------------------------------------------------------------------------
// bed (head on the west end of the long axis)
// ---------------------------------------------------------------------------
const bed: Art = p => {
  const { pal } = p.st
  const tall = p.H > p.W
  const L = tall ? p.H : p.W, B = tall ? p.W : p.H
  const x0 = INSET, y0 = INSET, x1 = L - INSET, y1 = B - INSET
  const pill = (px: number, py: number, w: number, h: number, c: string) => (
    <rect x={f(px)} y={f(py)} width={f(w)} height={f(h)} rx={0.07} fill={p.reg.dome(c)} stroke={INK} strokeOpacity={0.45} strokeWidth={p.px} />
  )
  const pillowsAt = (hx: number, col: string) => {
    const n = 2
    const ph = n === 2 ? (y1 - y0 - 0.2) / 2 : Math.min(0.5, y1 - y0 - 0.16)
    return Array.from({ length: n }, (_, i) => {
      const py = n === 2 ? y0 + 0.07 + i * (ph + 0.06) : (B - ph) / 2
      return <g key={i}>{pill(hx, py, 0.22, ph, col)}</g>
    })
  }
  let art: ReactNode
  switch (p.st.id) {
    case 'victorian': {
      const q = pal.fabric
      art = (<>
        {/* brass bed: head rail with finials, foot rail, oxblood quilt with diamond stitching */}
        <rect x={f(x0)} y={f(y0)} width={f(x1 - x0)} height={f(y1 - y0)} rx={0.04} fill={darken(pal.wood, 0.1)} {...ol(p)} />
        <rect x={f(x0 + 0.1)} y={f(y0 + 0.05)} width={f(x1 - x0 - 0.14)} height={f(y1 - y0 - 0.1)} rx={0.04} fill="#8f866f" stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
        {pillowsAt(x0 + 0.14, '#8a826e')}
        <rect x={f(x0 + 0.42)} y={f(y0 + 0.05)} width={f(x1 - x0 - 0.46)} height={f(y1 - y0 - 0.1)} rx={0.04} fill={p.reg.sheen(q)} {...ol(p)} />
        {Array.from({ length: Math.round((x1 - x0 - 0.46) / 0.18) }, (_, i) => <path key={i} d={`M${f(x0 + 0.42 + i * 0.18)} ${f(y0 + 0.05)}l0.09 ${f((y1 - y0 - 0.1) / 2)}l-0.09 ${f((y1 - y0 - 0.1) / 2)}`} fill="none" stroke={lighten(q, 0.3)} strokeOpacity={0.3} strokeWidth={p.px} />)}
        <rect x={f(x0 + 0.42)} y={f(y0 + 0.05)} width={0.12} height={f(y1 - y0 - 0.1)} fill={lighten(q, 0.35)} fillOpacity={0.35} />
        <path d={`M${f(x0 + 0.02)} ${f(y0 + 0.02)}V${f(y1 - 0.02)}`} stroke={pal.metal} strokeWidth={0.05} strokeLinecap="round" />
        {[y0 + 0.02, y1 - 0.02, (y0 + y1) / 2].map((fy, i) => <circle key={i} cx={f(x0 + 0.02)} cy={f(fy)} r={0.04} fill={p.reg.dome(pal.metal)} />)}
        <path d={`M${f(x1 - 0.02)} ${f(y0 + 0.02)}V${f(y1 - 0.02)}`} stroke={pal.metal} strokeWidth={0.035} strokeLinecap="round" />
      </>)
      break
    }
    case 'artdeco': {
      const q = pal.fabric
      art = (<>
        <rect x={f(x0 + 0.1)} y={f(y0)} width={f(x1 - x0 - 0.1)} height={f(y1 - y0)} rx={0.05} fill={pal.wood} {...ol(p)} />
        {/* fan headboard: gold rays in a half-disc at the head */}
        <path d={`M${f(x0 + 0.1)} ${f(y0)}A${f((y1 - y0) / 2)} ${f((y1 - y0) / 2)} 0 0 0 ${f(x0 + 0.1)} ${f(y1)}Z`} transform={`translate(${f(-0.0)} 0)`} fill={pal.wood} {...ol(p)} />
        {[-2, -1, 0, 1, 2].map(k => <path key={k} d={`M${f(x0 + 0.12)} ${f((y0 + y1) / 2)}L${f(x0 + 0.1 - Math.cos(k * 0.5) * (y1 - y0) * 0.45)} ${f((y0 + y1) / 2 + Math.sin(k * 0.5) * (y1 - y0) * 0.45)}`} stroke={pal.metal} strokeOpacity={0.8} strokeWidth={p.px * 1.5} />)}
        <rect x={f(x0 + 0.2)} y={f(y0 + 0.05)} width={f(x1 - x0 - 0.26)} height={f(y1 - y0 - 0.1)} rx={0.04} fill={p.reg.sheen(q)} {...ol(p)} />
        {pillowsAt(x0 + 0.24, '#a39a82')}
        <path d={`M${f(x0 + 0.58)} ${f(y0 + 0.05)}V${f(y1 - 0.05)}`} stroke={pal.metal} strokeWidth={0.03} />
        <rect x={f(x0 + 0.64)} y={f(y0 + 0.1)} width={f(x1 - x0 - 0.76)} height={f(y1 - y0 - 0.2)} fill="none" stroke={pal.metal} strokeOpacity={0.5} strokeWidth={p.px} />
      </>)
      break
    }
    case 'tudor': {
      art = (<>
        <rect x={f(x0 + 0.06)} y={f(y0 + 0.06)} width={f(x1 - x0 - 0.12)} height={f(y1 - y0 - 0.12)} rx={0.03} fill={pal.woodHi} {...ol(p)} />
        <rect x={f(x0 + 0.16)} y={f(y0 + 0.14)} width={f(x1 - x0 - 0.26)} height={f(y1 - y0 - 0.28)} rx={0.04} fill="#bdb29a" stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
        {pillowsAt(x0 + 0.2, '#a89d86')}
        <rect x={f(x0 + 0.5)} y={f(y0 + 0.14)} width={f(x1 - x0 - 0.6)} height={f(y1 - y0 - 0.28)} rx={0.03} fill={p.reg.sheen(pal.fabric, 0.8)} {...ol(p)} />
        <rect x={f(x0 + 0.56)} y={f(y0 + 0.2)} width={f(x1 - x0 - 0.72)} height={f(y1 - y0 - 0.4)} fill="none" stroke={lighten(pal.fabric, 0.3)} strokeOpacity={0.4} strokeWidth={p.px} />
        {/* four-poster: dark posts at the corners and a dashed canopy outline */}
        <rect x={f(x0 + 0.02)} y={f(y0 + 0.02)} width={f(x1 - x0 - 0.04)} height={f(y1 - y0 - 0.04)} fill="none" stroke={INK} strokeOpacity={0.6} strokeDasharray="0.05 0.04" strokeWidth={p.px * 1.2} />
        {[[x0 + 0.04, y0 + 0.04], [x1 - 0.04, y0 + 0.04], [x0 + 0.04, y1 - 0.04], [x1 - 0.04, y1 - 0.04]].map(([cx, cy], i) => <circle key={i} cx={f(cx)} cy={f(cy)} r={0.05} fill="#2a1a0e" stroke={INK} strokeOpacity={0.6} strokeWidth={p.px} />)}
      </>)
      break
    }
    case 'modernist': {
      art = (<>
        <rect x={f(x0)} y={f(y0)} width={f(x1 - x0)} height={f(y1 - y0)} rx={0.03} fill={pal.woodHi} {...ol(p)} />
        <rect x={f(x0 + 0.07)} y={f(y0 + 0.07)} width={f(x1 - x0 - 0.14)} height={f(y1 - y0 - 0.14)} rx={0.03} fill={p.reg.sheen('#6a6e74')} {...ol(p)} />
        {pillowsAt(x0 + 0.12, '#9a9a94')}
        <rect x={f(x0 + 0.5)} y={f(y0 + 0.07)} width={f(x1 - x0 - 0.57)} height={f(y1 - y0 - 0.14)} rx={0.03} fill={p.reg.sheen('#555a62')} />
        <rect x={f(x1 - 0.42)} y={f(y0 + 0.07)} width={0.35} height={f(y1 - y0 - 0.14)} fill="#3b3e44" fillOpacity={0.7} />
      </>)
      break
    }
    default: {
      art = (<>
        <rect x={f(x0 + 0.02)} y={f(y0 + 0.02)} width={f(x1 - x0 - 0.04)} height={f(y1 - y0 - 0.04)} rx={0.03} fill="none" stroke="#2a2620" strokeWidth={0.04} />
        <path d={`M${f(x0 + 0.02)} ${f(y0 + 0.1)}Q${f(x0 - 0.0)} ${f((y0 + y1) / 2)} ${f(x0 + 0.02)} ${f(y1 - 0.1)}`} fill="none" stroke="#2a2620" strokeWidth={0.05} />
        <rect x={f(x0 + 0.08)} y={f(y0 + 0.08)} width={f(x1 - x0 - 0.16)} height={f(y1 - y0 - 0.16)} rx={0.03} fill="#b9b2a0" stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
        {pillowsAt(x0 + 0.14, '#9c9684')}
        <rect x={f(x0 + 0.5)} y={f(y0 + 0.08)} width={f(x1 - x0 - 0.58)} height={f(y1 - y0 - 0.16)} rx={0.03} fill={p.reg.sheen(pal.fabric2, 0.9)} />
        {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${f(x0 + 0.5)} ${f(y0 + 0.2 + i * ((y1 - y0 - 0.4) / 3))}H${f(x1 - 0.08)}`} stroke="#e8e0c8" strokeOpacity={0.35} strokeWidth={0.03} />)}
      </>)
    }
  }
  return tall ? <g transform={`translate(${f(p.W)} 0) rotate(90)`}>{art}</g> : art
}

// ---------------------------------------------------------------------------
// table
// ---------------------------------------------------------------------------
const table: Art = p => {
  const { x0, y0, x1, y1, cx, cy } = inner(p)
  const { pal } = p.st
  const long = p.W > 1.2 || p.H > 1.2
  if (!long) {
    const r = Math.min(p.W, p.H) / 2 - 0.12
    switch (p.st.id) {
      case 'artdeco':
        return (<>
          <circle cx={f(cx)} cy={f(cy)} r={r} fill={p.reg.dome(darken(pal.wood, 0.1))} {...ol(p)} />
          <circle cx={f(cx)} cy={f(cy)} r={r - 0.03} fill="none" stroke={pal.metal} strokeWidth={p.px * 2} />
          <circle cx={f(cx)} cy={f(cy)} r={r - 0.09} fill="none" stroke={pal.metal} strokeOpacity={0.35} strokeWidth={p.px} />
        </>)
      case 'modernist':
        return (<>
          <circle cx={f(cx)} cy={f(cy)} r={r} fill={p.reg.dome(pal.stone)} {...ol(p)} />
          <circle cx={f(cx)} cy={f(cy)} r={0.07} fill={pal.metal} fillOpacity={0.7} />
        </>)
      case 'victorian':
        return (<>
          <circle cx={f(cx)} cy={f(cy)} r={r} fill={p.reg.dome(pal.wood)} {...ol(p)} />
          <circle cx={f(cx)} cy={f(cy)} r={r - 0.05} fill="none" stroke={pal.woodHi} strokeOpacity={0.7} strokeWidth={p.px * 1.5} />
          <circle cx={f(cx)} cy={f(cy)} r={r - 0.11} fill="none" stroke={pal.metal} strokeOpacity={0.35} strokeWidth={p.px} />
          <path d={`M${f(cx - r + 0.02)} ${f(cy - 0.12)}A${f(r)} ${f(r)} 0 0 1 ${f(cx - 0.12)} ${f(cy - r + 0.02)}`} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={p.px} />
        </>)
      default:
        return (<>
          <circle cx={f(cx)} cy={f(cy)} r={r} fill={p.reg.dome(p.st.id === 'tudor' ? pal.woodHi : pal.wood)} {...ol(p)} />
          <circle cx={f(cx)} cy={f(cy)} r={r - 0.05} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={p.px} />
        </>)
    }
  }
  const top = p.st.id === 'tudor' ? pal.woodHi : p.st.id === 'modernist' ? pal.woodHi : pal.wood
  const ty0 = y0 + 0.06, ty1 = y1 - 0.06
  const midY = (ty0 + ty1) / 2
  return (<>
    {p.st.id === 'modernist' && [[x0 + 0.08, ty0 + 0.04], [x1 - 0.08, ty0 + 0.04], [x0 + 0.08, ty1 - 0.04], [x1 - 0.08, ty1 - 0.04]].map(([lx, ly], i) => <circle key={i} cx={f(lx)} cy={f(ly)} r={0.03} fill={pal.metal} />)}
    <rect x={f(x0)} y={f(ty0)} width={f(x1 - x0)} height={f(ty1 - ty0)} rx={p.st.id === 'artdeco' ? 0.14 : 0.05} fill={p.reg.sheen(top)} {...ol(p)} />
    <rect x={f(x0 + 0.06)} y={f(ty0 + 0.06)} width={f(x1 - x0 - 0.12)} height={f(ty1 - ty0 - 0.12)} rx={0.03} fill="none" stroke={p.st.id === 'victorian' || p.st.id === 'artdeco' ? pal.metal : INK} strokeOpacity={p.st.id === 'victorian' || p.st.id === 'artdeco' ? 0.45 : 0.25} strokeWidth={p.px} />
    {p.st.id === 'tudor' && Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${f(x0 + 0.04)} ${f(ty0 + 0.1 + i * ((ty1 - ty0 - 0.2) / 3))}H${f(x1 - 0.04)}`} stroke={INK} strokeOpacity={0.18} strokeWidth={p.px} />)}
    {p.st.id === 'victorian' && <path d={`M${f(x0 + 0.14)} ${f(midY)}H${f(x1 - 0.14)}`} stroke={pal.fabric} strokeOpacity={0.8} strokeWidth={0.09} />}
    {p.st.id === 'mediterranean' && <path d={`M${f(x0 + 0.14)} ${f(midY)}H${f(x1 - 0.14)}`} stroke={pal.fabric2} strokeOpacity={0.7} strokeWidth={0.07} />}
    {hl(p, x0, ty0, x1 - x0, ty1 - ty0, 0.05)}
  </>)
}

// ---------------------------------------------------------------------------
// box
// ---------------------------------------------------------------------------
const box: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const s = 0.3
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, cx - s - 0.02, cy - 0.24, 2 * s + 0.04, 0.48, pal.wood, 0.05)}
        {[-0.18, 0.18].map(d => <rect key={d} x={f(cx + d - 0.025)} y={f(cy - 0.24)} width={0.05} height={0.48} fill={pal.metal} fillOpacity={0.85} />)}
        <circle cx={f(cx)} cy={f(cy)} r={0.03} fill={pal.metal} />
      </>)
    case 'artdeco':
      return (<>
        {Rect(p, cx - s, cy - 0.24, 2 * s, 0.48, '#2a2a32', 0.04)}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => <path key={i} d={`M${f(cx + dx * s)} ${f(cy + dy * 0.14)}V${f(cy + dy * 0.24)}H${f(cx + dx * (s - 0.1))}`} fill="none" stroke={pal.metal} strokeWidth={0.03} />)}
        <rect x={f(cx - 0.05)} y={f(cy - 0.04)} width={0.1} height={0.08} fill={pal.metal} />
      </>)
    case 'tudor':
      return (<>
        {Rect(p, cx - s, cy - 0.25, 2 * s, 0.5, pal.wood, 0.03)}
        {[-0.2, 0, 0.2].map(d => <rect key={d} x={f(cx + d - 0.02)} y={f(cy - 0.25)} width={0.04} height={0.5} fill="#2a2420" />)}
        {[-0.14, 0.14].map(d => <circle key={d} cx={f(cx + d + 0.0)} cy={f(cy - 0.12)} r={0.016} fill="#6a6258" />)}
      </>)
    case 'modernist':
      return (<>
        {Rect(p, cx - 0.27, cy - 0.27, 0.54, 0.54, '#6a6a68', 0.02)}
        <path d={`M${f(cx - 0.27)} ${f(cy)}H${f(cx + 0.27)}`} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
        <rect x={f(cx - 0.06)} y={f(cy - 0.12)} width={0.12} height={0.03} fill={pal.metal} />
      </>)
    default:
      return (<>
        {Rect(p, cx - s, cy - 0.24, 2 * s, 0.48, pal.fabric2, 0.05)}
        <rect x={f(cx - 0.24)} y={f(cy - 0.16)} width={0.48} height={0.32} rx={0.02} fill="none" stroke="#e8d9a8" strokeOpacity={0.55} strokeWidth={p.px * 1.2} />
        <circle cx={f(cx)} cy={f(cy)} r={0.06} fill="#e8d9a8" fillOpacity={0.55} />
      </>)
  }
}

// ---------------------------------------------------------------------------
// rug: pattern lives in the outer ring and on the cell seams, never in a
// 0.6 x 0.6 centre zone (bible section 2).
// ---------------------------------------------------------------------------
const rug: Art = p => {
  const x0 = 0.06, y0 = 0.06, x1 = p.W - 0.06, y1 = p.H - 0.06
  const w = x1 - x0, h = y1 - y0
  const sid = p.st.id
  const cols: Record<string, [string, string, string]> = {
    victorian: ['#6f1c24', '#C9A24A', '#1F3A2A'],
    artdeco: ['#13262a', '#C9A24A', '#0F5E55'],
    tudor: ['#6e1f22', '#c9b98a', '#3a2a1c'],
    modernist: ['#3a3d42', '#8a8e92', '#25272a'],
    mediterranean: ['#8f8a7c', '#1F4E8C', '#9A5538'],
  }
  const [field, trim, deep] = cols[sid]
  const out: ReactNode[] = []
  out.push(<rect key="base" x={f(x0)} y={f(y0)} width={f(w)} height={f(h)} rx={0.03} fill={darken(field, 0.15)} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px * 1.2} />)
  // fringe
  for (let i = 0; i < Math.round(h / 0.07); i++) {
    const yy = y0 + 0.04 + (i * (h - 0.08)) / Math.max(1, Math.round(h / 0.07) - 1)
    out.push(<path key={`fl${i}`} d={`M${f(x0)} ${f(yy)}h-0.04M${f(x1)} ${f(yy)}h0.04`} stroke={lighten(trim, 0.1)} strokeOpacity={0.55} strokeWidth={p.px * 1.2} />)
  }
  // border ring (outer 0.2)
  out.push(<rect key="ring" x={f(x0 + 0.03)} y={f(y0 + 0.03)} width={f(w - 0.06)} height={f(h - 0.06)} fill="none" stroke={trim} strokeOpacity={0.9} strokeWidth={0.025} />)
  out.push(<rect key="ring2" x={f(x0 + 0.1)} y={f(y0 + 0.1)} width={f(w - 0.2)} height={f(h - 0.2)} fill="none" stroke={deep} strokeOpacity={0.9} strokeWidth={0.06} />)
  out.push(<rect key="ring3" x={f(x0 + 0.16)} y={f(y0 + 0.16)} width={f(w - 0.32)} height={f(h - 0.32)} fill="none" stroke={trim} strokeOpacity={0.55} strokeWidth={p.px * 1.5} />)
  // field (plain, lighter)
  out.push(<rect key="field" x={f(x0 + 0.2)} y={f(y0 + 0.2)} width={f(w - 0.4)} height={f(h - 0.4)} fill={field} />)
  // border motifs: small lozenges on the ring, spaced every 0.2
  const motif = (cx: number, cy: number, k: number) => {
    const s = 0.04
    return sid === 'modernist'
      ? <rect key={`m${k}`} x={f(cx - 0.025)} y={f(cy - 0.025)} width={0.05} height={0.05} fill={trim} fillOpacity={0.6} />
      : <path key={`m${k}`} d={`M${f(cx)} ${f(cy - s)}L${f(cx + s)} ${f(cy)}L${f(cx)} ${f(cy + s)}L${f(cx - s)} ${f(cy)}Z`} fill={trim} fillOpacity={sid === 'artdeco' ? 0.9 : 0.75} />
  }
  let k = 0
  const nx = Math.max(2, Math.round((w - 0.3) / 0.2)), ny = Math.max(2, Math.round((h - 0.3) / 0.2))
  for (let i = 0; i < nx; i++) {
    const cx = x0 + 0.15 + ((w - 0.3) * (i + 0.5)) / nx
    out.push(motif(cx, y0 + 0.065, k++), motif(cx, y1 - 0.065, k++))
  }
  for (let j = 0; j < ny; j++) {
    const cy = y0 + 0.15 + ((h - 0.3) * (j + 0.5)) / ny
    out.push(motif(x0 + 0.065, cy, k++), motif(x1 - 0.065, cy, k++))
  }
  // cell-seam ornaments: only at the junctions of 4 cells (r <= 0.18), which sit 0.2 clear of every centre zone
  const jxs = (p.jx ?? (p.W >= 2 ? Array.from({ length: Math.floor(p.W - 0.01) }, (_, i) => i + 1) : [])).filter(v => v > 0.38 && v < p.W - 0.38)
  const jys = (p.jy ?? (p.H >= 2 ? Array.from({ length: Math.floor(p.H - 0.01) }, (_, i) => i + 1) : [])).filter(v => v > 0.38 && v < p.H - 0.38)
  for (const jx of jxs) for (const jy of jys) {
    out.push(<circle key={`med0${jx}${jy}`} cx={f(jx)} cy={f(jy)} r={0.17} fill={deep} stroke={trim} strokeOpacity={0.85} strokeWidth={0.02} />)
    out.push(<path key={`med1${jx}${jy}`} d={`M${f(jx)} ${f(jy - 0.12)}L${f(jx + 0.12)} ${f(jy)}L${f(jx)} ${f(jy + 0.12)}L${f(jx - 0.12)} ${f(jy)}Z`} fill={trim} fillOpacity={0.8} />)
    out.push(<circle key={`med2${jx}${jy}`} cx={f(jx)} cy={f(jy)} r={0.035} fill={field} />)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      out.push(<path key={`sp${jx}${jy}${dx}${dy}`} d={`M${f(jx + dx * 0.19)} ${f(jy + dy * 0.19)}L${f(jx + dx * 0.19 + dy * 0.04)} ${f(jy + dy * 0.19 + dx * 0.04)}L${f(jx + dx * 0.3)} ${f(jy + dy * 0.3)}L${f(jx + dx * 0.19 - dy * 0.04)} ${f(jy + dy * 0.19 - dx * 0.04)}Z`} fill={trim} fillOpacity={0.55} />)
    }
  }
  if (sid === 'artdeco') {
    for (let i = 0; i < 4; i++) out.push(<path key={`st${i}`} d={`M${f(x0 + 0.2 + i * 0.03)} ${f(y0 + 0.2 + i * 0.03)}h${f(0.22 - i * 0.05)}`} stroke={trim} strokeOpacity={0.7} strokeWidth={p.px * 1.5} />)
  }
  return <g>{out}</g>
}

// ---------------------------------------------------------------------------
// plant / shrub (canopy seen from above)
// ---------------------------------------------------------------------------
function fronds(p: Pc, cx: number, cy: number, n: number, len: number, c1: string, c2: string, seed: number) {
  const r = rng(seed)
  const out: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3
    const l = len * (0.8 + r() * 0.3)
    const tx = cx + Math.cos(a) * l, ty = cy + Math.sin(a) * l
    const mx = cx + Math.cos(a + 0.35) * l * 0.55, my = cy + Math.sin(a + 0.35) * l * 0.55
    out.push(<path key={i} d={`M${f(cx)} ${f(cy)}Q${f(mx)} ${f(my)} ${f(tx)} ${f(ty)}Q${f(cx + Math.cos(a - 0.35) * l * 0.55)} ${f(cy + Math.sin(a - 0.35) * l * 0.55)} ${f(cx)} ${f(cy)}Z`} fill={i % 2 ? c1 : c2} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />)
    out.push(<path key={`v${i}`} d={`M${f(cx)} ${f(cy)}L${f(tx)} ${f(ty)}`} stroke={darken(c1, 0.4)} strokeOpacity={0.5} strokeWidth={p.px} />)
  }
  return out
}

const plant: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const seed = p.seed
  switch (p.st.id) {
    case 'victorian':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.3} fill={p.reg.dome('#7a6228')} {...ol(p)} />
        {fronds(p, cx, cy, 9, 0.34, pal.leaf, pal.leaf2, seed)}
        <circle cx={f(cx)} cy={f(cy)} r={0.05} fill={darken(pal.leaf, 0.4)} />
      </>)
    case 'artdeco':
      return (<>
        <rect x={f(cx - 0.24)} y={f(cy - 0.24)} width={0.48} height={0.48} fill={p.reg.sheen('#26262e')} {...ol(p)} />
        <rect x={f(cx - 0.2)} y={f(cy - 0.2)} width={0.4} height={0.4} fill="none" stroke={pal.metal} strokeOpacity={0.8} strokeWidth={p.px * 1.5} />
        {fronds(p, cx, cy, 7, 0.34, pal.leaf, pal.leaf2, seed)}
        <circle cx={f(cx)} cy={f(cy)} r={0.04} fill={darken(pal.leaf, 0.4)} />
      </>)
    case 'tudor':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.24} fill={p.reg.dome('#8a4a2e')} {...ol(p)} />
        {Array.from({ length: 12 }, (_, i) => { const a = i * 0.52 + 0.2; const d = 0.06 + (i % 3) * 0.06; return <circle key={i} cx={f(cx + Math.cos(a) * d)} cy={f(cy + Math.sin(a) * d)} r={0.09} fill={i % 2 ? pal.leaf : pal.leaf2} stroke={INK} strokeOpacity={0.35} strokeWidth={p.px} /> })}
      </>)
    case 'modernist':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.27} fill={p.reg.dome('#77787a')} {...ol(p)} />
        {[[-0.1, -0.14, 0.17], [0.13, -0.06, 0.18], [-0.05, 0.12, 0.18], [0.12, 0.14, 0.14], [-0.17, 0.05, 0.14]].map(([dx, dy, r], i) => <ellipse key={i} cx={f(cx + dx)} cy={f(cy + dy)} rx={r} ry={r * 0.82} transform={`rotate(${i * 55} ${f(cx + dx)} ${f(cy + dy)})`} fill={p.reg.dome(i % 2 ? pal.leaf : pal.leaf2)} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />)}
      </>)
    default:
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.26} fill={p.reg.dome('#9a5538')} {...ol(p)} />
        {Array.from({ length: 9 }, (_, i) => { const a = i * 0.7; const d = 0.1 + (i % 2) * 0.1; return <circle key={i} cx={f(cx + Math.cos(a) * d)} cy={f(cy + Math.sin(a) * d)} r={0.11} fill={i % 2 ? pal.leaf : pal.leaf2} stroke={INK} strokeOpacity={0.35} strokeWidth={p.px} /> })}
        {[[-0.08, -0.1], [0.12, 0.02], [-0.02, 0.14]].map(([dx, dy], i) => <circle key={`l${i}`} cx={f(cx + dx)} cy={f(cy + dy)} r={0.04} fill="#d9b83a" stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />)}
      </>)
  }
}

const shrub: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const r = rng(p.seed)
  const leaves = (n: number, rad: number, c1: string, c2: string) => Array.from({ length: n }, (_, i) => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad
    return <circle key={i} cx={f(cx + Math.cos(a) * d)} cy={f(cy + Math.sin(a) * d)} r={0.045 + r() * 0.03} fill={r() < 0.5 ? c1 : c2} fillOpacity={0.9} />
  })
  switch (p.st.id) {
    case 'artdeco':
      return (<>
        {[0.3, 0.22, 0.14, 0.06].map((rad, i) => <circle key={i} cx={f(cx)} cy={f(cy)} r={rad} fill={i % 2 ? pal.leaf2 : pal.leaf} stroke={INK} strokeOpacity={0.45} strokeWidth={p.px} />)}
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${f(cx)} ${f(cy)}L${f(cx + Math.cos(i * 0.785) * 0.3)} ${f(cy + Math.sin(i * 0.785) * 0.3)}`} stroke={INK} strokeOpacity={0.3} strokeWidth={p.px} />)}
      </>)
    case 'modernist':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.32} fill={darken(pal.leaf, 0.2)} fillOpacity={0.6} />
        {Array.from({ length: 26 }, (_, i) => { const a = (i / 26) * Math.PI * 2; return <path key={i} d={`M${f(cx)} ${f(cy)}Q${f(cx + Math.cos(a + 0.3) * 0.16)} ${f(cy + Math.sin(a + 0.3) * 0.16)} ${f(cx + Math.cos(a) * 0.32)} ${f(cy + Math.sin(a) * 0.32)}`} fill="none" stroke={i % 2 ? pal.leaf2 : lighten(pal.leaf2, 0.15)} strokeWidth={0.018} strokeLinecap="round" /> })}
      </>)
    case 'tudor':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.33} fill={p.reg.dome(darken(pal.leaf, 0.1))} {...ol(p)} />
        {leaves(26, 0.28, pal.leaf2, '#6f8f9a')}
        {[[-0.1, -0.1], [0.12, 0.05], [0, 0.14]].map(([dx, dy], i) => <circle key={i} cx={f(cx + dx)} cy={f(cy + dy)} r={0.025} fill="#a8a2d8" />)}
      </>)
    case 'mediterranean':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.3} fill={p.reg.dome(pal.leaf)} {...ol(p)} />
        {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={f(cx + (r() - 0.5) * 0.44)} cy={f(cy + (r() - 0.5) * 0.44)} r={0.03} fill="#8a6ac0" />)}
      </>)
    default: // boxwood ball
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.33} fill={p.reg.dome(pal.leaf)} {...ol(p)} />
        {leaves(34, 0.29, pal.leaf2, darken(pal.leaf, 0.3))}
      </>)
  }
}

// ---------------------------------------------------------------------------
// lamp: the object only; the warm pool is a separate light layer
// ---------------------------------------------------------------------------
const lamp: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  switch (p.st.id) {
    case 'victorian':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.2} fill={p.reg.dome(pal.wood)} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.15} fill={p.reg.dome('#1f5236')} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.15} fill="none" stroke={pal.metal} strokeOpacity={0.7} strokeWidth={0.018} />
        <circle cx={f(cx - 0.025)} cy={f(cy - 0.025)} r={0.055} fill="#5fa67c" fillOpacity={0.35} />
        <circle cx={f(cx)} cy={f(cy)} r={0.025} fill="#cdb878" />
      </>)
    case 'artdeco':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.24} fill={p.reg.dome('#8f8c80')} {...ol(p)} />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${f(cx)} ${f(cy)}L${f(cx + Math.cos(i * 0.785) * 0.24)} ${f(cy + Math.sin(i * 0.785) * 0.24)}`} stroke={pal.metal} strokeOpacity={0.7} strokeWidth={p.px} />)}
        <circle cx={f(cx)} cy={f(cy)} r={0.07} fill={pal.metal} />
      </>)
    case 'tudor':
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.2} fill={p.reg.dome(pal.metal)} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.14} fill="#2a2018" stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
        <circle cx={f(cx)} cy={f(cy)} r={0.07} fill="#ffcf6a" />
        <circle cx={f(cx)} cy={f(cy)} r={0.035} fill="#fff6c8" />
      </>)
    case 'modernist':
      return (<>
        <path d={`M${f(cx - 0.3)} ${f(cy + 0.26)}Q${f(cx - 0.3)} ${f(cy - 0.3)} ${f(cx + 0.12)} ${f(cy - 0.12)}`} fill="none" stroke={pal.metal} strokeWidth={0.035} strokeLinecap="round" />
        <circle cx={f(cx - 0.3)} cy={f(cy + 0.26)} r={0.07} fill={pal.metal} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
        <circle cx={f(cx + 0.12)} cy={f(cy - 0.12)} r={0.15} fill={p.reg.dome('#9d978a')} {...ol(p)} />
        <circle cx={f(cx + 0.12)} cy={f(cy - 0.12)} r={0.05} fill="#fff1c8" />
      </>)
    default:
      return (<>
        <circle cx={f(cx)} cy={f(cy)} r={0.24} fill={p.reg.dome('#9A5538')} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.17} fill={p.reg.dome('#e0b86a')} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.17} fill="none" stroke="#1F4E8C" strokeWidth={0.03} strokeDasharray="0.06 0.05" />
        <circle cx={f(cx)} cy={f(cy)} r={0.04} fill="#fff1c8" />
      </>)
  }
}

// ---------------------------------------------------------------------------
// counter (long along x; back against the north wall)
// ---------------------------------------------------------------------------
const counter: Art = p => {
  const { x0, y0, x1, y1 } = inner(p)
  const { pal } = p.st
  const w = x1 - x0, h = y1 - y0
  const pan = (cx: number, cy: number, r: number, c = '#b8692f') => (
    <g key={`${cx}${cy}`}><circle cx={f(cx)} cy={f(cy)} r={r} fill={p.reg.dome(c)} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} /><circle cx={f(cx)} cy={f(cy)} r={r * 0.6} fill={darken(c, 0.35)} fillOpacity={0.6} /><path d={`M${f(cx + r)} ${f(cy)}h${f(r * 0.9)}`} stroke={darken(c, 0.4)} strokeWidth={0.025} strokeLinecap="round" /></g>
  )
  const basin = (cx: number, cy: number, rw: number, rh: number, tint: string) => (
    <g key={`b${cx}`}>
      <rect x={f(cx - rw)} y={f(cy - rh)} width={f(2 * rw)} height={f(2 * rh)} rx={0.05} fill={tint} stroke={INK} strokeOpacity={0.55} strokeWidth={p.px * 1.2} />
      <circle cx={f(cx)} cy={f(cy)} r={0.025} fill="#1a1a1a" />
      <path d={`M${f(cx)} ${f(cy - rh - 0.02)}v-0.06h0.07`} stroke={pal.metal} strokeWidth={0.03} fill="none" strokeLinecap="round" />
    </g>
  )
  const mid = (y0 + y1) / 2
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, x0, y0, w, h, '#6a4528', 0.04)}
        {Array.from({ length: Math.round(w / 0.1) }, (_, i) => <path key={i} d={`M${f(x0 + 0.05 + i * 0.1)} ${f(y0 + 0.02)}v${f(h - 0.04)}`} stroke={INK} strokeOpacity={0.22} strokeWidth={p.px} />)}
        {basin(x1 - 0.42, mid + 0.05, 0.2, 0.2, '#3a4a4d')}
        {pan(x0 + 0.2, y0 + 0.17, 0.065)}{pan(x0 + 0.42, y0 + 0.17, 0.055, '#c47a3a')}
      </>)
    case 'artdeco':
      return (<>
        {Rect(p, x0, y0, w, h, '#25252c', 0.06)}
        <rect x={f(x0 + 0.04)} y={f(y0 + 0.04)} width={f(w - 0.08)} height={f(h - 0.08)} rx={0.04} fill="none" stroke="#c9ccd0" strokeOpacity={0.7} strokeWidth={p.px * 1.5} />
        {basin(x1 - 0.4, mid, 0.17, 0.18, '#40444a')}
      </>)
    case 'tudor':
      return (<>
        {Rect(p, x0, y0, w, h, pal.woodHi, 0.03)}
        {Array.from({ length: 3 }, (_, i) => <path key={i} d={`M${f(x0 + 0.03)} ${f(y0 + 0.1 + i * (h - 0.2) / 2)}H${f(x1 - 0.03)}`} stroke={INK} strokeOpacity={0.2} strokeWidth={p.px} />)}
        {pan(x0 + 0.2, y0 + 0.17, 0.065)}{pan(x0 + 0.5, y0 + 0.17, 0.05)}
        {basin(x1 - 0.4, mid + 0.04, 0.18, 0.2, '#4a4a46')}
      </>)
    case 'modernist':
      return (<>
        {Rect(p, x0, y0, w, h, darken(pal.stone, 0.32), 0.03)}
        <rect x={f(x0 + 0.03)} y={f(y1 - 0.06)} width={f(w - 0.06)} height={0.04} fill="#6e6a62" fillOpacity={0.7} />
        {basin(x0 + w * 0.7, mid, 0.17, 0.2, '#5f6568')}
        {[0.25, 0.5].map((t, i) => <circle key={i} cx={f(x0 + w * t * 0.9)} cy={f(y0 + 0.14)} r={0.05} fill="#f4efe0" fillOpacity={0.9} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />)}
      </>)
    default:
      return (<>
        {Rect(p, x0, y0, w, h, '#7a7a70', 0.04)}
        {Array.from({ length: Math.round(w / 0.1) }, (_, i) => Array.from({ length: 2 }, (_, j) => <rect key={`${i}${j}`} x={f(x0 + 0.04 + i * 0.1)} y={f(y0 + 0.06 + j * 0.1)} width={0.09} height={0.09} fill={(i + j) % 2 ? '#1F4E8C' : '#c9c6b8'} fillOpacity={0.9} />))}
        {basin(x1 - 0.4, y1 - 0.3, 0.16, 0.14, '#4e5a5c')}
      </>)
  }
}

// ---------------------------------------------------------------------------
// tv
// ---------------------------------------------------------------------------
const tv: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const screen = (x: number, y: number, w: number, h: number, r = 0.02) => (
    <g>
      <rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} rx={r} fill="#0c0f12" stroke={INK} strokeOpacity={0.7} strokeWidth={p.px} />
      <path d={`M${f(x + 0.03)} ${f(y + h - 0.03)}L${f(x + w * 0.5)} ${f(y + 0.03)}H${f(x + w * 0.65)}L${f(x + 0.18)} ${f(y + h - 0.03)}Z`} fill="#9FB4D8" fillOpacity={0.14} />
    </g>
  )
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, cx - 0.36, cy - 0.3, 0.72, 0.6, pal.wood, 0.1)}
        <path d={`M${f(cx - 0.36)} ${f(cy - 0.1)}Q${f(cx)} ${f(cy - 0.42)} ${f(cx + 0.36)} ${f(cy - 0.1)}`} fill="none" stroke={pal.woodHi} strokeOpacity={0.5} strokeWidth={p.px} />
        {screen(cx - 0.26, cy - 0.2, 0.4, 0.4, 0.14)}
        {[0.12, 0.24].map((d, i) => <circle key={i} cx={f(cx + 0.25)} cy={f(cy - 0.12 + d * 0.8 + i * 0.05)} r={0.032} fill={pal.metal} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />)}
      </>)
    case 'artdeco':
      return (<>
        {Rect(p, cx - 0.36, cy - 0.28, 0.72, 0.56, '#2a2a32', 0.16)}
        {screen(cx - 0.27, cy - 0.2, 0.54, 0.4, 0.1)}
        <path d={`M${f(cx - 0.3)} ${f(cy + 0.24)}H${f(cx + 0.3)}`} stroke={pal.metal} strokeOpacity={0.8} strokeWidth={0.02} />
      </>)
    case 'modernist':
      return (<>
        {Rect(p, cx - 0.38, cy + 0.06, 0.76, 0.24, '#8d897e', 0.02)}
        <rect x={f(cx - 0.36)} y={f(cy - 0.26)} width={0.72} height={0.06} rx={0.01} fill="#101214" stroke={INK} strokeOpacity={0.7} strokeWidth={p.px} />
        <rect x={f(cx - 0.34)} y={f(cy - 0.2)} width={0.68} height={0.2} fill="#9FB4D8" fillOpacity={0.12} />
      </>)
    default:
      return (<>
        {Rect(p, cx - 0.36, cy - 0.3, 0.72, 0.6, p.st.id === 'tudor' ? '#2f2a24' : pal.fabric2, 0.04)}
        {screen(cx - 0.28, cy - 0.22, 0.46, 0.44)}
        {[0.1, 0.2].map((d, i) => <circle key={i} cx={f(cx + 0.26)} cy={f(cy - 0.1 + d)} r={0.03} fill={pal.metal} />)}
      </>)
  }
}

// ---------------------------------------------------------------------------
// bathtub (long axis x)
// ---------------------------------------------------------------------------
const bathtub: Art = p => {
  const { x0, y0, x1, y1 } = inner(p)
  const { pal } = p.st
  const w = x1 - x0, h = y1 - y0
  const ty = (y0 + y1) / 2
  const th = Math.min(h, 0.74)
  const water = (x: number, y: number, ww: number, hh: number, r: number, c = '#1f4a52') => (
    <g>
      <rect x={f(x)} y={f(y)} width={f(ww)} height={f(hh)} rx={r} fill={c} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
      <path d={`M${f(x + r)} ${f(y + 0.04)}H${f(x + ww * 0.5)}`} stroke="#bfe6ea" strokeOpacity={0.28} strokeWidth={0.03} strokeLinecap="round" />
    </g>
  )
  const taps = (x: number) => (<>
    <circle cx={f(x)} cy={f(ty)} r={0.045} fill={p.reg.dome(pal.metal)} {...ol(p)} />
    <circle cx={f(x)} cy={f(ty - 0.14)} r={0.025} fill={pal.metal} /><circle cx={f(x)} cy={f(ty + 0.14)} r={0.025} fill={pal.metal} />
  </>)
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {[[x0 + 0.1, ty - th / 2 + 0.03], [x0 + 0.1, ty + th / 2 - 0.03], [x1 - 0.1, ty - th / 2 + 0.03], [x1 - 0.1, ty + th / 2 - 0.03]].map(([fx, fy], i) => <circle key={i} cx={f(fx)} cy={f(fy)} r={0.05} fill={pal.metal} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />)}
        <rect x={f(x0)} y={f(ty - th / 2)} width={f(w)} height={f(th)} rx={th / 2} fill={p.reg.sheen(pal.enamel, 0.8)} {...ol(p)} />
        {water(x0 + 0.1, ty - th / 2 + 0.09, w - 0.2, th - 0.18, (th - 0.18) / 2)}
        {taps(x0 + 0.08)}
        {hl(p, x0, ty - th / 2, w, th, th / 2)}
      </>)
    case 'artdeco':
      return (<>
        <rect x={f(x0)} y={f(ty - th / 2)} width={f(w)} height={f(th)} rx={0.07} fill="#26262e" {...ol(p)} />
        <rect x={f(x0 + 0.03)} y={f(ty - th / 2 + 0.03)} width={f(w - 0.06)} height={f(th - 0.06)} rx={0.05} fill="none" stroke={pal.metal} strokeOpacity={0.8} strokeWidth={p.px * 1.5} />
        {water(x0 + 0.1, ty - th / 2 + 0.1, w - 0.2, th - 0.2, 0.08, '#294b50')}
        {taps(x0 + 0.08)}
      </>)
    case 'tudor':
      return (<>
        <rect x={f(x0)} y={f(ty - th / 2)} width={f(w)} height={f(th)} rx={th / 2.2} fill={p.reg.sheen(pal.metal, 0.9)} {...ol(p)} />
        {water(x0 + 0.08, ty - th / 2 + 0.08, w - 0.16, th - 0.16, (th - 0.16) / 2.2, '#2c4a48')}
        {taps(x0 + 0.06)}
      </>)
    case 'modernist':
      return (<>
        <ellipse cx={f((x0 + x1) / 2)} cy={f(ty)} rx={f(w / 2)} ry={f(th / 2)} fill={p.reg.sheen('#b8bcbc', 0.8)} {...ol(p)} />
        <ellipse cx={f((x0 + x1) / 2)} cy={f(ty)} rx={f(w / 2 - 0.08)} ry={f(th / 2 - 0.08)} fill="#2a4a54" stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
        <path d={`M${f(x0 + 0.2)} ${f(ty - 0.12)}Q${f(x0 + 0.5)} ${f(ty - 0.2)} ${f(x0 + 0.7)} ${f(ty - 0.14)}`} stroke="#bfe6ea" strokeOpacity={0.28} strokeWidth={0.03} fill="none" strokeLinecap="round" />
        <circle cx={f(x0 + 0.12)} cy={f(ty)} r={0.03} fill={pal.metal} />
      </>)
    default:
      return (<>
        <rect x={f(x0)} y={f(ty - th / 2)} width={f(w)} height={f(th)} rx={0.05} fill="#1F4E8C" {...ol(p)} />
        {Array.from({ length: Math.round(w / 0.1) }, (_, i) => <rect key={i} x={f(x0 + 0.02 + i * 0.1)} y={f(ty - th / 2 + 0.02)} width={0.08} height={0.08} fill={i % 2 ? '#d8d2c0' : '#1F4E8C'} fillOpacity={0.85} />)}
        {water(x0 + 0.12, ty - th / 2 + 0.12, w - 0.24, th - 0.24, 0.05, '#2f6a74')}
        {taps(x0 + 0.08)}
      </>)
  }
}

// ---------------------------------------------------------------------------
// bookshelf (against the north edge of its footprint; long axis x)
// ---------------------------------------------------------------------------
const bookshelf: Art = p => {
  const { x0, y0, x1 } = inner(p)
  const { pal } = p.st
  const w = x1 - x0
  const D = 0.38
  const r = rng(p.seed)
  const spine = p.st.id === 'victorian' ? ['#7A1F26', '#1F3A2A', '#C9A24A', '#4a2e1e', '#2f4a6a', '#8a5a2a']
    : p.st.id === 'artdeco' ? ['#0F5E55', '#C9A24A', '#1c1c22', '#8a2a2a', '#d9d0bd']
      : p.st.id === 'modernist' ? ['#d8d4c8', '#8a8e92', '#c8c2b2', '#3a3d42', '#9FB4D8']
        : p.st.id === 'tudor' ? ['#4a2e1e', '#6e1f22', '#8a7a52', '#2c3a2a']
          : ['#d8d2c0', '#1F4E8C', '#9A5538', '#c9b98a']
  const books: ReactNode[] = []
  let x = x0 + 0.05
  let i = 0
  const dense = p.st.id !== 'tudor'
  while (x < x0 + w - 0.07) {
    const bw = (dense ? 0.035 : 0.06) + r() * 0.03
    if (x + bw > x0 + w - 0.05) break
    const bh = D - 0.1 - r() * 0.07
    books.push(<rect key={i} x={f(x)} y={f(y0 + 0.05)} width={f(bw)} height={f(bh)} fill={spine[Math.floor(r() * spine.length)]} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px * 0.8} />)
    x += bw + 0.004
    i++
    if (!dense && r() < 0.35) x += 0.1 + r() * 0.12
  }
  return (<>
    <rect x={f(x0)} y={f(y0)} width={f(w)} height={D} rx={0.025} fill={p.reg.sheen(p.st.id === 'modernist' ? pal.woodHi : pal.wood)} {...ol(p)} />
    <rect x={f(x0 + 0.03)} y={f(y0 + 0.03)} width={f(w - 0.06)} height={f(D - 0.06)} fill={darken(pal.wood, 0.45)} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
    {books}
    {p.st.id === 'modernist' && Array.from({ length: Math.max(1, Math.round(w)) - 1 }, (_, k) => <path key={k} d={`M${f(x0 + (w * (k + 1)) / Math.round(w))} ${f(y0)}v${D}`} stroke={INK} strokeOpacity={0.5} strokeWidth={0.03} />)}
    {hl(p, x0, y0, w, D, 0.025)}
  </>)
}

// ---------------------------------------------------------------------------
// stove / fridge
// ---------------------------------------------------------------------------
const stove: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const burner = (bx: number, by: number, r: number, hot = true) => (
    <g key={`${bx}${by}`}>
      <circle cx={f(bx)} cy={f(by)} r={r} fill="#161616" stroke={INK} strokeOpacity={0.7} strokeWidth={p.px} />
      <circle cx={f(bx)} cy={f(by)} r={r * 0.66} fill="none" stroke={hot ? '#a8501f' : '#555'} strokeOpacity={0.9} strokeWidth={p.px * 1.5} />
      <circle cx={f(bx)} cy={f(by)} r={r * 0.28} fill={hot ? '#e0702a' : '#444'} fillOpacity={0.9} />
    </g>
  )
  const burners = (r: number) => [[-0.15, -0.1], [0.15, -0.1], [-0.15, 0.17], [0.15, 0.17]].map(([dx, dy], i) => <g key={i}>{burner(cx + dx, cy + dy, r)}</g>)
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, cx - 0.37, cy - 0.37, 0.74, 0.74, '#1c1b1b', 0.04)}
        <circle cx={f(cx + 0.24)} cy={f(cy - 0.27)} r={0.06} fill="#0a0a0a" stroke={INK} strokeWidth={p.px} />
        {burners(0.1)}
        <path d={`M${f(cx - 0.34)} ${f(cy + 0.33)}H${f(cx + 0.34)}`} stroke={pal.metal} strokeWidth={0.035} strokeLinecap="round" />
      </>)
    case 'artdeco':
      return (<>
        {Rect(p, cx - 0.36, cy - 0.36, 0.72, 0.72, '#cfc6b0', 0.08)}
        <rect x={f(cx - 0.3)} y={f(cy - 0.3)} width={0.6} height={0.6} rx={0.05} fill="#1d1d20" />
        {burners(0.1)}
        <path d={`M${f(cx - 0.3)} ${f(cy + 0.32)}H${f(cx + 0.3)}`} stroke="#c9ccd0" strokeWidth={0.025} />
      </>)
    case 'tudor':
      return (<>
        {Rect(p, cx - 0.37, cy - 0.37, 0.74, 0.74, '#262322', 0.03)}
        <rect x={f(cx - 0.3)} y={f(cy - 0.3)} width={0.6} height={0.34} fill="#0e0d0d" stroke={INK} strokeOpacity={0.7} strokeWidth={p.px} />
        <ellipse cx={f(cx)} cy={f(cy - 0.13)} rx={0.18} ry={0.08} fill="#e0702a" fillOpacity={0.55} />
        {[-0.15, 0.15].map(d => burner(cx + d, cy + 0.2, 0.09))}
      </>)
    case 'modernist':
      return (<>
        {Rect(p, cx - 0.37, cy - 0.37, 0.74, 0.74, '#b8bcc0', 0.02)}
        <rect x={f(cx - 0.3)} y={f(cy - 0.3)} width={0.6} height={0.6} rx={0.02} fill="#0c0e10" />
        {[[-0.14, -0.13], [0.14, -0.13], [-0.14, 0.14], [0.14, 0.14]].map(([dx, dy], i) => <circle key={i} cx={f(cx + dx)} cy={f(cy + dy)} r={0.1} fill="none" stroke="#9FB4D8" strokeOpacity={0.5} strokeWidth={0.02} />)}
      </>)
    default:
      return (<>
        {Rect(p, cx - 0.37, cy - 0.37, 0.74, 0.74, '#1F4E8C', 0.04)}
        {Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => <rect key={`${i}${j}`} x={f(cx - 0.35 + i * 0.175)} y={f(cy - 0.35 + j * 0.175)} width={0.165} height={0.165} fill={(i + j) % 2 ? '#d8d2c0' : '#1F4E8C'} fillOpacity={0.7} />))}
        <rect x={f(cx - 0.28)} y={f(cy - 0.24)} width={0.56} height={0.4} rx={0.03} fill="#15110e" />
        {[-0.12, 0.12].map(d => burner(cx + d, cy - 0.04, 0.09))}
      </>)
  }
}

const fridge: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const bw = 0.62, bh = 0.74
  const x = cx - bw / 2, y = cy - bh / 2
  const col = p.st.id === 'modernist' ? '#5f6469' : p.st.id === 'tudor' ? '#6e5234' : p.st.id === 'victorian' ? '#7f7762' : p.st.id === 'artdeco' ? '#7f7762' : '#767260'
  return (<>
    {Rect(p, x, y, bw, bh, col, p.st.id === 'artdeco' ? 0.12 : 0.05)}
    <path d={`M${f(x + 0.03)} ${f(y + bh * 0.36)}H${f(x + bw - 0.03)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px * 1.2} />
    <rect x={f(x + bw - 0.13)} y={f(y + 0.12)} width={0.04} height={0.16} rx={0.015} fill={p.st.id === 'tudor' ? '#c8c8c8' : pal.metal} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
    <rect x={f(x + bw - 0.13)} y={f(y + 0.44)} width={0.04} height={0.2} rx={0.015} fill={p.st.id === 'tudor' ? '#c8c8c8' : pal.metal} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
    {p.st.id === 'victorian' && [y + 0.08, y + bh - 0.12].map((hy, i) => <rect key={i} x={f(x - 0.015)} y={f(hy)} width={0.03} height={0.05} fill={pal.metal} />)}
    {p.st.id === 'tudor' && <rect x={f(x + 0.08)} y={f(y + 0.08)} width={0.14} height={0.05} fill="#d8d2c0" fillOpacity={0.8} />}
  </>)
}

// ---------------------------------------------------------------------------
// clock (longcase seen from above: a narrow plinth with the hood and finial)
// ---------------------------------------------------------------------------
const clock: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const face = (x: number, y: number, r: number, c = '#a39b84') => (<>
    <circle cx={f(x)} cy={f(y)} r={r} fill={c} stroke={INK} strokeOpacity={0.6} strokeWidth={p.px * 1.2} />
    {[0, 3, 6, 9].map(i => <path key={i} d={`M${f(x + Math.sin(i * 0.5236) * r * 0.78)} ${f(y - Math.cos(i * 0.5236) * r * 0.78)}L${f(x + Math.sin(i * 0.5236) * r * 0.95)} ${f(y - Math.cos(i * 0.5236) * r * 0.95)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />)}
    <path d={`M${f(x)} ${f(y)}L${f(x - r * 0.4)} ${f(y - r * 0.3)}M${f(x)} ${f(y)}L${f(x + r * 0.2)} ${f(y - r * 0.7)}`} stroke={INK} strokeOpacity={0.7} strokeWidth={p.px * 1.4} strokeLinecap="round" />
  </>)
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, cx - 0.22, cy - 0.3, 0.44, 0.6, pal.wood, 0.03)}
        <rect x={f(cx - 0.17)} y={f(cy - 0.25)} width={0.34} height={0.26} rx={0.02} fill={darken(pal.wood, 0.3)} stroke={pal.metal} strokeOpacity={0.7} strokeWidth={p.px} />
        {face(cx, cy - 0.12, 0.1, '#8f866c')}
        <path d={`M${f(cx - 0.12)} ${f(cy + 0.08)}H${f(cx + 0.12)}M${f(cx)} ${f(cy + 0.08)}V${f(cy + 0.26)}`} stroke={pal.metal} strokeOpacity={0.6} strokeWidth={p.px * 1.5} />
      </>)
    case 'artdeco':
      return (<>
        {face(cx, cy, 0.2, '#8f866c')}
        {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${f(cx + Math.sin(i * 0.5236) * 0.23)} ${f(cy - Math.cos(i * 0.5236) * 0.23)}L${f(cx + Math.sin(i * 0.5236) * 0.31)} ${f(cy - Math.cos(i * 0.5236) * 0.31)}`} stroke={darken(pal.metal, 0.25)} strokeWidth={0.025} strokeLinecap="round" />)}
      </>)
    case 'tudor':
      return (<>
        {Rect(p, cx - 0.2, cy - 0.28, 0.4, 0.56, pal.metal, 0.04)}
        {face(cx, cy, 0.14, '#9a8c68')}
      </>)
    case 'modernist':
      return face(cx, cy, 0.22, '#8d8e8a')
    default:
      return (<>
        {Rect(p, cx - 0.26, cy - 0.26, 0.52, 0.52, pal.fabric2, 0.05)}
        {face(cx, cy, 0.17, '#a39b84')}
      </>)
  }
}

// ---------------------------------------------------------------------------
// desk
// ---------------------------------------------------------------------------
const desk: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const x = cx - 0.38, y = cy - 0.3, w = 0.76, h = 0.6
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, x, y, w, h, pal.wood, 0.03)}
        <rect x={f(x + 0.07)} y={f(y + 0.07)} width={f(w - 0.14)} height={f(h - 0.14)} rx={0.02} fill="#244a34" stroke={pal.metal} strokeOpacity={0.75} strokeWidth={p.px * 1.2} />
        <rect x={f(x + 0.13)} y={f(y + 0.12)} width={0.14} height={0.1} fill="#d8d2b8" fillOpacity={0.85} />
        <circle cx={f(x + w - 0.16)} cy={f(y + 0.16)} r={0.04} fill="#15110e" stroke={pal.metal} strokeWidth={p.px} />
      </>)
    case 'artdeco':
      return (<>
        <path d={`M${f(x + 0.1)} ${f(y)}H${f(x + w - 0.1)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + 0.1)}V${f(y + h - 0.1)}Q${f(x + w)} ${f(y + h)} ${f(x + w - 0.1)} ${f(y + h)}H${f(x + 0.1)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - 0.1)}V${f(y + 0.1)}Q${f(x)} ${f(y)} ${f(x + 0.1)} ${f(y)}Z`} fill={p.reg.sheen('#25252c')} {...ol(p)} />
        <rect x={f(x + 0.06)} y={f(y + 0.06)} width={f(w - 0.12)} height={f(h - 0.12)} rx={0.05} fill="none" stroke={pal.metal} strokeOpacity={0.8} strokeWidth={p.px * 1.5} />
        <rect x={f(x + 0.12)} y={f(y + 0.12)} width={0.16} height={0.1} fill="#d8d2b8" fillOpacity={0.7} />
      </>)
    case 'modernist':
      return (<>
        {Rect(p, x, y + 0.04, w, h - 0.08, pal.woodHi, 0.02)}
        <rect x={f(x + 0.1)} y={f(y + 0.12)} width={0.2} height={0.12} fill="#2a2c30" stroke={INK} strokeOpacity={0.5} strokeWidth={p.px} />
        <rect x={f(x + 0.4)} y={f(y + 0.12)} width={0.1} height={0.1} fill="#d8d4c8" fillOpacity={0.8} />
      </>)
    default:
      return (<>
        {Rect(p, x, y, w, h, p.st.id === 'tudor' ? pal.woodHi : pal.wood, 0.03)}
        <path d={`M${f(x + 0.04)} ${f(y + 0.24)}H${f(x + w - 0.04)}`} stroke={INK} strokeOpacity={0.3} strokeWidth={p.px} />
        <rect x={f(x + 0.1)} y={f(y + 0.07)} width={0.16} height={0.1} fill="#d8d2b8" fillOpacity={0.8} />
        <circle cx={f(x + w - 0.16)} cy={f(y + 0.12)} r={0.035} fill="#15110e" stroke={pal.metal} strokeWidth={p.px} />
      </>)
  }
}

// ---------------------------------------------------------------------------
// toilet / shower
// ---------------------------------------------------------------------------
const toilet: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const por = p.st.id === 'artdeco' ? '#9a9a96' : '#a9a79c'
  return (<>
    {p.st.id === 'victorian' && <>
      <rect x={f(cx - 0.12)} y={f(cy - 0.34)} width={0.24} height={0.1} rx={0.02} fill={pal.wood} {...ol(p)} />
      <path d={`M${f(cx)} ${f(cy - 0.24)}V${f(cy - 0.08)}`} stroke={pal.metal} strokeWidth={0.025} />
    </>}
    {p.st.id !== 'victorian' && <rect x={f(cx - 0.19)} y={f(cy - 0.34)} width={0.38} height={0.13} rx={0.03} fill={p.reg.sheen(por)} {...ol(p)} />}
    <ellipse cx={f(cx)} cy={f(cy + 0.1)} rx={0.2} ry={0.26} fill={p.reg.sheen(por)} {...ol(p)} />
    <ellipse cx={f(cx)} cy={f(cy + 0.12)} rx={0.13} ry={0.18} fill="#2a4a54" fillOpacity={0.75} stroke={INK} strokeOpacity={0.4} strokeWidth={p.px} />
    {p.st.id === 'tudor' && <ellipse cx={f(cx)} cy={f(cy + 0.1)} rx={0.2} ry={0.26} fill="none" stroke="#8a6a44" strokeWidth={0.04} />}
  </>)
}

const shower: Art = p => {
  const { cx, cy } = inner(p)
  const { pal } = p.st
  const s = 0.62
  const x = cx - s / 2, y = cy - s / 2
  switch (p.st.id) {
    case 'victorian':
      return (<>
        {Rect(p, x, y, s, s, '#8f8f88', 0.04)}
        <circle cx={f(cx)} cy={f(cy)} r={0.3} fill="none" stroke={pal.metal} strokeWidth={0.03} strokeDasharray="0.08 0.04" />
        <circle cx={f(cx)} cy={f(cy)} r={0.06} fill={p.reg.dome(pal.metal)} {...ol(p)} />
        <circle cx={f(cx)} cy={f(cy)} r={0.02} fill="#15110e" />
      </>)
    case 'artdeco':
      return (<>
        <path d={`M${f(x)} ${f(y)}H${f(x + s)}V${f(y + s - 0.3)}A0.3 0.3 0 0 1 ${f(x + s - 0.3)} ${f(y + s)}H${f(x)}Z`} fill="#6d8a80" fillOpacity={0.9} {...ol(p)} />
        {Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => <rect key={`${i}${j}`} x={f(x + 0.03 + i * 0.145)} y={f(y + 0.03 + j * 0.145)} width={0.12} height={0.12} fill="#fff" fillOpacity={0.07} />))}
        <circle cx={f(x + 0.12)} cy={f(y + 0.12)} r={0.05} fill={p.reg.dome('#c9ccd0')} />
      </>)
    case 'modernist':
      return (<>
        <rect x={f(x)} y={f(y)} width={s} height={s} fill="#555a5e" {...ol(p)} />
        <rect x={f(x)} y={f(y + s - 0.02)} width={s} height={0.04} fill="#9FB4D8" fillOpacity={0.7} />
        <circle cx={f(cx)} cy={f(cy)} r={0.09} fill="none" stroke="#c8ccd0" strokeWidth={0.02} />
      </>)
    default:
      return (<>
        {Rect(p, x, y, s, s, p.st.id === 'tudor' ? '#5a5750' : '#2f6a74', 0.05)}
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${f(x + 0.06)} ${f(y + 0.1 + i * 0.09)}H${f(x + s - 0.06)}`} stroke={INK} strokeOpacity={0.18} strokeWidth={p.px} />)}
        <circle cx={f(cx)} cy={f(cy)} r={0.07} fill={p.reg.dome('#c8c8c0')} {...ol(p)} />
      </>)
  }
}

export const ART: Record<FurnitureType, Art> = {
  chair, sofa, bed, table, box, rug, plant, shrub, lamp, counter, tv, bathtub,
  bookshelf, stove, fridge, clock, desk, toilet, shower,
}

/** Glyphs that stay upright: the footprint rotation is not applied. */
const NO_ROTATE = new Set<FurnitureType>(['clock', 'lamp', 'plant', 'shrub', 'box', 'table'])

function canonical(fu: Furniture): { W: number; H: number; rot: number } {
  const { w, h } = furnitureFootprint(fu)
  const rot = NO_ROTATE.has(fu.type) ? 0 : (fu.rotation ?? 0)
  const swap = rot === 90 || rot === 270
  return { W: swap ? h : w, H: swap ? w : h, rot }
}

function pieceTransform(fu: Furniture): string {
  const { w, h } = furnitureFootprint(fu)
  const { W, H, rot } = canonical(fu)
  return `translate(${f(fu.col + w / 2)} ${f(fu.row + h / 2)}) rotate(${-rot}) translate(${f(-W / 2)} ${f(-H / 2)})`
}

/** A decorative rug on the floor of a room: the rug art on a free rectangle (cell units). */
export function rugRect(reg: Reg, st: StyleKit, x: number, y: number, w: number, h: number, px: number, seed: number): ReactElement {
  const jx: number[] = [], jy: number[] = []
  for (let k = Math.ceil(x + 1e-6); k < x + w; k++) jx.push(k - x)
  for (let k = Math.ceil(y + 1e-6); k < y + h; k++) jy.push(k - y)
  const pc: Pc = { reg, st, W: w, H: h, px, seed, jx, jy }
  return <g data-decor="rug" transform={`translate(${f(x)} ${f(y)})`}>{rug(pc)}</g>
}

/** One logical piece, drawn once. The group carries data-furniture for tests. */
export function pieceArt(reg: Reg, st: StyleKit, fu: Furniture, px: number): ReactElement {
  const { W, H } = canonical(fu)
  const pc: Pc = { reg, st, W, H, px, seed: hashStr(`${fu.type}${fu.row}.${fu.col}`) }
  return (
    <g data-furniture={fu.type} data-row={fu.row} data-col={fu.col} transform={pieceTransform(fu)}>
      {ART[fu.type](pc)}
    </g>
  )
}

/** Hull used for the soft cast shadow: the piece's occupied body, inset like the art. */
export function pieceShadow(fu: Furniture): ReactElement | null {
  if (fu.type === 'rug') return null
  const { W, H } = canonical(fu)
  const round = fu.type === 'plant' || fu.type === 'shrub' || fu.type === 'lamp' || (fu.type === 'table' && W <= 1.2 && H <= 1.2) || fu.type === 'clock'
  const g = (child: ReactNode) => <g transform={pieceTransform(fu)}>{child}</g>
  if (round) return g(<circle cx={W / 2} cy={H / 2} r={Math.min(W, H) / 2 - 0.13} />)
  const small = fu.type === 'stove' || fu.type === 'fridge' || fu.type === 'tv' || fu.type === 'desk' || fu.type === 'shower' || fu.type === 'box' || fu.type === 'toilet'
  if (small) return g(<rect x={W / 2 - 0.34} y={H / 2 - 0.33} width={0.68} height={0.66} rx={0.05} />)
  if (fu.type === 'bookshelf') return g(<rect x={INSET} y={INSET} width={W - 2 * INSET} height={0.38} rx={0.03} />)
  return g(<rect x={INSET} y={INSET + 0.04} width={W - 2 * INSET} height={H - 2 * INSET - 0.08} rx={0.08} />)
}
