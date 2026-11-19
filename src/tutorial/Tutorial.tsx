// Case 0 on screen. The board, statements, portraits, action bar and roll-call are the casebook's own: this
// plays it with a coach (src/casebook/coach.ts). The beat engine (play.ts) owns the game state and decides what
// to say; the casebook draws it. What is added here is the prologue and closing cards, the way out, the soft amber
// halo on the control the current beat wants, and the flag that records the walk-through was heard to the end.
import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import Casebook from '../casebook/Casebook'
import type { Coach } from '../casebook/coach'
import { fillNames } from '../casebook/stories'
import '../casebook/casebook.css'
import './tutorial.css'
import { AccuseSheet } from './AccuseSheet'
import { case0, case0Story, INVESTIGATOR_LINE } from './case0'
import { accuseReady, beatFor, BEATS, initTut, tutReduce } from './play'
import type { Target } from './play'
import { writeTutorialFlag } from './storage'

const puzzle = case0
/** What the beat wants touched, as tokens on the casebook root. tutorial.css draws the halo for each one: the
 *  Content-Security-Policy allows no inline style element, so the halo is static CSS keyed on these tokens. */
function haloTokens(targets: readonly Target[]): string {
  return targets.map(t => {
    switch (t.kind) {
      case 'cell': return `cell-${t.cell.row}-${t.cell.col}`
      case 'chip': return `chip-${t.position}`
      case 'who': return `who-${t.position}`
      case 'bar': return 'bar'
    }
  }).join(' ')
}

export default function Tutorial() {
  const [ts, dispatch] = useReducer((s: ReturnType<typeof initTut>, a: Parameters<typeof tutReduce>[2]) => tutReduce(puzzle, s, a), puzzle, initTut)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const lineRef = useRef<HTMLParagraphElement>(null)
  const beat = useMemo(() => beatFor(puzzle, ts), [ts])

  // The instruction line is hidden (inert) behind the prologue, so a live region could not announce it on Begin:
  // focus moves onto it instead, and the beat is read out from a region that exists from the start.
  const focusLine = () => { window.setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 0) }
  const begin = () => { setStarted(true); focusLine() }
  const replay = () => { dispatch({ t: 'tutorialReset' }); setFinished(false); setStarted(true); focusLine() }
  // Hearing the roll-call to its last line is the end of Case 0.
  const onEnd = useCallback(() => writeTutorialFlag('done'), [])
  const onClose = useCallback(() => setFinished(true), [])

  const showCard = !started && !finished
  const coach: Coach = {
    state: ts.game,
    dispatch,
    beat: { n: beat.n, of: BEATS },
    instruction: beat.text,
    halo: haloTokens(beat.targets),
    hold: showCard || finished,
    ready: accuseReady(puzzle, ts),
    lineRef,
    story: case0Story,
    title: 'Case 0',
    header: !finished ? <a className="tut-skip" href="?casebook=" onClick={() => writeTutorialFlag('skipped')}>Skip — I know how to play</a> : null,
    card: finished ? (
      <div className="tut-card tut-done">
        <h2 className="tut-card-title">Case 0, closed.</h2>
        <p className="tut-card-body">That is the whole game: read the statements, light the lamp, place, suppose, name. The real cases are only more of it.</p>
        <div className="tut-card-bar">
          <a className="cb-primary tut-btn" href="?casebook=">Play a real case</a>
          <button type="button" className="cb-ghostbtn" onClick={replay}>Play Case 0 again</button>
        </div>
      </div>
    ) : showCard ? (
      <div className="tut-card tut-prologue" role="group" aria-label="Prologue">
        <p className="tut-card-kicker">Prologue</p>
        <p className="tut-card-body">{case0Story.premise}</p>
        <p className="tut-card-voice">&ldquo;{fillNames(puzzle, INVESTIGATOR_LINE)}&rdquo;</p>
        <div className="tut-card-bar">
          <button type="button" className="cb-primary" onClick={begin}>Begin — about 90 seconds</button>
        </div>
      </div>
    ) : null,
    sheet: p => <AccuseSheet puzzle={puzzle} wrongName={p.wrongName} onAccuse={p.onAccuse} onClose={p.onClose} />,
    onEnd,
    onClose,
  }

  return (
    <div className="tut-root" data-beat={beat.id} data-testid="tutorial">
      <Casebook puzzle={puzzle} coach={coach} />
    </div>
  )
}
