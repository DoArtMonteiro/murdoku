// The one flag Case 0 keeps: `alibi_tutorial_v1`. `done` once the roll-call has been heard,
// `skipped` when the player said they know how to play, `dismissed` when the picker's offer
// was closed. Any value hides the offer. Nothing here reads or writes a murdoku_* key, and
// every access is wrapped: private mode or a full quota only means the offer comes back.
export const TUTORIAL_KEY = 'alibi_tutorial_v1'

export type TutorialFlag = 'done' | 'skipped' | 'dismissed'

export function readTutorialFlag(): string | null {
  try { return localStorage.getItem(TUTORIAL_KEY) } catch { return null }
}

export function writeTutorialFlag(value: TutorialFlag): void {
  try {
    // A finished walk-through is never downgraded by a later skip or dismissal.
    if (value !== 'done' && localStorage.getItem(TUTORIAL_KEY) === 'done') return
    localStorage.setItem(TUTORIAL_KEY, value)
  } catch { /* storage unavailable: the offer simply shows again */ }
}
