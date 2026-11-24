// The board: a Portuguese house plan laid in azulejo. One responsive SVG, one tile per cell,
// cobalt grout, ink walls on the room boundaries, doors, plaques, furniture and tokens.
//
// CSP: style-src 'self'. No <style>, no inline style attributes, no <pattern>/<filter> ids.
// Every look is a class in art.css; the glaze stagger is a data-d bucket, not a style prop.
// This renderer draws floor 0 (the one floor a case of this mode has).
import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX, KeyboardEvent, PointerEvent } from 'react'
import type { Cell, Puzzle } from '../../core/types'
import type { EmblemId } from '../model'
import { EMBLEM_BOX, EmblemTile } from './emblems'
import { FURNITURE_LABEL, FurniturePiece } from './furniture'
import { Crack } from './Crack'
import { Motif } from './motifs'
import { deepTint } from './palette'
import { PAD, TOKEN_TOP, U, furnitureByCell, groundFurniture, hash, keyOf, roomLabels, roomMotifs, wallPaths } from './plan'
import './art.css'

export interface TilePlanProps {
  puzzle: Puzzle
  /** `accent` tints the token (a hex); absent, the puzzle's own person accent is used. */
  people: Record<string, { name: string; emblem: EmblemId; accent?: string }>
  tokens: Record<string, Cell>
  victimId: string
  selectedPerson?: string | null
  /** keys `${row},${col}`: ochre glaze (where a statement can hold) */
  lit?: ReadonlySet<string>
  /** tiles excluded by occupied rows/columns: a faint diagonal hatch (no fill). Prefer `sightlines`. */
  blocked?: ReadonlySet<string>
  /** keys of placed people: their whole row and column are drawn as cobalt hairlines */
  sightlines?: ReadonlySet<string>
  /** tiles washed with the warm room tint (the murder room, in the reveal) */
  tint?: ReadonlySet<string>
  /** person whose token pulses once */
  pulse?: string | null
  /** tiles involved in a collision: almagre hairline crack overlay */
  collision?: ReadonlySet<string>
  /** translucent token (a supposition) */
  ghost?: { person: string; cell: Cell } | null
  /** person whose token is lifting off (the caught liar): animate up + fade */
  lifted?: string | null
  /** after solve: almagre ring on that token */
  murderer?: string | null
  onTile?: (cell: Cell) => void
  /** long-press ~450ms (pointer events); not fired if the pointer moved */
  onTileHold?: (cell: Cell) => void
  className?: string
}

export const cellKey = (c: { row: number; col: number }) => `${c.row},${c.col}`

const HOLD_MS = 450
const MOVE_SLOP = 8
const EMPTY: ReadonlySet<string> = new Set()
// the ruled-out hatch: five diagonals across one tile, drawn as a single path
const HATCH = 'M0 34L34 0M0 68L68 0M0 100L100 0M32 100L100 32M66 100L100 66'

// token geometry inside a 100-unit tile: below TOKEN_TOP, so a plaque along the top edge stays clear
const TS = 60
const TX = (U - TS) / 2
const TY = TOKEN_TOP
const TOKEN_TRANSFORM = `translate(${TX} ${TY}) scale(${TS / EMBLEM_BOX})`

/** The victim: a dark tile with a chalk outline of a body. Distinct at a glance, nothing gory. */
function VictimTile(): JSX.Element {
  return (
    <>
      <rect className="lp-victim-ground" x="1.2" y="1.2" width="45.6" height="45.6" rx="4.5" />
      <g className="lp-victim-chalk">
        <circle cx="13.5" cy="24" r="4.4" />
        <rect x="19.5" y="19" width="13.5" height="10" rx="3.6" />
        <path d="M33 22L39.5 20L40.5 13.5M33 27L40 29.5L41 36M24 19L20.5 12.5M24 29L19.5 35.5" />
      </g>
    </>
  )
}

function Token({ person, emblem, tint, victim, ghost, selected, murderer, lifted, pulse }: {
  person: string
  emblem: EmblemId | null
  /** deep tint (hex) of a suspect's token */
  tint: string
  victim: boolean
  ghost?: boolean
  selected?: boolean
  murderer?: boolean
  lifted?: boolean
  pulse?: boolean
}): JSX.Element {
  const dark = victim || !emblem
  return (
    <g className={lifted ? 'lp-token lp-lift' : 'lp-token'} data-person={person}>
      <g className={ghost ? 'lp-ghost' : undefined}>
        <g className={pulse ? 'lp-face lp-pulse' : 'lp-face'}>
          <rect className="lp-shadow lp-shadow-far" x={TX + 1} y={TY + 3} width={TS + 3} height={TS + 4} rx="7" />
          <rect className="lp-shadow" x={TX + 1.5} y={TY + 3} width={TS} height={TS} rx="5.5" />
          <g transform={TOKEN_TRANSFORM} className={dark ? 'lp-emb' : 'lp-emb lp-emb-tk'}>
            {dark ? <VictimTile /> : <EmblemTile id={emblem} fill={tint} />}
          </g>
        </g>
      </g>
      {pulse && <rect className="lp-pulse-ring" x={TX - 5} y={TY - 5} width={TS + 10} height={TS + 10} rx="9" />}
      {selected && !ghost && <rect className="lp-ring" x={TX - 6} y={TY - 6} width={TS + 12} height={TS + 12} rx="9" />}
      {murderer && <rect className="lp-ring-murderer" x={TX - 8} y={TY - 8} width={TS + 16} height={TS + 16} rx="11" />}
    </g>
  )
}

export function TilePlan(p: TilePlanProps): JSX.Element {
  const { puzzle, people, tokens, victimId, selectedPerson, ghost, lifted, murderer, pulse, onTile, onTileHold, className } = p
  const lit = p.lit ?? EMPTY
  const blocked = p.blocked ?? EMPTY
  const sightlines = p.sightlines ?? EMPTY
  const tint = p.tint ?? EMPTY
  const collision = p.collision ?? EMPTY
  const N = puzzle.size

  const geo = useMemo(() => {
    const furn = furnitureByCell(puzzle)
    const furnKeys = new Set(furn.keys())
    return {
      furn,
      pieces: groundFurniture(puzzle),
      walls: wallPaths(puzzle, furnKeys),
      labels: roomLabels(puzzle, furnKeys, furn),
      motifs: roomMotifs(puzzle),
      roomName: new Map(puzzle.rooms.map(r => [r.id, r.name])),
    }
  }, [puzzle])

  const tintOf = (id: string) => deepTint(people[id]?.accent ?? puzzle.people.find(x => x.id === id)?.accent)
  const nameOf = (id: string) => people[id]?.name ?? puzzle.people.find(x => x.id === id)?.name ?? id
  const occupant = useMemo(() => {
    const m = new Map<string, string>()
    for (const [person, c] of Object.entries(tokens)) if (!m.has(keyOf(c.row, c.col))) m.set(keyOf(c.row, c.col), person)
    return m
  }, [tokens])

  // glaze spreads outward from the first lit tile, in buckets (no inline styles)
  const origin = useMemo(() => {
    let best: { row: number; col: number } | null = null
    for (const k of lit) {
      const [row, col] = k.split(',').map(Number)
      if (!best || row < best.row || (row === best.row && col < best.col)) best = { row, col }
    }
    return best
  }, [lit])

  const refs = useRef(new Map<string, SVGGElement>())
  const [active, setActive] = useState({ row: 0, col: 0 })
  const [focused, setFocused] = useState<{ row: number; col: number } | null>(null)
  const hold = useRef<{ timer: ReturnType<typeof setTimeout> | null; fired: boolean; x: number; y: number }>({ timer: null, fired: false, x: 0, y: 0 })

  const clearHold = () => {
    if (hold.current.timer) clearTimeout(hold.current.timer)
    hold.current.timer = null
  }
  useEffect(() => clearHold, [])

  const label = (r: number, c: number): string => {
    const k = keyOf(r, c)
    const room = geo.roomName.get(puzzle.roomOf[r]?.[c] ?? '') ?? 'Outside'
    const parts = [`Row ${r + 1}, column ${c + 1}.`, `${room}.`]
    const pieces = geo.furn.get(k)
    if (pieces?.length) parts.push(`${[...new Set(pieces.map(f => FURNITURE_LABEL[f.type]))].join(', ')}.`)
    const who = occupant.get(k)
    if (who) parts.push(who === victimId ? `${nameOf(who)}, the victim.` : `${nameOf(who)}.`)
    if (ghost && cellKey(ghost.cell) === k) parts.push(`Supposed: ${nameOf(ghost.person)}.`)
    if (lit.has(k)) parts.push('A statement can hold here.')
    if (collision.has(k)) parts.push('Collision.')
    if (blocked.has(k)) parts.push('Ruled out.')
    // the non-visual twin of a sightline: whose row or column this tile is on (not the person's own tile)
    const seen = [...sightlines].filter(t => t !== k).flatMap(t => {
      const [tr, tc] = t.split(',').map(Number)
      const who = occupant.get(t)
      return who && (tr === r || tc === c) ? [nameOf(who)] : []
    })
    if (seen.length) parts.push(`In line with ${seen.join(' and ')}.`)
    return parts.join(' ')
  }

  const move = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(N - 1, r))
    const cc = Math.max(0, Math.min(N - 1, c))
    setActive({ row: rr, col: cc })
    refs.current.get(keyOf(rr, cc))?.focus()
  }

  const onKey = (e: KeyboardEvent<SVGGElement>, cell: Cell) => {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); move(cell.row - 1, cell.col); break
      case 'ArrowDown': e.preventDefault(); move(cell.row + 1, cell.col); break
      case 'ArrowLeft': e.preventDefault(); move(cell.row, cell.col - 1); break
      case 'ArrowRight': e.preventDefault(); move(cell.row, cell.col + 1); break
      case 'Home': e.preventDefault(); move(cell.row, 0); break
      case 'End': e.preventDefault(); move(cell.row, N - 1); break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onTile?.({ row: cell.row, col: cell.col })
        break
    }
  }

  const down = (e: PointerEvent<SVGGElement>, cell: Cell) => {
    hold.current.fired = false
    if (!onTileHold) return
    clearHold()
    hold.current.x = e.clientX
    hold.current.y = e.clientY
    hold.current.timer = setTimeout(() => {
      hold.current.timer = null
      hold.current.fired = true
      onTileHold({ row: cell.row, col: cell.col })
    }, HOLD_MS)
  }
  const moved = (e: PointerEvent<SVGGElement>) => {
    if (!hold.current.timer) return
    if (Math.hypot(e.clientX - hold.current.x, e.clientY - hold.current.y) > MOVE_SLOP) clearHold()
  }

  // sightlines: one hairline per distinct row and column that holds a listed person
  const sightRows = new Set<number>(), sightCols = new Set<number>()
  for (const k of sightlines) {
    const [r, c] = k.split(',').map(Number)
    if (r >= 0 && r < N) sightRows.add(r)
    if (c >= 0 && c < N) sightCols.add(c)
  }

  const size = N * U
  const view = size + PAD * 2
  const ghostKey = ghost ? cellKey(ghost.cell) : null

  const rows: JSX.Element[] = []
  for (let r = 0; r < N; r++) {
    const cells: JSX.Element[] = []
    for (let c = 0; c < N; c++) {
      const k = keyOf(r, c)
      const cell = { row: r, col: c }
      const room = puzzle.roomOf[r]?.[c] ?? ''
      const isLit = lit.has(k) && !collision.has(k)
      const d = isLit && origin ? Math.min(7, Math.abs(r - origin.row) + Math.abs(c - origin.col)) : 0
      cells.push(
        <g
          key={k}
          ref={el => { if (el) refs.current.set(k, el); else refs.current.delete(k) }}
          className="lp-cell"
          role="gridcell"
          aria-label={label(r, c)}
          tabIndex={active.row === r && active.col === c ? 0 : -1}
          transform={`translate(${c * U} ${r * U})`}
          onClick={() => {
            if (hold.current.fired) { hold.current.fired = false; return }
            onTile?.(cell)
          }}
          onKeyDown={e => onKey(e, cell)}
          onPointerDown={e => down(e, cell)}
          onPointerMove={moved}
          onPointerUp={clearHold}
          onPointerCancel={clearHold}
          onPointerLeave={clearHold}
          onContextMenu={e => { if (onTileHold) e.preventDefault() }}
          onFocus={e => {
            setActive(cell)
            let visible = true
            try { visible = e.currentTarget.matches(':focus-visible') } catch { /* older engines: show the ring */ }
            setFocused(visible ? cell : null)
          }}
          onBlur={() => setFocused(f => (f && f.row === r && f.col === c ? null : f))}
        >
          <rect className="lp-tile" data-tone={hash(r, c) % 11 === 0 ? 2 : hash(r, c) % 5 === 0 ? 1 : undefined} width={U} height={U} />
          {room && <Motif kind={geo.motifs.get(room) ?? 3} />}
          <rect className="lp-tint" data-on={tint.has(k) ? '' : undefined} width={U} height={U} />
          <g className="lp-glaze" data-lit={isLit ? '' : undefined} data-d={d || undefined}>
            <rect className="lp-glaze-fill" width={U} height={U} />
            <path className="lp-glaze-gloss" d="M10 38L38 10" />
          </g>
          <path className="lp-blocked" data-on={blocked.has(k) ? '' : undefined} d={HATCH} />
        </g>,
      )
    }
    rows.push(<g key={r} role="row">{cells}</g>)
  }

  return (
    <svg
      className={className ? `lp ${className}` : 'lp'}
      viewBox={`${-PAD} ${-PAD} ${view} ${view}`}
      role="grid"
      aria-label="House plan"
      focusable="false"
    >
      <rect className="lp-frieze" x={-PAD + 3} y={-PAD + 3} width={view - 6} height={view - 6} rx="5" />
      {rows}
      <g className="lp-sights" aria-hidden="true">
        {[...sightRows].sort((a, b) => a - b).map(r => <path key={`r${r}`} className="lp-sight" data-axis="row" data-line={r} d={`M0 ${r * U + U / 2}H${size}`} />)}
        {[...sightCols].sort((a, b) => a - b).map(c => <path key={`c${c}`} className="lp-sight" data-axis="col" data-line={c} d={`M${c * U + U / 2} 0V${size}`} />)}
      </g>
      <path className="lp-wall-in" d={geo.walls.inner} />
      <path className="lp-sill" d={geo.walls.sills} />
      <path className="lp-jamb" d={geo.walls.jambs} />
      <path className="lp-wall-out" d={geo.walls.outer} />
      <g aria-hidden="true">
        {geo.pieces.map((f, i) => <FurniturePiece key={`${f.type}${f.row},${f.col},${i}`} f={f} />)}
        {geo.labels.map(l => (
          <g key={l.roomId} className="lp-label" data-room={l.roomId}>
            <rect className="lp-label-plaque" x={l.x} y={l.y} width={l.w} height={l.h} rx={l.h / 2} />
            <text className="lp-label-text" x={l.x + l.w / 2} y={l.y + l.h / 2} textAnchor="middle" fontSize={l.fs}>{l.name}</text>
          </g>
        ))}
        {Object.entries(tokens).map(([person, c]) => (
          <g key={person} transform={`translate(${c.col * U} ${c.row * U})`}>
            <Token
              person={person}
              emblem={people[person]?.emblem ?? null}
              tint={tintOf(person)}
              victim={person === victimId}
              selected={person === selectedPerson}
              murderer={person === murderer}
              lifted={person === lifted}
              pulse={person === pulse}
            />
          </g>
        ))}
        {ghost && ghostKey && (
          // two nested groups, one per axis, so the CSS translate rules (data-row / data-col) can
          // transition and the supposition glides when its cell changes. No inline styles.
          <g className="lp-gy" data-row={ghost.cell.row} transform={`translate(0 ${ghost.cell.row * U})`}>
            <g className="lp-gx" data-col={ghost.cell.col} transform={`translate(${ghost.cell.col * U} 0)`}>
              <Token
                person={ghost.person} emblem={people[ghost.person]?.emblem ?? null} tint={tintOf(ghost.person)}
                victim={ghost.person === victimId} murderer={ghost.person === murderer} ghost
              />
            </g>
          </g>
        )}
        {[...collision].map(k => {
          const [r, c] = k.split(',').map(Number)
          if (!(r >= 0 && r < N && c >= 0 && c < N)) return null
          return (
            <g key={k} transform={`translate(${c * U} ${r * U})`}>
              <Crack variant={hash(r, c)} />
            </g>
          )
        })}
        {focused && <rect className="lp-focus" x={focused.col * U + 4} y={focused.row * U + 4} width={U - 8} height={U - 8} rx="6" />}
      </g>
    </svg>
  )
}
