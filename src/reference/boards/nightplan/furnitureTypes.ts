import type { FurnitureType } from '../../../core/types'

/** Every FurnitureType the Night Plan draws (furniture.tsx's ART is a Record over the same union, so tsc enforces completeness). */
export const FURNITURE_TYPES: readonly FurnitureType[] = [
  'chair', 'sofa', 'bed', 'table', 'box', 'rug', 'plant', 'shrub', 'lamp', 'counter', 'tv', 'bathtub',
  'bookshelf', 'stove', 'fridge', 'clock', 'desk', 'toilet', 'shower',
]
