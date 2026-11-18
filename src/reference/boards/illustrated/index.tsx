// ============================================================================
// R2 "Rich Illustrated Floor Plan". A painted top-down house at night inside a
// lot of lawn, hedge, path and trees, drawn as one SVG. The board stays an
// axis-aligned plan: cell (r,c) is exactly the rectangle boardLayout() gives,
// so the shell's numerals, tokens, washes and hit grid line up unchanged.
//
// Geometry (all from boardLayout): the lot of lawn runs on every side of the
// sheet, including the numeral strip above and left of the grid (the shell sets
// its numeral pills there). The strip is the same garden; only a feathered shade
// (<= 12%) is drawn behind the pills, no panel and no edge.
//
// Purely visual: aria-hidden, no handlers, no network, deterministic for a
// given (puzzle, floor, size). Theme is accepted; the painting is a night scene
// in both themes.
// ============================================================================
import { memo, useMemo } from 'react'
import type { BoardLayout, BoardProps } from '../../contract'
import { frameFor } from './frame'
import { getScene } from './scene'
import { styleFor } from './styles'

export function boardLayout(width: number, height: number, n: number): BoardLayout {
  const fr = frameFor(width, height, n)
  return { x0: fr.sx + fr.m, y0: fr.sy + fr.m, cellW: fr.u, cellH: fr.u }
}

function BoardImpl({ puzzle, floor, width: w0, height: h0, layout }: BoardProps) {
  const width = Math.max(0, w0), height = Math.max(0, h0)
  const u = layout.cellW
  const n = puzzle.size
  const st = useMemo(() => styleFor(puzzle), [puzzle])
  const scene = useMemo(
    () => getScene({ puzzle, floor, width, height, x0: layout.x0, y0: layout.y0, u }),
    [puzzle, floor, width, height, layout.x0, layout.y0, u],
  )

  const { reg, fr, garden, house, vig, grain } = scene
  const gx = layout.x0, gy = layout.y0
  const wallPx = Math.ceil(0.135 * u) + 1
  const gutLen = n * u
  return (
    <div aria-hidden="true" data-board="illustrated" data-style={st.id} style={{ position: 'relative', width, height, pointerEvents: 'none' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} focusable="false">
        <defs>{reg.defs}</defs>
        <g transform={`translate(${gx} ${gy}) scale(${u})`}>
          {garden.base}
          <g transform="translate(0.1 0.13)" fill="#000" stroke="#000" strokeLinejoin="round">
            <g strokeWidth={0.22} opacity={0.06}>{garden.shadow}</g><g strokeWidth={0.14} opacity={0.08}>{garden.shadow}</g><g strokeWidth={0.07} opacity={0.1}>{garden.shadow}</g><g opacity={0.12}>{garden.shadow}</g>
          </g>
          {garden.light}
        </g>
        <rect x={0} y={0} width={width} height={height} fill={reg.url(vig)} />
        <g transform={`translate(${gx} ${gy}) scale(${u})`}>{house.node}</g>
        {/* one grain pass over the whole painting (a small tile, rasterised once) */}
        <rect x={0} y={0} width={width} height={height} fill={reg.url(grain)} opacity={u < 56 ? 0.6 : 1} />
        {/* numeral strip: the garden continues under the shell's numeral pills; only a soft feathered darkening (<= 12%) sits behind them */}
        <g data-layer="gutter">
          <rect x={gx - fr.gut} y={gy - fr.gut} width={gutLen + fr.gut + wallPx} height={fr.gut - wallPx} fill={scene.gutTop} />
          <rect x={gx - fr.gut} y={gy} width={fr.gut - wallPx} height={gutLen + wallPx} fill={scene.gutLeft} />
        </g>
      </svg>
    </div>
  )
}

const Board = memo(BoardImpl)
export default Board

/**
 * Room-name overlay. The shell paints it in a layer ABOVE the token layer (and below dialogs, aria-hidden,
 * pointer-events none), so a name is never hidden by a portrait. Same geometry and scene cache as the board.
 */
export const BoardLabels = memo(function BoardLabels({ puzzle, floor, width: w0, height: h0, layout }: BoardProps) {
  const width = Math.max(0, w0), height = Math.max(0, h0)
  const u = layout.cellW
  const scene = useMemo(
    () => getScene({ puzzle, floor, width, height, x0: layout.x0, y0: layout.y0, u }),
    [puzzle, floor, width, height, layout.x0, layout.y0, u],
  )
  return (
    <div aria-hidden="true" data-board-labels="illustrated" style={{ position: 'relative', width, height, pointerEvents: 'none' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} focusable="false">
        <g transform={`translate(${layout.x0} ${layout.y0}) scale(${u})`}>{scene.labels}</g>
      </svg>
    </div>
  )
})
