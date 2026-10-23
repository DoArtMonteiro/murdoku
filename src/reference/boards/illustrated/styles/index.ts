import type { Puzzle } from '../../../../core/types'
import { hashStr } from '../color'
import { artdeco } from './artdeco'
import { mediterranean } from './mediterranean'
import { modernist } from './modernist'
import { tudor } from './tudor'
import type { StyleId, StyleKit } from './types'
import { victorian } from './victorian'

export const STYLES: Record<StyleId, StyleKit> = { victorian, artdeco, tudor, modernist, mediterranean }
export const STYLE_IDS: readonly StyleId[] = ['victorian', 'artdeco', 'tudor', 'modernist', 'mediterranean']

/**
 * Explicit style per case. Midnight Delivery (very-easy-1) is Victorian per the
 * style bible; the other very-easy cases showcase the other four packs. Every
 * other case follows a fixed rotation keyed by difficulty tier and case number
 * so neighbouring cases rarely share a style.
 */
const BY_CASE: Record<string, StyleId> = {
  'very-easy-1': 'victorian',
  'very-easy-2': 'artdeco',
  'very-easy-3': 'tudor',
  'very-easy-4': 'modernist',
  'very-easy-5': 'mediterranean',
}
const TIER_OFFSET: Record<string, number> = { 'very-easy': 0, easy: 1, medium: 2, hard: 3, expert: 4, master: 2 }

export function styleIdFor(puzzle: Pick<Puzzle, 'id'>): StyleId {
  const hit = BY_CASE[puzzle.id]
  if (hit) return hit
  const m = /^([a-z-]+?)-(\d+)$/.exec(puzzle.id)
  if (m) {
    const off = TIER_OFFSET[m[1]]
    if (off !== undefined) return STYLE_IDS[(off + Number(m[2]) - 1) % STYLE_IDS.length]
  }
  return STYLE_IDS[hashStr(puzzle.id) % STYLE_IDS.length]
}

/** The style kit for a puzzle: deterministic, a pure function of the case id. */
export function styleFor(puzzle: Pick<Puzzle, 'id'>): StyleKit {
  return STYLES[styleIdFor(puzzle)]
}
