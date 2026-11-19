// Places the board has to keep free of room names. The reference shell lays the authored evidence markers of a case
// (see reference/story) over the plan at fixed coordinates, in cell units; a name must never sit on one.
import { storyFor } from '../../story'

type Box = [number, number, number, number]
/** A marker's keep-clear half-size: its 0.08 cell radius plus the 0.1 cell the story validator holds labels away, rounded up. */
const HALF = 0.2

export function evidenceKeepClear(caseId: string): Box[] {
  return (storyFor(caseId)?.evidence ?? []).map(e => [e.placement.x - HALF, e.placement.y - HALF, e.placement.x + HALF, e.placement.y + HALF] as Box)
}
