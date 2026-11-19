import type { Puzzle } from '../core/types'
import { cellFloor } from '../core/types'
import { floorWord } from './cells'
import type { Placement } from './cells'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  placement: Placement
  selected: string
  conflicts: ReadonlySet<string>
  /** People a supposition has left with no square: red pencil. */
  contradictions: ReadonlySet<string>
  /** Supposition: how many squares each person has left. */
  counts: Record<string, number> | null
  onSelect: (id: string) => void
}

/** The portrait rail: one tap selects a suspect. Shows placed or unplaced, and marks the victim. */
export function Rail({ puzzle, placement, selected, conflicts, contradictions, counts, onSelect }: Props) {
  return (
    <ul className="cb-rail" aria-label="Suspects">
      {puzzle.people.map(p => {
        const cell = placement[p.id]
        const bad = conflicts.has(p.id)
        const none = contradictions.has(p.id)
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
              data-victim={p.isVictim || undefined}
              aria-pressed={p.id === selected}
              aria-label={`${p.name}${p.isVictim ? ', the victim' : ''}, ${where}${bad ? ', shares a row or column' : ''}${none ? ', no square left' : ''}`}
              title={none ? `No square left for ${p.name}` : undefined}
              onClick={() => onSelect(p.id)}
            >
              <span className="cb-who-face">
                <Portrait person={p} size={44} />
                {counts && p.id in counts && <b className="cb-count" data-zero={counts[p.id] === 0 || undefined}>{counts[p.id]}</b>}
              </span>
              <span className="cb-who-name">{p.name}</span>
              <span className="cb-who-state" aria-hidden="true">{p.isVictim ? 'victim' : cell ? 'placed' : 'to place'}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
