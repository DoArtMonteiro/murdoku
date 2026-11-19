// The painted plan is a separate chunk so the slice shell can paint first.
import type { ComponentType } from 'react'
import type { BoardLayoutFn, BoardProps } from '../reference/contract'

export interface BoardModule {
  Board: ComponentType<BoardProps>
  boardLayout: BoardLayoutFn
  /** Room-name overlay, painted above the tokens. */
  Labels?: ComponentType<BoardProps>
}

export function loadBoard(): Promise<BoardModule> {
  return import('../reference/boards/illustrated').then(m => ({ Board: m.default, boardLayout: m.boardLayout, Labels: m.BoardLabels }))
}
