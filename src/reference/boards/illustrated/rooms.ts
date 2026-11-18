// Room names to a style-independent role, used to pick floors and decor.
import type { Role } from './styles/types'

export function roleOf(name: string): Role {
  const n = name.toLowerCase()
  if (/front yard|yard|courtyard|driveway|lawn/.test(n)) return 'yard'
  if (/garden|grounds|terrace|patio/.test(n)) return 'garden'
  if (/porch|veranda|verandah|stoop|deck/.test(n)) return 'porch'
  if (/landing|stairs/.test(n)) return 'landing'
  if (/conservatory|greenhouse/.test(n)) return 'conservatory'
  if (/hall|entrance|foyer|lobby|corridor|vestibule|passage/.test(n)) return 'hall'
  if (/kitchen|scullery/.test(n)) return 'kitchen'
  if (/pantry|larder|utility|laundry/.test(n)) return 'pantry'
  if (/bath|toilet|wc|shower/.test(n)) return 'bath'
  if (/bed|nursery|guest|dressing/.test(n)) return 'bed'
  if (/dining/.test(n)) return 'dining'
  if (/study|office|library|den\b/.test(n)) return 'study'
  if (/living|lounge|sitting|drawing|parlou?r|reception/.test(n)) return 'living'
  return 'other'
}

/** Rooms that read as exterior ground (lawn, paving, deck): no walls, no ceiling decor. */
export const isOutdoor = (r: Role) => r === 'yard' || r === 'garden' || r === 'porch'
