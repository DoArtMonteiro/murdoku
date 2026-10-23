import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Puzzle, Cell, CellMark, FurnitureType } from '../core/types'
import { furnitureCells } from '../core/types'
import { resolveScene } from '../scene3d/resolve'
import { sceneFor } from '../scene3d/scenes'
import { withoutLookalikes } from '../scene3d/lookalikes'
import type { SceneRenderer } from '../scene3d/renderer'
import { validateScene, formatViolations } from '../scene3d/validate'
import { CELL, makeStoreyFrame, STOREY_HEIGHT, type StoreyView } from '../scene3d/units'
import Avatar from './Avatar'

// ============================================================================
// ISOMETRIC DOLLHOUSE BOARD
//
// A 3D Kenney diorama (src/scene3d) with the Murdoku grid laid over it.
//
// Two layers, one projection:
//   1. the WebGL canvas draws the house — floor, shell, partitions, furniture,
//      shadows — and the floor highlights (lanes, clue cells, targets) as
//      decals that read through walls and furniture;
//   2. a DOM/SVG layer, scaled to the same virtual canvas, carries everything
//      the player interacts with: precise cell hit polygons, suspect standees,
//      marks and drafts. It is positioned with the closed-form projection in
//      scene3d/units.ts, which is the same maths the camera is built from.
//
// Cells, rows, columns, clues and solutions are untouched: `row` and `col`
// keep their exact meaning and are simply drawn on two diagonal screen axes.
// ============================================================================

interface ClueTarget { roomId?: string; furniture?: FurnitureType; cells?: Cell[] }

interface Props {
  puzzle: Puzzle
  marks: CellMark[][]
  conflicts: Set<string>
  onCellClick: (row: number, col: number) => void
  highlight?: ClueTarget | ClueTarget[] | null
  highlightLabel?: string
  ghostMarks?: CellMark[][] | null
  /** Rows/cols consumed on the OTHER storey — the cross-floor lock. */
  blockedRows?: ReadonlySet<number>
  blockedCols?: ReadonlySet<number>
  floor?: 0 | 1
  /** Physical context for the inactive storey. Ghost is the primary play view. */
  storeyView?: StoreyView
  /** Lanes that JUST locked elsewhere, for the one-shot cross-storey reveal. */
  flashRows?: ReadonlySet<number>
  flashCols?: ReadonlySet<number>
  /** The suspect currently armed for placement, if any — drives the valid/invalid target ring. */
  armedPerson?: string | null
}

const SKIN = {
  tokenPlate: '#FFFFFF',
  tokenPlateConflict: '#E14B4B',
  tokenShadow: 'rgba(20,15,10,0.45)',
  contactShadow: 'rgba(20,15,10,0.35)',
  markInk: '#3A2A18',
  markHalo: 'rgba(255,255,255,0.8)',
  draftPlate: '#FFF8E6',
  draftInk: '#2A1D10',
  ghostRing: 'rgba(80,60,40,0.55)',
  validTarget: '#B97919',
  invalidTarget: '#C94444',
  placementCue: '#62400B',
  laneRow: 'rgba(145,91,28,0.75)',
  laneCol: 'rgba(33,104,126,0.75)',
  laneRowSolid: '#915B1C',
  laneColSolid: '#21687E',
}

/** Axis numerals: CSS px, so they stay legible when the board is scaled down. */
const AXIS_FONT_PX = 12
const AXIS_OFFSET_PX = 15

const flag = (name: string) =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(name)

export default function IsoBoard({
  puzzle, marks, conflicts, onCellClick,
  highlight = null, highlightLabel,
  ghostMarks = null, blockedRows, blockedCols, floor = 0,
  storeyView = 'ghost', flashRows, flashCols, armedPerson = null,
}: Props) {
  const N = puzzle.size
  const scope = `${puzzle.id}:${floor}`
  const [selected, setSelected] = useState<{ row: number; col: number; scope: string } | null>(null)
  const [hover, setHover] = useState<typeof selected>(null)
  const selection = selected?.scope === scope ? selected : null
  const active = hover?.scope === scope ? hover : selection
  const descriptionId = useId()

  const spec = useMemo(() => withoutLookalikes(sceneFor(puzzle, floor), puzzle), [puzzle, floor])
  const rawScene = useMemo(() => resolveScene(spec, N), [spec, N])
  const twoStorey = (puzzle.floors ?? 1) > 1
  const companionFloor = (floor === 0 ? 1 : 0) as 0 | 1
  const companionSpec = useMemo(
    () => twoStorey ? withoutLookalikes(sceneFor(puzzle, companionFloor), puzzle) : null,
    [twoStorey, puzzle, companionFloor],
  )
  const companionScene = useMemo(
    () => companionSpec ? resolveScene(companionSpec, N) : null,
    [companionSpec, N],
  )
  const frame = useMemo(
    () => twoStorey ? makeStoreyFrame(N, floor, storeyView) : rawScene.frame,
    [twoStorey, N, floor, storeyView, rawScene.frame],
  )
  const scene = useMemo(() => ({ ...rawScene, frame }), [rawScene, frame])
  const companion = useMemo(() => companionScene ? {
    scene: companionScene,
    offsetY: (floor === 0 ? 1 : -1) * (storeyView === 'ghost' ? STOREY_HEIGHT : STOREY_HEIGHT * 1.8),
    mode: storeyView,
  } : undefined, [companionScene, floor, storeyView])

  // Dev-time guardrail: the physical model is validated on every scene build
  // and the report lands in the console, where the visual QA loop reads it.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const report = validateScene(scene, puzzle)
    if (report.length) console.warn(`[scene ${scene.puzzleId}#${scene.floor}]\n` + formatViolations(report))
  }, [scene, puzzle])

  /** `?env=1` strips every puzzle overlay so the house can be judged alone. */
  const envOnly = flag('env')
  const diag = flag('diag')

  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<SceneRenderer | null>(null)
  const [rendererReady, setRendererReady] = useState(0)
  const [scale, setScale] = useState(1)

  // three.js is loaded on demand: the DOM board (hit grid, tokens, marks)
  // is usable before the first model arrives, and the app shell never pays
  // for the renderer on screens that do not draw a house.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let created: SceneRenderer | null = null
    import('../scene3d/renderer').then(({ createSceneRenderer }) => {
      if (cancelled) return
      created = createSceneRenderer(canvas, scene, companion)
      rendererRef.current = created
      const el = wrapRef.current
      if (created && el) created.setSize(el.clientWidth || frame.width, el.clientHeight || frame.height)
      setRendererReady(v => v + 1)
    })
    return () => { cancelled = true; created?.dispose(); rendererRef.current = null }
  }, [scene, companion, frame.width, frame.height])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth || frame.width
      setScale(w / frame.width)
      rendererRef.current?.setSize(w, el.clientHeight || (w * frame.height) / frame.width)
    }
    fit()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit)
      return () => window.removeEventListener('resize', fit)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [frame.width, frame.height])

  const roomOf = puzzle.roomOfByFloor?.[floor] ?? puzzle.roomOf
  const roomName = (r: number, c: number) =>
    puzzle.rooms.find(rm => rm.id === roomOf[r]?.[c])?.name ?? ''
  const personById = (id: string) => puzzle.people.find(p => p.id === id)

  // ---- lane state, derived from the SAME marks the logical game uses -------
  const lockedRows = new Set<number>(), lockedCols = new Set<number>()
  const placementRows = new Set<number>(), placementCols = new Set<number>()
  const conflictRows = new Set<number>(), conflictCols = new Set<number>()
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const m = marks[r][c]
    if (m.kind === 'person') {
      lockedRows.add(r); lockedCols.add(c)
      if (m.person !== armedPerson) { placementRows.add(r); placementCols.add(c) }
      if (conflicts.has(m.person)) { conflictRows.add(r); conflictCols.add(c) }
    }
  }
  // The mover vacates its previous cell on either floor. Rebuild guidance from
  // the other floor's people so another occupant sharing that lane still counts.
  const otherPlacementRows = new Set<number>(ghostMarks ? [] : blockedRows)
  const otherPlacementCols = new Set<number>(ghostMarks ? [] : blockedCols)
  if (ghostMarks) ghostMarks.forEach((row, r) => row.forEach((mark, c) => {
    if (mark.kind === 'person' && mark.person !== armedPerson) {
      otherPlacementRows.add(r)
      otherPlacementCols.add(c)
    }
  }))
  // Guidance describes lane occupancy, not whether all puzzle clues are satisfied.
  // The game reducer remains the authority for placement, swaps and detective locks.
  const guidanceFor = (r: number, c: number) => {
    const mark = marks[r][c]
    if (mark.kind === 'person') return `${conflicts.has(mark.person) ? 'Conflict · ' : ''}Occupied · ${personById(mark.person)?.name ?? 'Person'}${mark.locked ? ' · Locked placement' : ''}`
    const reasons = [
      otherPlacementRows?.has(r) ? 'Row occupied on the other floor' : placementRows.has(r) ? 'Row occupied on this floor' : '',
      otherPlacementCols?.has(c) ? 'Column occupied on the other floor' : placementCols.has(c) ? 'Column occupied on this floor' : '',
    ].filter(Boolean)
    return reasons.join(' · ') || (mark.kind === 'x' && !(mark.auto && armedPerson) ? 'Marked as excluded' : mark.kind === 'draft' ? 'Pencilled candidates' : 'Row and column free')
  }
  const isOpenTarget = (r: number, c: number) => {
    const mark = marks[r][c]
    return mark.kind !== 'person'
      && !placementRows.has(r) && !placementCols.has(c) && !otherPlacementRows?.has(r) && !otherPlacementCols?.has(c)
  }
  const targetOpen = active ? isOpenTarget(active.row, active.col) : false
  const furniture = useMemo(() => puzzle.furniture.filter(f => (f.floor ?? 0) === floor), [puzzle.furniture, floor])
  const clueCells = useMemo(() => {
    const targets: ClueTarget[] = highlight ? (Array.isArray(highlight) ? highlight : [highlight]) : []
    const cells = new Set<string>()
    const clueRooms = new Set(targets.map(t => t.roomId).filter(Boolean))
    const clueFurn = new Set(targets.map(t => t.furniture).filter(Boolean))
    for (const t of targets) for (const c of t.cells ?? []) cells.add(`${c.row},${c.col}`)
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (clueRooms.has(roomOf[r]?.[c])) cells.add(`${r},${c}`)
      if (furniture.some(f => clueFurn.has(f.type) && furnitureCells(f).some(x => x.row === r && x.col === c))) cells.add(`${r},${c}`)
    }
    return cells
  }, [highlight, furniture, roomOf, N])

  const lockedKey = [...lockedRows].join(',') + '|' + [...lockedCols].join(',') + '|' + [...conflictRows].join(',') + '|' + [...conflictCols].join(',')
  useEffect(() => {
    rendererRef.current?.setHighlights({
      activeRow: active?.row, activeCol: active?.col,
      lockedRows, lockedCols, conflictRows, conflictCols,
      blockedRows, blockedCols, clueCells,
      hoverTarget: armedPerson && active
        ? { row: active.row, col: active.col, valid: targetOpen }
        : null,
      envOnly, diag,
    })
    // lockedKey stands in for the four derived sets, which are rebuilt every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, rendererReady, active, lockedKey, blockedRows, blockedCols, clueCells, armedPerson, targetOpen, envOnly, diag])

  const points = (poly: Array<[number, number]>) => poly.map(p => p.join(',')).join(' ')
  const centreOf = (r: number, c: number) => frame.project(frame.cellCentre(r, c, scene.floorY[r][c]))
  const cellPoly = (r: number, c: number) => frame.cellPolygon(r, c, scene.floorY[r][c])

  // ---- axis numerals, from the SAME projection as the cell polygons ---------
  // Row r runs along world x, so its far end meets the front-right edge; column
  // c runs along world z and meets the front-left edge. Each numeral sits on
  // that edge at the strip's middle, pushed outward along the screen direction
  // the world axis continues in (the same projection, one cell on).
  const axisLabels = (() => {
    const unit = (a: [number, number], b: [number, number]): [number, number] => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
      return [dx / len, dy / len]
    }
    const rows: Array<{ index: number; x: number; y: number; dx: number; dy: number }> = []
    const cols: typeof rows = []
    for (let i = 0; i < N; i++) {
      const rc = frame.cellCentre(i, N - 1, scene.floorY[i][N - 1])
      const rowEdge = frame.project([rc[0] + CELL / 2, rc[1], rc[2]])
      const [rdx, rdy] = unit(rowEdge, frame.project([rc[0] + CELL / 2 + CELL, rc[1], rc[2]]))
      rows.push({ index: i, x: rowEdge[0], y: rowEdge[1], dx: rdx, dy: rdy })
      const cc = frame.cellCentre(N - 1, i, scene.floorY[N - 1][i])
      const colEdge = frame.project([cc[0], cc[1], cc[2] + CELL / 2])
      const [cdx, cdy] = unit(colEdge, frame.project([cc[0], cc[1], cc[2] + CELL / 2 + CELL]))
      cols.push({ index: i, x: colEdge[0], y: colEdge[1], dx: cdx, dy: cdy })
    }
    return { rows, cols }
  })()
  /** One word per axis, beyond the middle numeral, so rows and columns are never confused. */
  const axisTitle = (kind: 'row' | 'col') => {
    const labels = kind === 'row' ? axisLabels.rows : axisLabels.cols
    const a = labels[Math.floor((N - 1) / 2)], b = labels[Math.ceil((N - 1) / 2)]
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dx: a.dx, dy: a.dy }
    const push = AXIS_OFFSET_PX + 24
    return (
      <span
        key={`${kind}-title`}
        data-axis-title={kind}
        style={{
          position: 'absolute',
          left: `calc(${(mid.x / frame.width) * 100}% + ${mid.dx * push}px)`,
          top: `calc(${(mid.y / frame.height) * 100}% + ${mid.dy * push}px)`,
          transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap',
          fontSize: AXIS_FONT_PX - 1, lineHeight: 1, letterSpacing: '0.14em', fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}
      >{kind === 'row' ? 'ROW' : 'COL'}</span>
    )
  }
  const axisChip = (kind: 'row' | 'col', label: { index: number; x: number; y: number; dx: number; dy: number }) => {
    const on = kind === 'row' ? active?.row === label.index : active?.col === label.index
    const solid = kind === 'row' ? SKIN.laneRowSolid : SKIN.laneColSolid
    return (
      <span
        key={`${kind}${label.index}`}
        data-axis-numeral={kind}
        data-axis-index={label.index + 1}
        data-axis-active={on ? '' : undefined}
        style={{
          position: 'absolute',
          left: `calc(${(label.x / frame.width) * 100}% + ${label.dx * AXIS_OFFSET_PX}px)`,
          top: `calc(${(label.y / frame.height) * 100}% + ${label.dy * AXIS_OFFSET_PX}px)`,
          transform: 'translate(-50%, -50%)',
          minWidth: AXIS_FONT_PX + 8, height: AXIS_FONT_PX + 8, padding: '0 3px', boxSizing: 'border-box',
          display: 'grid', placeItems: 'center', borderRadius: 4,
          fontSize: AXIS_FONT_PX, lineHeight: 1, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          // Resting numerals take the page's own text colour (checked >= 4.5:1 in both themes);
          // the active lane gets a self-contained plate so it holds on any background.
          color: on ? SKIN.markInk : 'var(--color-text-primary)',
          background: on ? SKIN.draftPlate : 'transparent',
          border: on ? `2px solid ${solid}` : '2px solid transparent',
        }}
      >{label.index + 1}</span>
    )
  }

  return (
    <div
      data-testid="board"
      data-iso-board=""
      data-scene-authored={scene.walls.some(w => w.kind === 'partition') ? 'true' : 'false'}
      data-storey-view={twoStorey ? storeyView : undefined}
      data-companion-floor={twoStorey ? companionFloor : undefined}
      className="relative w-full select-none"
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      role="grid"
      aria-label={`Isometric house, ${N} by ${N} grid, floor ${floor + 1}`}
      aria-describedby={envOnly ? undefined : descriptionId}
    >
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          data-scene-canvas=""
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />
        {/* Overlay authored at the virtual canvas size and scaled as ONE unit. */}
        <div
          style={{
            position: 'absolute', width: frame.width, height: frame.height,
            transformOrigin: 'top left', transform: `scale(${scale})`,
          }}
        >
          {/* placement cues: small landing marks on every free cell while a suspect is armed */}
          {!envOnly && armedPerson && (
            <svg width={frame.width} height={frame.height} style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
              {Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => {
                if (!roomOf[r]?.[c] || marks[r][c].kind !== 'empty' || !isOpenTarget(r, c)) return null
                const [x, y] = centreOf(r, c)
                return <circle key={`cue${r}-${c}`} data-placement-cue={`${r}-${c}`} cx={x} cy={y} r={4} fill={SKIN.placementCue} stroke={SKIN.draftPlate} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              }))}
            </svg>
          )}

          {/* active lane traces: thin dashed lines with end pins, drawn above the scene */}
          {!envOnly && active && (
            <svg width={frame.width} height={frame.height} data-active-lanes="" style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
              {(() => {
                const r0 = centreOf(active.row, 0), r1 = centreOf(active.row, N - 1)
                const c0 = centreOf(0, active.col), c1 = centreOf(N - 1, active.col)
                return (
                  <>
                    <line data-lane-trace="row" x1={r0[0]} y1={r0[1]} x2={r1[0]} y2={r1[1]} stroke={SKIN.laneRow} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="7 6" />
                    <line data-lane-trace="column" x1={c0[0]} y1={c0[1]} x2={c1[0]} y2={c1[1]} stroke={SKIN.laneCol} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="7 6" />
                    {[r0, r1].map((p, i) => <circle key={'rp' + i} cx={p[0]} cy={p[1]} r={5} fill={SKIN.laneRow} />)}
                    {[c0, c1].map((p, i) => <circle key={'cp' + i} cx={p[0]} cy={p[1]} r={5} fill={SKIN.laneCol} />)}
                  </>
                )
              })()}
            </svg>
          )}

          {/* cross-storey reveal: lanes that just locked on the other floor pulse here */}
          {!envOnly && (flashRows?.size || flashCols?.size) ? (
            <svg width={frame.width} height={frame.height} style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
              {[...(flashRows ?? [])].map(r => Array.from({ length: N }, (_, c) => (
                <polygon key={`fr${r}-${c}`} points={points(cellPoly(r, c))} fill="rgba(150,120,255,0.38)">
                  <animate attributeName="opacity" values="0;1;0.2;1;0.55" dur="1.4s" fill="freeze" />
                </polygon>
              )))}
              {[...(flashCols ?? [])].map(c => Array.from({ length: N }, (_, r) => (
                <polygon key={`fc${c}-${r}`} points={points(cellPoly(r, c))} fill="rgba(150,120,255,0.38)">
                  <animate attributeName="opacity" values="0;1;0.2;1;0.55" dur="1.4s" fill="freeze" />
                </polygon>
              )))}
            </svg>
          ) : null}

          {/* Occupied footprints anchor the portrait to its exact logical cell. */}
          {!envOnly && (
            <svg width={frame.width} height={frame.height} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 80, pointerEvents: 'none' }}>
              {marks.flatMap((row, r) => row.map((mark, c) => mark.kind === 'person' ? (
                <g key={`placed${r}-${c}`} data-placed-cell={`${r}-${c}`}>
                  <polygon points={points(cellPoly(r, c))} fill={conflicts.has(mark.person) ? 'rgba(201,68,68,0.15)' : 'rgba(255,248,230,0.16)'} stroke={SKIN.draftPlate} strokeWidth={3} vectorEffect="non-scaling-stroke" />
                  <polygon points={points(cellPoly(r, c))} fill="none" stroke={conflicts.has(mark.person) ? SKIN.invalidTarget : SKIN.markInk} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray={conflicts.has(mark.person) ? '5 3' : undefined} />
                </g>
              ) : null))}
            </svg>
          )}

          {/* ---------------- TOKENS ----------------
              Suspects are gameplay and stand IN the scene: a standee whose feet
              sit on the cell's floor point, with a portrait badge at chest height. */}
          {!envOnly && Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => {
            const m = marks[r][c]
            const [cx, cy] = centreOf(r, c)
            const z = 100 + (r + c) * 2
            if (m.kind === 'person') {
              const p = personById(m.person)
              if (!p) return null
              const bad = conflicts.has(p.id)
              const standeeH = 92
              return (
                <div
                  key={`p${r}-${c}`}
                  title={`${p.name}${p.isVictim ? ' — victim' : ''}`}
                  data-scene-object="suspect"
                  data-cell-token={`${r}-${c}`}
                  style={{ position: 'absolute', left: cx - 32, top: cy - standeeH, zIndex: z, pointerEvents: 'none' }}
                >
                  <div style={{
                    position: 'absolute', left: -4, top: standeeH - 6, width: 72, height: 16,
                    borderRadius: '50%', background: SKIN.contactShadow, filter: 'blur(2.5px)',
                  }} />
                  <div style={{
                    position: 'absolute', left: 27, top: 38, width: 10, height: standeeH - 32,
                    background: bad ? SKIN.tokenPlateConflict : SKIN.tokenPlate,
                    borderRadius: 2, boxShadow: `0 4px 8px ${SKIN.tokenShadow}`,
                  }} />
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', padding: 3,
                    background: bad ? SKIN.tokenPlateConflict : SKIN.tokenPlate,
                    boxShadow: `0 4px 10px ${SKIN.tokenShadow}`,
                  }}>
                    <Avatar seed={p.avatarSeed} accent={p.accent} size={58} dead={p.isVictim} name={p.name} />
                  </div>
                  {bad && <svg data-conflict-icon="" aria-hidden width={28} height={28} viewBox="0 0 28 28" style={{ position: 'absolute', right: -7, top: -7 }}>
                    <path d="M14 2 L27 25 H1 Z" fill={SKIN.invalidTarget} stroke={SKIN.draftPlate} strokeWidth={2} />
                    <path d="M14 10 V16 M14 20 V21" stroke={SKIN.draftPlate} strokeWidth={2.5} strokeLinecap="round" />
                  </svg>}
                </div>
              )
            }
            if (m.kind === 'x') {
              return (
                <div key={`x${r}-${c}`} style={{
                  position: 'absolute', left: cx - 18, top: cy - 22, zIndex: z, pointerEvents: 'none',
                  fontSize: 38, fontWeight: 800, lineHeight: 1, color: SKIN.markInk, textShadow: `0 1px 0 ${SKIN.markHalo}`,
                }}>×</div>
              )
            }
            if (m.kind === 'draft' && m.persons.length) {
              return (
                <div key={`d${r}-${c}`} style={{
                  position: 'absolute', left: cx - 42, top: cy - 24, width: 84,
                  display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', zIndex: z, pointerEvents: 'none',
                }}>
                  {m.persons.slice(0, 4).map(pid => {
                    const p = personById(pid)
                    return p ? (
                      <span key={pid} style={{
                        width: 24, height: 24, borderRadius: 5, background: SKIN.draftPlate,
                        border: `2px solid ${p.accent}`, color: SKIN.draftInk,
                        fontSize: 13, fontWeight: 800, display: 'grid', placeItems: 'center',
                      }}>{p.name[0]}</span>
                    ) : null
                  })}
                </div>
              )
            }
            if (ghostMarks?.[r]?.[c]?.kind === 'person') {
              return (
                <div key={`g${r}-${c}`} style={{
                  position: 'absolute', left: cx - 18, top: cy - 18, width: 36, height: 36, borderRadius: '50%',
                  border: `2px dashed ${SKIN.ghostRing}`, zIndex: z, pointerEvents: 'none',
                }} />
              )
            }
            return null
          }))}

          {/* Evidence outlines remain legible over beds, tables and tall models. */}
          {!envOnly && clueCells.size > 0 && (
            <svg width={frame.width} height={frame.height} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 300, pointerEvents: 'none' }}>
              {[...clueCells].map(key => {
                const [r, c] = key.split(',').map(Number)
                if (r < 0 || r >= N || c < 0 || c >= N) return null
                return <g key={key} data-clue-cell={`${r}-${c}`}>
                  <polygon points={points(cellPoly(r, c))} fill="rgba(255,248,230,0.12)" stroke={SKIN.draftPlate} strokeWidth={3} vectorEffect="non-scaling-stroke" />
                  <polygon points={points(cellPoly(r, c))} fill="none" stroke={SKIN.validTarget} strokeWidth={1.2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                </g>
              })}
            </svg>
          )}

          {/* Persistent selection + pointer/focus target, with contrast on every material. */}
          {!envOnly && active && (
            <svg width={frame.width} height={frame.height} aria-hidden data-active-cell={`${active.row}-${active.col}`} style={{ position: 'absolute', inset: 0, zIndex: 400, pointerEvents: 'none' }}>
              <polygon points={points(cellPoly(active.row, active.col))} fill="rgba(255,248,230,0.14)" stroke={SKIN.markInk} strokeWidth={5} vectorEffect="non-scaling-stroke" />
              <polygon data-placement-target={armedPerson ? '' : undefined} points={points(cellPoly(active.row, active.col))} fill="none" stroke={armedPerson && !targetOpen ? SKIN.invalidTarget : SKIN.draftPlate} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
            </svg>
          )}

          {/* ---------------- HIT LAYER ----------------
              Precise floor polygons above everything, so a click lands on the
              cell the player aimed at and never on a model that overhangs it. */}
          <svg width={frame.width} height={frame.height} aria-hidden={envOnly || undefined} style={{ position: 'absolute', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
            {Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (
              <polygon
                key={`h${r}-${c}`}
                points={points(cellPoly(r, c))}
                fill="transparent"
                data-cell={`${r}-${c}`}
                role="gridcell"
                tabIndex={envOnly ? -1 : (selection?.row ?? 0) === r && (selection?.col ?? 0) === c ? 0 : -1}
                aria-selected={selection?.row === r && selection.col === c}
                style={{ cursor: 'pointer', pointerEvents: envOnly ? 'none' : 'all', touchAction: 'manipulation', outline: 'none' }}
                onMouseEnter={() => setHover({ row: r, col: c, scope })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => { setHover(null); setSelected({ row: r, col: c, scope }) }}
                onClick={() => { setSelected({ row: r, col: c, scope }); onCellClick(r, c) }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); onCellClick(r, c); return
                  }
                  const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key]
                  if (!delta) return
                  event.preventDefault()
                  const row = Math.max(0, Math.min(N - 1, r + delta[0]))
                  const col = Math.max(0, Math.min(N - 1, c + delta[1]))
                  event.currentTarget.ownerSVGElement?.querySelector<SVGElement>(`[data-cell="${row}-${col}"]`)?.focus()
                }}
                aria-label={`Row ${r + 1}, column ${c + 1}${roomName(r, c) ? `, ${roomName(r, c)}` : ''}${marks[r][c].kind !== 'empty' ? `, ${guidanceFor(r, c)}` : ''}`}
              />
            )))}
          </svg>
        </div>
      </div>
      {/* Permanent coordinates, outside the clipped canvas: rows 1..N down the front-right
          edge, columns 1..N down the front-left edge. Cells already carry "Row r, column c". */}
      {!envOnly && (
        <div aria-hidden data-axis-numerals="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
          {axisLabels.rows.map(label => axisChip('row', label))}
          {axisLabels.cols.map(label => axisChip('col', label))}
          {axisTitle('row')}
          {axisTitle('col')}
        </div>
      )}
      {!envOnly && <>
        <span id={descriptionId} className="sr-only">Use arrow keys to move between cells. Enter or Space applies the selected tool. Rows and columns are shared across floors.</span>
        {/* Below the board on narrow screens so it never covers the south tip; inside it on desktop. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="absolute inset-x-2 top-full mt-1 lg:top-auto lg:mt-0 lg:bottom-[3px]" style={{ pointerEvents: 'none', textAlign: 'center', fontSize: 12, lineHeight: 1.4, color: SKIN.draftPlate }}>
          {active && <span style={{ display: 'inline-block', padding: '4px 8px', background: SKIN.markInk }}>
            {`Row ${active.row + 1} · Column ${active.col + 1}${roomName(active.row, active.col) ? ` · ${roomName(active.row, active.col)}` : ''} — ${guidanceFor(active.row, active.col)}`}
          </span>}
        </div>
        {highlightLabel && <span style={{ position: 'absolute', top: 4, left: 8, maxWidth: 'calc(100% - 16px)', padding: '4px 8px', background: SKIN.draftPlate, color: SKIN.markInk, fontSize: 12, pointerEvents: 'none' }}>Clue: {highlightLabel}</span>}
      </>}
    </div>
  )
}
