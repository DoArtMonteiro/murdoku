// One False Alibi: the playable screen. The plan, the people strip, the selected account and the Contradictions
// ledger. All rules live in game.ts / collide.ts / lens.ts; this file only draws them and plays the sounds.
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { ArrowLeft, Undo2, X } from 'lucide-react'
import { roomIdAt } from '../core/engine'
import type { Cell } from '../core/types'
import { chooseTheme, useReducedMotion, useSliceTheme } from '../casebook/theme'
import { TilePlan } from './art/TilePlan'
import { AccountCard, Ledger, Strip } from './Accounts'
import { beatFor, BEATS, coachDone, markCoachDone } from './coach'
import { commonPeople } from './collide'
import { actOf, activeStatements, initState, ledgerRows, liveCollisions, nameOf, orderedPeople, reduce, toSaved } from './state'
import type { Ctx, GameState } from './state'
import { blockedTiles, lensTiles } from './lens'
import type { LieCase } from './model'
import { Reveal } from './Reveal'
import { clearSave, loadSave, writeSave } from './save'
import { ColdSheet, DoubtSheet, Intro, Menu, RestartSheet } from './Sheets'
import { loadSoundPref, playCue, primeAudio, saveSoundPref } from './sound'
import './tokens.css'
import './game.css'

interface Props {
  lieCase: LieCase
  /** Direction A, for comparison: only the true statements, nothing to doubt, no ledger. */
  truthOnly?: boolean
}

/** Mount point. Restarting remounts the play surface so every piece of state starts clean. */
export default function Game({ lieCase, truthOnly = false }: Props) {
  const [run, setRun] = useState(0)
  const restart = useCallback(() => { clearSave(lieCase, truthOnly); setRun(r => r + 1) }, [lieCase, truthOnly])
  return <Play key={run} lieCase={lieCase} truthOnly={truthOnly} introOpen={run === 0} onRestart={restart} />
}

const NOTES: Partial<Record<NonNullable<GameState['cue']>, string>> = {
  collision: "These accounts can't all be true.",
  crack: 'Then where were you, really?',
  stand: 'That account stands.',
}

const isFresh = (s: GameState) => !Object.keys(s.placed).length && !s.struck && !s.strikes && !s.journal.length

function Play({ lieCase: c, truthOnly, introOpen, onRestart }: Props & { truthOnly: boolean; introOpen: boolean; onRestart: () => void }) {
  const ctx: Ctx = useMemo(() => ({ c, truthOnly }), [c, truthOnly])
  const [state, dispatch] = useReducer((s: GameState, a: Parameters<typeof reduce>[2]) => reduce(ctx, s, a), ctx, x => initState(x, loadSave(x.c, x.truthOnly)))
  const theme = useSliceTheme()
  const reduced = useReducedMotion()
  const [sound, setSound] = useState(loadSoundPref)
  const [intro, setIntro] = useState(() => introOpen && isFresh(state))
  const [doubting, setDoubting] = useState<string | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [coachOn, setCoachOn] = useState(() => !coachDone())

  // The theme tokens key off <html data-theme>. Only this mode sets it, and only while it is on screen.
  useEffect(() => {
    const root = document.documentElement
    const before = root.getAttribute('data-theme')
    root.setAttribute('data-theme', theme)
    return () => { if (before === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', before) }
  }, [theme])

  useEffect(() => { writeSave(c, truthOnly, toSaved(state)) }, [c, truthOnly, state.placed, state.struck, state.stands, state.strikes, state.journal]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (sound && state.cue && state.cueN) playCue(state.cue) }, [state.cueN]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (state.outcome) markCoachDone() }, [state.outcome])
  // the lifted token stays on the plan just long enough to play its lift, then goes
  useEffect(() => {
    if (!state.lifted) return
    const t = window.setTimeout(() => dispatch({ t: 'settleLift' }), reduced ? 0 : 900)
    return () => window.clearTimeout(t)
  }, [state.lifted, reduced])

  const order = useMemo(() => orderedPeople(c), [c])
  const visible = useMemo(() => (truthOnly ? c.statements.filter(s => s.id !== c.lieId) : c.statements), [c, truthOnly])
  const active = useMemo(() => activeStatements(ctx, state.struck), [ctx, state.struck])
  const act = actOf(ctx, state)
  const people = useMemo(() => Object.fromEntries(c.puzzle.people.map(x => [x.id, { name: nameOf(c, x.id), emblem: c.story.cast[x.id].emblem }])), [c])

  const lens = useMemo(
    () => lensTiles(c, active, state.selected, state.lit[state.selected] ?? [], state.placed),
    [c, active, state.selected, state.lit, state.placed],
  )
  const blocked = useMemo(() => blockedTiles(c.puzzle, state.placed, state.selected), [c, state.placed, state.selected])
  const collisions = useMemo(() => (state.outcome ? [] : liveCollisions(ctx, state)), [ctx, state])
  const cracked = useMemo(() => {
    const out = new Set<string>()
    for (const k of collisions) if (k.people.includes(state.selected)) for (const t of k.tiles) out.add(t)
    return out
  }, [collisions, state.selected])

  const rows = ledgerRows(state.journal)
  const common = useMemo(() => new Set(rows.length >= 2 ? commonPeople(rows.map(r => r.people)) : []), [rows])

  const tokens: Record<string, Cell> = state.lifted ? { ...state.placed, [state.lifted.person]: state.lifted.cell } : state.placed
  const closed = state.outcome === 'proved'
  const roomName = (id: string): string | null => {
    const cell = state.placed[id]
    return cell ? c.puzzle.rooms.find(r => r.id === roomIdAt(c.puzzle, cell))?.name ?? null : null
  }

  const beat = coachOn && !intro && !doubting ? beatFor(state, truthOnly) : null
  // the third beat answers the first collision, so it takes the line over the plain event note
  const event = state.cue ? NOTES[state.cue] : undefined
  const coaching = beat !== null && (!event || (beat === 3 && state.cue === 'collision'))
  const line = coaching && beat ? BEATS[beat] : event ?? null

  const toggleSound = () => {
    const next = !sound
    if (next) primeAudio()
    setSound(next)
    saveSoundPref(next)
  }
  const toggleTheme = () => chooseTheme(theme === 'dark' ? 'light' : 'dark')
  const confirmDoubt = () => { if (doubting) dispatch({ t: 'doubt', id: doubting }); setDoubting(null) }
  const phase = truthOnly ? 'Everyone told the truth' : act === 1 ? 'Find the false account' : 'Rebuild where everyone was'

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
        <Menu sound={sound} theme={theme} onSound={toggleSound} onTheme={toggleTheme} onRestart={() => setRestarting(true)} onHow={() => setIntro(true)} />
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
            blocked={state.outcome ? undefined : blocked}
            collision={cracked}
            lifted={state.lifted?.person ?? null}
            murderer={closed ? c.puzzle.murdererId : null}
            onTile={cell => dispatch({ t: 'tile', cell })}
          />
        </div>

        <div className="ofa-side">
          <Strip c={c} order={order} selected={state.selected} placed={state.placed} common={common} onSelect={id => dispatch({ t: 'select', id })} />
          {rows.length > 0 && <Ledger c={c} rows={rows} common={common} />}
          {line && !closed && (
            <p className="ofa-line" data-kind={coaching ? 'coach' : 'event'} data-cue={event ? state.cue : undefined}>
              <span>{line}</span>
              {coaching && (
                <button type="button" className="ofa-line-x" aria-label="Dismiss hint" onClick={() => { setCoachOn(false); markCoachDone() }}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </p>
          )}
          {closed
            ? <Reveal c={c} placed={state.placed} strikes={state.strikes} truthOnly={truthOnly} onRestart={onRestart} />
            : (
              <AccountCard
                c={c} person={state.selected} statements={visible} lit={state.lit[state.selected] ?? []}
                struck={state.struck} stands={state.stands} placed={state.placed} roomName={roomName(state.selected)}
                doubting={act === 1 && !truthOnly && !state.outcome}
                onLit={id => dispatch({ t: 'lit', id })} onDoubt={setDoubting}
              />
            )}
        </div>
      </main>

      <div className="ofa-sr" role="status" aria-live="polite" aria-atomic="true">{state.announce}</div>

      {intro && <Intro c={c} truthOnly={truthOnly} onBegin={() => setIntro(false)} />}
      {doubting && <DoubtSheet c={c} id={doubting} onYes={confirmDoubt} onNo={() => setDoubting(null)} />}
      {restarting && <RestartSheet onYes={() => { setRestarting(false); onRestart() }} onNo={() => setRestarting(false)} />}
      {state.outcome === 'cold' && <ColdSheet onRestart={onRestart} />}
    </div>
  )
}
