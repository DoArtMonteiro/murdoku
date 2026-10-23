// Floor materials as SVG <pattern> tiles. All tiles are whole numbers of cells
// (1 or 2) authored in cell units, so on an integer cell size the tile edges
// land on whole pixels and no seams appear. Every material has a texture pass
// (grain / mottling / joint lines) kept under ~14% luminance contrast so the
// centre zone of a cell stays calm for tokens.
import type { ReactNode } from 'react'
import type { Reg } from './reg'
import { darken, hashStr, lighten, mix, rng } from './color'
import type { FloorSpec } from './styles/types'

const f = (v: number) => +v.toFixed(3)

type R = () => number
const jit = (c: string, r: R, amt: number) => (r() < 0.5 ? darken(c, r() * amt) : lighten(c, r() * amt))

function pattern(reg: Reg, key: string, size: number, children: (id: string) => ReactNode, h = size): string {
  const id = reg.once(`mat-${key}`, i => (
    <pattern key={i} id={i} patternUnits="userSpaceOnUse" width={size} height={h}>{children(i)}</pattern>
  ))
  return reg.url(id)
}

/** Wide boards running east-west, staggered butt joints, per-board colour and grain. */
function planks(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  const base = spec.a
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const rows = 8, h = 1 / rows * 2 // 4 boards per cell
    const els: ReactNode[] = []
    for (let row = 0; row < rows / 2; row++) {
      // each row spans 2 cells wide; two or three boards per row
      let x = -r() * 0.9
      const y = row * 0.25
      let i = 0
      while (x < 2) {
        const len = 0.9 + r() * 1.1
        const x0 = Math.max(0, x), x1 = Math.min(2, x + len)
        if (x1 > x0) {
          const c = jit(base, r, 0.1)
          els.push(<rect key={`b${row}-${i}`} x={f(x0)} y={f(y)} width={f(x1 - x0)} height={0.25} fill={c} />)
          // grain: two or three long darker streaks
          for (let g = 0; g < 5; g++) {
            const gy = y + 0.03 + r() * 0.19
            const gx0 = x0 + r() * (x1 - x0) * 0.3, gx1 = x1 - r() * (x1 - x0) * 0.3
            els.push(<path key={`g${row}-${i}-${g}`} d={`M${f(gx0)} ${f(gy)}Q${f((gx0 + gx1) / 2)} ${f(gy + (r() - 0.5) * 0.03)} ${f(gx1)} ${f(gy)}`} stroke={darken(c, 0.35)} strokeOpacity={0.14} strokeWidth={px * 1.2} fill="none" />)
          }
          els.push(<path key={`j${row}-${i}`} d={`M${f(x0)} ${f(y + 0.25)}H${f(x1)}`} stroke={darken(base, 0.55)} strokeOpacity={0.5} strokeWidth={px * 1.4} />)
          els.push(<path key={`l${row}-${i}`} d={`M${f(x0)} ${f(y + 0.25 + px)}H${f(x1)}`} stroke="#fff" strokeOpacity={0.05} strokeWidth={px} />)
          if (x > 0) els.push(<path key={`e${row}-${i}`} d={`M${f(x)} ${f(y)}V${f(y + 0.25)}`} stroke={darken(base, 0.55)} strokeOpacity={0.55} strokeWidth={px * 1.4} />)
        }
        x += len
        i++
      }
    }
    void h
    return els
  }, 1)
}

/** 90-degree herringbone: planks 1x3 units of w = 1/6 cell; tile = 1 cell. */
function herring(reg: Reg, spec: FloorSpec, key: string, px: number, brickMode = false): string {
  return pattern(reg, key, 1, () => {
    const r = rng(hashStr(key))
    const w = 1 / 6, L = 3 * w
    const els: ReactNode[] = []
    const seam = darken(spec.a, 0.6)
    const draw = (x: number, y: number, horiz: boolean, i: number) => {
      const ww = horiz ? L : w, hh = horiz ? w : L
      if (x + ww <= 0 || y + hh <= 0 || x >= 1 || y >= 1) return
      const c = brickMode ? jit(spec.b && r() < 0.35 ? spec.b : spec.a, r, 0.1) : jit(spec.a, r, 0.12)
      els.push(<rect key={`p${i}`} x={f(x)} y={f(y)} width={f(ww)} height={f(hh)} fill={c} stroke={seam} strokeOpacity={0.55} strokeWidth={px * 1.2} />)
      // grain
      const n = horiz ? 2 : 2
      for (let g = 0; g < n; g++) {
        const t = 0.3 + g * 0.4
        if (horiz) els.push(<path key={`g${i}-${g}`} d={`M${f(x + 0.02)} ${f(y + hh * t)}H${f(x + ww - 0.02)}`} stroke={darken(c, 0.4)} strokeOpacity={0.12} strokeWidth={px} />)
        else els.push(<path key={`g${i}-${g}`} d={`M${f(x + ww * t)} ${f(y + 0.02)}V${f(y + hh - 0.02)}`} stroke={darken(c, 0.4)} strokeOpacity={0.12} strokeWidth={px} />)
      }
    }
    let i = 0
    for (let k = 0; k < 6; k++) {
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
        draw(k * w + dx, k * w + dy, true, i++)
        draw((k + 3) * w + dx, (k - 2) * w + dy, false, i++)
      }
    }
    return els
  })
}

/** Square tiles with grout; `n` tiles per cell side. */
function tiles(reg: Reg, spec: FloorSpec, key: string, px: number, n: number, variant: 'quarry' | 'hydraulic' | 'chequer' | 'mosaic'): string {
  return pattern(reg, key, 2, () => {
    if (variant === 'mosaic') {
      // small square tiles: a ground, a tone-on-tone checker and one grout path
      const r2 = rng(hashStr(key))
      const els2: ReactNode[] = [<rect key="bg" width={2} height={2} fill={spec.a} />]
      const s2 = 1 / n
      for (let i = 0; i < 2 * n; i++) for (let j = 0; j < 2 * n; j++) {
        if ((i + j) % 2 === 0) continue
        els2.push(<rect key={`m${i}-${j}`} x={f(i * s2)} y={f(j * s2)} width={f(s2)} height={f(s2)} fill={jit(spec.b ?? '#222', r2, 0.12)} fillOpacity={0.55} />)
      }
      let d2 = ''
      for (let k = 0; k <= 2 * n; k++) d2 += `M${f(k * s2)} 0V2M0 ${f(k * s2)}H2`
      els2.push(<path key="grout" d={d2} stroke={darken(spec.a, 0.55)} strokeOpacity={0.4} strokeWidth={px} />)
      return els2
    }
    const r = rng(hashStr(key))
    const els: ReactNode[] = []
    const s = 1 / n
    const grout = variant === 'chequer' ? darken(spec.a, 0.3) : darken(spec.a, 0.55)
    for (let i = 0; i < 2 * n; i++) for (let j = 0; j < 2 * n; j++) {
      let c: string
      if (variant === 'chequer') c = (i + j) % 2 === 0 ? (spec.a) : (spec.b ?? '#888')
      else if (variant === 'hydraulic') c = (i + j) % 2 === 0 ? spec.a : (spec.b ?? lighten(spec.a, 0.5))
      else c = spec.a
      c = jit(c, r, variant === 'chequer' ? 0.05 : 0.1)
      const x = i * s, y = j * s
      els.push(<rect key={`t${i}-${j}`} x={f(x)} y={f(y)} width={f(s)} height={f(s)} fill={c} />)
      if (variant === 'chequer') {
        // marble veining on light squares, burnish on dark ones
        const light = (i + j) % 2 === 0 ? false : true
        for (let v = 0; v < 2; v++) {
          const y0 = y + r() * s, y1 = y + r() * s
          els.push(<path key={`v${i}-${j}-${v}`} d={`M${f(x)} ${f(y0)}Q${f(x + s * 0.5)} ${f(y + r() * s)} ${f(x + s)} ${f(y1)}`} stroke={light ? darken(c, 0.35) : lighten(c, 0.25)} strokeOpacity={light ? 0.18 : 0.08} strokeWidth={px * 1.2} fill="none" />)
        }
      } else {
        // mottling: a soft lighter patch and a dark speck
        els.push(<circle key={`m${i}-${j}`} cx={f(x + s * (0.3 + r() * 0.4))} cy={f(y + s * (0.3 + r() * 0.4))} r={f(s * 0.28)} fill={lighten(c, 0.12)} fillOpacity={0.18} />)
        els.push(<circle key={`s${i}-${j}`} cx={f(x + s * r())} cy={f(y + s * r())} r={px * 1.2} fill={darken(c, 0.4)} fillOpacity={0.35} />)
      }
      els.push(<rect key={`l${i}-${j}`} x={f(x)} y={f(y)} width={f(s)} height={f(s)} fill="none" stroke={grout} strokeOpacity={variant === 'chequer' ? 0.35 : 0.6} strokeWidth={px * (variant === 'quarry' ? 2 : 1.2)} />)
    }
    return els
  })
}

/** Irregular flagstones: a periodic jittered lattice of quads. */
function flags(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const N = 4, S = 2 / N
    const P: [number, number][][] = []
    for (let i = 0; i < N; i++) {
      P[i] = []
      for (let j = 0; j < N; j++) P[i][j] = [i * S + (r() - 0.5) * S * 0.45, j * S + (r() - 0.5) * S * 0.45]
    }
    const els: ReactNode[] = []
    const grout = darken(spec.a, 0.6)
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const at = (a: number, b: number): [number, number] => {
        const ii = a % N, jj = b % N
        return [P[ii][jj][0] + (a >= N ? 2 : 0), P[ii][jj][1] + (b >= N ? 2 : 0)]
      }
      const q = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
      const c = jit(spec.a, r, 0.14)
      for (const dx of [-2, 0, 2]) for (const dy of [-2, 0, 2]) {
        const d = q.map(([x, y]) => `${f(x + dx)} ${f(y + dy)}`).join('L')
        els.push(<path key={`q${i}-${j}-${dx}-${dy}`} d={`M${d}Z`} fill={c} stroke={grout} strokeOpacity={0.65} strokeWidth={px * 2} strokeLinejoin="round" />)
      }
      const [cx, cy] = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]
      els.push(<circle key={`c${i}-${j}`} cx={f(cx)} cy={f(cy)} r={f(S * 0.22)} fill={lighten(c, 0.1)} fillOpacity={0.15} />)
    }
    return els
  })
}

/** Terrazzo: a ground colour sown with chips of two or three stones. */
function terrazzo(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = [<rect key="bg" width={2} height={2} fill={spec.a} />]
    const chips = [spec.b ?? darken(spec.a, 0.5), spec.c ?? lighten(spec.a, 0.25), darken(spec.a, 0.25)]
    for (let i = 0; i < 150; i++) {
      const x = r() * 2, y = r() * 2, s = 0.015 + r() * 0.035
      const k = 3 + Math.floor(r() * 3)
      const ang = r() * Math.PI
      const pts: string[] = []
      for (let v = 0; v < k; v++) {
        const a = ang + (v / k) * Math.PI * 2 + (r() - 0.5) * 0.6
        const rr = s * (0.7 + r() * 0.5)
        pts.push(`${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`)
      }
      for (const dx of [-2, 0, 2]) for (const dy of [-2, 0, 2]) {
        if (x + dx < -0.1 || x + dx > 2.1 || y + dy < -0.1 || y + dy > 2.1) continue
        els.push(<path key={`c${i}-${dx}-${dy}`} d={`M${pts.map(p => { const [a, b] = p.split(' ').map(Number); return `${f(a + dx)} ${f(b + dy)}` }).join('L')}Z`} fill={chips[i % 3]} fillOpacity={0.55} />)
      }
    }
    void px
    return els
  })
}

/** Polished dark marble with pale veins. */
function marble(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = [<rect key="bg" width={2} height={2} fill={spec.a} />]
    for (let i = 0; i < 9; i++) {
      const x0 = r() * 2, y0 = r() * 2
      let d = `M${f(x0)} ${f(y0)}`
      let x = x0, y = y0
      for (let s = 0; s < 4; s++) { x += (r() - 0.35) * 0.5; y += (r() - 0.5) * 0.5; d += `L${f(x)} ${f(y)}` }
      for (const dx of [-2, 0, 2]) for (const dy of [-2, 0, 2]) {
        els.push(<path key={`v${i}-${dx}-${dy}`} d={d} transform={`translate(${dx} ${dy})`} stroke={spec.b ?? lighten(spec.a, 0.3)} strokeOpacity={0.12} strokeWidth={px * (1 + r() * 1.5)} fill="none" strokeLinecap="round" />)
      }
    }
    for (let i = 0; i < 6; i++) els.push(<ellipse key={`m${i}`} cx={f(r() * 2)} cy={f(r() * 2)} rx={f(0.2 + r() * 0.3)} ry={f(0.15 + r() * 0.2)} fill={lighten(spec.a, 0.18)} fillOpacity={0.05} />)
    return els
  })
}

/** Woven / mottled soft ground: carpet, plaster, lime floor, concrete, lawn-ish. */
function speckled(reg: Reg, spec: FloorSpec, key: string, px: number, weave: boolean): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = [<rect key="bg" width={2} height={2} fill={spec.a} />]
    for (let i = 0; i < 7; i++) els.push(<ellipse key={`b${i}`} cx={f(r() * 2)} cy={f(r() * 2)} rx={f(0.25 + r() * 0.35)} ry={f(0.2 + r() * 0.3)} fill={r() < 0.5 ? lighten(spec.a, 0.1) : darken(spec.a, 0.12)} fillOpacity={0.1} />)
    const n = weave ? 120 : 90
    for (let i = 0; i < n; i++) {
      const x = r() * 2, y = r() * 2
      if (weave) els.push(<path key={`w${i}`} d={`M${f(x)} ${f(y)}h${f(0.03 + r() * 0.04)}`} stroke={r() < 0.5 ? lighten(spec.a, 0.25) : darken(spec.a, 0.35)} strokeOpacity={0.22} strokeWidth={px * 1.2} />)
      else els.push(<circle key={`s${i}`} cx={f(x)} cy={f(y)} r={px * (0.6 + r())} fill={r() < 0.5 ? lighten(spec.a, 0.3) : darken(spec.a, 0.4)} fillOpacity={0.22} />)
    }
    return els
  })
}

/** Large-format slabs: one-cell slabs with joint lines and mottling (travertine, concrete, porcelain). */
function slabs(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = []
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const c = jit(spec.a, r, 0.06)
      els.push(<rect key={`s${i}${j}`} x={i} y={j} width={1} height={1} fill={c} />)
      for (let k = 0; k < 4; k++) els.push(<ellipse key={`m${i}${j}${k}`} cx={f(i + r())} cy={f(j + r())} rx={f(0.15 + r() * 0.3)} ry={f(0.1 + r() * 0.2)} fill={r() < 0.5 ? lighten(c, 0.12) : darken(c, 0.14)} fillOpacity={0.12} />)
      // travertine pits / horizontal strata
      for (let k = 0; k < 5; k++) { const y0 = j + r(); els.push(<path key={`t${i}${j}${k}`} d={`M${f(i + r() * 0.3)} ${f(y0)}H${f(i + 0.5 + r() * 0.5)}`} stroke={darken(c, 0.35)} strokeOpacity={0.1} strokeWidth={px} />) }
      els.push(<rect key={`j${i}${j}`} x={i} y={j} width={1} height={1} fill="none" stroke={darken(spec.a, 0.5)} strokeOpacity={0.5} strokeWidth={px * 1.5} />)
    }
    return els
  })
}

/** Round setts (cobbles): rows of rounded stones. */
function cobble(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 1, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = [<rect key="bg" width={1} height={1} fill={darken(spec.a, 0.45)} />]
    const n = 7
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) / n, y = j / n
      for (const dx of [-1, 0, 1]) {
        els.push(<ellipse key={`c${i}-${j}-${dx}`} cx={f(x + 0.5 / n + dx)} cy={f(y + 0.5 / n)} rx={f(0.46 / n)} ry={f(0.42 / n)} fill={jit(spec.a, r, 0.16)} stroke={darken(spec.a, 0.5)} strokeOpacity={0.5} strokeWidth={px} />)
      }
    }
    return els
  })
}

/** Narrow deck boards. */
function deck(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 1, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = []
    for (let i = 0; i < 8; i++) {
      els.push(<rect key={`d${i}`} x={0} y={i / 8} width={1} height={1 / 8} fill={jit(spec.a, r, 0.1)} />)
      els.push(<path key={`s${i}`} d={`M0 ${f((i + 1) / 8)}H1`} stroke={darken(spec.a, 0.6)} strokeOpacity={0.6} strokeWidth={px * 1.5} />)
      els.push(<path key={`g${i}`} d={`M${f(r() * 0.4)} ${f((i + 0.5) / 8)}H${f(0.5 + r() * 0.5)}`} stroke={darken(spec.a, 0.3)} strokeOpacity={0.14} strokeWidth={px} />)
    }
    return els
  })
}

/** Grass: blade ticks on a dark mottled ground. */
function lawn(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 2, () => {
    const r = rng(hashStr(key))
    const dark = spec.b ?? darken(spec.a, 0.2)
    const els: ReactNode[] = [<rect key="bg" width={2} height={2} fill={spec.a} />, <rect key="mow" width={2} height={1} fill={lighten(spec.a, 0.12)} fillOpacity={0.35} />]
    for (let i = 0; i < 6; i++) els.push(<ellipse key={`p${i}`} cx={f(r() * 2)} cy={f(r() * 2)} rx={f(0.2 + r() * 0.35)} ry={f(0.15 + r() * 0.3)} fill={dark} fillOpacity={0.5} />)
    for (let i = 0; i < 110; i++) {
      const x = r() * 2, y = r() * 2, l = 0.025 + r() * 0.035
      const c = r() < 0.5 ? lighten(spec.a, 0.22) : darken(spec.a, 0.3)
      for (const dx of [-2, 0, 2]) {
        if (x + dx < -0.1 || x + dx > 2.1) continue
        els.push(<path key={`g${i}-${dx}`} d={`M${f(x + dx)} ${f(y)}l${f((r() - 0.5) * 0.02)} ${f(-l)}`} stroke={c} strokeOpacity={0.4} strokeWidth={px * 1.1} strokeLinecap="round" />)
      }
    }
    return els
  })
}

function gravel(reg: Reg, spec: FloorSpec, key: string, px: number): string {
  return pattern(reg, key, 1, () => {
    const r = rng(hashStr(key))
    const els: ReactNode[] = [<rect key="bg" width={1} height={1} fill={spec.a} />]
    for (let i = 0; i < 120; i++) {
      const x = r(), y = r()
      for (const dx of [-1, 0, 1]) {
        els.push(<circle key={`g${i}-${dx}`} cx={f(x + dx)} cy={f(y)} r={px * (0.7 + r() * 1.1)} fill={jit(spec.a, r, 0.3)} fillOpacity={0.6} />)
      }
    }
    return els
  })
}

/** Resolve a floor spec to a paint (url of a registered pattern). */
export function floorPaint(reg: Reg, spec: FloorSpec, u: number): string {
  const px = 1 / u
  const key = `${spec.mat}-${[spec.a, spec.b, spec.c].filter(Boolean).map(s => s!.slice(1)).join('')}`
  switch (spec.mat) {
    case 'planks': return planks(reg, spec, key, px)
    case 'herring': return herring(reg, spec, key, px)
    case 'brick': return herring(reg, spec, key, px, true)
    case 'chequer': return tiles(reg, spec, key, px, 2, 'chequer')
    case 'quarry': return tiles(reg, spec, key, px, 2, 'quarry')
    case 'mosaic': return tiles(reg, spec, key, px, 4, 'mosaic')
    case 'hydraulic': return tiles(reg, spec, key, px, 2, 'hydraulic')
    case 'azulejo': return tiles(reg, spec, key, px, 2, 'hydraulic')
    case 'flags': return flags(reg, spec, key, px)
    case 'terrazzo': return terrazzo(reg, spec, key, px)
    case 'marble': return marble(reg, spec, key, px)
    case 'carpet': return speckled(reg, spec, key, px, true)
    case 'plaster': return speckled(reg, spec, key, px, false)
    case 'slabs': return slabs(reg, spec, key, px)
    case 'cobble': return cobble(reg, spec, key, px)
    case 'deck': return deck(reg, spec, key, px)
    case 'lawn': return lawn(reg, spec, key, px)
    case 'gravel': return gravel(reg, spec, key, px)
  }
}

/** Average colour of a floor spec, for luminance budgeting in tests. */
export function floorBase(spec: FloorSpec): string {
  if (spec.mat === 'chequer' || spec.mat === 'azulejo' || spec.mat === 'hydraulic' || spec.mat === 'mosaic') return mix(spec.a, spec.b ?? spec.a, 0.5)
  if (spec.mat === 'terrazzo') return spec.a
  return spec.a
}
