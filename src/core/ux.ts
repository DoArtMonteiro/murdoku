import type {
  Cell,
  CellMark,
  Clue,
  Difficulty,
  FurnitureType,
  GameMode,
  Puzzle,
  ClueText,
} from './types'

export const IN_PROGRESS_KEY = 'murdoku_play_v1'
export const LEGACY_IN_PROGRESS_KEY = 'murdoku_inprogress'
export const CASE_NOTES_KEY = 'murdoku_case_notes_v1'
export const NOTE_STORE_KEY = CASE_NOTES_KEY
export const CASE_NOTES_STORAGE_KEY = CASE_NOTES_KEY

export type DifficultyFilter = Difficulty | 'All'

export interface InProgressSummary {
  readonly id: string
  readonly mode: GameMode
  readonly elapsedSeconds: number
  readonly placedCount: number
  readonly selectedPerson: string | null
}

export interface ClueHighlight {
  roomId?: string
  furniture?: FurnitureType
  cells?: Cell[]
}

export interface CaseNotesStore {
  version: 1
  notes: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function decode(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase()
}

/** Return catalog cases matching both the free-text query and difficulty. */
export function filterCases(
  puzzles: readonly Puzzle[],
  query = '',
  difficulty: DifficultyFilter = 'All',
): Puzzle[] {
  const needle = normalized(query)
  return puzzles.filter(puzzle => {
    if (difficulty !== 'All' && puzzle.difficulty !== difficulty) return false
    if (!needle) return true

    const searchable = [
      puzzle.id,
      puzzle.title,
      puzzle.caseNumber,
      puzzle.flavor,
      ...puzzle.people.map(person => person.name),
      ...puzzle.rooms.map(room => room.name),
    ]
      .join(' ')
      .toLocaleLowerCase()

    return searchable.includes(needle)
  })
}

function validMode(value: unknown): value is GameMode {
  return value === 'classic' || value === 'detective'
}

function validPersonId(value: unknown, personIds: ReadonlySet<string>): value is string {
  return typeof value === 'string' && personIds.has(value)
}

function validCellMark(value: unknown, personIds: ReadonlySet<string>): value is CellMark {
  if (!isRecord(value) || typeof value.kind !== 'string') return false

  switch (value.kind) {
    case 'empty':
      return true
    case 'person':
      return validPersonId(value.person, personIds)
        && (value.locked === undefined || typeof value.locked === 'boolean')
    case 'x':
      return value.auto === undefined || typeof value.auto === 'boolean'
    case 'draft': {
      if (!Array.isArray(value.persons) || value.persons.length === 0) return false
      const persons = value.persons.filter((person): person is string => typeof person === 'string')
      return persons.length === value.persons.length
        && new Set(persons).size === persons.length
        && persons.every(person => personIds.has(person))
    }
    default:
      return false
  }
}

/**
 * A size x size grid of valid marks, or null. Untrusted input from storage:
 * wrong dimensions, unknown marks and people not in the case all fail closed.
 */
export function parseMarksGrid(value: unknown, size: number, personIds: ReadonlySet<string>): CellMark[][] | null {
  if (!Array.isArray(value) || value.length !== size) return null
  const grid: CellMark[][] = []
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== size) return null
    const out: CellMark[] = []
    for (const mark of row) {
      if (!validCellMark(mark, personIds)) return null
      out.push(mark)
    }
    grid.push(out)
  }
  return grid
}

/**
 * Parse an autosaved play into the small, read-only summary needed by Home.
 * Invalid JSON, unknown cases, wrong board dimensions, and stale person ids
 * are deliberately treated as no resumable work.
 */
export function parseInProgress(
  raw: unknown,
  puzzles: readonly Puzzle[],
): InProgressSummary | null {
  const value = decode(raw)
  if (!isRecord(value)) return null

  const id = value.id ?? value.puzzleId
  if (typeof id !== 'string' || !id) return null
  const puzzle = puzzles.find(candidate => candidate.id === id)
  if (!puzzle || !validMode(value.mode)) return null

  const marks = value.marks
  if (!Array.isArray(marks) || marks.length !== puzzle.size) return null

  const personIds = new Set(puzzle.people.map(person => person.id))
  const placedPeople = new Set<string>()
  for (const row of marks) {
    if (!Array.isArray(row) || row.length !== puzzle.size) return null
    for (const mark of row) {
      if (!validCellMark(mark, personIds)) return null
      if (mark.kind === 'person') {
        if (placedPeople.has(mark.person)) return null
        placedPeople.add(mark.person)
      }
    }
  }

  const elapsedValue = value.elapsedSeconds ?? value.elapsed
  if (typeof elapsedValue !== 'number' || !Number.isFinite(elapsedValue) || elapsedValue < 0) return null

  const selected = value.selectedPerson ?? value.selected ?? null
  if (selected !== null && !validPersonId(selected, personIds)) return null

  return {
    id,
    mode: value.mode,
    elapsedSeconds: Math.floor(elapsedValue),
    placedCount: placedPeople.size,
    selectedPerson: selected,
  }
}

function cellsForRow(size: number, row: number): Cell[] {
  if (row < 0 || row >= size) return []
  return Array.from({ length: size }, (_, col) => ({ row, col }))
}

function cellsForColumn(size: number, col: number): Cell[] {
  if (col < 0 || col >= size) return []
  return Array.from({ length: size }, (_, row) => ({ row, col }))
}

function cellsForEdge(size: number): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (row === 0 || col === 0 || row === size - 1 || col === size - 1) cells.push({ row, col })
    }
  }
  return cells
}

function cellsForCorner(size: number): Cell[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: size - 1 },
    { row: size - 1, col: 0 },
    { row: size - 1, col: size - 1 },
  ]
}

const nonEmpty = (cells: Cell[]): ClueHighlight | null => cells.length ? { cells } : null

/** The board target, if any, that one clue points at. */
function highlightForClue(puzzle: Puzzle, clue: Clue): ClueHighlight | null {
  switch (clue.kind) {
    case 'room':
      return { roomId: clue.roomId }
    case 'onFurniture':
    case 'onlyOnFurniture':
    case 'besideFurniture':
      return { furniture: clue.furniture }
    case 'besideAny': {
      const furniture = clue.furniture[0]
      return furniture ? { furniture } : null
    }
    // An out-of-range coordinate produces no cells, and a highlight with an
    // empty cell list would draw nothing while still reading as "located".
    case 'row':
      return nonEmpty(cellsForRow(puzzle.size, clue.row))
    case 'col':
      return nonEmpty(cellsForColumn(puzzle.size, clue.col))
    case 'edge':
      return nonEmpty(cellsForEdge(puzzle.size))
    case 'corner':
      return nonEmpty(cellsForCorner(puzzle.size))
    default:
      // Relational clues (besidePerson, sameRoomAs, direction) depend on where
      // another suspect lands, so they have no fixed square to draw around.
      return null
  }
}

/**
 * Every board target a person's clues point at.
 *
 * A suspect can carry more than one clue ("Beside the rug." + "In row 2."), and
 * the previous single-target version returned only the first match in a fixed
 * room > furniture > coordinate order, silently dropping the rest. Showing one
 * of two constraints is worse than showing none: it reads as the whole answer.
 */
export function resolveClueHighlights(puzzle: Puzzle, personId: string, activeFloor?: 0 | 1): ClueHighlight[] {
  const previewFloor = resolveCluePreviewFloor(puzzle, personId)
  if (activeFloor !== undefined && previewFloor !== null && activeFloor !== previewFloor) return []
  return puzzle.clues
    .filter(({ clue }) => clue.person === personId)
    .map(({ clue }) => highlightForClue(puzzle, clue))
    .filter((highlight): highlight is ClueHighlight => highlight !== null)
}

/** Use clue facts and their furniture candidates to select a floor, never the answer. */
export function resolveCluePreviewFloor(puzzle: Puzzle, personId: string): 0 | 1 | null {
  if ((puzzle.floors ?? 1) < 2) return null
  const clues = puzzle.clues.filter(({ clue }) => clue.person === personId).map(({ clue }) => clue)
  const floors = clues.flatMap(clue => {
    if (clue.kind === 'floor') return [clue.floorNum]
    if (clue.kind === 'room') {
      const room = puzzle.rooms.find(room => room.id === clue.roomId)
      return room ? [room.floor ?? 0] : []
    }
    return []
  })
  const furnitureFloors = floors.length ? [] : clues.flatMap(clue => {
    const types = clue.kind === 'besideAny' ? clue.furniture
      : clue.kind === 'onFurniture' || clue.kind === 'onlyOnFurniture' || clue.kind === 'besideFurniture'
        ? [clue.furniture] : []
    return puzzle.furniture.filter(piece => types.includes(piece.type)).map(piece => piece.floor ?? 0)
  })
  const unique = [...new Set(floors.length ? floors : furnitureFloors)]
  return unique.length === 1 && (unique[0] === 0 || unique[0] === 1) ? unique[0] : null
}

/** Back-compatible single-target accessor: the first drawable target. */
export function resolveClueHighlight(puzzle: Puzzle, personId: string): ClueHighlight | null {
  return resolveClueHighlights(puzzle, personId)[0] ?? null
}

function emptyCaseNotes(): CaseNotesStore {
  return { version: 1, notes: {} }
}

function cleanNotes(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const notes: Record<string, string> = {}
  for (const [caseId, note] of Object.entries(value)) {
    if (caseId && typeof note === 'string' && note.length > 0) notes[caseId] = note
  }
  return notes
}

/** Parse the v1 notes record; malformed versions fail closed to an empty store. */
export function parseCaseNotes(raw: unknown): CaseNotesStore {
  const value = decode(raw)
  if (!isRecord(value) || value.version !== 1) return emptyCaseNotes()
  const notes = isRecord(value.notes) ? value.notes : value.cases
  return { version: 1, notes: cleanNotes(notes) }
}

/** Serialize a notes map or a v1 store without allowing prototype pollution. */
export function serializeCaseNotes(value: CaseNotesStore | Record<string, string>): string {
  const candidate: unknown = value
  const notes = isRecord(candidate) && candidate.version === 1 && isRecord(candidate.notes)
    ? cleanNotes(candidate.notes)
    : cleanNotes(candidate)
  return JSON.stringify({ version: 1, notes })
}

// Explicit aliases keep the helpers discoverable for consumers that call the
// persistence layer a note store rather than a case-notes store.
export const parseNoteStore = parseCaseNotes
export const serializeNoteStore = serializeCaseNotes
export const parseNotes = parseCaseNotes
export const serializeNotes = serializeCaseNotes

// --- Accusation diagnostics -------------------------------------------------

/**
 * Which clues the player's current arrangement actually breaks.
 *
 * A rejected accusation used to say only "wrong". In a deduction game that is
 * the least useful thing you can say: the player has a chain of reasoning and
 * no way to find the link that snapped, so the only recovery is to re-derive
 * the whole board. Naming the broken RULE points at the flaw without revealing
 * where anyone belongs — the player still has to work out why it broke.
 *
 * Deliberately reports the clue text, never a cell. Victim flavour clues are
 * skipped because they assert nothing testable about placement.
 *
 * NOT FOR THE ACCUSE FLOW. Feeding this to a rejected accusation turns the
 * button into an oracle: each wrong submit then names a rule the arrangement
 * breaks, which a script can walk to the answer. GameScreen no longer calls it
 * (a rejection says one thing: the account does not hold up). It stays as a
 * pure helper for tests and for tools that want a player's own board checked
 * on request.
 */
export function findFailingClues(
  puzzle: Puzzle,
  placed: Record<string, Cell>,
  holds: (puzzle: Puzzle, clue: Clue, place: Record<string, Cell>) => boolean,
): ClueText[] {
  // Only judge a clue once every person it mentions is on the board; an unmet
  // clue about a suspect who has not been placed yet is not a mistake.
  const isPlaced = (id: string) => !!placed[id]
  return puzzle.clues.filter(({ clue }) => {
    if (clue.kind === 'victim') return false
    if (!isPlaced(clue.person)) return false
    const other = (clue as { other?: string }).other
    if (other && !isPlaced(other)) return false
    return !holds(puzzle, clue, placed)
  })
}

/**
 * Which of a person's clues the CURRENT arrangement already satisfies.
 *
 * Parallel to the clue text order used by the suspect card, so index i of the
 * result describes clue i of that card. Derived on every call and never cached:
 * a clue satisfied now becomes unsatisfied after an undo, and a stale tick
 * would be worse than no tick at all.
 *
 * A clue is only counted once every person it mentions is on the board. An
 * unmet clue about a suspect who has not been placed yet is not a failure and
 * must not read as one.
 *
 * NOT DRAWN BY THE GAME. SuspectCard used to tick a clue whenever the current
 * board satisfied it, which let a player slide a token around until the ticks
 * came on instead of reading the clue. The ticks are off; this helper remains
 * for tests and for any view that checks a board on explicit request.
 */
export function satisfiedClueFlags(
  puzzle: Puzzle,
  personId: string,
  placed: Record<string, Cell>,
  holds: (puzzle: Puzzle, clue: Clue, place: Record<string, Cell>) => boolean,
): boolean[] {
  return puzzle.clues
    .filter(({ clue }) => clue.person === personId)
    .map(({ clue }) => {
      if (clue.kind === 'victim') return false
      if (!placed[clue.person]) return false
      const other = (clue as { other?: string }).other
      if (other && !placed[other]) return false
      return holds(puzzle, clue, placed)
    })
}
