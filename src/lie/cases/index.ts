// The One False Alibi season in play order. Each case loads on demand.
import type { LieCase } from '../model'

export interface CaseEntry {
  id: string
  title: string
  load: () => Promise<LieCase>
}

export const CASES_IN_ORDER: CaseEntry[] = [
  { id: 'ofa-01', title: 'The Silent Bell', load: () => import('./ofa-01').then(m => m.OFA_01) },
  { id: 'ofa-02', title: 'The Notary’s Last Page', load: () => import('./ofa-02').then(m => m.OFA_02) },
  { id: 'ofa-03', title: 'The Bell Ringer', load: () => import('./ofa-03').then(m => m.OFA_03) },
]
