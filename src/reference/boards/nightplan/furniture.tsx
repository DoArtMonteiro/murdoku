// ============================================================================
// Night Plan pictograms — F-spec §5. One family: three tones only (bone light,
// oak mid, ink outline), 2 px outline (1.5 px when the cell is under 60 px),
// soft goods round-cornered, casework square. Every glyph is drawn in a local
// box [0,W]x[0,H] (cell units) FACING SOUTH with its back to the north, then
// rotated by the shell-agnostic rule below. Covers every FurnitureType.
// ============================================================================
import type { ReactElement, ReactNode } from 'react'
import type { Furniture, FurnitureType } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { A, P, SHADOW_OFFSET } from './palette'

const INK = P.ink, BONE = P.bone, OAK = P.oak

interface Mode { sil: boolean; sw: number }

function mkStroke(m: Mode, w = m.sw) {
  return { stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
}

/** Glyphs that must stay upright / are symmetric: the footprint rotation is not applied. */
const NO_ROTATE = new Set<FurnitureType>(['clock', 'lamp', 'plant', 'shrub', 'box', 'table'])

type Art = (W: number, H: number, m: Mode) => ReactNode

const ART: Record<FurnitureType, Art> = {
  chair: (W, H, m) => {
    // seat + backrest bar on the north side + two arm rests: reads as a chair, not a box
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    return (<>
      <rect x={cx - 0.3} y={cy - 0.32} width={0.6} height={0.14} rx={0.06} fill={OAK} {...s} />
      <rect x={cx - 0.3} y={cy - 0.14} width={0.1} height={0.4} rx={0.04} fill={OAK} {...s} />
      <rect x={cx + 0.2} y={cy - 0.14} width={0.1} height={0.4} rx={0.04} fill={OAK} {...s} />
      <rect x={cx - 0.2} y={cy - 0.14} width={0.4} height={0.4} rx={0.05} fill={BONE} {...s} />
    </>)
  },
  table: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    if (W > 1.2) {
      return (<>
        <rect x={0.12} y={cy - 0.34} width={W - 0.24} height={0.68} rx={0.08} fill={OAK} {...s} />
        {!m.sil && <>
          <rect x={0.19} y={cy - 0.27} width={W - 0.38} height={0.54} rx={0.05} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {[W * 0.3, W * 0.7].map(px => <circle key={px} cx={px} cy={cy} r={0.1} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.6} />)}
        </>}
      </>)
    }
    return (<>
      <circle cx={cx} cy={cy} r={0.31} fill={OAK} {...s} />
      {!m.sil && <circle cx={cx} cy={cy} r={0.25} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />}
    </>)
  },
  desk: (W, _H, m) => {
    const s = mkStroke(m)
    const x = (W - 0.76) / 2, y = 0.14
    return (<>
      <rect x={x} y={y} width={0.76} height={0.5} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={x + 0.04} y={y + 0.04} width={0.68} height={0.42} fill={BONE} />
        <rect x={x + 0.38} y={y + 0.1} width={0.3} height={0.2} fill={INK} />
        <path d={`M${x + 0.1} ${y + 0.34}H${x + 0.3}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
      </>}
    </>)
  },
  counter: (W, H, m) => {
    const s = mkStroke(m)
    const x = 0.12, y = 0.12, w = W - 0.24, h = H - 0.24
    return (<>
      <rect x={x} y={y} width={w} height={h} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={x + 0.05} y={y + 0.05} width={w - 0.1} height={h - 0.1} fill={BONE} />
        <circle cx={Math.min(0.5, W / 2)} cy={H / 2} r={0.15} fill={BONE} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {W >= 1.5 && [W * 0.58, W * 0.8].map(px => (
          <path key={px} d={`M${px} ${H / 2 + 0.02}V${H - 0.17}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
        ))}
      </>}
    </>)
  },
  stove: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    return (<>
      <rect x={cx - 0.35} y={cy - 0.35} width={0.7} height={0.7} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={cx - 0.35} y={cy - 0.35} width={0.7} height={0.08} fill={INK} />
        {[-1, 1].flatMap(dx => [-1, 1].map(dy => (
          <circle key={`${dx}${dy}`} cx={cx + dx * 0.15} cy={cy + 0.05 + dy * 0.14} r={0.06} fill={BONE} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        )))}
      </>}
    </>)
  },
  fridge: (W, H, m) => {
    const s = mkStroke(m)
    const x = (W - 0.6) / 2, y = (H - 0.76) / 2
    return (<>
      <rect x={x} y={y} width={0.6} height={0.76} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={x + 0.04} y={y + 0.04} width={0.52} height={0.68} fill={BONE} />
        <path d={`M${x + 0.04} ${y + 0.76 / 3}H${x + 0.56}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <rect x={x + 0.6 - 0.12} y={y + 0.28} width={0.06} height={0.3} fill={INK} />
      </>}
    </>)
  },
  bookshelf: (W, _H, m) => {
    const s = mkStroke(m)
    const x = 0.1, w = W - 0.2, y = 0.14, h = 0.34
    const nSp = Math.max(5, Math.round(5 * W))
    return (<>
      <rect x={x} y={y} width={w} height={h} fill={BONE} {...s} />
      {!m.sil && <>
        <rect x={x} y={y} width={w} height={0.07} fill={OAK} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {Array.from({ length: nSp }, (_, i) => {
          const px = x + (w * (i + 0.5)) / nSp
          const top = y + 0.1 + (i % 2 ? 0.06 : 0)
          return <path key={i} d={`M${px} ${top}V${y + h - 0.04}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        })}
      </>}
    </>)
  },
  tv: (W, _H, m) => {
    const s = mkStroke(m)
    const x = (W - 0.7) / 2, y = 0.14
    return (<>
      <rect x={x} y={y} width={0.7} height={0.44} fill={INK} {...s} />
      <rect x={(W - 0.3) / 2} y={y + 0.44} width={0.3} height={0.06} fill={OAK} {...s} />
      {!m.sil && <rect x={x + 0.05} y={y + 0.05} width={0.6} height={0.34} fill="none" stroke={BONE} strokeWidth={1} vectorEffect="non-scaling-stroke" />}
    </>)
  },
  lamp: (W, H, m) => {
    // shade over base: a small side table (oak) carrying a shade disc (bone) with its inner ring and a base dot. No cross, no rays.
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    return (<>
      <rect x={cx - 0.26} y={cy - 0.26} width={0.52} height={0.52} rx={0.04} fill={OAK} {...s} />
      <circle cx={cx} cy={cy} r={0.21} fill={BONE} {...s} />
      {!m.sil && <>
        <circle cx={cx} cy={cy} r={0.13} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.55} />
        <circle cx={cx} cy={cy} r={0.05} fill={OAK} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </>}
    </>)
  },
  plant: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    const leaves: [number, number][] = [[-0.15, -0.12], [0, -0.22], [0.15, -0.12]]
    return (<>
      <path d={`M${cx - 0.15} ${cy + 0.1}H${cx + 0.15}L${cx + 0.1} ${cy + 0.34}H${cx - 0.1}Z`} fill={OAK} {...s} />
      {leaves.map(([dx, dy], i) => <circle key={`o${i}`} cx={cx + dx} cy={cy + dy + 0.04} r={0.14} fill={BONE} {...mkStroke(m, m.sw * 2)} />)}
      {leaves.map(([dx, dy], i) => <circle key={`f${i}`} cx={cx + dx} cy={cy + dy + 0.04} r={0.14} fill={BONE} />)}
      {!m.sil && leaves.map(([dx, dy], i) => (
        <path key={`m${i}`} d={`M${cx} ${cy + 0.1}L${cx + dx} ${cy + dy + 0.04}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
      ))}
    </>)
  },
  shrub: (W, H, m) => {
    const cx = W / 2, cy = H / 2
    const pts: [number, number, number][] = [[-0.17, 0.05, 0.19], [0.17, 0.05, 0.19], [0, -0.14, 0.2], [0, 0.14, 0.18]]
    return (<>
      {pts.map(([dx, dy, r], i) => <circle key={`o${i}`} cx={cx + dx} cy={cy + dy} r={r} fill={P.olive} {...mkStroke(m, m.sw * 2)} />)}
      {pts.map(([dx, dy, r], i) => <circle key={`f${i}`} cx={cx + dx} cy={cy + dy} r={r} fill={P.olive} />)}
      {!m.sil && [[-0.12, -0.02], [0.1, 0.08], [0.02, -0.14]].map(([dx, dy], i) => (
        <path key={i} d={`M${cx + dx - 0.05} ${cy + dy}q0.05 -0.06 0.1 0`} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
      ))}
    </>)
  },
  rug: (W, H, m) => {
    const x = 0.18, y = 0.18, w = W - 0.36, h = H - 0.36
    const nT = Math.max(2, Math.round(h / 0.14))
    return (<>
      <rect x={x} y={y} width={w} height={h} rx={0.06} fill={BONE} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {!m.sil && <>
        <rect x={x + 0.03} y={y + 0.03} width={w - 0.06} height={h - 0.06} rx={0.04} fill="none" stroke={OAK} strokeWidth={0.06} />
        <rect x={x + 0.09} y={y + 0.09} width={w - 0.18} height={h - 0.18} fill="none" stroke={OAK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <path d={`M${x + w / 2} ${y + 0.16}L${x + w - 0.16} ${y + h / 2}L${x + w / 2} ${y + h - 0.16}L${x + 0.16} ${y + h / 2}Z`} fill={OAK} fillOpacity={0.55} stroke={OAK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {Array.from({ length: nT }, (_, i) => {
          const py = y + (h * (i + 0.5)) / nT
          return <path key={i} d={`M${x - 0.07} ${py}H${x}M${x + w} ${py}h0.07`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.4} />
        })}
      </>}
    </>)
  },
  box: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    return (<>
      <rect x={cx - 0.25} y={cy - 0.25} width={0.5} height={0.5} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={cx - 0.06} y={cy - 0.25} width={0.12} height={0.5} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={`M${cx - 0.25} ${cy - 0.12}H${cx - 0.06}M${cx + 0.06} ${cy - 0.12}H${cx + 0.25}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
        <rect x={cx + 0.1} y={cy + 0.08} width={0.11} height={0.09} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </>}
    </>)
  },
  clock: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    return (<>
      <circle cx={cx} cy={cy} r={0.25} fill={BONE} {...s} />
      {!m.sil && <>
        {[0, 90, 180, 270].map(a => {
          const r = (a * Math.PI) / 180
          return <path key={a} d={`M${cx + Math.sin(r) * 0.2} ${cy - Math.cos(r) * 0.2}L${cx + Math.sin(r) * 0.15} ${cy - Math.cos(r) * 0.15}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        })}
        <path d={`M${cx} ${cy}L${cx - 0.098} ${cy - 0.069}M${cx} ${cy}L${cx + 0.165} ${cy - 0.095}`} stroke={INK} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={cx} cy={cy} r={0.02} fill={INK} />
      </>}
    </>)
  },
  bathtub: (W, H, m) => {
    const s = mkStroke(m)
    const x = 0.12, y = (H - 0.5) / 2, w = W - 0.24, h = 0.5
    return (<>
      <rect x={x} y={y} width={w} height={h} rx={0.2} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={x + 0.06} y={y + 0.06} width={w - 0.12} height={h - 0.12} rx={0.15} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <circle cx={x + 0.2} cy={y + h / 2} r={0.04} fill={INK} />
        <circle cx={x + w - 0.2} cy={y + h / 2} r={0.05} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </>}
    </>)
  },
  toilet: (W, _H, m) => {
    const s = mkStroke(m)
    const cx = W / 2
    return (<>
      <rect x={cx - 0.2} y={0.14} width={0.4} height={0.14} fill={OAK} {...s} />
      <ellipse cx={cx} cy={0.58} rx={0.2} ry={0.26} fill={BONE} {...s} />
      {!m.sil && <ellipse cx={cx} cy={0.6} rx={0.11} ry={0.16} fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />}
    </>)
  },
  shower: (W, H, m) => {
    const s = mkStroke(m)
    const cx = W / 2, cy = H / 2
    const x = cx - 0.35, y = cy - 0.35
    return (<>
      <rect x={x} y={y} width={0.7} height={0.7} fill={OAK} {...s} />
      {!m.sil && <>
        <g stroke={INK} strokeWidth={1} opacity={0.55}>
          {Array.from({ length: 13 }, (_, i) => {
            const k = (i + 1) * 0.1
            const xa = Math.max(0, k - 0.7), xb = Math.min(0.7, k)
            return <path key={i} d={`M${x + xa} ${y + k - xa}L${x + xb} ${y + k - xb}`} vectorEffect="non-scaling-stroke" />
          })}
        </g>
        <circle cx={cx} cy={cy} r={0.07} fill={BONE} stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </>}
    </>)
  },
  bed: (W, H, m) => {
    // Head toward the west end of the long axis; rotated into place by Piece.
    const s = mkStroke(m)
    const tall = H > W
    const L = tall ? H : W, B = tall ? W : H
    const inner = (
      <>
        <rect x={0.12} y={0.12} width={0.1} height={B - 0.24} rx={0.03} fill={OAK} {...s} />
        <rect x={0.22} y={0.12} width={L - 0.34} height={B - 0.24} rx={0.06} fill={BONE} {...s} />
        {!m.sil && <>
          <rect x={0.22} y={0.12} width={0.3} height={B - 0.24} fill={OAK} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {B < 1.5
            ? <ellipse cx={0.37} cy={B / 2} rx={0.1} ry={Math.min(0.3, (B - 0.3) / 2)} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            : [0.3, 0.7].map(fr => <ellipse key={fr} cx={0.37} cy={B * fr} rx={0.1} ry={0.3} fill={BONE} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
        </>}
      </>
    )
    return tall ? <g transform={`translate(${W} 0) rotate(90)`}>{inner}</g> : inner
  },
  sofa: (W, H, m) => {
    // Back rest on the north side; long axis along x.
    const s = mkStroke(m)
    const x = 0.12, y = 0.12, w = W - 0.24, h = H - 0.24
    const seats = Math.max(1, Math.round(W - 0.2))
    return (<>
      <rect x={x} y={y} width={w} height={h} rx={0.06} fill={OAK} {...s} />
      {!m.sil && <>
        <rect x={x + 0.12} y={y + 0.22} width={w - 0.24} height={h - 0.22 - 0.04} rx={0.04} fill={BONE} />
        {Array.from({ length: seats - 1 }, (_, i) => {
          const px = x + 0.12 + ((w - 0.24) * (i + 1)) / seats
          return <path key={i} d={`M${px} ${y + 0.22}V${y + h - 0.04}`} stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
        })}
      </>}
    </>)
  },
}

/** Local-box dimensions of the glyph before rotation. */
function canonical(f: Furniture): { W: number; H: number; rot: number } {
  const { w, h } = furnitureFootprint(f)
  const rot = NO_ROTATE.has(f.type) ? 0 : (f.rotation ?? 0)
  const swap = rot === 90 || rot === 270
  return { W: swap ? h : w, H: swap ? w : h, rot }
}

function pieceTransform(f: Furniture): string {
  const { w, h } = furnitureFootprint(f)
  const { W, H, rot } = canonical(f)
  // facing: 0 south, 90 east (counter-clockwise on screen), 180 north, 270 west
  return `translate(${f.col + w / 2} ${f.row + h / 2}) rotate(${-rot}) translate(${-W / 2} ${-H / 2})`
}

export function PieceArt({ f, sw }: { f: Furniture; sw: number }): ReactElement | null {
  const art = ART[f.type] ?? ART.box
  const { W, H } = canonical(f)
  return <g data-furniture={f.type} transform={pieceTransform(f)}>{art(W, H, { sil: false, sw })}</g>
}

/** One lower-right drop shadow, same silhouette, ink @ 0.18, no blur. Rugs cast none. */
export function PieceShadow({ f, sw }: { f: Furniture; sw: number }): ReactElement | null {
  if (f.type === 'rug') return null
  const art = ART[f.type] ?? ART.box
  const { W, H } = canonical(f)
  return (
    <g transform={`translate(${SHADOW_OFFSET} ${SHADOW_OFFSET})`} opacity={A.shadow} style={{ fill: INK }}>
      <g transform={pieceTransform(f)} className="np-sil">{art(W, H, { sil: true, sw })}</g>
    </g>
  )
}
