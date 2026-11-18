import type { ReactNode } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import type { Puzzle } from '../../core/types'
import type { PlanGeometry } from './geometry'
import { SLOT_NAMES } from './storyState'
import type { ReconController } from './storyState'
import { Vignette } from './Vignettes'
import { SupineChalk } from './SupineChalk'

// ---- plan layers -------------------------------------------------------------------
const PATH_COLOUR = '#f3c969'

function pathD(pts: Array<{ x: number; y: number }>, g: PlanGeometry): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${(g.gx + p.x * g.layout.cellW).toFixed(1)} ${(g.gy + p.y * g.layout.cellH).toFixed(1)}`).join(' ')
}

/** SVG under the tokens: room glow, chalk outline, footsteps, candidate squares and the pin ring. */
export function ReconUnder({ puzzle, rc, geo, accent }: { puzzle: Puzzle; rc: ReconController; geo: PlanGeometry; accent: (id: string) => string }) {
  const { frame, rec } = rc
  const { cellW: cw, cellH: ch } = geo.layout
  const box = (r: number, c: number, inset = 3) => ({ x: geo.gx + c * cw + inset, y: geo.gy + r * ch + inset, width: cw - inset * 2, height: ch - inset * 2 })
  const victim = puzzle.solution[puzzle.victimId]
  const killerCell = puzzle.solution[rec.murderer]
  const killerRoom = killerCell ? puzzle.roomOf[killerCell.row]?.[killerCell.col] : undefined
  const roomCells = puzzle.rooms.find(r => r.id === killerRoom)?.cells ?? []
  const d = frame.deduction
  const clipId = `rs-chalkclip-${geo.size}`
  return (
    <svg className="rs-recon-layer" width={geo.size} height={geo.size} aria-hidden="true" focusable="false" data-testid="recon-layer" data-frame={frame.id}>
      {victim && (
        <defs><clipPath id={clipId}><rect x={geo.gx + victim.col * cw} y={geo.gy + victim.row * ch} width={cw} height={ch} /></clipPath></defs>
      )}
      {frame.accuse && roomCells.map(c => (
        <rect key={`g${c.row}-${c.col}`} className="rs-recon-glow" x={geo.gx + c.col * cw} y={geo.gy + c.row * ch} width={cw} height={ch} />
      ))}
      {frame.chalk && victim && (
        <g clipPath={`url(#${clipId})`}><g className="rs-recon-chalk" data-testid="recon-chalk">
          <g transform={`translate(${geo.gx + victim.col * cw} ${geo.gy + victim.row * ch}) scale(${cw / 100} ${ch / 100})`}>
            <SupineChalk />
          </g>
        </g></g>
      )}
      {frame.routes.map(id => {
        const pts = rec.routes[id]
        if (!pts || pts.length < 2) return null
        const end = pts[pts.length - 1], before = pts[pts.length - 2]
        const ang = Math.atan2((end.y - before.y) * ch, (end.x - before.x) * cw)
        const ex = geo.gx + end.x * cw, ey = geo.gy + end.y * ch
        const col = id === rec.murderer && frame.accuse ? PATH_COLOUR : accent(id)
        return (
          <g key={id} className="rs-route" data-testid={`route-${id}`} style={{ color: col }}>
            <path d={pathD(pts, geo)} className="rs-route-under" />
            <path d={pathD(pts, geo)} className="rs-route-line" />
            <path d="M-7 -5 L2 0 L-7 5" className="rs-route-head" transform={`translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`} />
          </g>
        )
      })}
      {d && (
        <g data-testid="recon-candidates">
          {d.openBefore.filter(c => !(c.row === d.cell.row && c.col === d.cell.col)).map(c => (
            <rect key={`o${c.row}-${c.col}`} className="rs-cand rs-cand-out" {...box(c.row, c.col)} />
          ))}
          {d.ownCandidates.filter(c => !d.openBefore.some(o => o.row === c.row && o.col === c.col)).map(c => (
            <g key={`x${c.row}-${c.col}`} className="rs-cand-x" transform={`translate(${geo.gx + c.col * cw} ${geo.gy + c.row * ch})`}>
              <rect className="rs-cand rs-cand-gone" x={3} y={3} width={cw - 6} height={ch - 6} />
              <path d={`M${cw * 0.3} ${ch * 0.3} L${cw * 0.7} ${ch * 0.7} M${cw * 0.7} ${ch * 0.3} L${cw * 0.3} ${ch * 0.7}`} />
            </g>
          ))}
          <rect className="rs-cand rs-cand-pin" {...box(d.cell.row, d.cell.col, 1.5)} />
        </g>
      )}
    </svg>
  )
}

// ---- panel ---------------------------------------------------------------------------
const STEP_LABEL = ['Motive', 'Movements', 'Crucial clue', 'Conclusion']

export function ReconPanel({ puzzle, rc, revealed, children }: {
  puzzle: Puzzle; rc: ReconController; revealed: boolean; accent?: (id: string) => string; children?: ReactNode
}) {
  const { rec, frame, idx } = rc
  const last = rec.frames.length - 1
  const name = (id: string) => puzzle.people.find(p => p.id === id)?.name ?? ''
  const stepFirst = (s: number) => rec.frames.findIndex(f => f.step === s)
  const slotFirst = (s: number) => rec.frames.findIndex(f => f.slot === s)
  const chain = rec.chain.steps
  const atEnd = idx >= last
  return (
    <section className="rs-recon" data-testid="reconstruction" aria-label={revealed ? 'Reconstruction (answer revealed, not counted)' : 'Reconstruction'}>
      {revealed && <p className="rs-recon-flag" data-testid="recon-revealed">Revealed, not counted as solved</p>}
      <ol className="rs-timeline" aria-label="Reconstruction steps">
        {STEP_LABEL.map((label, s) => (
          <li key={label}>
            <button type="button" className="rs-tl" aria-current={frame.step === s ? 'step' : undefined} data-testid={`step-${s}`} onClick={() => rc.go(stepFirst(s))}>
              <span className="rs-tl-n" aria-hidden="true">{s + 1}</span>
              <span className="rs-tl-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rs-recon-body" aria-live={rc.playing ? 'off' : 'polite'} data-testid="recon-body">
        <h3 className="rs-recon-title" data-testid="recon-title">{frame.title}</h3>
        <p className="rs-recon-text" data-testid="recon-text">{frame.body}</p>
      </div>

      <div className="rs-recon-ctl" role="group" aria-label="Playback">
        <button type="button" className="rs-btn rs-ctl" onClick={rc.prev} disabled={idx === 0} data-testid="recon-prev"><SkipBack size={18} aria-hidden="true" /><span>Prev</span></button>
        {!rc.reduced && (
          <button type="button" className="rs-btn rs-btn-primary rs-ctl" onClick={rc.toggle} data-testid="recon-play">
            {rc.playing ? <Pause size={18} aria-hidden="true" /> : atEnd ? <RotateCcw size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            <span>{rc.playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}</span>
          </button>
        )}
        <button type="button" className={`rs-btn ${rc.reduced ? 'rs-btn-primary' : ''} rs-ctl`} onClick={rc.next} disabled={atEnd} data-testid="recon-next"><span>Next</span><SkipForward size={18} aria-hidden="true" /></button>
        <span className="rs-recon-count" aria-hidden="true">{idx + 1} / {rec.frames.length}</span>
      </div>

      {frame.step === 2 && (
        <ol className="rs-chain" aria-label="Deductions in order" data-testid="recon-chain">
          {chain.map((s, i) => {
            const fi = rec.frames.findIndex(f => f.deduction?.n === s.n)
            const on = frame.deduction?.n === s.n
            const done = !!frame.deduction && frame.deduction.n > s.n
            return (
              <li key={s.n}>
                <button type="button" className={`rs-chain-item ${on ? 'rs-chain-on' : ''} ${done ? 'rs-chain-done' : ''}`} aria-current={on ? 'step' : undefined} onClick={() => rc.go(fi)} data-testid={`chain-${i + 1}`}>
                  <span className="rs-chain-n" aria-hidden="true">{s.n}</span>
                  <span className="rs-chain-main">
                    <span className="rs-chain-who">{name(s.person)} <span className="rs-chain-at">R{s.cell.row + 1}·C{s.cell.col + 1}</span></span>
                    <span className="rs-chain-clues">{s.clues.map(c => c.text).join(' ')}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <ul className="rs-film" aria-label="Filmstrip" data-testid="filmstrip">
        {SLOT_NAMES.map((label, slot) => (
          <li key={label}>
            <button type="button" className="rs-film-btn" data-testid={`film-${slot}`} aria-label={`Frame ${slot + 1}: ${label}`} aria-current={frame.slot === slot ? 'true' : undefined} onClick={() => rc.go(slotFirst(slot))}>
              <Vignette slot={slot as 0 | 1 | 2 | 3 | 4} killer={rec.murderer} />
              <span className="rs-film-cap" aria-hidden="true">{label}</span>
            </button>
          </li>
        ))}
      </ul>
      {children}
    </section>
  )
}
