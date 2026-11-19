// Room-name plates as SVG, drawn by BoardLabels in an overlay above the token layer.
import { Fragment, type ReactNode } from 'react'
import type { Label, Plan } from '../nightplan/plan'
import { displayLabel, type PlacedLabel } from './labels'
import type { StyleKit } from './styles/types'

/** One label style for every style pack: the interface face, Title Case, a translucent dark plate with a hairline rim. */
export const LABEL_FONT = "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
export const LABEL_PLATE = { fill: '#14100d', opacity: 0.74, rim: 'rgba(239,227,200,0.28)' } as const
/** The type colour: a warm cream, at least 4.5:1 against the plate over the lightest floor (see tests/casebook/labelContrast.test.ts). */
export const LABEL_INK = '#F3EAD4'

const f = (v: number) => +v.toFixed(3)

/** One plate per room, drawn the same in every style pack; the full name is the <title>. */
export function renderLabels(plan: Plan, labels: Label[], _st: StyleKit, u: number): ReactNode {
  const px = 1 / u
  const full = new Map(plan.rooms.map(r => [r.id, r.name]))
  return (
    <g data-layer="labels">
      {labels.map(l => {
        const w = l.w, h = l.capH
        const pad = (l as PlacedLabel).pad ?? 0.03
        // baseline: the caps start 0.9 px below the top of the plate and stand 0.69 em tall; the plate (0.72 em + 2 px) holds nearly all of a descender
        const base = l.cy - h / 2 + (0.9 + 0.69 * l.fs) * px
        return (
          <Fragment key={l.roomId}>
            <g data-label={l.text} data-label-faded={l.faded || undefined} opacity={l.faded ? 0.2 : undefined} data-label-full={full.get(l.roomId)} data-label-mode={l.mode} data-label-fs={l.fs} data-label-cap={f(0.69 * l.fs)} transform={l.rot ? `rotate(${l.rot} ${f(l.x)} ${f(l.cy)})` : undefined}>
              <title>{full.get(l.roomId)}</title>
              <rect x={f(l.x - w / 2 - pad)} y={f(l.cy - h / 2)} width={f(w + 2 * pad)} height={f(h)} rx={0.02} fill={LABEL_PLATE.fill} fillOpacity={LABEL_PLATE.opacity} stroke={LABEL_PLATE.rim} strokeWidth={px} />
              <text x={f(l.x)} y={f(base)} textAnchor="middle" fontSize={f(l.fs / u)} fontFamily={LABEL_FONT} fontWeight={600} fill={LABEL_INK} textLength={f(w)} lengthAdjust="spacingAndGlyphs">{displayLabel(l.text)}</text>
            </g>
          </Fragment>
        )
      })}
    </g>
  )
}
