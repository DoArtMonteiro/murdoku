import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Briefcase, CircleHelp, Moon, Sun } from 'lucide-react'
import type { Person } from '../../core/types'
import { furnitureAt } from '../../core/engine'
import type { BoardVariant } from '../contract'
import type { BoardModule, GameApi } from './types'
import { Plan } from './Plan'
import type { CellProbe } from './Plan'
import { AccusePanel, SuspectDock, SuspectList, Toolbar } from './Dossier'
import { ClueGlossary, Dialog, HowToPlayBody } from './Dialog'
import { CaseClosed } from './Victory'
import { storyFor } from '../story'
import type { CaseStory } from '../story/schema'
import { CaseIntro } from './Intro'
import { InterrogationBody } from './Interrogation'
import { EvidenceBoard, EvidenceDetailBody, EvidenceMarkers } from './Evidence'
import { ReconPanel, ReconUnder } from './Reconstruction'
import { outsideGrid, useFound, useReconstruction, visibleEvidence } from './storyState'
import { PortraitMap } from './portraitContext'
import type { PlanGeometry } from './geometry'
import { backHref } from './util'
import { clueTargets, mergeTargets, NO_TARGETS } from './clueTargets'
import type { ClueTargets } from './clueTargets'
import { fallbackLayout, fitSquare, phonePlan } from './geometry'
import { useElementSize, useViewport } from './useElementSize'
import './shell.css'

const introKey = (id: string) => `alibi.ref.intro.${id}`
function readIntroSeen(id: string): boolean {
  try { return localStorage.getItem(introKey(id)) === '1' } catch { return false }
}
function writeIntroSeen(id: string): void {
  try { localStorage.setItem(introKey(id), '1') } catch { /* storage unavailable: the card just shows again next visit */ }
}

const ROUTE_COLOURS = ['#c8b6ff', '#ff9d8a', '#7fe0c4', '#ffb15c', '#8ec5ff', '#f3a6d8']

const VARIANT_LABEL: Record<BoardVariant, string> = { nightplan: 'Night Plan', plan3d: 'Plan 3D', illustrated: 'Illustrated' }

interface ShellProps {
  game: GameApi
  board: BoardModule | null
  variant: BoardVariant
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  /** Authored story; undefined = look it up by case id, null = play without one. */
  story?: CaseStory | null
  /** false = never show the opening card (tests, embeds). Default: once per case and viewer. */
  intro?: boolean
}

export function Shell({ game, board, variant, theme: hostTheme, onToggleTheme, story: storyProp, intro }: ShellProps) {
  // The page theme follows the viewer: the toggle, else prefers-color-scheme (useTheme).
  const theme = hostTheme
  const toggleTheme = onToggleTheme
  const puzzle = game.puzzle!
  const story = useMemo(() => (storyProp === undefined ? storyFor(puzzle.id) : storyProp), [storyProp, puzzle.id])
  const portraits = useMemo(() => Object.fromEntries((story?.suspects ?? []).flatMap(s => (s.portrait === undefined ? [] : [[s.personId, s.portrait] as const]))), [story])
  const taleOf = useCallback((id: string) => story?.suspects.find(s => s.personId === id), [story])
  const { found, markFound } = useFound(puzzle.id)
  const [caseFileOpen, setCaseFileOpen] = useState(false)
  const [askId, setAskId] = useState<string | null>(null)
  const [evId, setEvId] = useState<string | null>(null)
  const [backToBoard, setBackToBoard] = useState(false)
  const [introAgain, setIntroAgain] = useState(false)
  const [introSeen, setIntroSeen] = useState(() => intro === false || readIntroSeen(puzzle.id))
  const introOpen = !!story && ((!introSeen && !game.completed) || introAgain)
  const vp = useViewport()
  const wide = vp.w >= 700 && vp.w > vp.h
  const dock = !wide || vp.h < 560
  // Phones shorter than ~760 px: tools and Accuse share one row so nothing is clipped.
  const compact = !wide && vp.h < 760
  const areaRef = useRef<HTMLDivElement>(null)
  const area = useElementSize(areaRef)
  const short = wide && vp.h < 560
  const padH = wide ? (short ? 8 : 32) : 16
  const padV = wide ? (short ? 6 : 16) : 4
  // wide: top 12 px, bottom 22 px (the hover caption lives in that strip)
  // light theme: the night board is matted like a pinned photograph (16 px on wide screens; none on phones, where every pixel goes to 44 px cells)
  const mat = theme === 'light' && wide ? 16 : 0
  let planSize = fitSquare(area.w - padH * 2 - mat * 2, area.h - (wide && !short ? 34 : padV * 2) - mat * 2)
  // Phone: never let cells drop under a 44 px tap target; the page scrolls instead
  // (the tool row and Accuse are sticky, so they stay on screen).
  // Phone: see phonePlan() for the cell-size policy and what is cropped.
  const phone = !wide ? phonePlan(vp.w - mat * 2, puzzle.size, board?.boardLayout ?? fallbackLayout) : null
  if (phone) planSize = phone.size
  const cropTop = phone?.cropT ?? 0, cropBottom = phone?.cropB ?? 0, cropLeft = phone?.cropL ?? 0, cropRight = phone?.cropR ?? 0
  const slotH = planSize - cropTop - cropBottom
  const slotW = planSize - cropLeft - cropRight

  const floors = puzzle.floors ?? 1
  const floor = Math.min(game.activeFloor, floors - 1)
  const [helpOpen, setHelpOpen] = useState(false)
  const [probe, setProbe] = useState<CellProbe | null>(null)
  const [live, setLive] = useState('')

  // --- reading aid: what each suspect's clues literally name on the plan -----
  const perPerson = useMemo(() => {
    const out = new Map<string, { clues: typeof puzzle.clues; lit: boolean[]; targets: ClueTargets }>()
    for (const p of puzzle.people) {
      const clues = puzzle.clues.filter(c => c.clue.person === p.id)
      const ts = clues.map(c => clueTargets(puzzle, c.clue, floor))
      out.set(p.id, {
        clues,
        lit: ts.map(t => t.rows.length + t.cols.length + t.cells.length > 0),
        targets: mergeTargets(ts),
      })
    }
    return out
  }, [puzzle, floor])
  const litFor = useCallback((p: Person) => perPerson.get(p.id) ?? { clues: [], lit: [], targets: NO_TARGETS }, [perPerson])
  const rc = useReconstruction(puzzle, story, game.completed)
  const washFor = rc?.frame.washFor
  const targets = (rc
    ? (washFor && perPerson.get(washFor)?.targets)
    : (!game.completed && game.selectedPerson && perPerson.get(game.selectedPerson)?.targets)) || NO_TARGETS
  // Footstep colours: bright, distinct on the dark floor and the pale one; the culprit's route turns gold.
  const accent = useCallback((id: string) => ROUTE_COLOURS[Math.max(0, puzzle.people.findIndex(p => p.id === id)) % ROUTE_COLOURS.length], [puzzle])

  // --- announcements ---------------------------------------------------------
  const prevMarks = useRef(game.marks)
  useEffect(() => {
    const old = prevMarks.current
    prevMarks.current = game.marks
    if (old === game.marks) return
    const name = (id: string) => puzzle.people.find(p => p.id === id)?.name ?? 'Someone'
    const msgs: string[] = []
    for (let r = 0; r < puzzle.size; r++) for (let c = 0; c < puzzle.size; c++) {
      const a = old[r]?.[c], b = game.marks[r]?.[c]
      if (!a || !b || a === b) continue
      const spot = `row ${r + 1}, column ${c + 1}`
      if (b.kind === 'person' && !(a.kind === 'person' && a.person === b.person)) msgs.push(`${name(b.person)} placed at ${spot}`)
      else if (a.kind === 'person' && b.kind !== 'person' && !game.placedOf[a.person]) msgs.push(`${name(a.person)} lifted from ${spot}`)
      else if (b.kind === 'x' && a.kind !== 'x') msgs.push(`Crossed out ${spot}`)
      else if (a.kind === 'x' && b.kind !== 'x') msgs.push(`Cross removed at ${spot}`)
    }
    if (msgs.length) setLive(msgs.length > 3 ? `Plan updated, ${msgs.length} squares changed` : msgs.join('. '))
  }, [game.marks, game.placedOf, puzzle])

  const firstSel = useRef(true)
  useEffect(() => {
    if (firstSel.current) { firstSel.current = false; return }
    const p = puzzle.people.find(x => x.id === game.selectedPerson)
    if (p) setLive(`${p.name} selected`)
  }, [game.selectedPerson, puzzle])

  // --- caption ---------------------------------------------------------------
  const selected = puzzle.people.find(p => p.id === game.selectedPerson)
  const roomAt = (r: number, c: number) => {
    const id = puzzle.roomOfByFloor?.[floor]?.[r]?.[c] ?? puzzle.roomOf[r]?.[c]
    return puzzle.rooms.find(x => x.id === id)?.name ?? ''
  }
  let caption: string
  if (probe) {
    const furn = furnitureAt(puzzle, probe.row, probe.col, floor)
    caption = `R${probe.row + 1} · C${probe.col + 1} · ${roomAt(probe.row, probe.col)}${furn.length ? ` · ${furn.join(', ')}` : ''}`
  } else if (game.completed) {
    caption = 'Case closed'
  } else if (game.tool === 'x') {
    caption = `${wide ? 'Choose' : 'Tap'} a square to cross it out`
  } else if (selected && game.placedOf[selected.id]) {
    const at = game.placedOf[selected.id]
    caption = `${selected.name} is at R${at.row + 1} · C${at.col + 1}`
  } else if (selected) {
    caption = `${wide ? 'Choose' : 'Tap'} a square to place ${selected.name}`
  } else caption = ''

  // Rows/columns holding more than one placed person (dashed lane rule on the plan).
  const conflictLanes = useMemo(() => {
    const rc: Record<number, number> = {}, cc: Record<number, number> = {}
    for (const at of Object.values(game.placedOf)) {
      if (at.floor !== floor && floors > 1) { /* rows/cols are global across floors */ }
      rc[at.row] = (rc[at.row] ?? 0) + 1; cc[at.col] = (cc[at.col] ?? 0) + 1
    }
    return {
      rows: Object.keys(rc).map(Number).filter(r => rc[r] > 1),
      cols: Object.keys(cc).map(Number).filter(c => cc[c] > 1),
    }
  }, [game.placedOf, floor, floors])

  const { clickCell } = game
  const onCell = useCallback((r: number, c: number) => clickCell(r, c), [clickCell])
  const onProbe = useCallback((p: CellProbe | null) => setProbe(p), [])

  const showReveal = !!rc?.frame.reveal
  // During play only items in the lot (the porch) are drawn on the plan: nothing may sit inside a cell or take a tap from one.
  // The rest of the evidence is in the drawer. The reconstruction (cells locked) shows every marker, numbered.
  const evItems = useMemo(() => (story
    ? story.evidence.filter(e => game.completed ? (e.showDuringPlay || showReveal) : (e.showDuringPlay && outsideGrid(e, puzzle.size)))
    : []), [story, game.completed, showReveal, puzzle.size])
  const numbered = game.completed
  const drawerItems = useMemo(() => (story ? visibleEvidence(story, game.completed) : []), [story, game.completed])
  const spotlight = useMemo(() => new Set(rc?.frame.spotlight ?? []), [rc?.frame.spotlight])
  const openEvidence = useCallback((id: string) => { setEvId(id); markFound(id) }, [markFound])
  const evFound = useMemo(() => (game.completed ? new Set(evItems.map(e => e.id)) : found), [game.completed, evItems, found])
  const overLayer = useCallback((g: PlanGeometry) => (
    evItems.length ? <EvidenceMarkers layer="hit" geo={g} items={evItems} found={evFound} onOpen={openEvidence} numbered={numbered} /> : null
  ), [evItems, evFound, openEvidence, numbered])
  const underLayer = useCallback((g: PlanGeometry) => (
    <>
      {evItems.length > 0 && <EvidenceMarkers layer="disc" geo={g} items={evItems} found={evFound} spotlight={spotlight} onOpen={openEvidence} numbered={numbered} />}
      {rc && <ReconUnder puzzle={puzzle} rc={rc} geo={g} accent={accent} />}
    </>
  ), [evItems, evFound, spotlight, openEvidence, rc, puzzle, accent, numbered])
  const dim = useMemo(() => {
    if (!rc) return undefined
    return new Set(puzzle.people.map(p => p.id).filter(id => !rc.frame.pinned.includes(id)))
  }, [rc, puzzle])

  const planEl = (
    <Plan
      puzzle={puzzle} floor={floor} size={planSize} theme={theme} board={planSize > 0 ? board : null}
      marks={game.marks} selectedPerson={game.selectedPerson} conflicts={game.conflicts} conflictLanes={conflictLanes}
      targets={targets} locked={game.completed} onCell={onCell} onProbe={onProbe}
      under={underLayer} over={overLayer} dim={dim} ringed={rc?.frame.accuse ? rc.rec.murderer : null}
    />
  )

  const floorControl = floors > 1 && (
    <div className="rs-floors" role="group" aria-label="Storey" data-testid="floor-switch">
      {Array.from({ length: floors }, (_, f) => (
        <button key={f} type="button" className="rs-seg" aria-pressed={floor === f} onClick={() => game.switchFloor?.(f as 0 | 1)}>
          {f === 0 ? 'Ground floor' : f === 1 ? 'Upstairs' : `Floor ${f + 1}`}
        </button>
      ))}
    </div>
  )

  const selectedPerson = game.selectedPerson
  const revealed = game.revealed ?? (game.completed && game.accusationsLeft === 0)
  const closed = game.completed
  const dossier = closed ? (
    <CaseClosed puzzle={puzzle} murdererId={game.murderer} revealed={revealed} onAgain={() => game.start(puzzle.id, 'classic')}>
      {rc && <ReconPanel puzzle={puzzle} rc={rc} revealed={revealed} accent={accent} />}
    </CaseClosed>
  ) : (
    <>
      {dock
        ? <SuspectDock puzzle={puzzle} selectedPerson={selectedPerson} game={game} litFor={litFor} onSelect={game.selectPerson} taleOf={story ? taleOf : undefined} onAsk={story ? setAskId : undefined} />
        : <SuspectList puzzle={puzzle} selectedPerson={selectedPerson} game={game} litFor={litFor} onSelect={game.selectPerson} taleOf={story ? taleOf : undefined} onAsk={story ? setAskId : undefined} />}
      <div className="rs-foot">
        <Toolbar game={game} />
        <AccusePanel game={game} />
      </div>
    </>
  )

  const modalOpen = helpOpen || introOpen || caseFileOpen || !!askId || !!evId
  const askTale = askId ? taleOf(askId) : undefined
  const evItem = evId ? story?.evidence.find(e => e.id === evId) : undefined
  const closeIntro = () => { setIntroAgain(false); setIntroSeen(true); writeIntroSeen(puzzle.id) }

  return (
    <PortraitMap.Provider value={portraits}>
    <div className="rs-app" data-theme-resolved={theme}>
      <div className={`rs-root ${rc ? 'rs-recon-on' : ''} ${rc?.frame.chalk ? 'rs-chalk-on' : ''} ${wide ? 'rs-wide' : 'rs-stack'} ${dock ? 'rs-dock-mode' : ''} ${compact ? 'rs-compact' : ''}`} data-testid="ref-shell" data-variant={variant} data-theme-resolved={theme} inert={modalOpen || undefined}>
        <header className="rs-mast">
          <a className="rs-icon-btn" href={backHref()} aria-label="Back to Alibi" data-testid="exit-link"><ArrowLeft size={18} aria-hidden="true" /></a>
          <div className="rs-title">
            <h1>{puzzle.title}</h1>
            <span className="rs-sub">{puzzle.caseNumber} · {story ? story.setting.estate : variant === 'illustrated' ? puzzle.difficulty : VARIANT_LABEL[variant]}</span>
          </div>
          {story && (
            <button type="button" className="rs-icon-btn rs-ev-btn" onClick={() => setCaseFileOpen(true)} aria-haspopup="dialog" aria-label={`Evidence board, ${drawerItems.filter(e => game.completed || found.has(e.id)).length}/${drawerItems.length} examined`} data-testid="evidence-btn">
              <Briefcase size={18} aria-hidden="true" />
              <span className="rs-ev-badge" aria-hidden="true">{drawerItems.filter(e => game.completed || found.has(e.id)).length}/{drawerItems.length}</span>
            </button>
          )}
          <button type="button" className="rs-icon-btn" onClick={() => setHelpOpen(true)} aria-label="How to play" aria-haspopup="dialog" data-testid="help-btn"><CircleHelp size={18} aria-hidden="true" /></button>
          <button type="button" className="rs-icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} data-testid="theme-btn">
            {theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
        </header>

        <main className="rs-main">
          <section className="rs-boardpanel" aria-label="Floor plan" data-testid="board-panel"
            style={!wide ? { maxHeight: slotH + padV * 2 + (floors > 1 ? 52 : 0), minHeight: Math.min(slotH, (puzzle.size + 1) * 44) + padV * 2 + (floors > 1 ? 52 : 0) } : undefined}>
            {floorControl}
            <div ref={areaRef} className="rs-area" data-testid="plan-area">
              <div className="rs-planslot" style={{ width: slotW, height: slotH, overflow: phone ? 'hidden' : undefined, ['--mat' as string]: `${mat}px` }}>
                <div style={{ marginTop: -cropTop, marginLeft: -cropLeft, width: planSize, height: planSize }}>{planEl}</div>
                {game.feedback === 'wrong' && (
                  <p key={`${game.accusationsLeft ?? ''}-${game.history.length}`} className="rs-wrong" aria-hidden="true" data-testid="wrong-stamp">Not proven</p>
                )}
              </div>
            </div>
            <p className={`rs-caption ${probe ? 'rs-caption-on' : ''}`} data-testid="caption" aria-hidden="true">{caption}</p>
          </section>
          <aside className="rs-dossier" aria-label="Dossier" data-testid="dossier">{dossier}</aside>
        </main>
        <div className="rs-sr" role="status" aria-live="polite" aria-atomic="true" data-testid="live">{live}</div>
      </div>
      {helpOpen && (
        <Dialog title="How to play" onClose={() => setHelpOpen(false)}>
          <HowToPlayBody />
          <ClueGlossary />
        </Dialog>
      )}
      {introOpen && story && (
        <Dialog title={puzzle.title} hideTitle variant="cinema" closeLabel="Skip the opening" onClose={closeIntro}>
          <CaseIntro puzzle={puzzle} story={story} onBegin={closeIntro} />
        </Dialog>
      )}
      {askTale && (
        <Dialog title={`${askTale.fullName}, ${askTale.role}`} hideTitle variant="wide" onClose={() => setAskId(null)}>
          <InterrogationBody puzzle={puzzle} tale={askTale} onShow={() => { game.selectPerson(askTale.personId); setAskId(null) }} />
        </Dialog>
      )}
      {caseFileOpen && story && (
        <Dialog title="Evidence board" variant="wide" onClose={() => setCaseFileOpen(false)}>
          <EvidenceBoard story={story} found={game.completed ? new Set(evItems.map(e => e.id)) : found} over={game.completed} onOpen={id => { setCaseFileOpen(false); setBackToBoard(true); openEvidence(id) }} onReplayIntro={() => { setCaseFileOpen(false); setIntroAgain(true) }} />
        </Dialog>
      )}
      {evItem && (
        <Dialog title={game.completed ? `Evidence ${evItem.n}: ${evItem.label}` : `Evidence: ${evItem.label}`} onClose={() => { setEvId(null); if (backToBoard) { setBackToBoard(false); setCaseFileOpen(true) } }}>
          <EvidenceDetailBody item={evItem} over={game.completed} />
        </Dialog>
      )}
    </div>
    </PortraitMap.Provider>
  )
}
