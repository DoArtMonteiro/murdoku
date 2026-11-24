// Furniture as cobalt plan-view line icons, one drawing per FurnitureType.
//
// Each piece is drawn in its natural box, long side horizontal, front toward the bottom
// (rotation 0 faces south), then rotated about the centre of its real footprint. The
// rotation convention is the one the generator and the illustrated board already use:
// the drawing is turned by -rotation, so a piece on the left wall (rotation 90) faces east.
// w and h in the data are already the rotated bounding box, so the natural box swaps them
// for a quarter turn. Rotating the w x h box itself is the bug class fixed in 69453e7.
import type { JSX } from 'react'
import type { Furniture, FurnitureType } from '../../core/types'
import { furnitureFootprint } from '../../core/types'

export const CELL = 100
const INSET = 13

const n = (v: number) => Math.round(v * 100) / 100

type Draw = (W: number, H: number) => JSX.Element

/** Rounded body: cal fill so it reads over the tile pattern, cobalt outline. */
const body = (x: number, y: number, w: number, h: number, rx = 6) => (
  <rect className="lf" x={n(x)} y={n(y)} width={n(w)} height={n(h)} rx={n(rx)} />
)

const DRAW: Record<FurnitureType, Draw> = {
  chair: (W, H) => (
    <>
      {body(W * 0.1, H * 0.3, W * 0.8, H * 0.66, 8)}
      {body(W * 0.06, H * 0.02, W * 0.88, H * 0.22, 6)}
    </>
  ),
  sofa: (W, H) => {
    const cushions = Math.max(2, Math.round(W / 70))
    const inner = W - W * 0.2
    const seams = Array.from({ length: cushions - 1 }, (_, i) => W * 0.1 + (inner * (i + 1)) / cushions)
    return (
      <>
        {body(0, 0, W, H, 10)}
        {body(0, 0, W, H * 0.3, 8)}
        {body(0, H * 0.18, W * 0.1, H * 0.82, 6)}
        {body(W * 0.9, H * 0.18, W * 0.1, H * 0.82, 6)}
        <path className="ln" d={seams.map(x => `M${n(x)} ${n(H * 0.34)}V${n(H * 0.94)}`).join('')} />
      </>
    )
  },
  bed: (W, H) => {
    const two = W > 110
    const pw = two ? W * 0.36 : W * 0.7
    return (
      <>
        {body(0, 0, W, H, 8)}
        {two ? (
          <>
            {body(W * 0.1, H * 0.07, pw, H * 0.2, 6)}
            {body(W * 0.54, H * 0.07, pw, H * 0.2, 6)}
          </>
        ) : body(W * 0.15, H * 0.07, pw, H * 0.2, 6)}
        <path className="ln" d={`M0 ${n(H * 0.4)}H${n(W)}`} />
        <path className="ln" d={`M${n(W * 0.12)} ${n(H * 0.62)}Q${n(W * 0.5)} ${n(H * 0.7)} ${n(W * 0.88)} ${n(H * 0.62)}`} />
      </>
    )
  },
  table: (W, H) => {
    const round = Math.abs(W - H) < 4
    const r = Math.min(W, H) / 2
    return round ? (
      <>
        <circle className="lf" cx={n(W / 2)} cy={n(H / 2)} r={n(r)} />
        <circle className="ln" cx={n(W / 2)} cy={n(H / 2)} r={n(r * 0.66)} />
      </>
    ) : (
      <>
        {body(0, H * 0.08, W, H * 0.84, 9)}
        <rect className="ln" x={n(W * 0.07)} y={n(H * 0.2)} width={n(W * 0.86)} height={n(H * 0.6)} rx="5" />
      </>
    )
  },
  box: (W, H) => (
    <>
      {body(0, 0, W, H, 3)}
      <rect className="ln" x={n(W * 0.16)} y={n(H * 0.16)} width={n(W * 0.68)} height={n(H * 0.68)} rx="2" />
      <path className="ln" d={`M0 0L${n(W * 0.16)} ${n(H * 0.16)}M${n(W)} 0L${n(W * 0.84)} ${n(H * 0.16)}M0 ${n(H)}L${n(W * 0.16)} ${n(H * 0.84)}M${n(W)} ${n(H)}L${n(W * 0.84)} ${n(H * 0.84)}`} />
    </>
  ),
  rug: (W, H) => {
    const fringe: string[] = []
    for (let y = 12; y < H - 6; y += 14) fringe.push(`M-7 ${n(y)}H0M${n(W)} ${n(y)}H${n(W + 7)}`)
    return (
      <>
        <rect className="ln" x="0" y="0" width={n(W)} height={n(H)} rx="4" />
        <rect className="ln" x="9" y="9" width={n(W - 18)} height={n(H - 18)} rx="2" />
        <path className="ln" d={`M${n(W / 2)} ${n(H * 0.3)}L${n(W * 0.62)} ${n(H / 2)}L${n(W / 2)} ${n(H * 0.7)}L${n(W * 0.38)} ${n(H / 2)}Z`} />
        <path className="ln" d={fringe.join('')} />
      </>
    )
  },
  plant: (W, H) => {
    const s = Math.min(W, H)
    return (
      <g transform={`translate(${n(W / 2)} ${n(H / 2)})`}>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <ellipse key={a} className="lf" cx="0" cy={n(-s * 0.27)} rx={n(s * 0.11)} ry={n(s * 0.22)} transform={`rotate(${a})`} />
        ))}
        <circle className="lf" r={n(s * 0.13)} />
      </g>
    )
  },
  shrub: (W, H) => {
    const s = Math.min(W, H)
    const bumps = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
    return (
      <g transform={`translate(${n(W / 2)} ${n(H / 2)})`}>
        {bumps.map(a => (
          <circle key={a} className="lf" cx={n(Math.cos(a) * s * 0.3)} cy={n(Math.sin(a) * s * 0.3)} r={n(s * 0.17)} />
        ))}
        <circle className="lf-bare" r={n(s * 0.31)} />
        <path className="ln" d={`M${n(-s * 0.14)} ${n(s * 0.04)}Q0 ${n(-s * 0.12)} ${n(s * 0.14)} ${n(s * 0.04)}M${n(-s * 0.05)} ${n(s * 0.16)}Q${n(s * 0.04)} ${n(s * 0.08)} ${n(s * 0.13)} ${n(s * 0.18)}`} />
      </g>
    )
  },
  lamp: (W, H) => {
    const s = Math.min(W, H)
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4
      return `M${n(Math.cos(a) * s * 0.36)} ${n(Math.sin(a) * s * 0.36)}L${n(Math.cos(a) * s * 0.48)} ${n(Math.sin(a) * s * 0.48)}`
    })
    return (
      <g transform={`translate(${n(W / 2)} ${n(H / 2)})`}>
        <circle className="lf" r={n(s * 0.28)} />
        <circle className="ln" r={n(s * 0.11)} />
        <path className="ln" d={rays.join('')} />
      </g>
    )
  },
  counter: (W, H) => {
    const sw = Math.min(W * 0.3, 70)
    return (
      <>
        {body(0, 0, W, H, 4)}
        <rect className="ln" x={n(W * 0.14)} y={n(H * 0.26)} width={n(sw)} height={n(H * 0.56)} rx="7" />
        <circle className="ln" cx={n(W * 0.14 + sw / 2)} cy={n(H * 0.14)} r="3.5" />
        <path className="ln" d={`M${n(W * 0.62)} ${n(H * 0.3)}H${n(W * 0.9)}M${n(W * 0.62)} ${n(H * 0.5)}H${n(W * 0.9)}M${n(W * 0.62)} ${n(H * 0.7)}H${n(W * 0.9)}`} />
      </>
    )
  },
  tv: (W, H) => (
    <>
      {body(0, H * 0.4, W, H * 0.6, 5)}
      <rect className="lf" x={n(W * 0.06)} y={n(H * 0.02)} width={n(W * 0.88)} height={n(H * 0.32)} rx="4" />
      <path className="ln" d={`M${n(W * 0.16)} ${n(H * 0.28)}L${n(W * 0.3)} ${n(H * 0.08)}M${n(W * 0.4)} ${n(H * 0.7)}H${n(W * 0.6)}`} />
    </>
  ),
  bathtub: (W, H) => (
    <>
      {body(0, 0, W, H, Math.min(H * 0.42, 28))}
      <rect className="ln" x="10" y="10" width={n(W - 20)} height={n(H - 20)} rx={n(Math.min(H * 0.34, 22))} />
      <circle className="ln" cx={n(W - 22)} cy={n(H / 2)} r="3.5" />
      <path className="ln" d={`M18 ${n(H * 0.3)}V${n(H * 0.7)}`} />
    </>
  ),
  bookshelf: (W, H) => {
    const books: string[] = []
    const top = H * 0.08
    const bottom = H * 0.54
    for (let x = 8, i = 0; x < W - 6; x += 10, i++) books.push(`M${n(x)} ${n(top + 5 + (i % 3) * 3)}V${n(bottom - 5)}`)
    return (
      <>
        {body(0, top, W, bottom - top, 3)}
        <path className="ln" d={books.join('')} />
      </>
    )
  },
  stove: (W, H) => {
    const r = Math.min(W, H) * 0.15
    return (
      <>
        {body(0, 0, W, H, 5)}
        {[[0.28, 0.3], [0.72, 0.3], [0.28, 0.7], [0.72, 0.7]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle className="ln" cx={n(W * x)} cy={n(H * y)} r={n(r)} />
            <circle className="ln" cx={n(W * x)} cy={n(H * y)} r={n(r * 0.45)} />
          </g>
        ))}
      </>
    )
  },
  fridge: (W, H) => (
    <>
      {body(0, 0, W, H, 4)}
      <path className="ln" d={`M0 ${n(H * 0.36)}H${n(W)}`} />
      <path className="ln-heavy" d={`M${n(W * 0.8)} ${n(H * 0.1)}V${n(H * 0.26)}M${n(W * 0.8)} ${n(H * 0.5)}V${n(H * 0.76)}`} />
    </>
  ),
  clock: (W, H) => {
    const r = Math.min(W, H) * 0.46
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6
      const inner = r * (i % 3 === 0 ? 0.74 : 0.84)
      return `M${n(Math.sin(a) * inner)} ${n(-Math.cos(a) * inner)}L${n(Math.sin(a) * r * 0.94)} ${n(-Math.cos(a) * r * 0.94)}`
    })
    return (
      <g transform={`translate(${n(W / 2)} ${n(H / 2)})`}>
        <circle className="lf" r={n(r)} />
        <path className="ln" d={ticks.join('')} />
        <path className="ln-heavy" d={`M0 0V${n(-r * 0.6)}M0 0L${n(r * 0.36)} ${n(r * 0.2)}`} />
      </g>
    )
  },
  desk: (W, H) => (
    <>
      {body(0, 0, W, H, 3)}
      <rect className="ln" x={n(W * 0.08)} y={n(H * 0.2)} width={n(W * 0.5)} height={n(H * 0.56)} rx="2" />
      <path className="ln" d={`M${n(W * 0.66)} 0V${n(H)}M${n(W * 0.66)} ${n(H * 0.5)}H${n(W)}`} />
      <circle className="lf-fill" cx={n(W * 0.83)} cy={n(H * 0.25)} r="2.6" />
      <circle className="lf-fill" cx={n(W * 0.83)} cy={n(H * 0.75)} r="2.6" />
    </>
  ),
  toilet: (W, H) => (
    <>
      {body(W * 0.2, 0, W * 0.6, H * 0.28, 4)}
      <ellipse className="lf" cx={n(W / 2)} cy={n(H * 0.64)} rx={n(W * 0.3)} ry={n(H * 0.33)} />
      <ellipse className="ln" cx={n(W / 2)} cy={n(H * 0.66)} rx={n(W * 0.18)} ry={n(H * 0.2)} />
    </>
  ),
  shower: (W, H) => (
    <>
      {body(0, 0, W, H, 4)}
      <rect className="ln" x="9" y="9" width={n(W - 18)} height={n(H - 18)} rx="2" />
      <circle className="ln" cx={n(W * 0.3)} cy={n(H * 0.3)} r={n(Math.min(W, H) * 0.1)} />
      <path className="ln" d={`M${n(W * 0.46)} ${n(H * 0.42)}L${n(W * 0.58)} ${n(H * 0.52)}M${n(W * 0.4)} ${n(H * 0.54)}L${n(W * 0.5)} ${n(H * 0.66)}M${n(W * 0.54)} ${n(H * 0.32)}L${n(W * 0.68)} ${n(H * 0.4)}`} />
      <circle className="lf-fill" cx={n(W * 0.68)} cy={n(H * 0.68)} r="2.8" />
    </>
  ),
}

/** Footprint-aware, rotated piece. `data-furniture` marks it for tests and for the gallery. */
export function FurniturePiece({ f }: { f: Furniture }): JSX.Element {
  const { w, h } = furnitureFootprint(f)
  const rot = f.rotation ?? 0
  const quarter = rot === 90 || rot === 270
  // natural box: a quarter turn swaps the footprint back
  const cw = (quarter ? h : w) * CELL
  const ch = (quarter ? w : h) * CELL
  const cx = (f.col + w / 2) * CELL
  const cy = (f.row + h / 2) * CELL
  return (
    <g
      className="lp-furn"
      data-furniture={f.type}
      transform={`translate(${n(cx)} ${n(cy)}) rotate(${-rot}) translate(${n(-cw / 2 + INSET)} ${n(-ch / 2 + INSET)})`}
    >
      {DRAW[f.type](cw - INSET * 2, ch - INSET * 2)}
    </g>
  )
}

/** Names a screen reader reads, and the gallery shows. */
export const FURNITURE_LABEL: Record<FurnitureType, string> = {
  chair: 'chair', sofa: 'sofa', bed: 'bed', table: 'table', box: 'box', rug: 'rug',
  plant: 'plant', shrub: 'shrub', lamp: 'lamp', counter: 'counter', tv: 'TV', bathtub: 'bathtub',
  bookshelf: 'bookshelf', stove: 'stove', fridge: 'fridge', clock: 'clock', desk: 'desk',
  toilet: 'toilet', shower: 'shower',
}
