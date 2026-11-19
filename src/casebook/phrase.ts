// Generated wording: every sentence in the hint and the reconstruction is built
// here from clue and chain data. Nothing positional is hand-written.
import type { Cell, Clue, FurnitureType, Puzzle } from '../core/types'
import { cellName, firstName } from './cells'

const FURNITURE_LABEL: Partial<Record<FurnitureType, string>> = { tv: 'TV' }
export const furnitureLabel = (t: FurnitureType): string => FURNITURE_LABEL[t] ?? t

const roomLabel = (p: Puzzle, id: string): string => p.rooms.find(r => r.id === id)?.name ?? 'that room'
const dirWord = { N: 'north', S: 'south', E: 'east', W: 'west' } as const

/** What a clue says, as a phrase that follows a name: "on the clock", "in row 3". */
export function cluePhrase(p: Puzzle, clue: Clue): string {
  const who = (id: string) => firstName(p, id)
  switch (clue.kind) {
    case 'room': return `in the ${roomLabel(p, clue.roomId)}`
    case 'notRoom': return `not in the ${roomLabel(p, clue.roomId)}`
    case 'onFurniture': return `on the ${furnitureLabel(clue.furniture)}`
    case 'onlyOnFurniture': return `alone on the ${furnitureLabel(clue.furniture)}`
    case 'besideFurniture': return `beside the ${furnitureLabel(clue.furniture)}`
    case 'besideAny': return `beside the ${clue.furniture.map(furnitureLabel).join(' or the ')}`
    case 'row': return `in row ${clue.row + 1}`
    case 'col': return `in column ${clue.col + 1}`
    case 'edge': return 'against an outer wall'
    case 'corner': return 'in a corner'
    case 'floor': return clue.floorNum === 0 ? 'on the ground floor' : 'upstairs'
    case 'above': return clue.targetKind === 'room' ? `directly above the ${roomLabel(p, clue.target)}` : `directly above ${who(clue.target)}`
    case 'below': return clue.targetKind === 'room' ? `directly below the ${roomLabel(p, clue.target)}` : `directly below ${who(clue.target)}`
    case 'direction': return `${clue.steps ? `${clue.steps} ` : ''}${dirWord[clue.dir]} of ${who(clue.other)}`
    case 'besidePerson': return `next to ${who(clue.other)}`
    case 'sameRoomAs': return `in ${who(clue.other)}'s room`
    case 'notSameRoomAs': return `not in ${who(clue.other)}'s room`
    case 'victim': return ''
  }
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
