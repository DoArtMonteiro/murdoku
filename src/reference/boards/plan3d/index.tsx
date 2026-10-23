// ============================================================================
// plan3d board — Murdoku reference prototype 2: a Three.js house drawn as a
// tilted plan (orthographic, azimuth 0, elevation 72). Purely visual: no
// pointer handlers, aria-hidden, deterministic for (puzzle, floor, size).
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoardLayout, BoardProps } from '../../contract'
import { boardLayout } from './layout'
import { buildPlan, labelCharU } from './plan'
import { loadModelData } from './models'
import { modelsFor, type Models } from './scene'
import type { PlanRenderer } from './renderer'

export { boardLayout }

export default function Board({ puzzle, floor, width, height, layout }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<PlanRenderer | null>(null)
  const latest = useRef<{ layout: BoardLayout; width: number; height: number }>({ layout, width, height })
  latest.current = { layout, width, height }
  const [unsupported, setUnsupported] = useState(false)
  // label spacing depends on the type size, which flips once between 9 and 11 px
  const charU = layout.cellW >= 80 ? labelCharU(100) : labelCharU(50)
  const plan = useMemo(() => buildPlan(puzzle, floor, charU), [puzzle, floor, charU])

  // (re)build the scene when the plan changes; the context lives as long as the plan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let created: PlanRenderer | null = null
    ;(async () => {
      const { createPlanRenderer } = await import('./renderer')
      if (cancelled) return
      created = createPlanRenderer(canvas)
      if (!created) { setUnsupported(true); return }
      rendererRef.current = created
      const names = modelsFor(plan)
      const data = await Promise.all(names.map(async n => [n, await loadModelData(n).catch(() => [])] as const))
      if (cancelled) return
      const models: Models = new Map(data)
      const { layout: l, width: w, height: h } = latest.current
      created.resize(l, w, h)
      created.setPlan(plan, models)
    })()
    return () => {
      cancelled = true
      created?.dispose()
      if (rendererRef.current === created) rendererRef.current = null
    }
  }, [plan])

  // a resize / layout change redraws the same scene; nothing else triggers a frame
  useEffect(() => {
    rendererRef.current?.resize(layout, width, height)
  }, [layout, width, height])

  if (unsupported) return <div aria-hidden data-plan3d="no-webgl" style={{ width, height }} />
  return (
    <div aria-hidden data-plan3d="board" style={{ position: 'relative', width, height, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0, width, height, display: 'block' }} />
    </div>
  )
}
