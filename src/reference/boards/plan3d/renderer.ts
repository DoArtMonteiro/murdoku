// ============================================================================
// plan3d RENDERER — owns the WebGL context for one board.
//
// Render on demand: a frame is drawn when the plan or the size changes, never
// on a timer. Everything GPU-side is disposed by dispose().
// ============================================================================

import * as THREE from 'three'
import type { BoardLayout } from '../../contract'
import { makePlanCamera } from './layout'
import type { Plan } from './plan'
import { buildScene, drawLabels, type BuiltScene, type Models } from './scene'

export interface PlanRenderer {
  setPlan: (plan: Plan, models: Models) => void
  resize: (layout: BoardLayout, width: number, height: number) => void
  render: () => void
  /** Draw calls of the last frame. */
  stats: () => { calls: number; triangles: number; geometries: number; textures: number }
  dispose: () => void
  readonly gl: THREE.WebGLRenderer
  readonly camera: () => THREE.OrthographicCamera | null
  readonly current: () => BuiltScene | null
}

export interface RendererOptions { dpr?: number; antialias?: boolean }

export function createPlanRenderer(canvas: HTMLCanvasElement, opts: RendererOptions = {}): PlanRenderer | null {
  let gl: THREE.WebGLRenderer
  try {
    gl = new THREE.WebGLRenderer({ canvas, antialias: opts.antialias ?? true, alpha: true, preserveDrawingBuffer: true })
  } catch {
    return null
  }
  const dpr = opts.dpr ?? Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)
  gl.setPixelRatio(dpr)
  gl.outputColorSpace = THREE.SRGBColorSpace
  gl.toneMapping = THREE.NoToneMapping
  gl.shadowMap.enabled = true
  gl.shadowMap.type = THREE.PCFShadowMap
  gl.setClearColor(0x000000, 0)

  let built: BuiltScene | null = null
  let plan: Plan | null = null
  let cam: THREE.OrthographicCamera | null = null
  let size = { w: 0, h: 0 }
  let layout: BoardLayout | null = null
  let disposed = false

  const applySize = () => {
    if (!plan || !layout || !built) return
    cam = makePlanCamera(layout, size.w, size.h, plan.n)
    gl.setSize(size.w, size.h, false)
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    const { x0, y0, cellW, cellH } = layout
    const sheet = new THREE.Vector4(x0 - 0.6 * cellW, y0 - 0.6 * cellH, x0 + (plan.n + 0.4) * cellW, y0 + (plan.n + 0.4) * cellH)
    built.vignette.uniforms.uSheet.value.copy(sheet)
    built.vignette.uniforms.uSize.value.set(size.w, size.h)
    built.vignette.uniforms.uDpr.value = dpr
    built.edgeMaterial.linewidth = (layout.cellW >= 80 ? 2 : layout.cellW >= 56 ? 1.5 : 1) * dpr
    built.edgeMaterial.resolution.set(size.w * dpr, size.h * dpr)
    built.labelMaterial.map?.dispose()
    const tex = new THREE.CanvasTexture(drawLabels(plan, layout, dpr))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = tex.magFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    built.labelMaterial.map = tex
    built.labelMaterial.needsUpdate = true
  }

  const render = () => {
    if (disposed || !built || !cam) return
    gl.render(built.scene, cam)
  }

  return {
    gl,
    camera: () => cam,
    current: () => built,
    setPlan(next, models) {
      built?.dispose()
      plan = next
      built = buildScene(next, models, layout ?? { x0: 0, y0: 0, cellW: 1, cellH: 1 })
      applySize()
      render()
    },
    resize(nextLayout, w, h) {
      layout = nextLayout
      size = { w, h }
      applySize()
      render()
    },
    render,
    stats: () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures }),
    dispose() {
      disposed = true
      built?.dispose()
      built = null
      gl.dispose()
      gl.forceContextLoss()
    },
  }
}
