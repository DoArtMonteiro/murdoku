import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { CellMark, Puzzle } from '../../core/types'
import { furnitureAt } from '../../core/engine'
import type { BoardLayout } from '../contract'
import type { ReactNode } from 'react'
import type { BoardModule } from './types'
import { fallbackLayout, planGeometry } from './geometry'
import type { PlanGeometry } from './geometry'
import type { ClueTargets } from './clueTargets'
import { Portrait } from './Portrait'
import { SupineChalk } from './SupineChalk'

export interface CellProbe { row: number; col: number }
export interface ConflictLanes { rows: number[]; cols: number[] }

interface PlanProps {
  puzzle: Puzzle
  floor: number
  size: number
  theme: 'light' | 'dark'
  board: BoardModule | null
  marks: CellMark[][]
  selectedPerson: string | null
  conflicts: ReadonlySet<string>
  conflictLanes: ConflictLanes
  targets: ClueTargets
  locked: boolean
  onCell: (row: number, col: number) => void
  onProbe: (cell: CellProbe | null) => void
  /** Drawn between the washes and the numerals/grid (footsteps, chalk, candidate rings). Must be memoised by the caller. */
  under?: (g: PlanGeometry) => ReactNode
  /** Drawn above the hit grid (evidence markers). Must be memoised by the caller. */
  over?: (g: PlanGeometry) => ReactNode
  /** Tokens of these people are drawn faint (reconstruction frames before they are pinned). */
  dim?: ReadonlySet<string>
  /** Person who gets the gold accusation ring (reconstruction conclusion). */
  ringed?: string | null
}

const furnitureWord = (t: string) => t.replace(/([a-z])([A-Z])/g, '$1 $2')

/** Memoised on its own so the 1 s game TICK never re-renders the (possibly 3D) board. */
const BoardLayer = memo(function BoardLayer({ board, puzzle, floor, bw, bh, layout, theme }: {
  board: BoardModule; puzzle: Puzzle; floor: number; bw: number; bh: number; layout: BoardLayout; theme: 'light' | 'dark'
}) {
  const B = board.Board
  return <B puzzle={puzzle} floor={floor} width={bw} height={bh} layout={layout} theme={theme} />
})

/** Optional board overlay (room names): same props as the board, painted above the token layer. */
const LabelsLayer = memo(function LabelsLayer({ board, puzzle, floor, bw, bh, layout, theme }: {
  board: BoardModule; puzzle: Puzzle; floor: number; bw: number; bh: number; layout: BoardLayout; theme: 'light' | 'dark'
}) {
  const L = board.Labels
  return L ? <L puzzle={puzzle} floor={floor} width={bw} height={bh} layout={layout} theme={theme} /> : null
})

/** Chalk cross: bone stroke with a dark under-stroke so it reads on any floor tint. */
function ChalkCross() {
  return (
    <svg className="rs-cross" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M9 10 L31 30 M31 9 L10 31" stroke="#1a1008" strokeOpacity=".6" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <path d="M9 10 L31 30 M31 9 L10 31" stroke="#f1e8ce" strokeWidth="3.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Supine chalk outline under the victim's portrait, clipped to the cell (the svg clips at its own box). */
function ChalkBody() {
  return (
    <svg className="rs-chalk" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-testid="chalk-outline">
      <SupineChalk shadow />
    </svg>
  )
}

/** Row numeral box: right-aligned 0.315u left of the grid, never wider than the margin allows. */
function rowNumStyle(gx: number, u: number, top: number): CSSProperties {
  const right = Math.max(20, gx - 0.2 * u)
  return { left: Math.max(0, right - 20), width: 20, top }
}

function PlanImpl({ puzzle, floor, size, theme, board, marks, selectedPerson, conflicts, conflictLanes, targets, locked, onCell, onProbe, under, over, dim, ringed }: PlanProps) {
  const n = puzzle.size
  const geo = useMemo(() => planGeometry(size, n, board?.boardLayout ?? fallbackLayout), [size, n, board])
  const { layout, gx, gy, gw, gh, ox, oy, bw, bh } = geo
  const { cellW, cellH } = layout
  const u = cellW

  const boardEl = board
    ? <BoardLayer board={board} puzzle={puzzle} floor={floor} bw={bw} bh={bh} layout={layout} theme={theme} />
    : null

  const personById = useMemo(() => new Map(puzzle.people.map(p => [p.id, p])), [puzzle])
  const roomName = useCallback((r: number, c: number) => {
    const id = puzzle.roomOfByFloor?.[floor]?.[r]?.[c] ?? puzzle.roomOf[r]?.[c]
    return puzzle.rooms.find(x => x.id === id)?.name ?? ''
  }, [puzzle, floor])

  // Roving tabindex: exactly one cell is in the tab order.
  const [focus, setFocus] = useState<CellProbe>({ row: 0, col: 0 })
  const [hot, setHot] = useState<CellProbe | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const focusCell = useCallback((row: number, col: number) => {
    setFocus({ row, col })
    gridRef.current?.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`)?.focus()
  }, [])
  const probe = useCallback((p: CellProbe | null) => { setHot(p); onProbe(p) }, [onProbe])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[role="gridcell"]')
    if (!t) return
    const r = Number(t.dataset.row), c = Number(t.dataset.col)
    let nr = r, nc = c
    switch (e.key) {
      case 'ArrowUp': nr = Math.max(0, r - 1); break
      case 'ArrowDown': nr = Math.min(n - 1, r + 1); break
      case 'ArrowLeft': nc = Math.max(0, c - 1); break
      case 'ArrowRight': nc = Math.min(n - 1, c + 1); break
      case 'Home': nc = 0; if (e.ctrlKey) nr = 0; break
      case 'End': nc = n - 1; if (e.ctrlKey) nr = n - 1; break
      case 'Enter': case ' ':
        e.preventDefault(); if (!locked) onCell(r, c); return
      default: return
    }
    e.preventDefault()
    focusCell(nr, nc)
  }

  const idx = useMemo(() => Array.from({ length: n }, (_, i) => i), [n])
  const rowLane = new Set(targets.rows), colLane = new Set(targets.cols)
  const targetCell = new Set(targets.cells.map(([r, c]) => r * 100 + c))
  const hasTargets = rowLane.size + colLane.size + targetCell.size > 0
  const tokenFrac = u < 60 ? 0.84 : 0.78
  const tokenSize = Math.max(26, Math.round(u * tokenFrac))
  const victimSize = Math.max(24, Math.round(u * 0.56))
  const numPx = u < 60 ? 12 : 13

  const frameStyle = { width: geo.size, height: geo.size, '--u': `${u}px` } as CSSProperties
  const activeCol = (c: number) => colLane.has(c) || hot?.col === c
  const activeRow = (r: number) => rowLane.has(r) || hot?.row === r

  return (
    <div className="rs-plan" data-testid="plan-frame" data-u={u} style={frameStyle}>
      <div className="rs-plan-backdrop" aria-hidden="true" style={{ left: ox, top: oy, width: bw, height: bh }} />
      <div className="rs-board" aria-hidden="true" data-testid="board-box" style={{ left: ox, top: oy, width: bw, height: bh }}>
        {boardEl}
      </div>

      {/* Reading-aid washes (never derived from the solution) */}
      {hasTargets && (
        <div className="rs-washes" aria-hidden="true" data-testid="washes">
          {[...rowLane].map(r => (
            <div key={`r${r}`} className="rs-wash rs-wash-lane rs-wash-row" data-lane={`row-${r}`} style={{ left: gx, top: gy + r * cellH, width: gw, height: cellH }} />
          ))}
          {[...colLane].map(c => (
            <div key={`c${c}`} className="rs-wash rs-wash-lane rs-wash-col" data-lane={`col-${c}`} style={{ left: gx + c * cellW, top: gy, width: cellW, height: gh }} />
          ))}
          {targets.cells.map(([r, c]) => (
            <div key={`x${r}-${c}`} className="rs-wash rs-wash-cell" data-lane={`cell-${r}-${c}`} style={{ left: gx + c * cellW, top: gy + r * cellH, width: cellW, height: cellH }} />
          ))}
        </div>
      )}

      {under?.(geo)}

      {/* Conflict: dashed oxblood lane rule along the lane centre */}
      {(conflictLanes.rows.length > 0 || conflictLanes.cols.length > 0) && (
        <svg className="rs-lanerules" aria-hidden="true" width={geo.size} height={geo.size} data-testid="conflict-rules">
          {conflictLanes.rows.map(r => <line key={`r${r}`} x1={gx} x2={gx + gw} y1={gy + (r + .5) * cellH} y2={gy + (r + .5) * cellH} />)}
          {conflictLanes.cols.map(c => <line key={`c${c}`} y1={gy} y2={gy + gh} x1={gx + (c + .5) * cellW} x2={gx + (c + .5) * cellW} />)}
        </svg>
      )}

      {/* Numerals (ink on the paper margin): columns across the top, rows down the left */}
      <div className="rs-numerals" aria-hidden="true" style={{ fontSize: numPx }}>
        {idx.map(c => (
          <span key={`nc${c}`} className="rs-num rs-num-col" data-axis="col" data-n={c + 1}
            style={{ left: gx + c * cellW + cellW / 2 - 10, width: 20, top: Math.max(0, gy - 0.2 * u - 16) }}>{c + 1}</span>
        ))}
        {idx.map(r => (
          <span key={`nr${r}`} className="rs-num rs-num-row" data-axis="row" data-n={r + 1}
            style={rowNumStyle(gx, u, gy + r * cellH + cellH / 2 - 8)}>{r + 1}</span>
        ))}
        {idx.map(c => activeCol(c) && (
          <i key={`mc${c}`} className="rs-lane-mark" data-lane-mark={`col-${c}`} style={{ left: gx + c * cellW + .05 * u, width: .9 * u, top: Math.max(0, gy - 0.2 * u), height: 3 }} />
        ))}
        {idx.map(r => activeRow(r) && (
          <i key={`mr${r}`} className="rs-lane-mark" data-lane-mark={`row-${r}`} style={{ left: Math.max(0, gx - 0.2 * u), width: 3, top: gy + r * cellH + .05 * u, height: .9 * u }} />
        ))}
        {/* counting ticks along the margin edges */}
        {Array.from({ length: n + 1 }, (_, i) => (
          <i key={`tc${i}`} className="rs-tick" style={{ left: gx + i * cellW, top: Math.max(0, gy - 0.1 * u), width: 1, height: .1 * u }} />
        ))}
        {Array.from({ length: n + 1 }, (_, i) => (
          <i key={`tr${i}`} className="rs-tick" style={{ left: Math.max(0, gx - 0.1 * u), top: gy + i * cellH, width: .1 * u, height: 1 }} />
        ))}
      </div>

      <div
        ref={gridRef}
        className="rs-grid"
        role="grid"
        aria-label="Floor plan. Rows run across, columns run down."
        aria-rowcount={n}
        aria-colcount={n}
        aria-readonly={locked || undefined}
        data-testid="plan-grid"
        style={{ left: gx, top: gy, width: gw, height: gh }}
        onKeyDown={onKeyDown}
        onMouseLeave={() => probe(null)}
      >
        {idx.map(r => (
          <div key={r} role="row" aria-rowindex={r + 1} className="rs-row" style={{ height: cellH }}>
            {idx.map(c => {
              const m = marks[r]?.[c] ?? { kind: 'empty' as const }
              const person = m.kind === 'person' ? personById.get(m.person) : undefined
              const furn = furnitureAt(puzzle, r, c, floor)
              const room = roomName(r, c)
              const isFocus = focus.row === r && focus.col === c
              const sel = !!person && person.id === selectedPerson
              const bad = !!person && conflicts.has(person.id)
              const victim = !!person?.isVictim
              const px = victim ? victimSize : tokenSize
              const desc = [
                `Row ${r + 1}, column ${c + 1}`, room, furn.length ? furn.map(furnitureWord).join(', ') : '',
                person ? `${person.name}${victim ? ' (victim)' : ''}${bad ? ', shares a row or column' : ''}` : '',
                m.kind === 'x' ? 'crossed out' : '',
              ].filter(Boolean).join('. ')
              return (
                <div
                  key={c}
                  role="gridcell"
                  aria-colindex={c + 1}
                  aria-label={desc}
                  aria-selected={sel || undefined}
                  tabIndex={isFocus ? 0 : -1}
                  className="rs-cell"
                  data-testid={`cell-${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  data-mark={m.kind}
                  data-person={person?.id}
                  style={{ width: cellW, height: cellH }}
                  onClick={() => { setFocus({ row: r, col: c }); if (!locked) onCell(r, c) }}
                  onMouseEnter={() => probe({ row: r, col: c })}
                  onFocus={() => { setFocus({ row: r, col: c }); probe({ row: r, col: c }) }}
                  onBlur={() => probe(null)}
                >
                  {victim && <ChalkBody />}
                  {person && (
                    <span
                      className={`rs-token ${sel ? 'rs-token-sel' : ''} ${bad ? 'rs-token-bad' : ''} ${victim ? 'rs-token-victim' : ''} ${dim?.has(person.id) ? 'rs-token-dim' : ''} ${ringed === person.id ? 'rs-token-ring' : ''}`}
                      data-testid={`token-${person.id}`}
                      data-size={px}
                      style={{ width: px, height: px }}
                    >
                      <Portrait personId={person.id} size={px - 4} />
                    </span>
                  )}
                  {m.kind === 'x' && <ChalkCross />}
                  {m.kind === 'draft' && (
                    <span className="rs-draft" aria-hidden="true">
                      {m.persons.slice(0, 4).map(pid => (personById.get(pid)?.name ?? '?')[0]).join('')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {board?.Labels && (
        <div className="rs-board-labels" aria-hidden="true" data-testid="board-labels" style={{ left: ox, top: oy, width: bw, height: bh }}>
          <LabelsLayer board={board} puzzle={puzzle} floor={floor} bw={bw} bh={bh} layout={layout} theme={theme} />
        </div>
      )}
      {over?.(geo)}
    </div>
  )
}

export const Plan = memo(PlanImpl)
