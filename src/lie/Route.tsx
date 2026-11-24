// Entry for `?alibi`, `?alibi=<caseId>`, `?alibi=<caseId>&truth` and `?alibi=gallery`.
import { Suspense, lazy, useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import type { LieCase } from './model'
import Game from './Game'
import './tokens.css'

/** Cases the route can play. Each loads on demand. */
const CASES: Record<string, () => Promise<LieCase>> = {
  fixture: () => import('./fixture').then(m => m.LIE_FIXTURE),
  'ofa-01': () => import('./case1').then(m => m.LIE_CASE_1),
}

const DEFAULT_CASE = 'ofa-01' in CASES ? 'ofa-01' : 'fixture'

// The art gallery is optional: a glob resolves to nothing when the file is absent, so a build without it still works.
const galleryModules = import.meta.glob<{ default?: ComponentType; Gallery?: ComponentType }>('./art/Gallery.tsx')
const GalleryLazy = Object.values(galleryModules)[0]
  ? lazy(async () => {
    const m = await Object.values(galleryModules)[0]()
    return { default: (m.default ?? m.Gallery ?? Missing) as ComponentType }
  })
  : null

function Missing() { return <Note title="No gallery in this build." /> }

function Note({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="ofa ofa-note">
      <main className="ofa-side">
        <h1 className="ofa-sheet-title">{title}</h1>
        {children}
        <a className="ofa-ghost" href="?casebook=">Back to the casebook</a>
      </main>
    </div>
  )
}

interface Props {
  /** The value of `?alibi=`: a case id, 'gallery', or empty for the default case. */
  alibi: string
  /** `&truth`: the comparison direction, where everyone told the truth. */
  truth?: boolean
}

export default function AlibiRoute({ alibi, truth = false }: Props) {
  if (alibi === 'gallery') {
    return GalleryLazy
      ? <Suspense fallback={null}><GalleryLazy /></Suspense>
      : <Note title="No gallery in this build." />
  }
  return <CaseLoader id={alibi || DEFAULT_CASE} truth={truth} />
}

function CaseLoader({ id, truth }: { id: string; truth: boolean }) {
  const [state, setState] = useState<{ id: string; c: LieCase | null; failed: boolean } | null>(null)
  useEffect(() => {
    let live = true
    const load = CASES[id]
    if (!load) { setState({ id, c: null, failed: false }); return }
    load().then(
      c => { if (live) setState({ id, c, failed: false }) },
      () => { if (live) setState({ id, c: null, failed: true }) },
    )
    return () => { live = false }
  }, [id])

  if (!state || state.id !== id) return <div className="ofa" aria-busy="true" />
  if (!state.c) {
    return (
      <Note title={state.failed ? 'That case did not load.' : `No case called "${id}".`}>
        <p className="ofa-sheet-p">Available: {Object.keys(CASES).join(', ')}.</p>
      </Note>
    )
  }
  return <Game key={`${state.c.id}${truth ? ':truth' : ''}`} lieCase={state.c} truthOnly={truth} />
}
