// One False Alibi: the playable screen. The plan, the people strip, the pinned citations, the ledger and the selected
// account. The bench is silent: the player does the detecting. All rules live in state.ts / collide.ts / lens.ts;
// this file only draws them and plays the sounds.
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowLeft, Undo2, X } from 'lucide-react'
import { roomIdAt } from '../core/engine'
import type { Cell } from '../core/types'
import { chooseTheme, useReducedMotion, useSliceTheme } from '../casebook/theme'
import { TilePlan } from './art/TilePlan'
import { AccountCard, Strip } from './Accounts'
import { beatFor, BEATS, coachDone, markCoachDone } from './coach'
import { Ledger } from './Ledger'
import { actOf, activeStatements, crackedTiles, HINT, initState, ladderStep, liar, nameOf, orderedPeople, reduce, tierFor, toSaved, visibleStatements } from './state'
import type { Ctx, GameState } from './state'
import { lensTiles, nowhereFits, tileKey } from './lens'
import type { LieCase } from './model'
import { Reveal, RevealCaption } from './Reveal'
import { useRevealSequence } from './revealSequence'
import { clearSave, loadSave, loadSolved, markSolved, writeSave } from './save'
import { CasesSheet, DoubtSheet, HowSheet, Intro, Menu, RestartSheet } from './Sheets'
import { loadSoundPref, playCue, primeAudio, saveSoundPref } from './sound'
import { Tray } from './Tray'
import './tokens.css'
import './game.css'

interface Props {
  lieCase: LieCase
  /** Hidden authoring harness (`&truth`): only the true statements, nothing to pin or doubt. */
  truthOnly?: boolean
  /** The casebook, in order, for the menu. */
  cases?: { id: string; title: string }[]
  /** Open the next case. Absent when there is none. */
  onNext?: () => void
}

/** Mount point. Restarting remounts the play surface so every piece of state starts clean. */
export default function Game({ lieCase, truthOnly = false, cases, onNext }: Props) {
  const [run, setRun] = useState(0)
  const restart = useCallback(() => { clearSave(lieCase, truthOnly); setRun(r => r + 1) }, [lieCase, truthOnly])
  return <Play key={run} lieCase={lieCase} truthOnly={truthOnly} cases={cases} onNext={onNext} introOpen={run === 0} onRestart={restart} />
}

const isFresh = (s: GameState) => !Object.keys(s.placed).length && !s.struck && !s.pins.length && !s.ledger.length && !s.falseCitations

type PlayProps = Props & { truthOnly: boolean; introOpen: boolean; onRestart: () => void }

function Play({ lieCase: c, truthOnly, cases, onNext, introOpen, onRestart }: PlayProps) {
  const ctx: Ctx = useMemo(() => ({ c, truthOnly }), [c, truthOnly])
  const [state, dispatch] = useReducer((s: GameState, a: Parameters<typeof reduce>[2]) => reduce(ctx, s, a), ctx, x => initState(x, loadSave(x.c, x.truthOnly)))
  const theme = useSliceTheme()
  const reduced = useReducedMotion()
  const [sound, setSound] = useState(loadSoundPref)
  const [intro, setIntro] = useState(() => introOpen && isFresh(state))
  const [doubting, setDoubting] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [how, setHow] = useState(false)
  const [casesOpen, setCasesOpen] = useState(false)
  const [coachOn, setCoachOn] = useState(() => !coachDone())
  // a case that was already closed when the page loaded shows the final frame at once: no sequence, no bell
  const [restored] = useState(() => state.outcome === 'proved')
  const [replayed, setReplayed] = useState(false)

  // The theme tokens key off <html data-theme>. Only this mode sets it, and only while it is on screen.
  useEffect(() => {
    const root = document.documentElement
    const before = root.getAttribute('data-theme')
    root.setAttribute('data-theme', theme)
    return () => { if (before === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', before) }
  }, [theme])

  useEffect(() => { writeSave(c, truthOnly, toSaved(state)) }, [c, truthOnly, state.placed, state.struck, state.pins, state.locked, state.ledger, state.falseCitations]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sound && state.cue && state.cueN) playCue(state.cue) }, [state.cueN]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!state.outcome) return
    markCoachDone()
    if (!truthOnly) markSolved(c.id)
  }, [state.outcome, truthOnly, c.id])
  // the lifted token stays on the plan just long enough to play its lift, then goes
  useEffect(() => {
    if (!state.lifted) return
    const t = window.setTimeout(() => dispatch({ t: 'settleLift' }), reduced ? 0 : 900)
    return () => window.clearTimeout(t)
  }, [state.lifted, reduced])

  const order = useMemo(() => orderedPeople(c), [c])
  const visible = useMemo(() => visibleStatements(ctx), [ctx])
  const active = useMemo(() => activeStatements(ctx, state.struck), [ctx, state.struck])
  const act = actOf(ctx, state)
  const people = useMemo(() => Object.fromEntries(c.puzzle.people.map(x => [x.id, { name: nameOf(c, x.id), emblem: c.story.cast[x.id].emblem }])), [c])
  const closed = state.outcome === 'proved'
  const hunting = act === 1 && !truthOnly && !closed

  const lens = useMemo(
    () => lensTiles(c, active, state.selected, state.lit[state.selected] ?? [], state.placed),
    [c, active, state.selected, state.lit, state.placed],
  )
  // the theatrical reveal plays on a fresh solve (or a replay) in the lie-hunting direction only
  const sequenced = closed && !truthOnly && (!restored || replayed)
  const seq = useRevealSequence(c, state.placed, sequenced, reduced)
  const revealDone = sequenced ? seq.done : closed
  const nowhere = nowhereFits(lens, state.placed, state.selected)
  const step = ladderStep(state.falseCitations)
  // after enough false citations the plan draws the lines already held by placed people, for the selected suspect
  const sightlines = useMemo(
    () => (step === 2 && !closed ? new Set(Object.entries(state.placed).filter(([id]) => id !== state.selected).map(([, cell]) => tileKey(cell))) : undefined),
    [step, closed, state.placed, state.selected],
  )
  const cracked = useMemo(() => (closed ? new Set<string>() : crackedTiles(c, state)), [c, state, closed])

  const tokens: Record<string, Cell> = state.lifted ? { ...state.placed, [state.lifted.person]: state.lifted.cell } : state.placed
  const roomName = (id: string): string | null => {
    const cell = state.placed[id]
    return cell ? c.puzzle.rooms.find(r => r.id === roomIdAt(c.puzzle, cell))?.name ?? null : null
  }

  const beat = coachOn && !intro && !doubting ? beatFor(state, truthOnly) : null
  const event = state.note ?? (nowhere ? { text: 'Nowhere fits all of that.', kind: 'info' as const } : null)
  const hint = !event && hunting && step >= 1 ? HINT : null

  const toggleSound = () => {
    const next = !sound
    if (next) primeAudio()
    setSound(next)
    saveSoundPref(next)
  }
  const toggleTheme = () => chooseTheme(theme === 'dark' ? 'light' : 'dark')
  const confirmDoubt = () => { if (doubting) dispatch({ t: 'doubt', id: doubting }); setDoubting(null) }
  const liarName = nameOf(c, liar(c))
  const phase = truthOnly ? 'Everyone told the truth' : closed ? 'Case closed' : act === 1 ? 'Find the false account' : `Then where was ${liarName}?`
  const solved = loadSolved()
  const caseList = cases?.map(k => ({ ...k, solved: solved.includes(k.id) || (closed && k.id === c.id), current: k.id === c.id }))

  return (
    <div className="ofa" data-act={act} data-closed={closed || undefined}>
      <header className="ofa-bar">
        <a className="ofa-icon" href="?casebook=" aria-label="Back to the casebook"><ArrowLeft size={22} aria-hidden="true" /></a>
        <div className="ofa-bar-title">
          <h1 className="ofa-title">{c.story.title}</h1>
          <p className="ofa-phase">{phase}</p>
        </div>
        <button type="button" className="ofa-icon" aria-label="Undo" disabled={!state.history.length || !!state.outcome} onClick={() => dispatch({ t: 'undo' })}>
          <Undo2 size={21} aria-hidden="true" />
        </button>
        <Menu
          sound={sound} theme={theme} onSound={toggleSound} onTheme={toggleTheme}
          onRestart={() => setRestarting(true)} onHow={() => setHow(true)} onCases={caseList && caseList.length > 0 ? () => setCasesOpen(true) : undefined}
        />
      </header>

      <main className="ofa-main">
        <div className="ofa-plan">
          <TilePlan
            puzzle={c.puzzle}
            people={people}
            tokens={tokens}
            victimId={c.puzzle.victimId}
            selectedPerson={state.selected}
            lit={lens ?? undefined}
            sightlines={sightlines}
            collision={cracked}
            lifted={state.lifted?.person ?? null}
            murderer={closed && !sequenced ? c.puzzle.murdererId : null}
            onTile={cell => dispatch({ t: 'tile', cell })}
            {...(sequenced ? seq.plan : {})}
          />
          {sequenced && <RevealCaption text={seq.caption} done={seq.done} onSkip={seq.skip} />}
        </div>

        <div className="ofa-side">
          {!closed && <Strip c={c} order={order} selected={state.selected} placed={state.placed} onSelect={id => dispatch({ t: 'select', id })} />}
          {(event || hint) && !closed && (
            <p className="ofa-line" data-kind="event" data-tone={event?.kind ?? 'info'} role="status">
              <span>{event?.text ?? hint}</span>
            </p>
          )}
          {beat && !closed && (
            <p className="ofa-line" data-kind="coach">
              <span>{BEATS[beat]}</span>
              <button type="button" className="ofa-line-x" aria-label="Dismiss hint" onClick={() => { setCoachOn(false); markCoachDone() }}>
                <X size={16} aria-hidden="true" />
              </button>
            </p>
          )}
          {hunting && state.pins.length > 0 && (
            <Tray c={c} pins={state.pins} onUnpin={id => dispatch({ t: 'pin', id })} onCite={() => dispatch({ t: 'cite' })} />
          )}
          {state.ledger.length > 0 && !truthOnly && !closed && (
            <Ledger c={c} rows={state.ledger} struck={state.struck} canDoubt={hunting} onChip={setDoubting} />
          )}
          {closed
            ? <Reveal c={c} placed={state.placed} tier={tierFor(truthOnly, state.falseCitations)} done={revealDone} onNext={onNext} onReplay={() => { if (sequenced) seq.restart(); else setReplayed(true) }} />
            : (
              <AccountCard
                c={c} person={state.selected} statements={visible} lit={state.lit[state.selected] ?? []}
                pins={state.pins} struck={state.struck} placed={state.placed} roomName={roomName(state.selected)}
                canPin={hunting} onLit={id => dispatch({ t: 'lit', id })} onPin={id => dispatch({ t: 'pin', id })}
              />
            )}
        </div>
      </main>

      <div className="ofa-sr" role="status" aria-live="polite" aria-atomic="true" data-tier={closed ? tierFor(truthOnly, state.falseCitations) : undefined}>{state.announce}</div>

      {intro && <Intro c={c} truthOnly={truthOnly} onBegin={() => setIntro(false)} />}
      {how && <HowSheet onClose={() => setHow(false)} />}
      {casesOpen && caseList && <CasesSheet cases={caseList} onClose={() => setCasesOpen(false)} />}
      {doubting && <DoubtSheet c={c} id={doubting} onYes={confirmDoubt} onNo={() => setDoubting(null)} />}
      {restarting && <RestartSheet onYes={() => { setRestarting(false); onRestart() }} onNo={() => setRestarting(false)} />}
    </div>
  )
}
