// The collision crack: an almagre hairline across a tile, drawn in as it appears.
// Almagre means contradiction and nothing else. The cal halo under the line keeps it
// readable over a token, a pattern or a glaze. Three shapes, picked per tile.
import type { JSX } from 'react'

const CRACKS = [
  'M18 6L34 28L26 40L46 58L40 70L62 90L70 96M46 58L66 56L74 66',
  'M94 14L72 30L78 44L56 52L60 66L38 80L30 94M56 52L40 44',
  'M6 62L26 56L34 68L52 60L60 76L84 70L96 82M52 60L58 40L72 30',
]

export function Crack({ variant }: { variant: number }): JSX.Element {
  const d = CRACKS[variant % CRACKS.length]
  return (
    <g className="lp-crack">
      <path className="lp-crack-halo" d={d} />
      <path className="lp-crack-line" d={d} pathLength={1} />
    </g>
  )
}
