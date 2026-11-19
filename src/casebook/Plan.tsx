import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { Cell, Person, Puzzle } from '../core/types'
import { furnitureAt } from '../core/engine'
import { fallbackLayout } from '../reference/shell/geometry'
import type { BoardModule } from './board'
import { cellKey, floorWord, roomNameAt } from './cells'
import type { Placement } from './cells'
import { fitPlan } from './layout'
import { Portrait } from './Portrait'

export interface PlanProps {
  puzzle: Puzzle
  floor: number
  theme: 'light' | 'dark'
  board: BoardModule | null
  avail: { w: number; h: number }
  placement: Placement
  selected: string
  /** People sharing a row or column with someone: red pencil. */
  conflicts: ReadonlySet<string>
  /** Cells where every lit statement holds, or null when the lens is off. */
  lens: ReadonlySet<string> | null
  /** Pencil crosses of the selected suspect. */
  crosses: ReadonlySet<string>
  /** Supposition: the ghost, its lanes, and the selected suspect's remaining squares. */
  ghost: { person: string; cell: Cell } | null
  remaining: ReadonlySet<string> | null
  interactive: boolean
  onCell: (cell: Cell) => void
  onLong: (cell: Cell) => void
  /** Replay: the person to ring in red pencil, and the one still flying in. */
  ringed?: string | null
  flying?: string | null
  dimmed?: ReadonlySet<string>
}

const LONG_MS = 420
const furnitureWord = (t: string) => t.replace(/([a-z])([A-Z])/g, '$1 $2')

interface CellProps {
  r: number; c: number; floor: number; u: number
  label: string
  focused: boolean
  lens: 'lit' | 'dim' | undefined
  lane: boolean
  ring: boolean
  cross: boolean
  token: { person: Person; size: number; selected: boolean; bad: boolean; ringed: boolean; flying: boolean; dim: boolean } | null
  ghost: { person: Person; size: number } | null
  interactive: boolean
  onTap: (r: number, c: number) => void
  onLong: (r: number, c: number) => void
}

const GridCell = memo(function GridCell(p: CellProps) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const clear = () => { window.clearTimeout(timer.current); timer.current = undefined }
  return (
    <div
      role="gridcell"
      aria-colindex={p.c + 1}
      aria-label={p.label}
      aria-selected={p.token?.selected || undefined}
      tabIndex={p.focused ? 0 : -1}
      className="cb-cell"
      data-row={p.r}
      data-col={p.c}
      data-floor={p.floor}
      data-lens={p.lens}
      data-lane={p.lane || undefined}
      data-person={p.token?.person.id}
      style={{ width: p.u, height: p.u }}
      onPointerDown={e => {
        if (!p.interactive) return
        fired.current = false
        start.current = { x: e.clientX, y: e.clientY }
        clear()
        timer.current = window.setTimeout(() => { fired.current = true; p.onLong(p.r, p.c) }, LONG_MS)
      }}
      onPointerMove={e => {
        if (timer.current !== undefined && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) clear()
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={e => e.preventDefault()}
      onClick={() => {
        if (fired.current) { fired.current = false; return }
        if (p.interactive) p.onTap(p.r, p.c)
      }}
    >
      {p.ring && <i className="cb-ring" aria-hidden="true" />}
      {p.cross && <i className="cb-cross" aria-hidden="true">{'✕'}</i>}
      {p.ghost && (
        <span className="cb-token cb-ghost" style={{ width: p.ghost.size, height: p.ghost.size }}>
          <Portrait person={p.ghost.person} size={p.ghost.size - 4} />
        </span>
      )}
      {p.token && (
        <span
          className="cb-token"
          data-selected={p.token.selected || undefined}
          data-bad={p.token.bad || undefined}
          data-victim={p.token.person.isVictim || undefined}
          data-ringed={p.token.ringed || undefined}
          data-flying={p.token.flying || undefined}
          data-dim={p.token.dim || undefined}
          data-testid={`token-${p.token.person.id}`}
          style={{ width: p.token.size, height: p.token.size }}
        >
          <Portrait person={p.token.person} size={p.token.size - 4} />
          <b className="cb-initial" aria-hidden="true">{p.token.person.name.charAt(0)}</b>
          {p.token.bad && (
            <svg className="cb-clash" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
              <path d="M5 21 C4 9 17 3 27 6 C37 10 38 25 29 33 C20 40 7 34 6 24" />
            </svg>
          )}
        </span>
      )}
    </div>
  )
})

function PlanImpl(props: PlanProps) {
  const { puzzle, floor, theme, board, avail, placement, selected, conflicts, lens, crosses, ghost, remaining, interactive } = props
  const n = puzzle.size
  const fit = useMemo(() => fitPlan(avail.w, avail.h, n, board?.boardLayout ?? fallbackLayout), [avail.w, avail.h, n, board])
  const { geo } = fit
  const { layout, gx, gy, ox, oy, bw, bh } = geo
  const u = layout.cellW

  const byId = useMemo(() => new Map(puzzle.people.map(p => [p.id, p])), [puzzle])
  const [focus, setFocus] = useState({ r: 0, c: 0 })
  const gridRef = useRef<HTMLDivElement>(null)
  const { onCell, onLong } = props
  const tap = useCallback((r: number, c: number) => { setFocus({ r, c }); onCell({ row: r, col: c, floor }) }, [onCell, floor])
  const long = useCallback((r: number, c: number) => { setFocus({ r, c }); onLong({ row: r, col: c, floor }) }, [onLong, floor])

  const here = useMemo(() => {
    const m = new Map<string, string>()
    for (const [id, cell] of Object.entries(placement)) if ((cell.floor ?? 0) === floor) m.set(`${cell.row}:${cell.col}`, id)
    return m
  }, [placement, floor])

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[role="gridcell"]')
    if (!t) return
    const r = Number(t.dataset.row), c = Number(t.dataset.col)
    let nr = r, nc = c
    switch (e.key) {
      case 'ArrowUp': nr = Math.max(0, r - 1); break
      case 'ArrowDown': nr = Math.min(n - 1, r + 1); break
      case 'ArrowLeft': nc = Math.max(0, c - 1); break
      case 'ArrowRight': nc = Math.min(n - 1, c + 1); break
      case 'Enter': case ' ': e.preventDefault(); if (interactive) tap(r, c); return
      case 's': case 'S': e.preventDefault(); if (interactive) long(r, c); return
      default: return
    }
    e.preventDefault()
    setFocus({ r: nr, c: nc })
    gridRef.current?.querySelector<HTMLElement>(`[data-row="${nr}"][data-col="${nc}"]`)?.focus()
  }

  const tokenSize = Math.max(26, Math.round(u * 0.84))
  const idx = useMemo(() => Array.from({ length: n }, (_, i) => i), [n])
  const ghostPerson = ghost ? byId.get(ghost.person) : undefined
  const fw = floorWord(puzzle, floor)

  const label = (r: number, c: number, who: Person | undefined, lensState: 'lit' | 'dim' | undefined, ghostHere: boolean, cross: boolean) => {
    const cell = { row: r, col: c, floor }
    const furn = furnitureAt(puzzle, r, c, floor).map(furnitureWord)
    return [
      `Row ${r + 1}, column ${c + 1}`, fw, roomNameAt(puzzle, cell), furn.join(', '),
      who ? `${who.name}${who.isVictim ? ' (victim)' : ''}${conflicts.has(who.id) ? ', shares a row or column' : ''}` : 'empty',
      ghostHere ? 'supposed here' : '', cross ? 'crossed out' : '',
      lensState === 'lit' ? 'lens: lit' : lensState === 'dim' ? 'lens: not lit' : '',
    ].filter(Boolean).join('. ')
  }

  const sel = byId.get(selected)
  const frame = { width: fit.size, height: fit.size, left: -fit.cropL, top: -fit.cropT, '--u': `${u}px` } as CSSProperties
  const BoardC = board?.Board, Labels = board?.Labels
  const lbl = board ? { puzzle, floor, width: bw, height: bh, layout, theme } : null

  return (
    <div className="cb-plan-wrap" style={{ width: fit.visW, height: fit.visH }} data-testid="plan" data-cell={u}>
      <div className="cb-plan" style={frame}>
        <div className="cb-board" aria-hidden="true" style={{ left: ox, top: oy, width: bw, height: bh }}>
          {BoardC && lbl && <BoardC {...lbl} />}
        </div>
        <div className="cb-numerals" aria-hidden="true">
          {idx.map(c => <span key={`c${c}`} className="cb-num" style={{ left: gx + c * u + u / 2 - 10, top: Math.max(0, gy - 0.2 * u - 16) }}>{c + 1}</span>)}
          {idx.map(r => <span key={`r${r}`} className="cb-num" style={{ left: Math.max(0, gx - 0.2 * u - 22), top: gy + r * u + u / 2 - 8 }}>{r + 1}</span>)}
        </div>
        <div
          ref={gridRef} className="cb-grid" role="grid" aria-label={`Floor plan${fw ? `, ${fw}` : ''}. Rows run across, columns run down.`}
          aria-rowcount={n} aria-colcount={n} aria-readonly={!interactive || undefined}
          style={{ left: gx, top: gy, width: u * n, height: u * n }} onKeyDown={onKey} data-testid="grid"
        >
          {idx.map(r => (
            <div key={r} role="row" aria-rowindex={r + 1} className="cb-row">
              {idx.map(c => {
                const id = here.get(`${r}:${c}`)
                const who = id ? byId.get(id) : undefined
                const key = cellKey({ row: r, col: c, floor })
                const lensState = lens ? (lens.has(key) ? 'lit' as const : 'dim' as const) : undefined
                const ghostHere = !!ghost && (ghost.cell.floor ?? 0) === floor && ghost.cell.row === r && ghost.cell.col === c
                const cross = crosses.has(key)
                return (
                  <GridCell
                    key={c} r={r} c={c} floor={floor} u={u}
                    label={label(r, c, who, lensState, ghostHere, cross)}
                    focused={focus.r === r && focus.c === c}
                    lens={lensState}
                    lane={!!ghost && (ghost.cell.row === r || ghost.cell.col === c)}
                    ring={!!remaining?.has(key) && !who}
                    cross={cross}
                    token={who ? {
                      person: who, size: who.isVictim ? Math.round(tokenSize * 0.9) : tokenSize, selected: who.id === selected,
                      bad: conflicts.has(who.id), ringed: props.ringed === who.id, flying: props.flying === who.id, dim: !!props.dimmed?.has(who.id),
                    } : null}
                    ghost={ghostHere && ghostPerson ? { person: ghostPerson, size: tokenSize } : null}
                    interactive={interactive}
                    onTap={tap} onLong={long}
                  />
                )
              })}
            </div>
          ))}
        </div>
        {Labels && lbl && (
          <div className="cb-labels" aria-hidden="true" style={{ left: ox, top: oy, width: bw, height: bh }}><Labels {...lbl} /></div>
        )}
        <span className="cb-sr">{sel ? `${sel.name} selected` : ''}</span>
      </div>
    </div>
  )
}

export const Plan = memo(PlanImpl)
