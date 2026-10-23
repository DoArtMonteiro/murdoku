import { useEffect, useRef } from 'react'
import { Eraser, Lightbulb, MapPin, Undo2, X } from 'lucide-react'
import type { ClueText, Person, Puzzle } from '../../core/types'
import { MessagesSquare } from 'lucide-react'
import { FramedPortrait, Portrait } from './Portrait'
import type { SuspectStory } from '../story/schema'
import type { GameApi, PlacedAt } from './types'

import { placedLabel } from './util'

interface CardProps {
  person: Person
  clues: ClueText[]
  /** Per clue: does it light up lanes/cells on the plan? */
  lit: boolean[]
  selected: boolean
  at: PlacedAt | undefined
  conflicted: boolean
  step: number
  tale?: SuspectStory
  /** Dock only: the portrait itself opens the interrogation. */
  onAsk?: () => void
}

/** The full clue card. Used docked under the plan (phone) and in the list (desktop). */
export function ClueBody({ person, clues, lit, at, conflicted, step, tale, onAsk }: Omit<CardProps, 'selected'>) {
  const frame = <FramedPortrait personId={person.id} size={56} label={`${person.name} portrait`} victim={person.isVictim} />
  return (
    <>
      {onAsk ? (
        <button type="button" className="rs-ask-portrait" onClick={onAsk} aria-label={`${person.isVictim ? 'Scene notes for' : 'Interrogate'} ${person.name}`} data-testid={`ask-${person.id}`}>
          {frame}
          <span className="rs-ask-badge" aria-hidden="true"><MessagesSquare size={12} /></span>
        </button>
      ) : frame}
      <span className="rs-card-main">
        <span className="rs-card-head">
          <span className="rs-step" aria-hidden="true">{step}</span>
          <span className="rs-name">{person.name}</span>
          {person.isVictim && <span className="rs-stamp-victim">Victim</span>}
        </span>
        {tale && (
          <span className="rs-role" data-testid={`role-${person.id}`}>
            {tale.role}{!person.isVictim && <span className="rs-motive"> · Motive: {tale.motive.label}</span>}
          </span>
        )}
        <span className={`rs-placed ${conflicted ? 'rs-placed-bad' : ''}`}>
          {conflicted ? `${placedLabel(at)} · shares a row or column` : placedLabel(at)}
        </span>
        <span className="rs-clues">
          {clues.map((c, i) => (
            <span key={i} className={`rs-clue ${lit[i] ? 'rs-clue-lit' : ''}`}>
              {c.text}
              {lit[i] && <span className="rs-sr"> (shown on the plan)</span>}
            </span>
          ))}
        </span>
      </span>
    </>
  )
}

type StoryLookup = (id: string) => SuspectStory | undefined

export function SuspectList({ puzzle, selectedPerson, game, litFor, onSelect, taleOf, onAsk }: {
  puzzle: Puzzle; selectedPerson: string | null; game: GameApi
  litFor: (p: Person) => { clues: ClueText[]; lit: boolean[] }
  onSelect: (id: string) => void
  taleOf?: StoryLookup
  onAsk?: (id: string) => void
}) {
  return (
    <ul className="rs-list" aria-label="Suspects">
      {puzzle.people.map((p, i) => {
        const { clues, lit } = litFor(p)
        const sel = p.id === selectedPerson
        return (
          <li key={p.id} className={`rs-li ${taleOf?.(p.id) ? 'rs-li-ask' : ''}`}>
            <button
              type="button"
              className={`rs-card ${sel ? 'rs-card-sel' : ''}`}
              aria-pressed={sel}
              data-testid={`suspect-${p.id}`}
              onClick={() => onSelect(p.id)}
            >
              <ClueBody person={p} clues={clues} lit={lit} at={game.placedOf[p.id]} conflicted={game.conflicts.has(p.id)} step={i + 1} tale={taleOf?.(p.id)} />
            </button>
            {onAsk && taleOf?.(p.id) && (
              <button type="button" className="rs-ask" onClick={() => onAsk(p.id)} data-testid={`ask-${p.id}`}>
                <MessagesSquare size={16} aria-hidden="true" /><span>{p.isVictim ? 'Scene notes' : 'Interrogate'}<span className="rs-sr"> {p.name}</span></span>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Phone / short-landscape: a row of portrait chips, then the selected suspect's full card. */
export function SuspectDock({ puzzle, selectedPerson, game, litFor, onSelect, taleOf, onAsk }: {
  puzzle: Puzzle; selectedPerson: string | null; game: GameApi
  litFor: (p: Person) => { clues: ClueText[]; lit: boolean[] }
  onSelect: (id: string) => void
  taleOf?: StoryLookup
  onAsk?: (id: string) => void
}) {
  const idx = Math.max(0, puzzle.people.findIndex(p => p.id === selectedPerson))
  const person = puzzle.people[idx]
  const tabs = useRef<HTMLDivElement>(null)

  // Keep the selected chip in view when the row scrolls (many suspects).
  useEffect(() => {
    tabs.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [selectedPerson])

  return (
    <section className="rs-dock" data-testid="clue-dock" aria-label="Selected suspect">
      <div ref={tabs} className="rs-chips" role="group" aria-label="Choose a suspect">
        {puzzle.people.map(p => {
          const sel = p.id === person.id
          const placed = !!game.placedOf[p.id]
          return (
            <button
              key={p.id}
              type="button"
              className={`rs-chip ${sel ? 'rs-chip-sel' : ''}`}
              aria-pressed={sel}
              aria-label={`${p.name}${p.isVictim ? ' (victim)' : ''}${placed ? ', placed' : ', not placed'}`}
              data-testid={`chip-${p.id}`}
              onClick={() => onSelect(p.id)}
            >
              <Portrait personId={p.id} size={32} />
              <span className="rs-chip-name">{p.name}</span>
              <span className={`rs-chip-dot ${placed ? 'rs-chip-dot-on' : ''}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {/* Every suspect's card occupies the same grid cell, so the dock is always as tall as
          the tallest one and the plan above it never resizes when the selection changes. */}
      <div className="rs-card-stack">
        {puzzle.people.map((p, i) => {
          const sel = p.id === person.id
          const c = litFor(p)
          return (
            <div
              key={p.id}
              className={`rs-card rs-card-dock rs-card-sel ${sel ? '' : 'rs-card-ghost'}`}
              data-testid={sel ? 'clue-card' : undefined}
              aria-hidden={sel ? undefined : true}
              inert={sel ? undefined : true}
            >
              <ClueBody person={p} clues={c.clues} lit={c.lit} at={game.placedOf[p.id]} conflicted={game.conflicts.has(p.id)} step={i + 1} tale={taleOf?.(p.id)} onAsk={sel && onAsk && taleOf?.(p.id) ? () => onAsk(p.id) : undefined} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function Toolbar({ game }: { game: GameApi }) {
  const cold = game.feedback === 'cold' || game.accusationsLeft === 0
  const canHint = game.hintsLeft > 0 && game.mode !== 'detective' && !cold && !game.completed
  return (
    <div className="rs-tools" role="toolbar" aria-label="Tools" data-testid="toolbar">
      <button type="button" className="rs-tool" aria-pressed={game.tool === 'place'} onClick={() => game.setTool('place')} data-testid="tool-place">
        <MapPin size={18} aria-hidden="true" /><span>Place</span>
      </button>
      <button type="button" className="rs-tool" aria-pressed={game.tool === 'x'} onClick={() => game.setTool('x')} data-testid="tool-x">
        <X size={18} aria-hidden="true" /><span>Mark ✕</span>
      </button>
      <button type="button" className="rs-tool" onClick={game.undo} disabled={game.history.length === 0} data-testid="tool-undo">
        <Undo2 size={18} aria-hidden="true" /><span>Undo</span>
      </button>
      <button type="button" className="rs-tool" onClick={game.hint} disabled={!canHint} data-testid="tool-hint" aria-label={`Hint, ${game.hintsLeft} left`}>
        <Lightbulb size={18} aria-hidden="true" /><span>Hint {game.hintsLeft}</span>
      </button>
      <button type="button" className="rs-tool" onClick={game.clearAll} data-testid="tool-clear">
        <Eraser size={18} aria-hidden="true" /><span>Clear</span>
      </button>
    </div>
  )
}

const FEEDBACK: Record<string, string> = {
  incomplete: 'Place every suspect on the plan before you accuse.',
  wrong: 'That account does not hold together. Re-read the clues and try again.',
  blocked: 'That square is already ruled out.',
  cold: 'The trail has gone cold. No accusations left.',
}

export function AccusePanel({ game }: { game: GameApi }) {
  const left = game.accusationsLeft
  const cold = game.feedback === 'cold' || left === 0
  const message = FEEDBACK[cold ? 'cold' : game.feedback]
  const leftText = typeof left === 'number' ? `${left} ${left === 1 ? 'accusation' : 'accusations'} left` : ''
  const bad = !!message
  return (
    <div className="rs-accuse" data-testid="accuse-panel">
      <p className={`rs-status ${bad ? 'rs-status-bad' : 'rs-status-idle'}`} role="status" data-testid="status-line">
        {message ?? leftText}
        {message && leftText && !cold && <span className="rs-status-sub"> {leftText}.</span>}
      </p>
      {cold && (game.reveal || game.startOver) ? (
        <div className="rs-cold-actions">
          {game.reveal && <button type="button" className="rs-btn" onClick={game.reveal} data-testid="reveal">Reveal</button>}
          <button type="button" className="rs-btn rs-btn-primary" onClick={() => (game.startOver ? game.startOver() : game.clearAll())} data-testid="start-over">Start over</button>
        </div>
      ) : (
        <button type="button" className="rs-btn rs-btn-primary rs-accuse-btn" onClick={game.submit} disabled={cold} data-testid="accuse">
          <span>Accuse</span>
          {typeof left === 'number' && <span className="rs-accuse-left" aria-hidden="true">{left} left</span>}
        </button>
      )}
    </div>
  )
}
