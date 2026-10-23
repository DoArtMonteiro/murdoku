import { AlertTriangle, Check, CircleDashed, ChevronsRight, UserRound } from 'lucide-react'
import type { Puzzle } from '../core/types'

interface Props {
  puzzle: Puzzle
  selectedPerson: string | null
  placedOf: Record<string, { row: number; col: number; locked?: boolean }>
  conflicts: Set<string>
  onSelectPerson: (id: string) => void
}

/**
 * The continuity desk's ordered account of the case.
 *
 * This is intentionally a semantic list of buttons rather than a progress
 * meter: each frame is a navigation target, and the text state keeps placed,
 * suggested, victim, and conflict states understandable without colour.
 */
export default function CaseProgressStrip({
  puzzle,
  selectedPerson,
  placedOf,
  conflicts,
  onSelectPerson,
}: Props) {
  const placedCount = puzzle.people.reduce((count, person) => count + (placedOf[person.id] ? 1 : 0), 0)
  const nextPerson = puzzle.people.find(person => !placedOf[person.id])

  return (
    <section
      data-testid="case-progress-strip"
      aria-labelledby="case-progress-heading"
      className="mx-3 mt-2 border lg:mx-4 lg:mt-3"
      style={{
        borderColor: 'var(--color-border-strong)',
        backgroundColor: '#D8C8A4',
        backgroundImage: 'url("/assets/evidence-paper.jpg")',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        boxShadow: 'var(--shadow-cut)',
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b px-3 py-2 sm:items-center sm:px-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="min-w-0">
          <h2 id="case-progress-heading" className="font-display text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#18150F' }}>
            Continuity / sequence
          </h2>
          {/* A instrução quebra linha em ecrãs estreitos: é o passo seguinte do jogador e não pode ficar cortada. */}
          <p data-testid="case-progress-status" className="mt-0.5 break-words font-mono text-[10px] tracking-wide" style={{ color: '#4B4232' }}>
            {nextPerson ? `Next suggested: ${nextPerson.name}` : 'All people placed — review the account before accusing.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
          <p className="font-mono text-[11px] tabular-nums tracking-widest" style={{ color: '#62400B' }} aria-live="polite">
            {placedCount} / {puzzle.people.length} placed
          </p>
          <span
            className="inline-flex items-center text-[#62400B] sm:hidden"
            role="img"
            aria-label="Deslize horizontalmente para ver as restantes pessoas"
          >
            <ChevronsRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>

      <ol
        className="flex min-w-0 gap-1.5 overflow-x-auto px-2 py-2 sm:gap-2 sm:px-3"
        aria-label="People in the reconstruction sequence"
        style={{
          backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--color-border-strong) 45%, transparent) 0 1.5px, transparent 1.8px)',
          backgroundPosition: '0 0',
          backgroundSize: '16px 16px',
        }}
      >
        {puzzle.people.map((person, index) => {
          const placed = Boolean(placedOf[person.id])
          const conflicted = conflicts.has(person.id)
          const selected = selectedPerson === person.id
          const suggested = !placed && person.id === nextPerson?.id
          const state = conflicted ? 'conflict' : placed ? 'placed' : suggested ? 'next' : 'open'
          const stateLabel = conflicted ? 'conflict' : placed ? 'placed' : suggested ? 'next suggested' : 'open'

          return (
            <li key={person.id} className="flex min-w-[142px] flex-1 items-stretch sm:min-w-0">
              <button
                type="button"
                onClick={() => onSelectPerson(person.id)}
                aria-pressed={selected}
                aria-current={selected ? 'step' : undefined}
                aria-label={`Step ${index + 1}, ${person.name}, ${stateLabel}${person.isVictim ? ', victim' : ''}`}
                data-person={person.id}
                data-state={state}
                className="focus-ring group relative flex min-h-[52px] w-full items-center gap-2 border px-2.5 py-2 text-left transition-colors sm:px-3"
                style={{
                  borderColor: conflicted
                    ? 'var(--color-danger)'
                    : selected
                    ? 'var(--color-accent-strong)'
                    : placed
                    ? 'color-mix(in srgb, var(--color-accent) 60%, var(--color-border-strong))'
                    : 'var(--color-border-strong)',
                  backgroundColor: selected ? '#D9A94E' : placed ? '#D4C095' : '#E2D7BD',
                  backgroundImage: 'url("/assets/evidence-paper.jpg")',
                  backgroundSize: 'cover',
                  backgroundBlendMode: 'multiply',
                  color: conflicted ? '#641F19' : '#19150F',
                  clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center border font-mono text-xs font-bold tabular-nums"
                  style={{
                    borderColor: conflicted ? 'var(--color-danger)' : selected ? 'var(--color-accent-strong)' : 'var(--color-border-strong)',
                    backgroundColor: selected ? '#A46C08' : '#312A20',
                    color: selected ? '#FFF7E4' : '#F1E8CE',
                  }}
                >
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[13px] font-semibold uppercase tracking-[0.08em]">
                    {person.name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.13em]" style={{ color: '#4B4232' }}>
                    {conflicted ? <AlertTriangle size={12} aria-hidden="true" /> : placed ? <Check size={12} aria-hidden="true" /> : suggested ? <CircleDashed size={12} aria-hidden="true" /> : <UserRound size={12} aria-hidden="true" />}
                    <span>{stateLabel}</span>
                    {person.isVictim && <span style={{ color: '#7A1F1A' }}>· victim</span>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
