// Room-name plates as SVG, drawn by BoardLabels in an overlay above the token layer.
import { Fragment, type ReactNode } from 'react'
import type { Label, Plan } from '../nightplan/plan'
import type { StyleKit } from './styles/types'

const f = (v: number) => +v.toFixed(3)

/** One plate per room: a dark engraved plate, a cream serif name with a 2 px #121826 halo; the full name is the <title>. */
export function renderLabels(plan: Plan, labels: Label[], st: StyleKit, u: number): ReactNode {
  const px = 1 / u
  const full = new Map(plan.rooms.map(r => [r.id, r.name]))
  return (
    <g data-layer="labels">
      {labels.map(l => {
        const w = l.w, h = l.capH
        // baseline: capitals are 0.69 em tall and centred on the plate
        const base = l.cy + (0.345 * l.fs) / u
        return (
          <Fragment key={l.roomId}>
            <g data-label={l.text} data-label-full={full.get(l.roomId)} data-label-mode={l.mode} data-label-fs={l.fs} data-label-cap={f(0.69 * l.fs)} transform={l.rot ? `rotate(${l.rot} ${f(l.x)} ${f(l.cy)})` : undefined}>
              <title>{full.get(l.roomId)}</title>
              <rect x={f(l.x - w / 2 - 0.03)} y={f(l.cy - h / 2)} width={f(w + 0.06)} height={f(h)} rx={0.015} fill="#14100d" fillOpacity={0.94} stroke={st.wall.trim} strokeOpacity={0.45} strokeWidth={px} />
              <text x={f(l.x)} y={f(base)} textAnchor="middle" fontSize={f(l.fs / u)} fontFamily={st.font} fill="#EFE3C8" textLength={f(w)} lengthAdjust="spacingAndGlyphs"
                stroke="#121826" strokeWidth={2 * px} strokeLinejoin="round" paintOrder="stroke">{l.text}</text>
            </g>
          </Fragment>
        )
      })}
    </g>
  )
}
