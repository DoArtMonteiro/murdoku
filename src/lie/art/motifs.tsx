// Four azulejo motifs, one per room, drawn inside a single 100 x 100 tile. They are
// repeated per tile (no <pattern> or ids, so nothing to collide between boards) and kept
// to a low-contrast cobalt hairline so a token on top stays the loudest thing on the tile.
import type { JSX } from 'react'
import type { MotifKind } from './plan'

const quarter = (
  <>
    <path d="M30 0A30 30 0 0 1 0 30" />
    <path d="M16 0A16 16 0 0 1 0 16" />
    <path d="M0 0L21 21" />
    <circle cx="9" cy="9" r="2" />
  </>
)

export function Motif({ kind }: { kind: MotifKind }): JSX.Element {
  switch (kind) {
    case 0: // quatrefoil: four lobes round a bud, dots in the corners
      return (
        <g className="lp-motif">
          <circle cx="50" cy="37" r="12" />
          <circle cx="63" cy="50" r="12" />
          <circle cx="50" cy="63" r="12" />
          <circle cx="37" cy="50" r="12" />
          <circle cx="50" cy="50" r="4" />
          <circle className="lp-motif-dot" cx="10" cy="10" r="2.6" />
          <circle className="lp-motif-dot" cx="90" cy="10" r="2.6" />
          <circle className="lp-motif-dot" cx="10" cy="90" r="2.6" />
          <circle className="lp-motif-dot" cx="90" cy="90" r="2.6" />
        </g>
      )
    case 1: // diagonal lattice: edge midpoints joined, a smaller diamond inside
      return (
        <g className="lp-motif">
          <path d="M50 0L100 50L50 100L0 50Z" />
          <path d="M50 22L78 50L50 78L22 50Z" />
          <circle cx="50" cy="50" r="4" />
          <circle className="lp-motif-dot" cx="0" cy="0" r="3" />
          <circle className="lp-motif-dot" cx="100" cy="0" r="3" />
          <circle className="lp-motif-dot" cx="0" cy="100" r="3" />
          <circle className="lp-motif-dot" cx="100" cy="100" r="3" />
        </g>
      )
    case 2: // rosette corner: a quarter-rosette in every corner, four tiles make one whole
      return (
        <g className="lp-motif">
          {quarter}
          <g transform="translate(100 0) scale(-1 1)">{quarter}</g>
          <g transform="translate(0 100) scale(1 -1)">{quarter}</g>
          <g transform="translate(100 100) scale(-1 -1)">{quarter}</g>
        </g>
      )
    default: // plain limewash with a double border
      return (
        <g className="lp-motif">
          <rect x="9" y="9" width="82" height="82" rx="3" />
          <rect x="15" y="15" width="70" height="70" rx="1.5" />
          <circle cx="50" cy="50" r="2.4" />
        </g>
      )
  }
}
