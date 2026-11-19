import type { Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { firstName, floorWord } from './cells'
import type { Placement } from './cells'
import { Notch } from './Notch'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  placement: Placement
  selected: string
  conflicts: ReadonlySet<string>
  /** People whose statements all hold where they stand. */
  holds: ReadonlySet<string>
  /** People a supposition has left with no square: red pencil. */
  contradictions: ReadonlySet<string>
  /** Supposition: how many squares each person has left. */
  counts: Record<string, number> | null
  onSelect: (id: string) => void
}

/** The portrait rail: one tap selects a suspect. A dashed ring is unplaced, a solid ring is placed; only the victim is captioned. */
export function Rail({ puzzle, placement, selected, conflicts, holds, contradictions, counts, onSelect }: Props) {
  return (
    <ul className="cb-rail" aria-label="Suspects" data-dense={puzzle.people.length >= 6 || undefined}>
      {puzzle.people.map(p => {
        const cell = placement[p.id]
        const name = firstName(puzzle, p.id)
        const bad = conflicts.has(p.id)
        const none = contradictions.has(p.id)
        const fits = holds.has(p.id) && !bad
        const where = cell ? `placed${floorWord(puzzle, cellFloor(cell)) ? `, ${floorWord(puzzle, cellFloor(cell))}` : ''}` : 'not placed'
        return (
          <li key={p.id}>
            <button
              type="button"
              className="cb-who"
              data-selected={p.id === selected || undefined}
              data-placed={!!cell || undefined}
              data-bad={bad || undefined}
              data-none={none || undefined}
              data-holds={fits || undefined}
              data-victim={p.isVictim || undefined}
              aria-pressed={p.id === selected}
              aria-label={`${name}${p.isVictim ? ', the victim' : ''}, ${where}${bad ? ', shares a row or column' : ''}${fits ? ', statements hold' : ''}${none ? ', no square left' : ''}`}
              title={none ? `No square left for ${name}` : undefined}
              onClick={() => onSelect(p.id)}
            >
              <span className="cb-who-face">
                <Portrait person={p} name={name} size={44} />
                {bad && <Notch className="cb-notch cb-notch-rail" />}
                {fits && <b className="cb-holds" aria-hidden="true">✓</b>}
                {counts && p.id in counts && <b className="cb-count" data-zero={counts[p.id] === 0 || undefined}>{counts[p.id]}</b>}
              </span>
              <span className="cb-who-name">{name}</span>
              {p.isVictim && <span className="cb-who-state" aria-hidden="true">victim</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
