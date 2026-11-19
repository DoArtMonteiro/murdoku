// Generated wording: every sentence in the hint and the reconstruction is built
// here from clue and chain data. Nothing positional is hand-written.
import type { Cell, Clue, FurnitureType, Puzzle } from '../core/types'
import { cellName, firstName, floorWord } from './cells'

const FURNITURE_LABEL: Partial<Record<FurnitureType, string>> = { tv: 'TV' }
export const furnitureLabel = (t: FurnitureType): string => FURNITURE_LABEL[t] ?? t

const roomLabel = (p: Puzzle, id: string): string => p.rooms.find(r => r.id === id)?.name ?? 'that room'
const dirWord = { N: 'north', S: 'south', E: 'east', W: 'west' } as const

/** "the clock" when the house holds exactly one piece of that type (docs/CLUE_SEMANTICS.md), else "a lamp". */
export function thing(p: Puzzle, t: FurnitureType): string {
  return `${p.furniture.filter(f => f.type === t).length === 1 ? 'the' : 'a'} ${furnitureLabel(t)}`
}

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * One statement as a sentence-case chip, no full stop. Built from the clue, never from ClueText.text.
 * Digits always. "On a clock square" means the person occupies a square the clock covers; "Beside"
 * means next to it and not on it.
 */
export function chipPhrase(p: Puzzle, clue: Clue): string {
  const who = (id: string) => firstName(p, id)
  switch (clue.kind) {
    case 'room': return `In the ${roomLabel(p, clue.roomId)}`
    case 'notRoom': return `Not in the ${roomLabel(p, clue.roomId)}`
    case 'onFurniture': return `On ${thing(p, clue.furniture)} square`
    case 'onlyOnFurniture': return `The only one on ${thing(p, clue.furniture)} square`
    case 'besideFurniture': return `Beside ${thing(p, clue.furniture)}`
    case 'besideAny': return `Beside ${clue.furniture.map(t => thing(p, t)).join(' or ')}`
    case 'row': return `In row ${clue.row + 1}`
    case 'col': return `In column ${clue.col + 1}`
    case 'edge': return 'On the outer edge of the house'
    case 'corner': return 'In a corner of the house'
    case 'floor': return clue.floorNum === 0 ? 'On the ground floor' : clue.floorNum === 1 ? 'Upstairs' : `On floor ${clue.floorNum + 1}`
    case 'above': return clue.targetKind === 'room' ? `Directly above the ${roomLabel(p, clue.target)}` : `Directly above ${who(clue.target)}`
    case 'below': return clue.targetKind === 'room' ? `Directly below the ${roomLabel(p, clue.target)}` : `Directly below ${who(clue.target)}`
    case 'direction': {
      const unit = clue.dir === 'N' || clue.dir === 'S' ? 'row' : 'column'
      return clue.steps
        ? `${clue.steps} ${unit}${clue.steps === 1 ? '' : 's'} ${dirWord[clue.dir]} of ${who(clue.other)}`
        : `Anywhere ${dirWord[clue.dir]} of ${who(clue.other)}`
    }
    case 'besidePerson': return `Right beside ${who(clue.other)}`
    case 'sameRoomAs': return `In the same room as ${who(clue.other)}`
    case 'notSameRoomAs': return `Not in the same room as ${who(clue.other)}`
    case 'victim': return ''
  }
}

/** The victim's statements read as the scene, not as testimony: "Found: in the Study". */
export function chipText(p: Puzzle, clue: Clue, scene = false): string {
  const t = chipPhrase(p, clue)
  return scene && t ? `Found: ${lowerFirst(t)}` : t
}

/** What a clue says, as a phrase that follows a name: "on a clock square", "in row 3". */
export const cluePhrase = (p: Puzzle, clue: Clue): string => lowerFirst(chipPhrase(p, clue))

export function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Which of a taken lane a removed cell lay in: "row 3" or "column 5". */
export function laneOf(removed: Cell, holder: Cell): string {
  return removed.row === holder.row ? `row ${removed.row + 1}` : `column ${removed.col + 1}`
}

export const cellList = (p: Puzzle, cells: Cell[]): string => joinList(cells.map(c => cellName(p, c)))

/** "row 3, columns 1, 2 and 5, upstairs": squares grouped by row and floor so a list stays readable. */
export function squareList(p: Puzzle, cells: Cell[]): string {
  const groups = new Map<string, Cell[]>()
  for (const c of cells) groups.set(`${c.floor ?? 0}:${c.row}`, [...(groups.get(`${c.floor ?? 0}:${c.row}`) ?? []), c])
  return [...groups.values()].map(g => {
    const fw = floorWord(p, g[0].floor ?? 0)
    const cols = g.map(c => c.col + 1).sort((a, b) => a - b)
    return `row ${g[0].row + 1}, column${cols.length > 1 ? 's' : ''} ${joinList(cols.map(String))}${fw ? `, ${fw}` : ''}`
  }).join('; ')
}
