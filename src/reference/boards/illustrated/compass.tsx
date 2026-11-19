// A small compass rose in the corner where the two numeral strips meet. Clues say "north of" and "columns west of";
// north is up, toward row 1. Purely decorative (the board is aria-hidden and the shell explains directions), drawn
// in px so it keeps its size on every board, and kept clear of every numeral pill: the corner square left of the
// grid and above it holds none (column numerals start half a cell right of the grid, row numerals half a cell below it).
import { compassGeom } from './frame'

export function Compass({ gx, gy, u, font }: { gx: number; gy: number; u: number; font: string }) {
  const { cx, cy, r } = compassGeom(gx, gy, u)
  const cream = '#EFE3C8'
  const k = r / 10.7
  return (
    <g data-layer="compass" data-compass="north" transform={`translate(${cx} ${cy}) scale(${k.toFixed(3)})`} pointerEvents="none">
      <circle r={10.7} fill="#14100d" fillOpacity={0.66} stroke={cream} strokeOpacity={0.6} strokeWidth={0.9} />
      {/* ticks at east, south and west; the north one is the arrow */}
      <path d="M10.7 0h-2.2M0 10.7v-2.2M-10.7 0h2.2" stroke={cream} strokeOpacity={0.55} strokeWidth={0.9} fill="none" />
      {/* the needle: bright north half, dim south half */}
      <path d="M0 -2.4L3 4.6L0 3L-3 4.6Z" fill={cream} />
      <path d="M0 8.2L2.2 4.9L0 5.8L-2.2 4.9Z" fill={cream} fillOpacity={0.4} />
      <text x={0} y={-4.6} textAnchor="middle" fontSize={6.6} fontWeight={700} fontFamily={font} fill={cream}>N</text>
    </g>
  )
}
