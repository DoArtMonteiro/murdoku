import type { CaseStory } from './schema'
import { veryEasy1Story } from './cases/very-easy-1'

const STORIES: Record<string, CaseStory> = {
  [veryEasy1Story.caseId]: veryEasy1Story,
}

/** The authored story of a case, or null (the shell then plays as plain R1). */
export function storyFor(caseId: string): CaseStory | null {
  return STORIES[caseId] ?? null
}

export type { CaseStory } from './schema'
