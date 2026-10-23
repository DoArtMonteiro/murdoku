import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { X, Lock } from 'lucide-react'
import type { Puzzle, Cell, CellMark, Furniture, FurnitureType } from '../core/types'
import { furnitureCells, furnitureFootprint } from '../core/types'
import { FURNITURE_NAME } from '../core/furniture'
import { FURNITURE_ICON, FURNITURE_ICON_SIDE } from '../core/kenneyIcons'
import { floorStyle, isDarkFloor, roomMaterial } from '../core/roomMaterials'
import Avatar from './Avatar'

/** A board target a clue points at: a whole room, a furniture type, or cells. */
interface ClueTarget { roomId?: string; furniture?: FurnitureType; cells?: Cell[] }

interface Props {
  puzzle: Puzzle
  marks: CellMark[][]
  conflicts: Set<string>
  onCellClick: (row: number, col: number) => void
  extraFurniture?: Furniture[]
  placingFurniture?: FurnitureType | null
  placingRotation?: 0 | 90 | 180 | 270
  onPlaceFurniture?: (row: number, col: number) => void
  /** One target, or every target a suspect's clues point at. */
  highlight?: ClueTarget | ClueTarget[] | null
  highlightLabel?: string
  /**
   * The OTHER storey, drawn faintly through the same cells so the player can
   * see that something is up there and roughly where. Never interactive.
   */
  ghostMarks?: CellMark[][] | null
  /**
   * Rows and columns consumed by a suspect on the other storey. Rows and
   * columns are shared across floors — that is the whole mechanic — so a cell
   * blocked from upstairs must read as blocked down here too.
   */
  blockedRows?: ReadonlySet<number>
  blockedCols?: ReadonlySet<number>
  /**
   * Which floor to render. 0 = ground (default), 1 = upstairs.
   * When puzzle.roomOfByFloor exists, rooms are resolved per floor.
   * Furniture is filtered to only pieces whose floor matches.
   */
  floor?: 0 | 1
}

// Room finishes are authored in core/roomMaterials.ts so every room has a
// distinct, quiet material signature without data-URI tile seams.

function handleCellKey(e: React.KeyboardEvent, r: number, c: number, N: number) {
  const dirs: Record<string, [number, number]> = {
    ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
  }
  const d = dirs[e.key]
  if (!d) return
  e.preventDefault()
  const nr = Math.max(0, Math.min(N - 1, r + d[0]))
  const nc = Math.max(0, Math.min(N - 1, c + d[1]))
  if (nr === r && nc === c) return
  const grid = (e.currentTarget as HTMLElement).closest('[data-grid]')
  ;(grid?.querySelector(`[data-cell="${nr}-${nc}"]`) as HTMLElement)?.focus()
}

/**
 * Relative luminance of an sRGB hex colour (WCAG 2.x formula).
 * Returns 0 (black) .. 1 (white). Used to pick token ink that meets AA
 * contrast against the muted suspect accent fill.
 */
function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

// Heavy espresso architecture, drawn like the printed rules of a physical board:
// room divisions are the boldest line on the table, cell divisions are hairlines.
// WALL_DARK: the thick espresso edge of the room boundary (dark side).
// WALL_LIGHT: a bone hairline on the bright side of the wall so it reads on
// dark floors at any board size — a double-rule like a physical board print.
const WALL = '#1a1a1a'
const WALL_SEAM = '#D8C8A4'   // bone-evidence token (DESIGN.md fixed material)
const ESPRESSO = '#241820'

export default function MapGrid({
  puzzle, marks, conflicts, onCellClick,
  extraFurniture = [], placingFurniture, placingRotation = 0, onPlaceFurniture,
  highlight = null, highlightLabel,
  ghostMarks = null, blockedRows, blockedCols,
  floor = 0,
}: Props) {
  const N = puzzle.size
  // Per-floor room map: when roomOfByFloor is present use the correct storey;
  // fall back to roomOf so single-floor puzzles are pixel-identical to before.
  const roomOf = puzzle.roomOfByFloor?.[floor] ?? puzzle.roomOf
  const room = (id: string) => puzzle.rooms.find(r => r.id === id)
  const personById = (id: string) => puzzle.people.find(p => p.id === id)
  const [hoverCell, setHoverCell] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  // Placing a suspect is a committing, physical action, so the token lands with
  // a little overshoot (bounce) rather than a flat fade. The global
  // prefers-reduced-motion CSS only covers CSS animations, never Framer's
  // JS-driven springs â€” so opt out here explicitly.
  const snapIn = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
    : {
        initial: { scale: 0.55, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, bounce: 0.35, duration: 0.42 },
      }

  // Only render furniture on the active floor. Pieces with no floor field
  // default to 0 (ground). extraFurniture (custom decorator pieces) also
  // follow the same rule so they stay on the storey the player added them on.
  const allFurniture: Furniture[] = [...puzzle.furniture, ...extraFurniture]
    .filter(f => (f.floor ?? 0) === floor)
  const furnByCell: Record<string, Furniture[]> = {}
  for (const f of allFurniture) (furnByCell[`${f.row},${f.col}`] ||= []).push(f)
  // Room labels must dodge the WHOLE footprint, not just the anchor cell.
  const occupiedCells = new Set(allFurniture.flatMap(f => furnitureCells(f).map(c => `${c.row},${c.col}`)))

  // Label stamps follow the same storey rule as the rooms and furniture under
  // them. Without this filter a two-floor board draws BOTH storeys' room names
  // into the same corners — on the live board "HAL" and "ONT YARD" were printed
  // over one another. Rooms with no floor field default to ground, so
  // single-floor boards keep exactly the labels they have today.
  const labelAnchors = puzzle.rooms.filter(rm => (rm.floor ?? 0) === floor).map(rm => {
    const sorted = [...rm.cells].sort((a, b) => a.row - b.row || a.col - b.col)
    const free = (c: { row: number; col: number }) => !occupiedCells.has(`${c.row},${c.col}`)
    // How many unobstructed cells run to the right of this one, inside the room.
    const runFrom = (c: { row: number; col: number }) => {
      let n = 1
      while (n < N
        && rm.cells.some(x => x.row === c.row && x.col === c.col + n)
        && free({ row: c.row, col: c.col + n })) n++
      return n
    }
    // Anchor on the WIDEST free run, not merely the first free cell in reading
    // order. A label only abbreviates when its anchor has no room to spread, and
    // taking the first free cell stranded KITCHEN and HALLWAY at one-cell-wide
    // spots — they printed as "KIT" and "HAL" on a live board while roomier
    // neighbours showed their full names. Ties keep the top-most/left-most cell
    // so labels stay in a predictable corner.
    let anchor = sorted.find(free) ?? sorted[0]
    let span = free(anchor) ? runFrom(anchor) : 1
    for (const c of sorted) {
      if (!free(c)) continue
      const run = runFrom(c)
      if (run > span) { anchor = c; span = run }
    }
    // Abbreviation ladder (used only as a last resort):
    //   multi-word â†’ initials (FRONT YARD â†’ FY), single-word â†’ first 3 chars (KITCHEN â†’ KIT)
    // Prefer wrapping or font-shrink over initials â€” see label render below.
    const words = rm.name.trim().toUpperCase().split(/\s+/)
    const abbr = words.length > 1
      ? words.map(w => w[0]).join('')
      : words[0].slice(0, 3)
    return { name: rm.name, abbr, row: anchor.row, col: anchor.col, span }
  })

  const isPlacing = !!placingFurniture && !!onPlaceFurniture
  // A suspect can carry several clues, each with its own board target, so the
  // highlight is normalised to a list and every target is squared off. Showing
  // only the first of two constraints reads as the whole answer.
  const targets: ClueTarget[] = highlight ? (Array.isArray(highlight) ? highlight : [highlight]) : []
  const highlightedCells = new Set(
    targets.flatMap(target => (target.cells ?? []).map(cell => `${cell.row},${cell.col}`)),
  )
  const highlightedRooms = new Set(targets.map(target => target.roomId).filter(Boolean))
  const highlightedFurniture = new Set(targets.map(target => target.furniture).filter(Boolean))
  const highlightDescriptionId = targets.length && highlightLabel ? `clue-target-${puzzle.id}` : undefined

  return (
    /*
      The board fills whatever box the layout gives it. The old
      `max-w-[580px] mx-auto` pinned it to 580px on any monitor.
      `aspect-ratio: 1/1` STAYS: this is an NÃ—N grid of square cells.
      Sizing is the parent's job (GameScreen's centre column).
    */
    <div
      data-testid="board"
      className="relative w-full h-full select-none"
      style={{ aspectRatio: '1 / 1' }}
      aria-describedby={highlightDescriptionId}
    >
      {highlightDescriptionId && (
        <span id={highlightDescriptionId} className="sr-only">
          Projector highlight for the selected clue: {highlightLabel}
        </span>
      )}
      {/* interactive cell grid */}
      <div
        data-grid=""
        data-board-frame="noire"
        className="continuity-board w-full h-full overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          gridTemplateRows: `repeat(${N}, 1fr)`,
          // Bold black board-game frame â€” physical object sitting on the desk.
          border: `5px solid ${WALL}`,
          // Directional shadow: lifts the board off the dark desk like a physical object.
          boxShadow: `
            0 20px 48px rgba(26,18,22,0.72),
            0 7px 17px rgba(36,24,32,0.62),
            0 1px 0 0 rgba(221,195,145,0.18),
            inset 0 0 0 1px rgba(214,180,125,0.22)
          `,
          background: ESPRESSO,
          gap: '0',
        }}
      >
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const id = roomOf[r][c]
            const mark = marks[r][c]
            const furn = furnByCell[`${r},${c}`] ?? []
            const wallR = c < N - 1 && roomOf[r][c + 1] !== id
            const wallB = r < N - 1 && roomOf[r + 1][c] !== id
            const person = mark.kind === 'person' ? personById(mark.person) : null
            const conflicted = person ? conflicts.has(person.id) : false
            const locked = mark.kind === 'person' && mark.locked
            const isAutoX = mark.kind === 'x' && mark.auto
            const tokenSize = Math.max(26, 340 / N)
            const roomLabel = room(id)?.name ?? ''
            const material = roomMaterial(roomLabel)
            const isOutdoor = material === 'front-yard' || material === 'garden'
            const darkFloor = isDarkFloor(material)
            const draftNames = mark.kind === 'draft'
              ? mark.persons.map(pid => personById(pid)?.name).filter(Boolean).join(', ')
              : ''
            const furnNames = furn.map(f => FURNITURE_NAME[f.type]).join(', ')
            const cellKey = `${r},${c}`
            const isHovered = hoverCell === cellKey
            const showPreview = isPlacing && isHovered && !!placingFurniture
            const isClueTarget = Boolean(
              targets.length && (
                highlightedRooms.has(id)
                || furn.some(item => highlightedFurniture.has(item.type))
                || highlightedCells.has(`${r},${c}`)
              )
            )

            // X mark colour: dark on light floors, white on dark floors.
            // Plus a contrasting text-shadow so neither extreme washes it out.
            const xColor = darkFloor ? '#FFFFFF' : '#1A1008'
            const xShadow = darkFloor
              ? '0 0 3px rgba(26,26,26,0.9), 0 1px 4px rgba(26,26,26,0.72)'
              : '0 0 3px rgba(244,233,208,0.9), 0 1px 3px rgba(244,233,208,0.6)'

            return (
              <button
                key={cellKey}
                data-cell={`${r}-${c}`}
                onClick={() => isPlacing ? onPlaceFurniture!(r, c) : onCellClick(r, c)}
                onMouseEnter={() => isPlacing && setHoverCell(cellKey)}
                onMouseLeave={() => isPlacing && setHoverCell(null)}
                onKeyDown={(e) => handleCellKey(e, r, c, N)}
                title={draftNames ? `Maybe: ${draftNames}` : furnNames || undefined}
                /* The ROOM NAME is load-bearing in the accessible name. Clues
                   say "In the Kitchen" and "Beside the rug", so a player using
                   a screen reader who only hears "Row 1, column 2, Bed" cannot
                   connect a cell to the clue that references it. Sighted players
                   read the room off the floor material and the label stamp;
                   this is the equivalent. */
                aria-label={`Row ${r + 1}, column ${c + 1}${roomLabel ? `, ${roomLabel}` : ''}${person ? `, ${person.name}` : draftNames ? `, drafts: ${draftNames}` : furnNames ? `, ${furnNames}` : ''}${mark.kind === 'x' ? ', marked empty' : ''}${isClueTarget && highlightLabel ? `, matches clue: ${highlightLabel}` : ''}`}
                data-clue-target={isClueTarget ? 'true' : undefined}
                /* Focus ring: SOLID var(--color-accent-strong), never --board-glow.
                   The glow variant is 50% alpha and composites to ~1.8:1 on light
                   floors â€” fails WCAG 2.4.11. This is the only focus indicator. */
                className="group relative flex items-center justify-center focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--color-accent-strong)] transition-transform active:scale-[0.97]"
                style={{
                  // Floor pattern lives on a dedicated child span so marks/tokens
                  // are unaffected by any filter applied to the floor layer.
                  // Room walls: a 3px espresso block + 1px bone hairline so the
                  // divider reads on dark floors. Total border = 4px to match the
                  // existing geometry. Cell-internal lines stay hairline.
                  borderRight: wallR
                    ? `3px solid ${WALL}`
                    : isOutdoor
                      ? `1px dashed rgba(26, 26, 26, 0.5)`
                      : `1px solid rgba(26, 26, 26, 0.5)`,
                  borderBottom: wallB
                    ? `3px solid ${WALL}`
                    : isOutdoor
                      ? `1px dashed rgba(26, 26, 26, 0.5)`
                      : `1px solid rgba(26, 26, 26, 0.5)`,
                  // Bone-highlight stripe on the far side of each room wall so the
                  // boundary reads on any dark floor. outline-based hairlines don't
                  // shift layout; box-shadow inset covers the right+bottom edges.
                  boxShadow: (wallR || wallB)
                    ? [
                        wallR ? `inset -1px 0 0 0 ${WALL_SEAM}` : '',
                        wallB ? `inset 0 -1px 0 0 ${WALL_SEAM}` : '',
                      ].filter(Boolean).join(', ')
                    : undefined,
                  cursor: isPlacing ? 'crosshair' : 'pointer',
                  ...(showPreview ? {
                    outline: '2px dashed color-mix(in srgb, var(--color-text-primary) 65%, transparent)',
                    outlineOffset: '-4px',
                  } : {}),
                }}
              >
                {isClueTarget && (
                  <span aria-hidden className="clue-projector-trace absolute inset-[3px] z-[2] pointer-events-none" />
                )}
                {/* Hover ring.
                    On a CHILD rather than the button because the button already
                    carries an inline boxShadow for room-wall seams, and an inline
                    style beats a class — cells on a wall would silently lose the
                    effect while their neighbours kept it.
                    INSET, so pointing at a cell never nudges the board by a pixel
                    the way an outline or border would.
                    Behind `@media (hover: hover)` so it cannot stick to the last
                    tapped cell on a touch screen, which is what a JS-tracked
                    hover does. It also sits BELOW the focus ring's z-10, so a
                    keyboard user can still see where focus is while the mouse
                    rests somewhere else. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[3] hidden [@media(hover:hover)]:group-hover:block"
                  style={{ boxShadow: 'inset 0 0 0 3px var(--color-accent-strong)' }}
                />
                {/* floor layer â€” SVG material tile, behind all marks and avatars.
                    Rendered first so it sits behind everything without z-index tricks.
                    The preview brightness boost only touches the floor, not tokens. */}
                <span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    ...floorStyle(material),
                    filter: [
                      'brightness(var(--board-floor-brightness, 1))',
                      'saturate(var(--board-floor-saturate, 1))',
                      showPreview ? 'brightness(1.12)' : '',
                    ].filter(Boolean).join(' '),
                  }}
                />

                {/* Ghost of the other storey: shows THAT someone is stacked
                    above or below this cell without competing with the active
                    floor. aria-hidden and non-interactive — the live region and
                    the floor switcher carry this for assistive tech. */}
                {ghostMarks?.[r]?.[c]?.kind === 'person' && mark.kind === 'empty' && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-[22%] rounded-full"
                    style={{
                      border: '1px dashed color-mix(in srgb, var(--color-text-primary) 38%, transparent)',
                      opacity: 0.5,
                    }}
                  />
                )}

                {/* A row or column spent on the other storey is spent here too. */}
                {(blockedRows?.has(r) || blockedCols?.has(c)) && mark.kind === 'empty' && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'color-mix(in srgb, var(--color-bg-inset) 46%, transparent)',
                    }}
                  />
                )}

                {/* Furniture is NOT drawn per cell — see the spanning overlay
                    below the grid. A bed that covers 2x2 cells has to be one
                    bed, not four. */}

                {/* placement ghost preview */}
                {showPreview && (() => {
                  const Icon = FURNITURE_ICON[placingFurniture!]
                  return (
                    <span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        transform: placingRotation ? `rotate(${placingRotation}deg)` : undefined,
                        opacity: 0.65,
                      }}
                    >
                      <Icon />
                    </span>
                  )
                })()}

                {/* mark: x â€” reads on both light and dark floors via dual-tone treatment */}
                {mark.kind === 'x' && (
                  <span
                    className="relative flex items-center justify-center"
                    style={{ color: xColor, filter: `drop-shadow(${xShadow})` }}
                  >
                    <X
                      size={Math.max(16, 150 / N)}
                      strokeWidth={isAutoX ? 2.0 : 2.5}
                      style={{ opacity: isAutoX ? 0.55 : 0.88 }}
                    />
                  </span>
                )}

                {/* mark: draft â€” dossier initial chips with opaque plates */}
                {mark.kind === 'draft' && (
                  <span className="absolute inset-[8%] flex flex-wrap items-center justify-center gap-1 content-center">
                    {mark.persons.slice(0, 4).map(pid => {
                      const p = personById(pid)!
                      const sz = Math.max(18, 130 / N)
                      return (
                        <span
                          key={pid}
                          title={p.name}
                          className="flex items-center justify-center font-display font-bold leading-none"
                          style={{
                            width: sz, height: sz,
                            fontSize: Math.max(10, sz * 0.55),
                            borderRadius: 2,
                            border: `1.5px solid ${p.accent}`,
                            color: p.accent,
                            // Opaque cream plate so chips are legible on any floor
                            background: '#F5EED8',
                            boxShadow: '0 1px 4px rgba(36,24,32,0.45)',
                          }}
                        >{p.name[0]}</span>
                      )
                    })}
                  </span>
                )}

                {/* mark: person â€” suspect token with accent or danger ring */}
                {person && (
                  <motion.span
                    key={person.id}
                    {...snapIn}
                    className={`relative ${conflicted ? 'animate-pulse' : ''}`}
                    style={{
                      boxShadow: conflicted
                        ? '0 0 0 2px #fff, 0 0 0 4px var(--color-danger), 0 0 10px var(--color-danger)'
                        : `0 0 0 2px ${person.accent}, 0 0 0 3px rgba(36,24,32,0.66)`,
                      borderRadius: 6,
                      // Two-layer drop-shadow so token reads on light AND dark floors
                      filter: 'drop-shadow(0 2px 5px rgba(36,24,32,0.76)) drop-shadow(0 0 2px rgba(36,24,32,0.5))',
                    }}
                  >
                    <Avatar seed={person.avatarSeed} accent={person.accent} size={tokenSize} dead={person.isVictim} name={person.name} />
                    {/* Colour-independent initial — legible under any form of
                        colour-vision deficiency because it is a printed letter,
                        not a colour cue. aria-hidden: the cell aria-label already
                        carries the person's name.
                        Threshold: hide below 32px where it blurs; at 32–39px use
                        10px (ramp floor); at 40px+ use 11px. */}
                    {tokenSize >= 32 && (() => {
                      const lum = hexLuminance(person.accent)
                      // Contrast against accent fill: >0.36 luminance → dark ink, else white ink
                      // (0.36 ≈ the mid-point where both light and dark achieve AA 3:1 threshold)
                      const inkColor = lum > 0.18
                        ? 'var(--color-miniature-contour-deep, #1A1A1A)'
                        : 'var(--color-step-numeral, #F1E8CE)'
                      const fontSize = tokenSize >= 40 ? 11 : 10
                      return (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 right-0 flex items-center justify-center font-display font-bold leading-none pointer-events-none select-none"
                          style={{
                            fontSize,
                            color: inkColor,
                            width: Math.round(tokenSize * 0.42),
                            height: Math.round(tokenSize * 0.42),
                            borderRadius: 2,
                            background: person.accent,
                            // Fine espresso halo so the chip reads on any floor
                            boxShadow: '0 0 0 1px rgba(36,24,32,0.55)',
                            // Step back slightly so it doesn't obscure the portrait
                            opacity: 0.92,
                          }}
                        >
                          {person.name.trim().charAt(0).toUpperCase()}
                        </span>
                      )
                    })()}
                    {conflicted && (
                      <span
                        className="absolute -top-1.5 -left-1.5 w-4 h-4 flex items-center justify-center font-bold text-[11px] leading-none"
                        title="Two suspects share this row or column"
                        style={{
                          background: 'var(--color-danger)',
                          color: 'var(--color-on-accent)',
                          borderRadius: 2,
                          // Light halo so the badge reads on the mahogany floor too
                          boxShadow: '0 0 0 1.5px var(--color-text-primary)',
                        }}
                      >!</span>
                    )}
                    {locked && !conflicted && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center"
                        style={{
                          background: 'var(--color-accent)',
                          color: 'var(--color-on-accent)',
                          borderRadius: 2,
                          // Same halo treatment for lock badge
                          boxShadow: '0 0 0 1.5px rgba(36,24,32,0.78)',
                        }}
                      >
                        <Lock size={9} strokeWidth={3} />
                      </span>
                    )}
                  </motion.span>
                )}
              </button>
            )
          })
        )}

        {/* ── FURNITURE OVERLAY ──────────────────────────────────────────────
            IMPORTANT: this is `position:absolute` (not a grid item) so the
            100 cell buttons auto-place correctly into the N×N explicit tracks.
            When this div used `gridArea:'1/1/-1/-1'` it occupied all explicit
            grid cells, forcing the buttons into implicit auto rows at ~1px tall —
            that is why the floor tiles appeared to vanish (the floor spans were
            absolute-inset-0 inside a 1px-tall button).

            The overlay uses the same N×N grid internally so `gridColumn` and
            `gridRow` on each piece still work correctly. It sits above the
            buttons (z-index 1) but is `pointer-events-none` so cells remain
            clickable.

            Each piece is flex-centered inside its footprint span so a 2×1 or
            1×2 piece centers its square SVG correctly. Percentage padding was
            wrong for non-square footprints because CSS resolves all four sides
            against the element's WIDTH, so a 2×1 sofa had more left/right
            padding than top/bottom padding. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            gridTemplateRows: `repeat(${N}, 1fr)`,
            zIndex: 1,
            // Published so each sprite can size itself in CELLS from its own
            // intrinsic pixels, which is the only way a kit of tightly-cropped
            // renders keeps its true relative proportions.
            ['--cell' as string]: `calc(100% / ${N})`,
          }}
        >
          {allFurniture.map((f, i) => {
            const { w, h } = furnitureFootprint(f)
            const rot = f.rotation ?? 0
            // A piece with purpose-drawn side artwork is never spun by CSS: the
            // turned view is DRAWN, so its top plane and light stay put. 270deg
            // is the same drawing mirrored, which a cabinet projection survives
            // (a mirror keeps the top plane on top and the front face forward).
            const sideIcon = FURNITURE_ICON_SIDE[f.type]
            const useSideArt = (rot === 90 || rot === 270) && !!sideIcon
            const Icon = useSideArt ? sideIcon! : FURNITURE_ICON[f.type]
            // A piece under a suspect token or a struck-out cell steps back
            // rather than disappearing, so the room keeps its shape.
            const covered = furnitureCells(f)
              .filter(cell => cell.row < N && cell.col < N)
              .map(cell => marks[cell.row][cell.col])
            const underToken = covered.some(m => m.kind === 'person')
            const struck = covered.length > 0 && covered.every(m => m.kind === 'x')
            // Icon size: all pieces fill nearly their entire footprint.
            // Size differences come from how many cells the piece occupies,
            // not from shrinking the glyph. 94% on both 1×1 and multi-cell
            // footprints gives a consistent near-flush fill with a thin margin.
            // How far this piece rises above its footprint, in cell heights.
            // Clamped on the back row: a piece on row 0 would otherwise lift out
            // through the board's frame. The reference art lets a tree do exactly
            // that, but our board draws a heavy frame and the overflow would be
            // sliced by it, which reads as a rendering fault rather than depth.
            //
            // A piece whose footprint is non-square and which is rotated a
            // quarter turn must be LAID OUT in its unrotated aspect and then
            // rotated, or the artwork letterboxes to the narrow axis. The 2x1
            // pieces carry a 200x100 viewBox, so dropping one into a 1-wide,
            // 2-tall box fits it to the WIDTH and renders it at half a cell
            // tall — a tiny sofa marooned in a tall gap, which is what the
            // live board showed. Swapping the box back to landscape and
            // rotating it lands the art flush inside the real footprint.
            // Side artwork is already drawn portrait, so it needs no box swap —
            // only the rotate-the-drawing fallback does.
            return (
              <span
                key={`${f.type}-${f.row}-${f.col}-${i}`}
                data-furniture-icon={f.type}
                style={{
                  gridColumn: `${f.col + 1} / span ${w}`,
                  gridRow: `${f.row + 1} / span ${h}`,
                  position: 'relative',
                  opacity: underToken ? 0.3 : struck ? 0.18 : 1,
                  // Stacking follows the board's own perspective: rows further
                  // down are nearer the viewer, so a piece must be drawn OVER
                  // anything behind it and UNDER anything in front. Without an
                  // explicit z-index this falls back to DOM order, which is the
                  // generator's placement order — i.e. random-looking overlaps
                  // once pieces start rising out of their footprint below.
                  zIndex: f.row + 1,
                }}
              >
                {/* SPRITE RENDERING — the artwork is shown whole and untouched.

                    Kenney's pieces are pre-rendered isometric objects, and an
                    isometric object is far taller than the patch of floor it
                    stands on. The previous pass boxed each one at 94% of a cell
                    with `object-fit: contain`, so `contain` solved for the
                    HEIGHT and shrank the piece until its base covered a
                    fraction of its own square — every object read as a tiny
                    miniature marooned in a big tile. A drop-shadow was then
                    layered over art that already carries a baked contact
                    shadow, and the vertical lift stretched what was left.

                    None of that machinery runs here. The footprint span is the
                    only box, and the sprite anchors itself to the bottom of it,
                    draws wider than the cell so its base lands ON the square,
                    and rises freely out of the top. Rotation is unnecessary
                    because the kit ships four pre-rendered facings — the turned
                    view is real art, not a spun copy of the front. */}
                <Icon />
              </span>
            )
          })}
        </div>
      </div>

      {/* label overlay â€” same grid tracks, anchored corner stamps.
          At Nâ‰¥6 (â‰¤48px cells) the full name is too wide to fit without
          occluding playable area, so we render initials/short-code instead.
          The full name is always present via `title` (DOM attribute) and via
          a visually-hidden <span> so screen readers announce it in full.

          Design: evidence-tab room labels â€” dark plate, white text, bold.
          Hugs the top-left corner of the anchor cell over the wall line. */}
      <div
        className="absolute inset-0 pointer-events-none p-[2px]"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          gridTemplateRows: `repeat(${N}, 1fr)`,
        }}
      >
        {labelAnchors.map((l, i) => {
          // Label strategy â€” ranked by readability, initials only as true last resort:
          //
          //   1. FULL NAME, wrapping to 2 lines. Always tried first for multi-word
          //      names. Even a 1-cell-wide room has ~80â€“160px width and can show
          //      "LIVING / ROOM" across two lines at 9px.
          //
          //   2. FULL NAME single-line with ellipsis for short single-word names
          //      that fit without wrapping.
          //
          //   3. INITIALS â€” only when the name is a single word longer than 6 chars
          //      AND the cell span is 1. (e.g. hypothetical "Conservatory" span=1).
          //      Visible abbr is aria-hidden; full name in title + sr-only span.
          //
          // "Living Room" span=1 â†’ multi-word â†’ strategy 1: wraps to 2 lines âœ“
          // "Bathroom"    span=2 â†’ single word, short â†’ strategy 2 âœ“
          // "Pantry"      span=1 â†’ single word, â‰¤6 chars â†’ strategy 2 âœ“

          const words = l.name.trim().split(/\s+/)
          const isMultiWord = words.length > 1
          // Only fall to initials for genuinely unbreakable single-word long names
          const useInitials = !isMultiWord && l.span < 2 && l.name.length > 6
          // Wrap multi-word names regardless of span
          const wrapLabel = isMultiWord && !useInitials

          return (
            <span
              key={i}
              title={l.name}
              className="font-mono uppercase self-start justify-self-start"
              style={{
                gridColumnStart: l.col + 1,
                // Initials fit in 1 col; wrapping names span their room width.
                gridColumnEnd: useInitials ? 'span 1' : `span ${l.span}`,
                gridRowStart: l.row + 1,
                color: '#F4E9D0',
                // Font: 9px floor always. Scale up to 11px at Nâ‰¤5, shrink at N=7.
                fontSize: useInitials ? '10px' : `clamp(10px, ${Math.round(110 / N)}px, 11px)`,
                background: 'rgba(36,24,32,0.9)',
                borderRadius: 2,
                padding: useInitials ? '1px 3px' : '2px 6px',
                letterSpacing: useInitials ? '0.06em' : '0.12em',
                margin: useInitials ? '2px' : '4px',
                // Allow wrapping for multi-word names with â‰¥2 span; clamp single-line otherwise.
                whiteSpace: wrapLabel ? 'normal' : 'nowrap',
                wordBreak: wrapLabel ? 'normal' : undefined,
                maxWidth: '100%',
                overflow: 'hidden',
                // textOverflow only applies when nowrap
                textOverflow: wrapLabel ? undefined : 'ellipsis',
                display: 'block',
                fontWeight: 700,
                // Prevent the label growing beyond 2 lines even if name is very long.
                WebkitLineClamp: wrapLabel ? 2 : undefined,
                WebkitBoxOrient: wrapLabel ? 'vertical' as const : undefined,
              }}
            >
              {/* Visible text: initials when compact, full name otherwise */}
              <span aria-hidden={useInitials || undefined}>{useInitials ? l.abbr : l.name}</span>
              {/* SR-only full name when visible text is abbreviated */}
              {useInitials && <span className="sr-only">{l.name}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}
