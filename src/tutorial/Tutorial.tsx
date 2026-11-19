// Case 0 on screen. It is the casebook's own board, statements, portraits, action bar and roll-call
// (imported, not copied), driven by the casebook's own reducer through src/tutorial/play.ts. The
// only things added are the instruction line in the readout slot, a soft amber halo on the control
// the current beat wants, and a prologue card. The casebook itself is untouched.
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cellFloor } from '../core/types'
import { warmAvatars } from '../components/avatarImage'
import { useElementSize } from '../reference/shell/useElementSize'
import { loadBoard } from '../casebook/board'
import type { BoardModule } from '../casebook/board'
import { Alibis } from '../casebook/Alibis'
import { Bar } from '../casebook/Bar'
import { Chips } from '../casebook/Chips'
import { cellKey, conflictIds, firstName, norm } from '../casebook/cells'
import type { Placement } from '../casebook/cells'
import { lensCells, reserveHeightFor, satisfiedIds, statementReady, statementsOf } from '../casebook/lens'
import { Menu } from '../casebook/Menu'
import { Plan } from '../casebook/Plan'
import type { Measure } from '../casebook/Plan'
import { Rail } from '../casebook/Rail'
import { Readout } from '../casebook/Readout'
import { buildRollCall } from '../casebook/rollcall'
import { cueFor, loadSoundPref, playCue, primeAudio, saveSoundPref } from '../casebook/sound'
import { visibleStory } from '../casebook/stories'
import { suppose } from '../casebook/suppose'
import { chooseTheme, useCompact, useReducedMotion, useSliceTheme } from '../casebook/theme'
import { TIER_LABEL, tierOf } from '../casebook/verdict'
import '../casebook/casebook.css'
import '../casebook/fonts.css'
import './tutorial.css'
import { AccuseSheet } from './AccuseSheet'
import { case0, case0Story, INVESTIGATOR_LINE } from './case0'
import { accuseReady, beatFor, BEATS, initTut, tutReduce } from './play'
import type { Target } from './play'
import { writeTutorialFlag } from './storage'

const NONE: readonly number[] = []
const puzzle = case0
// Controls wear a soft amber glow around them. A square wears a pale ring inside itself (the plan clips
// what spills out), drawn on its ::after so it sits above the lens fill. Both pulse; reduced motion keeps them still.
const GLOW = 'animation: var(--tut-glow-anim, tut-glow 1.8s ease-in-out infinite); position: relative; z-index: 4; outline: 2.5px solid #e2a33a; outline-offset: 2px;'
const RING = 'content: ""; opacity: 1 !important; background: transparent !important; animation: var(--tut-ring-anim, tut-ring 1.6s ease-in-out infinite); box-shadow: inset 0 0 0 3.5px #fff6dc, inset 0 0 16px 5px rgba(255, 246, 220, .75);'

/** One soft amber halo per target, as scoped CSS: it survives the board and the chips re-rendering. */
function haloCss(targets: readonly Target[]): string {
  const cells: string[] = [], others: string[] = []
  for (const t of targets) {
    switch (t.kind) {
      case 'cell': cells.push(`.tut-root .cb-cell[data-row="${t.cell.row}"][data-col="${t.cell.col}"]::after`); break
      case 'chip': others.push(`.tut-root .cb-chips li:nth-child(${t.position + 1}) .cb-chip`); break
      case 'who': others.push(`.tut-root .cb-rail li:nth-child(${t.position + 1}) .cb-who`); break
      case 'bar': others.push('.tut-root .cb-bar .cb-accuse'); break
    }
  }
  return [cells.length ? `${cells.join(',')} { ${RING} }` : '', others.length ? `${others.join(',')} { ${GLOW} }` : ''].join(' ')
}

export default function Tutorial() {
  const theme = useSliceTheme()
  const reduced = useReducedMotion()
  const [ts, dispatch] = useReducer((s: ReturnType<typeof initTut>, a: Parameters<typeof tutReduce>[2]) => tutReduce(puzzle, s, a), puzzle, initTut)
  const state = ts.game
  const [board, setBoard] = useState<BoardModule | null>(null)
  const [started, setStarted] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [accused, setAccused] = useState<string | null>(null)
  const [roll, setRoll] = useState<{ step: number } | null>(null)
  const [finished, setFinished] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const compact = useCompact(rootRef)
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [panelH, setPanelH] = useState(0)
  const avail = useElementSize(stageRef)
  const [sound, setSound] = useState(loadSoundPref)
  const [chipsW, setChipsW] = useState(340)
  const lineRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => { warmAvatars(); let live = true; loadBoard().then(m => { if (live) setBoard(m) }, () => {}); return () => { live = false } }, [])

  const vis = useMemo(() => visibleStory(case0Story, state.outcome === 'proved'), [state.outcome])
  const rollcall = useMemo(() => buildRollCall(puzzle), [])
  const rollEnd = rollcall.cleared.length + 2
  const reserve = useMemo(() => reserveHeightFor(puzzle, chipsW, compact), [chipsW, compact])
  const beat = useMemo(() => beatFor(puzzle, ts), [ts])

  // ---- what the board shows ----------------------------------------------------------
  const away = !!roll
  const shown: Placement = useMemo(() => {
    if (!roll) return state.placement
    const out: Placement = { [rollcall.victim.person]: norm(rollcall.victim.cell) }
    rollcall.cleared.forEach((c, j) => { if (j <= roll.step - 1) out[c.person] = norm(c.cell) })
    if (roll.step >= rollcall.cleared.length + 1) out[rollcall.last.person] = norm(rollcall.last.cell)
    return out
  }, [roll, rollcall, state.placement])
  const rollDim = useMemo(() => (roll ? new Set(rollcall.cleared.filter((_, j) => j < roll.step - 1).map(c => c.person)) : undefined), [roll, rollcall])
  const rollNow = roll && roll.step >= 1 && roll.step <= rollcall.cleared.length ? rollcall.cleared[roll.step - 1].person : null
  const rollRing = roll && roll.step >= rollcall.cleared.length + 1 ? rollcall.last.person : null
  const conflicts = useMemo(() => (away ? new Set<string>() : conflictIds(state.placement)), [away, state.placement])
  const lit = state.lit[state.selected] ?? NONE
  const lens = useMemo(() => (away ? null : lensCells(puzzle, state.selected, lit, state.placement)), [away, state.selected, lit, state.placement])
  const crosses = useMemo(() => new Set(away ? [] : state.pencil[state.selected] ?? []), [away, state.pencil, state.selected])
  const report = useMemo(() => (state.ghost && !away ? suppose(puzzle, state.ghost) : null), [state.ghost, away])
  const measures = useMemo<Measure[]>(() => {
    if (away) return []
    return statementsOf(puzzle, state.selected).flatMap(st => {
      const c = st.clue
      if (!lit.includes(st.index) || !statementReady(st, state.placement) || c.kind !== 'direction' || !c.steps) return []
      return [{ from: state.placement[c.other], dir: c.dir, steps: c.steps }]
    })
  }, [away, state.selected, lit, state.placement])
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
  const holds = useMemo(() => (away ? new Set<string>() : satisfiedIds(puzzle, state.placement)), [away, state.placement])

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
  // The panel keeps its play-time height during the roll-call, so the board never resizes under it.
  useLayoutEffect(() => { if (!away && !finished && panelRef.current) setPanelH(panelRef.current.offsetHeight) }, [away, finished, avail.w, avail.h, state.ghost, state.selected, started])

  // ---- the alibi roll-call (the casebook's own, played on the true plan) ---------------
  useEffect(() => {
    if (!roll) return
    dispatch({ t: 'floor', floor: 0 })
  }, [roll])
  useEffect(() => {
    if (!roll || reduced || roll.step >= rollEnd) return
    const wait = roll.step === rollEnd - 1 ? 1500 : roll.step === 0 ? 1200 : 900
    const t = window.setTimeout(() => setRoll(r => (r && r.step < rollEnd ? { step: r.step + 1 } : r)), wait)
    return () => window.clearTimeout(t)
  }, [roll, reduced, rollEnd])
  const advanceRoll = useCallback(() => setRoll(r => (r && r.step < rollEnd ? { step: r.step + 1 } : r)), [rollEnd])
  const startRoll = useCallback(() => {
    setSheet(false); dispatch({ t: 'reveal' }); dispatch({ t: 'clearVerdict' })
    setRoll({ step: reduced ? rollEnd : 0 })
  }, [reduced, rollEnd])
  useLayoutEffect(() => {
    const k = state.verdict?.kind
    if (k === 'proved' || k === 'provedHelp') startRoll()
  }, [state.verdict, startRoll])
  // Hearing the roll-call to its last line is the end of Case 0.
  useEffect(() => { if (roll && roll.step >= rollEnd) writeTutorialFlag('done') }, [roll, rollEnd])

  // ---- sound ------------------------------------------------------------------------------
  const prev = useRef(state)
  useEffect(() => {
    const before = prev.current
    prev.current = state
    const cue = sound ? cueFor(before, state) : null
    if (cue) playCue(cue)
  }, [state, sound])
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

  const onCell = useCallback((cell: Parameters<typeof norm>[0]) => (roll ? advanceRoll() : dispatch({ t: 'cell', cell })), [roll, advanceRoll])
  const onLong = useCallback((cell: Parameters<typeof norm>[0]) => { if (!away) dispatch({ t: 'long', cell }) }, [away])
  const accuse = (id: string) => { setAccused(id); dispatch({ t: 'accuse', id }) }
  const closeSheet = useCallback(() => { setSheet(false); dispatch({ t: 'clearVerdict' }) }, [])
  // The instruction line is hidden (inert) behind the prologue, so a live region could not announce it on Begin:
  // focus moves onto it instead, and the beat is read out from a region that exists from the start.
  const begin = () => { setStarted(true); window.setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 0) }
  const replay = () => { dispatch({ t: 'tutorialReset' }); setRoll(null); setFinished(false); setSheet(false); setAccused(null); setStarted(true); window.setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 0) }

  const sel = puzzle.people.find(p => p.id === state.selected)!
  const role = vis.roleOf(sel.id)
  const tier = tierOf(state.outcome, state.hintsUsed, state.strikes, state.revealed)
  const wrongName = state.verdict?.kind === 'notThem' && accused ? firstName(puzzle, accused) : null
  const showCard = !started && !finished

  return (
    <div className="cb-root tut-root" ref={rootRef} data-compact={compact || undefined} data-theme={theme} data-reduced={reduced || undefined} data-mode={state.supposeOn ? 'suppose' : state.pencilOn ? 'pencil' : undefined} data-beat={beat.id} data-testid="tutorial">
      <style>{started && !away && !finished && !sheet ? haloCss(beat.targets) : ''}</style>
      <header className="cb-head">
        <a className="cb-back" href="?casebook=" aria-label="Back to the case list"><ArrowLeft size={22} aria-hidden="true" /></a>
        <h1 className="cb-title">Case 0</h1>
        {!finished && <a className="tut-skip" href="?casebook=" onClick={() => writeTutorialFlag('skipped')}>Skip — I know how to play</a>}
        <Menu sound={sound} theme={theme} onSound={toggleSound} onTheme={() => chooseTheme(theme === 'dark' ? 'light' : 'dark')} />
      </header>

      <main className="cb-main">
        <section className="cb-stage">
          <div className="cb-stage-in" ref={stageRef}>
            <Plan
              puzzle={puzzle} floor={0} theme={theme} board={board} avail={{ w: avail.w, h: avail.h }}
              placement={shown} selected={away ? '' : state.selected} conflicts={conflicts} lens={lens} crosses={crosses}
              ghost={away ? null : state.ghost} remaining={remaining} interactive={!showCard} onCell={onCell} onLong={onLong}
              ringed={rollRing} dimmed={rollDim} dusk={!!roll} now={rollNow} measures={measures}
            />
          </div>
        </section>

        <section className="cb-panel tut-panel" ref={panelRef} style={(away || finished) && panelH ? { height: panelH } : undefined} data-away={away || undefined}>
          {finished ? (
            <div className="tut-card tut-done">
              <h2 className="tut-card-title">Case 0, closed.</h2>
              <p className="tut-card-body">That is the whole game: read the statements, light the lamp, place, suppose, name. The real cases are only more of it.</p>
              <div className="tut-card-bar">
                <a className="cb-primary tut-btn" href="?casebook=">Play a real case</a>
                <button type="button" className="cb-ghostbtn" onClick={replay}>Play Case 0 again</button>
              </div>
            </div>
          ) : roll ? (
            <Alibis
              puzzle={puzzle} roll={rollcall} step={roll.step} list={reduced} tierLabel={tier ? TIER_LABEL[tier] : null} motive={vis.motive} closing={vis.closing ?? ''}
              onAdvance={advanceRoll} onSkip={() => setRoll({ step: rollEnd })} onProof={() => {}} onClose={() => { setRoll(null); setFinished(true) }}
            />
          ) : (
            <>
              <div className="tut-game" inert={showCard || undefined}>
                <div className="cb-who-line">
                  <span className="cb-who-title">{sel.name}</span>
                  <span className="cb-who-role">{[role?.role, sel.isVictim ? 'victim' : ''].filter(Boolean).join(', ')}</span>
                  <span className="tut-step" aria-label={`Step ${beat.n} of ${BEATS}`}>{beat.n} / {BEATS}</span>
                </div>
                <div className="cb-mid" style={{ '--cb-chips-h': `${reserve}px` } as CSSProperties}>
                  <Chips puzzle={puzzle} person={sel.id} placement={state.placement} lit={lit} onToggle={index => dispatch({ t: 'lit', index })} />
                  <div className="cb-readout tut-readout" data-testid="readout">
                    <p className="tut-line" ref={lineRef} tabIndex={-1} data-testid="instruction">{beat.text}</p>
                    {((report && state.ghost) || state.hint) && (
                      <Readout
                        puzzle={puzzle} selected={sel} oneLiner={null} premise="" premiseOpen={false} onTogglePremise={() => {}}
                        ghostPerson={state.ghost?.person ?? null} report={report} hint={state.hint} outcome={null} tier={null} firstMove={false} onRoll={() => {}}
                      />
                    )}
                  </div>
                </div>
                <Rail puzzle={puzzle} placement={state.placement} selected={state.selected} conflicts={conflicts} holds={holds} contradictions={contradictions} counts={counts} onSelect={id => dispatch({ t: 'select', id })} />
                <Bar
                  pencilOn={state.pencilOn} supposeOn={state.supposeOn} canUndo={state.history.length > 0}
                  whyDone={accuseReady(puzzle, ts)} accuseDisabled={!accuseReady(puzzle, ts)}
                  onPencil={() => dispatch({ t: 'pencil' })} onSuppose={() => dispatch({ t: 'suppose' })} onUndo={() => dispatch({ t: 'undo' })}
                  onWhy={() => dispatch({ t: 'why' })} onAccuse={() => setSheet(true)}
                />
              </div>
              {showCard && (
                <div className="tut-card tut-prologue" role="group" aria-label="Prologue">
                  <p className="tut-card-kicker">Prologue</p>
                  <p className="tut-card-body">{case0Story.premise}</p>
                  <p className="tut-card-voice">&ldquo;{INVESTIGATOR_LINE}&rdquo;</p>
                  <div className="tut-card-bar">
                    <button type="button" className="cb-primary" onClick={begin}>Begin — about 90 seconds</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {sheet && <AccuseSheet puzzle={puzzle} wrongName={wrongName} onAccuse={accuse} onClose={closeSheet} />}
      <div className="cb-sr" role="status" aria-live="polite">{state.announce}</div>
      <div className="cb-sr" role="status" aria-live="polite" data-testid="beat-live">{started && !finished && !roll ? `Step ${beat.n} of ${BEATS}. ${beat.text}` : ''}</div>
    </div>
  )
}
