import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { warmAvatars } from '../components/avatarImage'
import { useElementSize } from '../reference/shell/useElementSize'
import { loadBoard } from './board'
import { browserMetrics } from './measure'
import type { BoardModule } from './board'
import { Bar } from './Bar'
import { Chips } from './Chips'
import { cellKey, conflictIds, firstName, floorsOf, norm } from './cells'
import type { Placement } from './cells'
import { initState, reduce, toSaved } from './game'
import { nextStep } from './hint'
import { lensCells, reserveHeightFor, satisfiedIds, statementReady, statementsOf } from './lens'
import { Menu } from './Menu'
import { Plan } from './Plan'
import type { Measure } from './Plan'
import { Rail } from './Rail'
import { Readout } from './Readout'
import { buildRecon } from './recon'
import { Replay } from './Replay'
import { Alibis } from './Alibis'
import { buildRollCall, computedClosing } from './rollcall'
import { loadSave, writeSave } from './save'
import { Sheet } from './Sheet'
import { cueFor, loadSoundPref, playCue, primeAudio, saveSoundPref } from './sound'
import { fillNames, storyFor, titleFor, visibleStory } from './stories'
import { suppose } from './suppose'
import { chooseTheme, useCompact, useReducedMotion, useSliceTheme } from './theme'
import { TIER_LABEL, tierOf } from './verdict'
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
  const [roll, setRoll] = useState<{ step: number } | null>(null)
  const [auto, setAuto] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const compact = useCompact(rootRef)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [panelH, setPanelH] = useState(0)
  const avail = useElementSize(stageRef)
  const [sound, setSound] = useState(loadSoundPref)

  useEffect(() => { warmAvatars(); let live = true; loadBoard().then(m => { if (live) setBoard(m) }, () => {}); return () => { live = false } }, [])
  useEffect(() => { writeSave(puzzle.id, toSaved(state)) }, [puzzle.id, state.placement, state.pencil, state.strikes, state.outcome, state.hintsUsed, state.revealed]) // eslint-disable-line

  const story = useMemo(() => storyFor(puzzle), [puzzle])
  const solved = state.outcome === 'proved' || state.outcome === 'called' || state.outcome === 'cold'
  const vis = visibleStory(story, solved)
  const recon = useMemo(() => buildRecon(puzzle), [puzzle])
  const rollcall = useMemo(() => buildRollCall(puzzle), [puzzle])
  const rollEnd = rollcall.cleared.length + 2
  const [chipsW, setChipsW] = useState(340)
  // The face for the statements loads late: measure again once it has.
  const [fontEpoch, setFontEpoch] = useState(0)
  useEffect(() => {
    const bump = () => setFontEpoch(n => n + 1)
    document.fonts?.ready.then(bump, () => {})
    document.fonts?.addEventListener?.('loadingdone', bump)
    return () => document.fonts?.removeEventListener?.('loadingdone', bump)
  }, [])
  const reserve = useMemo(() => reserveHeightFor(puzzle, chipsW, compact, browserMetrics()), [puzzle, chipsW, compact, fontEpoch]) // eslint-disable-line
  const floors = floorsOf(puzzle)

  // ---- what the board shows --------------------------------------------------
  const frames = recon.frames
  const finale = !!replay && replay.step >= frames.length
  const away = !!replay || !!roll
  const shown: Placement = useMemo(() => {
    if (replay) {
      const out: Placement = {}
      const upto = finale ? frames.length : replay.step + 1
      for (const f of frames.slice(0, upto)) out[f.person] = norm(f.cell)
      return out
    }
    if (roll) {
      // The scene, then each person as their alibi is read, then the one left. Always the true plan.
      const out: Placement = { [rollcall.victim.person]: norm(rollcall.victim.cell) }
      rollcall.cleared.forEach((c, j) => { if (j <= roll.step - 1) out[c.person] = norm(c.cell) })
      if (roll.step >= rollcall.cleared.length + 1) out[rollcall.last.person] = norm(rollcall.last.cell)
      return out
    }
    return state.placement
  }, [replay, roll, rollcall, finale, frames, state.placement])
  const rolling = !!roll && !replay
  const rollDim = useMemo(() => (rolling ? new Set(rollcall.cleared.filter((_, j) => j < roll.step - 1).map(c => c.person)) : undefined), [rolling, roll, rollcall])
  const rollNow = rolling && roll.step >= 1 && roll.step <= rollcall.cleared.length ? rollcall.cleared[roll.step - 1].person : null
  const rollRing = rolling && roll.step >= rollcall.cleared.length + 1 ? rollcall.last.person : null
  const conflicts = useMemo(() => (away ? new Set<string>() : conflictIds(state.placement)), [away, state.placement])
  const lit = state.lit[state.selected] ?? NONE
  const lens = useMemo(() => (away ? null : lensCells(puzzle, state.selected, lit, state.placement)), [away, puzzle, state.selected, lit, state.placement])
  const crosses = useMemo(() => new Set(away ? [] : state.pencil[state.selected] ?? []), [away, state.pencil, state.selected])
  const report = useMemo(() => (state.ghost && !away ? suppose(puzzle, state.ghost) : null), [state.ghost, away, puzzle])
  // Lit "N rows north of X" statements, drawn as a thin measured line from X once X stands somewhere.
  const measures = useMemo<Measure[]>(() => {
    if (away) return []
    return statementsOf(puzzle, state.selected).flatMap(st => {
      const c = st.clue
      if (!lit.includes(st.index) || !statementReady(st, state.placement) || c.kind !== 'direction' || !c.steps) return []
      return [{ from: state.placement[c.other], dir: c.dir, steps: c.steps }]
    })
  }, [away, puzzle, state.selected, lit, state.placement])
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
  // Lit squares that exist only on a floor out of view: the board would look dark. Say where they are.
  const litFloor = useMemo(() => {
    if (!lens?.size || [...lens].some(k => k.startsWith(`${state.floor}:`))) return null
    return Math.min(...[...lens].map(k => Number(k.split(':')[0])))
  }, [lens, state.floor])
  const placedOther = Object.values(shown).filter(c => cellFloor(c) === otherFloor).length
  const floorName = (f: number) => (f === 0 ? 'Ground' : f === 1 ? 'Upstairs' : `Floor ${f + 1}`)

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

  // The panel keeps its play-time height during the proof and the roll-call, so the board never resizes between them.
  useLayoutEffect(() => { if (!away && panelRef.current) setPanelH(panelRef.current.offsetHeight) }, [away, avail.w, avail.h, state.hint, state.ghost, state.outcome, state.selected])

  // ---- the proof (the solver's order, behind "Show the proof") ------------------
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
  const startProof = () => { setAuto(false); setReplay({ step: 0 }) }

  // ---- the alibi roll-call -------------------------------------------------------
  // The plan follows each person to their floor.
  useEffect(() => {
    if (!roll || replay) return
    const n = rollcall.cleared.length
    const cell = roll.step === 0 ? rollcall.victim.cell : roll.step <= n ? rollcall.cleared[roll.step - 1].cell : rollcall.last.cell
    dispatch({ t: 'floor', floor: cellFloor(cell) })
  }, [roll, replay, rollcall])
  // About 0.9 s per suspect; the scene and the last one are held a beat longer. Reduced motion never runs the clock.
  useEffect(() => {
    if (!roll || replay || reduced || roll.step >= rollEnd) return
    const wait = roll.step === rollEnd - 1 ? 1500 : roll.step === 0 ? 1200 : 900
    const t = window.setTimeout(() => setRoll(r => (r && r.step < rollEnd ? { step: r.step + 1 } : r)), wait)
    return () => window.clearTimeout(t)
  }, [roll, replay, reduced, rollEnd])
  const advanceRoll = useCallback(() => setRoll(r => (r && r.step < rollEnd ? { step: r.step + 1 } : r)), [rollEnd])
  const startRoll = useCallback(() => {
    setSheet(false); dispatch({ t: 'reveal' }); dispatch({ t: 'clearVerdict' }); setReplay(null); setAuto(false)
    setRoll({ step: reduced ? rollEnd : 0 })
  }, [reduced, rollEnd])
  // A right name goes straight into the roll-call, whatever the plan: the sheet never names the murderer or the
  // verdict. Both land at the end of the roll-call.
  useLayoutEffect(() => {
    const k = state.verdict?.kind
    if (k === 'proved' || k === 'provedHelp' || k === 'calledIt') startRoll()
  }, [state.verdict, startRoll])

  // ---- accuse -----------------------------------------------------------------
  const accuse = (id: string) => { setAccused(id); dispatch({ t: 'accuse', id }) }
  const closeSheet = useCallback(() => { setSheet(false); dispatch({ t: 'clearVerdict' }) }, [])

  const sel = puzzle.people.find(p => p.id === state.selected)!
  const role = vis.roleOf(sel.id)
  const hint = state.hint

  const onCell = useCallback((cell: Parameters<typeof norm>[0]) => (replay ? advance() : roll ? advanceRoll() : dispatch({ t: 'cell', cell })), [replay, roll, advance, advanceRoll])
  const onLong = useCallback((cell: Parameters<typeof norm>[0]) => { if (!away) dispatch({ t: 'long', cell }) }, [away])

  const firstMove = state.history.length === 0 && Object.keys(state.placement).length === 0
  const [premiseOpen, setPremiseOpen] = useState(false)
  const holds = useMemo(() => (away ? new Set<string>() : satisfiedIds(puzzle, state.placement)), [away, puzzle, state.placement])

  // Sound: a cue for what just changed. Never on first render, never while off.
  const prev = useRef(state)
  useEffect(() => {
    const before = prev.current
    prev.current = state
    const cue = sound ? cueFor(before, state) : null
    // The verdict jingles wait for the end of the roll-call: a right name must not be heard before it is read out.
    if (cue && cue !== 'proved' && cue !== 'called') playCue(cue)
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
  const tier = tierOf(state.outcome, state.hintsUsed, state.strikes, state.revealed)
  const tierLabel = tier ? TIER_LABEL[tier] : 'The case went cold'
  const rollDone = !!roll && roll.step >= rollEnd
  useEffect(() => {
    if (sound && rollDone && tier) playCue(tier === 'calledIt' ? 'called' : 'proved')
  }, [rollDone]) // eslint-disable-line
  const closing = fillNames(puzzle, vis.closing ?? computedClosing(puzzle))
  const alibi = sel.isVictim ? null : vis.alibiOf(sel.id)

  return (
    <div className="cb-root" ref={rootRef} data-compact={compact || undefined} data-theme={theme} data-reduced={reduced || undefined} data-mode={state.supposeOn ? 'suppose' : state.pencilOn ? 'pencil' : undefined}>
      <header className="cb-head">
        <a className="cb-back" href="?casebook=" aria-label="Back to the case list"><ArrowLeft size={22} aria-hidden="true" /></a>
        <h1 className="cb-title">{titleFor(puzzle)}</h1>
        {floors > 1 && (
          <div className="cb-floors" role="group" aria-label="Floor">
            {Array.from({ length: floors }, (_, f) => {
              const n = f === otherFloor ? placedOther : 0
              const caption = f !== otherFloor ? '' : lensOther ? 'lit' : n ? `${n} placed` : ''
              const aria = f !== otherFloor ? floorName(f) : lensOther ? `${floorName(f)}, the lit statement holds here` : n ? `${floorName(f)}, ${n} placed` : floorName(f)
              return (
                <button key={f} type="button" aria-pressed={state.floor === f} aria-label={aria} onClick={() => dispatch({ t: 'floor', floor: f })}>
                  <span>{floorName(f)}</span>
                  {caption && <small className="cb-floor-note" aria-hidden="true">{caption}</small>}
                  {caption && <i className={lensOther ? 'cb-dot cb-dot-lens' : 'cb-dot'} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        )}
        <Menu sound={sound} theme={theme} onSound={toggleSound} onTheme={() => chooseTheme(theme === 'dark' ? 'light' : 'dark')} />
      </header>

      <main className="cb-main">
        <section className="cb-stage">
          <div className="cb-stage-in" ref={stageRef}>
            <Plan
              puzzle={puzzle} floor={state.floor} theme={theme} board={board} avail={{ w: avail.w, h: avail.h }}
              placement={shown} selected={away ? '' : state.selected} conflicts={conflicts} lens={lens} crosses={crosses}
              ghost={away ? null : state.ghost} remaining={remaining} interactive onCell={onCell} onLong={onLong}
              ringed={replay ? (finale ? recon.finale.murderer : null) : rollRing}
              flying={replay && !finale ? frames[replay.step].person : null}
              dimmed={replay ? (finale ? new Set(puzzle.people.map(p => p.id).filter(id => !recon.finale.group.includes(id))) : undefined) : rollDim}
              dusk={rolling} now={rollNow} measures={measures}
            />
          </div>
        </section>

        <section className="cb-panel" ref={panelRef} style={away && panelH ? { height: panelH } : undefined} data-away={away || undefined}>
          {replay ? (
            <Replay
              puzzle={puzzle} recon={recon} step={replay.step} auto={auto} onNext={advance} onAuto={() => setAuto(a => !a)}
              onSkip={() => setReplay({ step: frames.length })} onClose={() => { setReplay(null); setAuto(false) }}
            />
          ) : roll ? (
            <Alibis
              puzzle={puzzle} roll={rollcall} step={roll.step} list={reduced} tierLabel={tierLabel} motive={vis.motive} closing={closing}
              onAdvance={advanceRoll} onSkip={() => setRoll({ step: rollEnd })} onProof={startProof} onClose={() => setRoll(null)}
            />
          ) : (
            <>
              <div className="cb-who-line">
                <span className="cb-who-title">{firstName(puzzle, sel.id)}</span>
                <span className="cb-who-role">{[role?.role, sel.isVictim ? 'victim' : ''].filter(Boolean).join(', ')}</span>
                <span className="cb-strikes" aria-label={`${state.strikes} of 3 accusations used`}>{strikeDots.map((on, i) => <i key={i} data-on={on || undefined} />)}</span>
              </div>
              {alibi && <p className="cb-alibi">&ldquo;{alibi}&rdquo;</p>}
              <div className="cb-mid" style={{ '--cb-chips-h': `${reserve}px`, '--cb-readout-h': `${Math.min(88, Math.max(56, 200 - reserve))}px` } as CSSProperties}>
                <Chips puzzle={puzzle} person={sel.id} placement={state.placement} lit={lit} onToggle={index => dispatch({ t: 'lit', index })} />
                <div className="cb-readout" data-testid="readout">
                  <Readout
                    puzzle={puzzle} selected={sel} oneLiner={role?.oneLiner ?? null} premise={vis.premise} premiseOpen={premiseOpen}
                    onTogglePremise={() => setPremiseOpen(o => !o)} ghostPerson={state.ghost?.person ?? null} report={report}
                    hint={hint} outcome={state.outcome} tier={tier} firstMove={firstMove} onRoll={startRoll}
                    lensCue={litFloor === null ? null : { floor: floorName(litFloor), onShow: () => dispatch({ t: 'floor', floor: litFloor }) }}
                  />
                </div>
              </div>
              <Rail puzzle={puzzle} placement={state.placement} selected={state.selected} conflicts={conflicts} holds={holds} contradictions={contradictions} counts={counts} onSelect={id => dispatch({ t: 'select', id })} />
              <Bar
                pencilOn={state.pencilOn} supposeOn={state.supposeOn} canUndo={state.history.length > 0}
                whyDone={state.outcome === 'proved' || !nextStep(puzzle, state.placement)} accuseDisabled={state.outcome === 'cold' || state.outcome === 'proved'}
                onPencil={() => dispatch({ t: 'pencil' })} onSuppose={() => dispatch({ t: 'suppose' })} onUndo={() => dispatch({ t: 'undo' })}
                onWhy={() => dispatch({ t: 'why' })} onAccuse={() => setSheet(true)}
              />
            </>
          )}
        </section>
      </main>

      {sheet && (
        <Sheet
          puzzle={puzzle} verdict={state.verdict} accused={accused} strikes={state.strikes}
          onAccuse={accuse} onBack={closeSheet} onClose={closeSheet} onRoll={startRoll}
        />
      )}
      <div className="cb-sr" role="status" aria-live="polite">{state.announce}</div>
    </div>
  )
}
