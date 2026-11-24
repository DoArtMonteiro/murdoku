// Shared assembly for the authored One False Alibi cases. A case file states the story-first data
// (house, plan, statements, collisions, story); this derives the parts that must never drift from it:
// the room map and the puzzle whose clues are exactly the true statements plus the victim marker.
// tests/lie/case-*.test.ts and verifyLieCase check the result against the engine.
import type { Cell, Furniture, FurnitureType, Person, Puzzle, Room } from '../../core/types'
import type { LieCase, LieStory, Statement } from '../model'

export const rect = (r0: number, c0: number, r1: number, c1: number): Cell[] => {
  const out: Cell[] = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c })
  return out
}

/** A piece of furniture; a piece taller than wide is drawn turned. */
export const piece = (type: FurnitureType, row: number, col: number, w = 1, h = 1): Furniture => ({
  type, row, col, w, h, rotation: w < h ? 90 : 0, floor: 0,
})

export const at = (row: number, col: number): Cell => ({ row, col, floor: 0 })

export const VICTIM_MARKER = 'The victim — found alone with the murderer.'

export interface CaseSpec {
  id: string
  title: string
  caseNumber: string
  difficulty: Puzzle['difficulty']
  flavor: string
  size: Puzzle['size']
  rooms: Room[]
  furniture: Furniture[]
  people: Person[]
  solution: Record<string, Cell>
  victimId: string
  statements: Statement[]
  lieId: string
  collisions: string[][]
  story: LieStory
}

export function buildCase(spec: CaseSpec): LieCase {
  const roomOf: string[][] = Array.from({ length: spec.size }, () => Array<string>(spec.size).fill(''))
  for (const room of spec.rooms) for (const c of room.cells) roomOf[c.row][c.col] = room.id
  const lie = spec.statements.find(s => s.id === spec.lieId)
  if (!lie) throw new Error(`${spec.id}: lieId ${spec.lieId} is not a statement`)
  return {
    id: spec.id,
    puzzle: {
      id: spec.id,
      title: spec.title,
      caseNumber: spec.caseNumber,
      difficulty: spec.difficulty,
      size: spec.size,
      rooms: spec.rooms,
      roomOf,
      furniture: spec.furniture,
      people: spec.people,
      clues: [
        ...spec.statements.filter(s => s.id !== spec.lieId).map(s => ({ clue: s.clue, text: s.text })),
        { clue: { kind: 'victim', person: spec.victimId }, text: VICTIM_MARKER },
      ],
      solution: spec.solution,
      victimId: spec.victimId,
      murdererId: lie.author,
      flavor: spec.flavor,
      source: 'custom',
    },
    statements: spec.statements,
    lieId: spec.lieId,
    collisions: spec.collisions,
    story: spec.story,
  }
}
