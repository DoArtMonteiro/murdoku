import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import type { Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { warmAvatars } from '../components/avatarImage'
import { useElementSize } from '../reference/shell/useElementSize'
import { loadBoard } from './board'
import type { BoardModule } from './board'
import { Bar } from './Bar'
import { Chips } from './Chips'
import { cellKey, conflictIds, floorsOf, norm } from './cells'
import type { Placement } from './cells'
import { initState, reduce, toSaved } from './game'
import { nextStep } from './hint'
import { lensCells, reserveHeightFor, satisfiedIds } from './lens'
import { Plan } from './Plan'
import { Rail } from './Rail'
import { Readout } from './Readout'
import { buildRecon } from './recon'
import { Replay } from './Replay'
import { loadSave, writeSave } from './save'
import { Sheet } from './Sheet'
import { cueFor, loadSoundPref, playCue, primeAudio, saveSoundPref } from './sound'
import { storyFor, visibleStory } from './stories'
import { suppose } from './suppose'
import { useCompact, useReducedMotion, useSliceTheme } from './theme'
import './casebook.css'
import './fonts.css'

const AUTO_MS = 3000
const NONE: readonly number[] = []

export default function Casebook({ puzzle }: { puzzle: Puzzle }) {
  const theme = useSliceTheme()
  const reduced = useReducedMotion()
  const [state, dispatch] = useReducer((s: ReturnType<typeof initState>, a: Parameters<typeof reduce>[2]) => reduce(puzzle, s, a), puzzle, p => initState(p, loadSave(p)))
  const [board, setBoard] = useState<BoardModule | null>(null)
  const [sheet, setSheet] = useState(false)
  const [accused, setAccused] = useState<string | null>(null)
  const [replay, setReplay] = useState<{ step: number } | null>(null)
  const [auto, setAuto] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const compact = useCompact(rootRef)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [panelH, setPanelH] = useState(0)
  const avail = useElementSize(stageRef)
  const [sound, setSound] = useState(loadSoundPref)

  useEffect(() => { warmAvatars(); let live = true; loadBoard().then(m => { if (live) setBoard(m) }, () => {}); return () => { live = false } }, [])
  useEffect(() => { writeSave(puzzle.id, toSaved(state)) }, [puzzle.id, state.placement, state.pencil, state.strikes, state.outcome, state.hintsUsed]) // eslint-disable-line

  const story = useMemo(() => storyFor(puzzle), [puzzle])
  const solved = state.outcome === 'proved' || state.outcome === 'called' || state.outcome === 'cold'
  const vis = visibleStory(story, solved)
  const recon = useMemo(() => buildRecon(puzzle), [puzzle])
  const [chipsW, setChipsW] = useState(340)
  const reserve = useMemo(() => reserveHeightFor(puzzle, chipsW), [puzzle, chipsW])
  const floors = floorsOf(puzzle)

  // ---- what the board shows --------------------------------------------------
  const frames = recon.frames
  const finale = !!replay && replay.step >= frames.length
  const shown: Placement = useMemo(() => {
    if (!replay) return state.placement
    const out: Placement = {}
    const upto = finale ? frames.length : replay.step + 1
    for (const f of frames.slice(0, upto)) out[f.person] = norm(f.cell)
    return out
  }, [replay, finale, frames, state.placement])
  const conflicts = useMemo(() => (replay ? new Set<string>() : conflictIds(state.placement)), [replay, state.placement])
  const lit = state.lit[state.selected] ?? NONE
  const lens = useMemo(() => (replay ? null : lensCells(puzzle, state.selected, lit, state.placement)), [replay, puzzle, state.selected, lit, state.placement])
  const crosses = useMemo(() => new Set(replay ? [] : state.pencil[state.selected] ?? []), [replay, state.pencil, state.selected])
  const report = useMemo(() => (state.ghost && !replay ? suppose(puzzle, state.ghost) : null), [state.ghost, replay, puzzle])
  const remaining = useMemo(() => {
    if (!report || !state.ghost || state.selected === state.ghost.person) return null
    return new Set((report.remaining[state.selected] ?? []).filter(c => cellFloor(c) === state.floor).map(cellKey))
  }, [report, state.ghost, state.selected, state.floor])
  const counts = useMemo(() => {
    if (!report) return null
    const out: Record<string, number> = {}
    for (const id of new Set([...report.linked, ...report.contradictions])) out[id] = report.remaining[id].length
    return out
  }, [report])
  const contradictions = useMemo(() => new Set(report?.contradictions ?? []), [report])

  const otherFloor = state.floor === 0 ? 1 : 0
  const lensOther = !!lens && [...lens].some(k => k.startsWith(`${otherFloor}:`))
  const placedOther = Object.values(shown).some(c => cellFloor(c) === otherFloor)

  // The statements wrap inside the panel: measure it, so the reserved height matches the real width.
  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) return
    const read = () => {
      const cs = getComputedStyle(el)
      const w = Math.floor(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
      if (w > 100) setChipsW(prev => (prev === w ? prev : w))
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  // The panel keeps its play-time height during the replay, so the board never resizes between the two.
  useLayoutEffect(() => { if (!replay && panelRef.current) setPanelH(panelRef.current.offsetHeight) }, [replay, avail.w, avail.h, state.hint, state.ghost, state.outcome, state.selected])

  // ---- replay -----------------------------------------------------------------
  useEffect(() => {
    if (!replay) return
    const f = replay.step >= frames.length ? recon.finale.victimCell : frames[replay.step].cell
    dispatch({ t: 'floor', floor: cellFloor(f) })
  }, [replay, frames, recon])
  const advance = useCallback(() => setReplay(r => (r && r.step < frames.length ? { step: r.step + 1 } : r)), [frames.length])
  useEffect(() => {
    if (!replay || !auto || replay.step >= frames.length) return
    const t = window.setTimeout(advance, AUTO_MS)
    return () => window.clearTimeout(t)
  }, [replay, auto, frames.length, advance])
  const startReplay = () => { setSheet(false); dispatch({ t: 'clearVerdict' }); setReplay({ step: 0 }) }

  // ---- accuse -----------------------------------------------------------------
  const accuse = (id: string) => { setAccused(id); dispatch({ t: 'accuse', id }) }
  const closeSheet = useCallback(() => { setSheet(false); dispatch({ t: 'clearVerdict' }) }, [])

  const sel = puzzle.people.find(p => p.id === state.selected)!
  const role = vis.roleOf(sel.id)
  const hint = state.hint

  const onCell = useCallback((cell: Parameters<typeof norm>[0]) => (replay ? advance() : dispatch({ t: 'cell', cell })), [replay, advance])
  const onLong = useCallback((cell: Parameters<typeof norm>[0]) => { if (!replay) dispatch({ t: 'long', cell }) }, [replay])

  const moved = state.history.length > 0 || Object.keys(state.placement).length > 0 || Object.values(state.lit).some(l => l.length) || state.hintsUsed > 0
  const [premiseOpen, setPremiseOpen] = useState(!moved)
  useEffect(() => { if (moved) setPremiseOpen(false) }, [moved])
  const holds = useMemo(() => (replay ? new Set<string>() : satisfiedIds(puzzle, state.placement)), [replay, puzzle, state.placement])

  // Sound: a cue for what just changed. Never on first render, never while off.
  const prev = useRef(state)
  useEffect(() => {
    const before = prev.current
    prev.current = state
    const cue = sound ? cueFor(before, state) : null
    if (cue) playCue(cue)
  }, [state, sound])
  // A saved "on" has no audio context after a reload; the browser only allows one from a tap, so make it on the first.
  useEffect(() => {
    if (!sound) return
    const arm = () => { primeAudio() }
    window.addEventListener('pointerdown', arm, { once: true })
    return () => window.removeEventListener('pointerdown', arm)
  }, [sound])
  const toggleSound = () => {
    const on = !sound
    if (on && !primeAudio()) return
    setSound(on); saveSoundPref(on)
    if (on) playCue('lens')
  }

  const strikeDots = Array.from({ length: 3 }, (_, i) => i < state.strikes)

  return (
    <div className="cb-root" ref={rootRef} data-compact={compact || undefined} data-theme={theme} data-reduced={reduced || undefined} data-mode={state.supposeOn ? 'suppose' : state.pencilOn ? 'pencil' : undefined}>
      <header className="cb-head">
        <a className="cb-back" href="?casebook=" aria-label="Back to the case list"><ArrowLeft size={22} aria-hidden="true" /></a>
        <h1 className="cb-title">{puzzle.title}<span className="cb-sub">{puzzle.caseNumber}</span></h1>
        {floors > 1 && (
          <div className="cb-floors" role="group" aria-label="Floor">
            {Array.from({ length: floors }, (_, f) => (
              <button key={f} type="button" aria-pressed={state.floor === f} onClick={() => dispatch({ t: 'floor', floor: f })}>
                {f === 0 ? 'Ground' : f === 1 ? 'Upstairs' : `Floor ${f + 1}`}
                {f === otherFloor && lensOther && <i className="cb-dot cb-dot-lens" aria-label="lens lit here" />}
                {f === otherFloor && !lensOther && placedOther && <i className="cb-dot" aria-label="people placed here" />}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="cb-main">
        <section className="cb-stage">
          <div className="cb-stage-in" ref={stageRef}>
            <Plan
              puzzle={puzzle} floor={state.floor} theme={theme} board={board} avail={{ w: avail.w, h: avail.h }}
              placement={shown} selected={replay ? '' : state.selected} conflicts={conflicts} lens={lens} crosses={crosses}
              ghost={replay ? null : state.ghost} remaining={remaining} interactive onCell={onCell} onLong={onLong}
              ringed={finale ? recon.finale.murderer : null}
              flying={replay && !finale ? frames[replay.step].person : null}
              dimmed={finale ? new Set(puzzle.people.map(p => p.id).filter(id => !recon.finale.group.includes(id))) : undefined}
            />
          </div>
        </section>

        <section className="cb-panel" ref={panelRef} style={replay ? { minHeight: panelH } : undefined}>
          {replay ? (
            <Replay
              puzzle={puzzle} recon={recon} step={replay.step} auto={auto} motive={vis.motive}
              proved={state.outcome === 'proved'} onNext={advance} onAuto={() => setAuto(a => !a)}
              onSkip={() => setReplay({ step: frames.length })} onClose={() => { setReplay(null); setAuto(false) }}
            />
          ) : (
            <>
              <div className="cb-who-line">
                <span className="cb-who-title">{sel.name}</span>
                <span className="cb-who-role">{[role?.role, sel.isVictim ? 'victim' : ''].filter(Boolean).join(', ')}</span>
                <span className="cb-strikes" aria-label={`${state.strikes} of 3 strikes`}>{strikeDots.map((on, i) => <i key={i} data-on={on || undefined} />)}</span>
                <button type="button" className="cb-sound" aria-pressed={sound} aria-label="Sound" title="Sound" onClick={toggleSound}>{sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}</button>
              </div>
              <div className="cb-mid" style={{ '--cb-chips-h': `${reserve}px`, '--cb-readout-h': `${Math.min(88, Math.max(56, 200 - reserve))}px` } as CSSProperties}>
                <Chips puzzle={puzzle} person={sel.id} placement={state.placement} lit={lit} onToggle={index => dispatch({ t: 'lit', index })} />
                <div className="cb-readout" data-testid="readout">
                  <Readout
                    puzzle={puzzle} selected={sel} oneLiner={role?.oneLiner ?? null} premise={vis.premise} premiseOpen={premiseOpen}
                    onTogglePremise={() => setPremiseOpen(o => !o)} ghostPerson={state.ghost?.person ?? null} report={report}
                    hint={hint} outcome={state.outcome} onReplay={startReplay}
                  />
                </div>
              </div>
              <Rail puzzle={puzzle} placement={state.placement} selected={state.selected} conflicts={conflicts} holds={holds} contradictions={contradictions} counts={counts} onSelect={id => dispatch({ t: 'select', id })} />
              <Bar
                pencilOn={state.pencilOn} supposeOn={state.supposeOn} canUndo={state.history.length > 0}
                whyDone={!nextStep(puzzle, state.placement)} accuseDisabled={state.outcome === 'cold' || state.outcome === 'proved'}
                onPencil={() => dispatch({ t: 'pencil' })} onSuppose={() => dispatch({ t: 'suppose' })} onUndo={() => dispatch({ t: 'undo' })}
                onWhy={() => dispatch({ t: 'why' })} onAccuse={() => setSheet(true)}
              />
            </>
          )}
        </section>
      </main>

      {sheet && (
        <Sheet
          puzzle={puzzle} verdict={state.verdict} accused={accused} strikes={state.strikes} hintsUsed={state.hintsUsed} motive={vis.motive}
          onAccuse={accuse} onBack={closeSheet} onClose={closeSheet} onFinish={closeSheet} onReplay={startReplay}
        />
      )}
      <div className="cb-sr" role="status" aria-live="polite">{state.announce}</div>
    </div>
  )
}
