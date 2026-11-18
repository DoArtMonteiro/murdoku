// Dev harness for the plan3d board (not part of the app bundle): renders one
// case at a given box size and exposes measurement hooks on window.__plan3d.
//   /src/reference/boards/plan3d/harness/index.html?case=very-easy-1&w=896&h=812&floor=0&grid=1
import { createRoot } from 'react-dom/client'
import Board, { boardLayout } from '../index'
import { initCatalog, getPuzzleById } from '../../../../core/catalog'
import { buildPlan } from '../plan'
import { loadModelData } from '../models'
import { modelsFor } from '../scene'
import { measureOcclusion } from '../diagnostics'
import { createPlanRenderer } from '../renderer'
import { makePlanCamera, projectToBox } from '../layout'

const q = new URLSearchParams(location.search)
initCatalog()
const id = q.get('case') ?? 'very-easy-1'
const puzzle = getPuzzleById(id)!
const w = Number(q.get('w') ?? 896), h = Number(q.get('h') ?? 812), floor = Number(q.get('floor') ?? 0)
const layout = boardLayout(w, h, puzzle.size)
const showGrid = q.has('grid')

createRoot(document.getElementById('root')!).render(
  <div style={{ position: 'relative', width: w, height: h, background: q.has('bg') ? '#111511' : 'transparent' }}>
    <Board puzzle={puzzle} floor={floor} width={w} height={h} layout={layout} theme="dark" />
    {showGrid && (
      <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
        {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => {
          const r = Math.floor(i / puzzle.size), c = i % puzzle.size
          return <rect key={i} x={layout.x0 + c * layout.cellW} y={layout.y0 + r * layout.cellH} width={layout.cellW} height={layout.cellH} fill="none" stroke="#ff00aa" strokeWidth={0.5} />
        })}
      </svg>
    )}
  </div>,
)

const api = {
  puzzle, layout, w, h,
  async measure() {
    const plan = buildPlan(puzzle, floor)
    const data = await Promise.all(modelsFor(plan).map(async m => [m, await loadModelData(m)] as const))
    return measureOcclusion(plan, new Map(data), layout, w, h)
  },
  plan: () => buildPlan(puzzle, floor),
  /** Build + render on a private canvas: draw calls, scene build ms, per-frame ms. */
  async stats() {
    const plan = buildPlan(puzzle, floor)
    const data = await Promise.all(modelsFor(plan).map(async m => [m, await loadModelData(m)] as const))
    const canvas = document.createElement('canvas')
    const r = createPlanRenderer(canvas, { dpr: 1 })!
    r.resize(layout, w, h)
    const t0 = performance.now()
    r.setPlan(plan, new Map(data))
    const build = performance.now() - t0
    const times: number[] = []
    for (let i = 0; i < 10; i++) { const t = performance.now(); r.render(); r.gl.getContext().finish(); times.push(performance.now() - t) }
    const out = { ...r.stats(), buildMs: build, frameMs: times.sort((a, b) => a - b)[5], objects: plan.objects.length, models: modelsFor(plan).length }
    r.dispose()
    const after = { geometries: r.gl.info.memory.geometries, textures: r.gl.info.memory.textures }
    return { ...out, afterDispose: after }
  },
  project(x: number, z: number) {
    const cam = makePlanCamera(layout, w, h, puzzle.size)
    return projectToBox(cam, w, h, x, 0, z)
  },
}
;(window as unknown as { __plan3d: typeof api }).__plan3d = api
