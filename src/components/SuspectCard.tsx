import { motion } from 'framer-motion'
import { Check, Lock, Crosshair } from 'lucide-react'
import type { Person } from '../core/types'

interface Props {
  person: Person
  clues: string[]
  selected: boolean
  placed: boolean
  locked?: boolean
  conflicted: boolean
  resolved?: boolean
  showCheck?: boolean
  /** This suspect's clue is currently squared off on the board. */
  located?: boolean
  /** False when the clue has no drawable board target (e.g. a pure row clue with no cells). */
  canLocate?: boolean
  /**
   * Parallel to `clues`: true when the current board arrangement satisfies
   * that clue. Optional and always derived from the caller's board state —
   * never cached here. Absent index = unsatisfied (no change from before).
   * GameScreen will pass this once it reads the prop; existing call sites
   * that omit it compile and behave exactly as now.
   */
  satisfiedClues?: boolean[]
  onSelect: () => void
  onToggleResolved?: () => void
  onToggleLocate?: () => void
}

export default function SuspectCard({
  person, clues, selected, placed, locked, conflicted, resolved, showCheck,
  located, canLocate, onSelect, onToggleResolved, onToggleLocate,
}: Props) {
  const portraitIndex = [...person.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 8
  const portraitColumn = portraitIndex % 4
  const portraitRow = Math.floor(portraitIndex / 4)
  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      data-testid="suspect-card"
      data-person={person.id}
      className="evidence-strip w-full border p-2.5 flex gap-2.5 transition-colors"
      style={{
        /* Unselected card: border-strong so the card boundary meets WCAG 1.4.11
           (bg-surface vs bg-base is near-zero contrast, the border IS the affordance).
           Selected: person.accent ring — accent carries the boundary at that point. */
        borderColor: selected ? person.accent : 'var(--color-border-strong)',
        backgroundColor: selected ? '#E4C477' : '#DDD1B3',
        backgroundImage: 'url("/assets/evidence-paper.jpg")',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        /* Selected: double-ring — outer accent halo signals commitment */
        boxShadow: selected ? `0 0 0 1px ${person.accent}, var(--shadow-cut)` : 'var(--shadow-cut)',
        opacity: resolved ? 0.5 : 1,
        /* Accent left-spine when selected: same file-folder language as case cards */
        borderLeftWidth: '1px',
        borderLeftColor: selected ? person.accent : 'var(--color-border-strong)',
      }}
    >
      <button onClick={onSelect} aria-pressed={selected} className="focus-ring flex gap-2.5 flex-1 min-w-0 text-left items-start">
        {/* Polaroid evidence print: parchment border with the deeper bottom
            margin a real print has, pinned at a slight angle and casting a hard
            directional shadow. The tilt alternates per suspect so a column of
            cards reads as pinned to a board, not mechanically stacked. */}
        <div
          className="relative flex-shrink-0"
          style={{
            background: 'var(--color-text-primary)',
            padding: '3px 3px 9px 3px',
            transform: `rotate(${person.id.charCodeAt(person.id.length - 1) % 2 ? -2.5 : 2}deg)`,
            boxShadow: '0 3px 8px -1px rgba(0,0,0,0.6)',
          }}
        >
          <span
            className="contact-sheet-portrait block h-11 w-11"
            role="img"
            aria-label={`${person.name} portrait`}
            style={{
              backgroundImage: 'url("/assets/contact-sheet.jpg")',
              backgroundSize: '400% 200%',
              backgroundPosition: `${portraitColumn * 33.333}% ${portraitRow * 100}%`,
            }}
          >
          </span>
          {placed && (
            /* Placement marker: sharp square badge (no rounding) for the noir
               language. NOT a correctness check — lock = committed. */
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center"
              title={locked ? 'Locked in' : conflicted ? 'Row/column conflict' : 'Placed on the board'}
              style={{
                width: 16, height: 16,
                backgroundColor: conflicted ? 'var(--color-danger)' : locked ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                border: `2px solid ${conflicted ? 'var(--color-danger)' : locked ? 'var(--color-accent)' : person.accent}`,
                color: 'var(--color-on-accent)',
              }}>
              {locked ? <Lock size={9} strokeWidth={3} /> : conflicted ? <span className="text-[10px] font-bold leading-none" style={{ color: 'var(--color-on-accent)' }}>!</span> : null}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Suspect name: headline font-display, the case file's subject line */}
            <span className={`font-display font-bold text-sm leading-tight truncate tracking-wide uppercase ${resolved ? 'line-through' : ''}`} style={{ color: '#1A1710' }}>{person.name}</span>
            {person.isVictim && (
              /* Stamped-ink VICTIM marker: rectangular (no rounding), danger-text
                 on a muted danger wash. Same rubber-stamp aesthetic as CLOSED on
                 the case cards. Slight rotation to read as physically stamped.
                 The card is always parchment, so the ink is a fixed deep red
                 rather than the theme's danger-text (pale pink in dark mode). */
              <span
                className="text-[10px] font-display font-bold uppercase tracking-[0.14em] px-1 py-[2px] leading-none flex-shrink-0"
                style={{
                  color: '#7A1F1A',
                  border: '1px solid color-mix(in srgb, #7A1F1A 55%, transparent)',
                  background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
                  transform: 'rotate(-1deg)',
                  display: 'inline-block',
                }}
              >
                VICTIM
              </span>
            )}
          </div>
          {clues.map((c, i) => {
            /* Clue text: font-mono — typed evidence on the case file.
               This is the signature move of the redesign: clues read as
               a detective's typewritten notes, not UI body copy.
               There is deliberately NO per-clue "satisfied" tick. It used to
               light up when the current board met a clue, which let a player
               click suspects around until the ticks came on and never read a
               clue (and on relational clues it confirmed partial answers). The
               `satisfiedClues` prop is still accepted so callers compile, but
               it is not drawn. Checking a clue off is the player's own act
               (showCheck / onToggleResolved). */
            return (
              <p
                key={i}
                className={`text-[11px] leading-snug mt-0.5 font-mono flex gap-1 items-baseline ${resolved ? 'line-through' : ''}`}
                style={{ color: '#30291D' }}
              >
                {clues.length > 1 ? <span className="flex-shrink-0 opacity-60" aria-hidden>—</span> : null}
                <span>{c}</span>
              </p>
            )
          })}
        </div>
      </button>

      {canLocate && onToggleLocate && (
        /* Locate: the only thing that puts an amber square on the board. Help is
           asked for, never volunteered — selecting a suspect must stay a pure
           placement action. Pressed state is carried by fill + aria-pressed. */
        <button
          onClick={onToggleLocate}
          aria-pressed={!!located}
          aria-label={located ? `Hide ${person.name}'s clue on the board` : `Show ${person.name}'s clue on the board`}
          title="Show me where this clue points"
          className="focus-ring flex-shrink-0 self-start w-11 h-11 border flex items-center justify-center transition-colors"
          style={{
            borderColor: located ? 'var(--color-accent)' : 'var(--color-border-strong)',
            background: located ? 'var(--color-accent)' : 'transparent',
            color: located ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
          }}
        >
          <Crosshair size={15} strokeWidth={2.4} />
        </button>
      )}

      {showCheck && (
        /* Checkbox: sharp-cornered dossier tick box. Unresolved = unfilled
           outline button — border IS the affordance, so border-strong required. */
        <button
          onClick={onToggleResolved}
          aria-label={resolved ? 'Mark clue unsolved' : 'Mark clue solved'}
          title="Your own note — check off clues you've worked out"
          className="focus-ring flex-shrink-0 self-start w-11 h-11 border flex items-center justify-center transition-colors"
          style={{
            /* Unresolved: unfilled outline button → border-strong (WCAG 1.4.11) */
            borderColor: resolved ? 'var(--color-accent)' : 'var(--color-border-strong)',
            background: resolved ? 'var(--color-accent)' : 'transparent',
            color: resolved ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
          }}
        >
          {resolved && <Check size={13} strokeWidth={3} />}
        </button>
      )}
    </motion.div>
  )
}
