import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { CaseStory, EvidenceStory } from '../story/schema'
import type { PlanGeometry } from './geometry'
import { EvidenceIcon } from './EvidenceIcon'
import { markerDiameter, markerHit, visibleEvidence } from './storyState'

// ---- plan markers ------------------------------------------------------------
/**
 * Evidence hotspots, drawn in two layers so a token can never be covered: the
 * visible disc lives BELOW the hit grid (tokens paint over it), and a
 * transparent round button sits ABOVE the grid to take the tap (44 px on
 * phones, 28 px with a mouse). During play a disc is an unnumbered brass ring
 * around a small silhouette of the object; the numbers 1-5 exist only in the
 * reconstruction. They stand on furniture rims, wall lines and the porch only
 * (story validator), so they never cover a cell centre or a room label; the
 * drawer offers the same items as 44 px tiles.
 */
export function EvidenceMarkers({ geo, items, found, spotlight, onOpen, layer, numbered }: {
  geo: PlanGeometry; items: EvidenceStory[]; found: ReadonlySet<string>; spotlight?: ReadonlySet<string>; onOpen: (id: string) => void
  layer: 'disc' | 'hit'
  /** Reconstruction: show the evidence numbers instead of object silhouettes. */
  numbered: boolean
}) {
  const d = markerDiameter(geo.layout.cellW)
  const at = (e: EvidenceStory) => ({ x: geo.gx + e.placement.x * geo.layout.cellW, y: geo.gy + e.placement.y * geo.layout.cellH })
  if (layer === 'disc') {
    return (
      <div className="rs-evidence rs-evidence-discs" aria-hidden="true" data-testid="evidence-discs">
        {items.map(e => {
          const c = at(e)
          return (
            <span
              key={e.id}
              className={`rs-ev-disc ${numbered ? 'rs-ev-num' : 'rs-ev-obj'} ${found.has(e.id) ? 'rs-ev-found' : ''} ${spotlight?.has(e.id) ? 'rs-ev-spot' : ''}`}
              data-disc={e.id}
              style={{ left: c.x - d / 2, top: c.y - d / 2, width: d, height: d, fontSize: d < 20 ? 11 : 12 }}
            >{numbered ? e.n : <EvidenceIcon kind={e.kind} size={Math.round(d * 0.64)} />}</span>
          )
        })}
      </div>
    )
  }
  return (
    <div className="rs-evidence" data-testid="evidence-markers">
      {items.map(e => {
        const c = at(e)
        const isFound = found.has(e.id)
        const hit = markerHit(geo.layout.cellW, e.placement.x, e.placement.y, Math.round(geo.gw / geo.layout.cellW), !numbered)
        return (
          <button
            key={e.id}
            type="button"
            className="rs-ev"
            data-testid={`evidence-${e.id}`}
            data-x={e.placement.x}
            data-y={e.placement.y}
            aria-label={`${numbered ? `Evidence ${e.n}` : 'Evidence'}: ${e.label}, ${e.placement.where}${isFound ? ', examined' : ''}`}
            style={{ left: c.x - hit / 2, top: c.y - hit / 2, width: hit, height: hit }}
            onClick={ev => { ev.stopPropagation(); onOpen(e.id) }}
          />
        )
      })}
    </div>
  )
}

// ---- detail + drawer -----------------------------------------------------------
export function EvidenceDetailBody({ item, over }: { item: EvidenceStory; over: boolean }) {
  return (
    <div className="rs-ev-detail" data-testid="evidence-detail">
      <div className="rs-ev-detail-head">
        <span className="rs-ev-tile-icon"><EvidenceIcon kind={item.kind} size={36} /></span>
        <div>
          <p className="rs-eyebrow">{over ? `Evidence ${item.n}` : 'Evidence'}</p>
          <p className="rs-ev-where">{item.placement.where}</p>
        </div>
      </div>
      <p className="rs-ev-desc">{item.description}</p>
      {over && <p className="rs-ev-reveal" data-testid="evidence-reveal-note"><strong>What it meant.</strong> {item.revealNote}</p>}
    </div>
  )
}

export function EvidenceBoard({ story, found, over, onOpen, onReplayIntro }: {
  story: CaseStory; found: ReadonlySet<string>; over: boolean; onOpen: (id: string) => void; onReplayIntro: () => void
}) {
  const items = visibleEvidence(story, over)
  const count = items.filter(e => over || found.has(e.id)).length
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => { setOpenId(null) }, [over])
  return (
    <div className="rs-eboard" data-testid="evidence-board">
      <p className="rs-ev-count" role="status">{count} of {items.length} items examined</p>
      <ul className="rs-ev-grid">
        {items.map(e => {
          const isFound = over || found.has(e.id)
          return (
            <li key={e.id}>
              {isFound ? (
                <button type="button" className="rs-ev-tile" data-testid={`tile-${e.id}`} aria-expanded={openId === e.id} onClick={() => setOpenId(openId === e.id ? null : e.id)}>
                  <span className="rs-ev-tile-icon"><EvidenceIcon kind={e.kind} /></span>
                  <span className="rs-ev-tile-text">
                    <span className="rs-ev-tile-n">{over ? `Evidence ${e.n}` : 'Evidence'}</span>
                    <span className="rs-ev-tile-label">{e.label}</span>
                  </span>
                </button>
              ) : (
                <button type="button" className="rs-ev-tile rs-ev-tile-empty" data-testid={`tile-${e.id}`} onClick={() => onOpen(e.id)}>
                  <span className="rs-ev-tile-icon rs-ev-tile-dim" aria-hidden="true"><EvidenceIcon kind={e.kind} /></span>
                  <span className="rs-ev-tile-text">
                    <span className="rs-ev-tile-n">Evidence</span>
                    <span className="rs-ev-tile-label">Not yet examined</span>
                    <span className="rs-ev-tile-where">{e.placement.where}</span>
                  </span>
                </button>
              )}
              {openId === e.id && isFound && <EvidenceDetailBody item={e} over={over} />}
            </li>
          )
        })}
      </ul>
      <button type="button" className="rs-btn rs-btn-quiet" onClick={onReplayIntro} data-testid="replay-intro">
        <BookOpen size={18} aria-hidden="true" /><span>Read the opening again</span>
      </button>
    </div>
  )
}
