// Entry for `?alibi`, `?alibi=<caseId>`, `?alibi=<caseId>&truth` and `?alibi=gallery`.
// `?alibi` with no id opens the first case the player has not solved. `&truth` is the hidden authoring harness:
// nothing in the interface leads to it.
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import type { LieCase } from './model'
import Game from './Game'
import { loadSolved, nextId, pickId } from './save'
import './tokens.css'

/** A case the route can play: its id and title are known now, the case itself loads on demand. */
interface Entry { id: string; title: string; load: () => Promise<LieCase> }

type CaseModules = { CASES_IN_ORDER?: unknown; LIE_CASE_1?: LieCase; LIE_FIXTURE?: LieCase }

// Every case source is optional: a glob resolves to nothing when a file is absent, so a build without it still works.
// `./cases/index.ts` exports CASES_IN_ORDER (LieCase objects, or { id, title?, load } entries) and is the casebook.
// Without it the route falls back to the single case and the fixture. The fixture is always playable by id.
const modules = import.meta.glob<CaseModules>(['./cases/index.ts', './case1.ts', './fixture.ts'])

const isCase = (x: unknown): x is LieCase =>
  typeof x === 'object' && x !== null && 'puzzle' in x && 'statements' in x && 'story' in x
const isEntry = (x: unknown): x is { id: string; title?: string; load: () => Promise<LieCase> } =>
  typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string' && typeof (x as { load?: unknown }).load === 'function'

const fromCase = (c: LieCase): Entry => ({ id: c.id, title: c.story.title, load: () => Promise.resolve(c) })
const lazyCase = (id: string, title: string, path: string, pick: (m: CaseModules) => LieCase | undefined): Entry => ({
  id, title,
  load: async () => {
    const c = pick(await modules[path]())
    if (!c) throw new Error(`no case in ${path}`)
    return c
  },
})

interface Registry { order: Entry[]; byId: Map<string, Entry> }

async function loadRegistry(): Promise<Registry> {
  const order: Entry[] = []
  const index = modules['./cases/index.ts']
  if (index) {
    try {
      const list = (await index()).CASES_IN_ORDER
      if (Array.isArray(list)) {
        for (const x of list) {
          if (isCase(x)) order.push(fromCase(x))
          else if (isEntry(x)) order.push({ id: x.id, title: x.title ?? x.id, load: x.load })
        }
      }
    } catch { /* fall back to the single case below */ }
  }
  if (!order.length && modules['./case1.ts']) order.push(lazyCase('ofa-01', 'One False Alibi', './case1.ts', m => m.LIE_CASE_1))
  const byId = new Map(order.map(e => [e.id, e]))
  if (modules['./fixture.ts'] && !byId.has('fixture')) byId.set('fixture', lazyCase('fixture', 'The Quiet Quay', './fixture.ts', m => m.LIE_FIXTURE))
  return { order, byId }
}

// The art gallery is optional too.
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
  /** The value of `?alibi=`: a case id, 'gallery', or empty for the first unsolved case. */
  alibi: string
  /** `&truth`: the hidden authoring harness, where everyone told the truth. */
  truth?: boolean
}

export default function AlibiRoute({ alibi, truth = false }: Props) {
  if (alibi === 'gallery') {
    return GalleryLazy
      ? <Suspense fallback={null}><GalleryLazy /></Suspense>
      : <Note title="No gallery in this build." />
  }
  return <CaseLoader initial={alibi} truth={truth} />
}

function CaseLoader({ initial, truth }: { initial: string; truth: boolean }) {
  const [reg, setReg] = useState<Registry | null>(null)
  const [asked, setAsked] = useState(initial)
  const [loaded, setLoaded] = useState<{ id: string; c: LieCase | null; failed: boolean } | null>(null)

  useEffect(() => { void loadRegistry().then(setReg) }, [])
  const id = useMemo(() => (reg ? pickId(asked, reg.order, loadSolved()) : ''), [reg, asked])

  useEffect(() => {
    if (!reg || !id) return
    let live = true
    const entry = reg.byId.get(id)
    if (!entry) { setLoaded({ id, c: null, failed: false }); return }
    entry.load().then(
      c => { if (live) setLoaded({ id, c, failed: false }) },
      () => { if (live) setLoaded({ id, c: null, failed: true }) },
    )
    return () => { live = false }
  }, [reg, id])

  const goTo = useCallback((to: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('alibi', to)
    window.history.pushState(null, '', url)
    setAsked(to)
  }, [])

  if (!reg || !loaded || loaded.id !== id) return <div className="ofa" aria-busy="true" />
  if (!loaded.c) {
    return (
      <Note title={loaded.failed ? 'That case did not load.' : id ? `No case called "${id}".` : 'No cases in this build.'}>
        <p className="ofa-sheet-p">Available: {reg.order.map(e => e.id).join(', ') || 'none'}.</p>
      </Note>
    )
  }
  const next = nextId(loaded.c.id, reg.order, loadSolved())
  return (
    <Game
      key={`${loaded.c.id}${truth ? ':truth' : ''}`}
      lieCase={loaded.c}
      truthOnly={truth}
      cases={reg.order.map(e => ({ id: e.id, title: e.title }))}
      onNext={next ? () => goTo(next) : undefined}
    />
  )
}
