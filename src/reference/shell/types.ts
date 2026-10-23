// Structural view of the useGame() return that the reference shell depends on.
// Fields that are being added/removed concurrently are optional so the shell
// compiles before and after those changes.
import type { CellMark, GameMode, Puzzle } from '../../core/types'
import type { BoardLayoutFn, BoardProps } from '../contract'
import type { ComponentType } from 'react'

export type ShellTool = 'place' | 'x' | 'draft'

export interface PlacedAt { row: number; col: number; floor: number; locked?: boolean }

export interface GameApi {
  puzzles: readonly Puzzle[]
  catalogProgress: { done: number; total: number } | null
  puzzle: Puzzle | null
  screen?: string
  mode?: GameMode
  marks: CellMark[][]
  activeFloor: number
  selectedPerson: string | null
  tool: ShellTool
  hintsLeft: number
  completed: boolean
  murderer: string | null
  feedback: string
  accusationsLeft?: number
  placedOf: Record<string, PlacedAt>
  conflicts: ReadonlySet<string>
  history: readonly unknown[]
  start: (id: string, mode: GameMode) => void
  selectPerson: (id: string) => void
  setTool: (t: ShellTool) => void
  clickCell: (row: number, col: number) => void
  clearAll: () => void
  undo: () => void
  hint: () => void
  submit: () => void
  switchFloor?: (floor: 0 | 1) => void
  revealed?: boolean
  reveal?: () => void
  startOver?: () => void
}

export interface BoardModule {
  Board: ComponentType<BoardProps>
  boardLayout: BoardLayoutFn
  /** Optional overlay painted above the token layer (e.g. room names); aria-hidden, pointer-events none. */
  Labels?: ComponentType<BoardProps>
}
