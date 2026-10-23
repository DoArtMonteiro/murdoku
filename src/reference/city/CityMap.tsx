import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Puzzle } from '../../core/types'
import { computeBadges } from '../../core/daily'
import type { StreakState } from '../../core/daily'
import { MapArt } from './MapArt'
import { BuildingThumb } from './buildings'
import { DistrictBadge, EvidenceIcon, Medal, Padlock, PinMark, Vignette } from './icons'
import {
  DIFFICULTY_DOTS, DIFFICULTY_PT, DISTRICTS, DISTRICT_BY_ID, HERO, MAP_H, MAP_W, MEDALS, STYLE_NAME, STYLE_NOTE, VIGNETTES,
  heroOf, layoutCity, lockReason, progressOf, roman, routeOrder,
} from './cityModel'
import type { CaseState, CasePin, DistrictId, HoodState } from './cityModel'
import './city.css'

/** The slice of useGame() the city reads. Read-only: nothing here writes game state. */
export interface CityGame {
  puzzles: Puzzle[]
  completedIds: string[]
  records?: Record<string, { bestSeconds: number; hints: number }>
  streak?: StreakState
  catalogProgress?: { done: number; total: number } | null
}

const STATE_PT: Record<CaseState, string> = { locked: 'Trancado', open: 'Disponível', solved: 'Resolvido' }
const HOOD_PT: Record<HoodState, string> = { locked: 'Trancado', available: 'Disponível', progress: 'Em curso', complete: 'Completo' }
const EMPTY_STREAK: StreakState = { lastSolved: null, current: 0, best: 0 }
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function CityMap({ game }: { game: CityGame }) {
  const puzzles = game.puzzles
  const layout = useMemo(() => layoutCity(puzzles), [puzzles])
  // `?demo=N` previews the map with the first N cases of the route solved (display only, nothing is saved).
  const demo = useMemo(() => {
    const n = Number(new URLSearchParams(window.location.search).get('demo'))
    return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), puzzles.length) : 0
  }, [puzzles.length])
  const completed = useMemo(() => demo ? routeOrder(puzzles).slice(0, demo).map(p => p.id) : game.completedIds, [demo, puzzles, game.completedIds])
  const progress = useMemo(() => progressOf(layout.pins, completed), [layout, completed])
  const states = progress.states
  const badges = useMemo(() => computeBadges({
    puzzles, completedIds: completed, records: game.records ?? {}, streak: game.streak ?? EMPTY_STREAK,
  }), [puzzles, completed, game.records, game.streak])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [shelfHood, setShelfHood] = useState<DistrictId | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const pinRefs = useRef(new Map<string, HTMLButtonElement>())

  const selected = layout.pins.find(p => p.id === selectedId) ?? null
  const rovingId = activeId && layout.pins.some(p => p.id === activeId)
    ? activeId : (layout.pins.find(p => states[p.id] === 'open') ?? layout.pins[0])?.id ?? null
  const solvedTotal = layout.pins.filter(p => progress.solved.has(p.id)).length
  const currentHood: DistrictId = (DISTRICTS.find(d => progress.hoods[d.id].unlocked && progress.hoods[d.id].state !== 'complete') ?? DISTRICTS[0]).id
  const shelfId = shelfHood ?? currentHood

  const scrollToDistrict = useCallback((id: DistrictId, smooth: boolean) => {
    const sc = scrollRef.current, cv = canvasRef.current
    if (!sc || !cv) return
    const mine = layout.pins.filter(p => p.district === id)
    if (!mine.length) return
    const minX = Math.min(...mine.map(p => p.cx)), my = mine.reduce((s, p) => s + p.cy, 0) / mine.length
    const k = cv.offsetWidth / MAP_W
    sc.scrollTo({
      left: Math.max(0, minX * k - 48), top: Math.max(0, my * k - sc.clientHeight / 2),
      behavior: smooth && !reduceMotion() ? 'smooth' : 'auto',
    })
  }, [layout])

  // On a phone the map overflows its frame: start on the street with the next open case.
  const framed = useRef(false)
  useEffect(() => {
    if (framed.current || !layout.pins.length) return
    framed.current = true
    const sc = scrollRef.current
    if (!sc || !canvasRef.current || canvasRef.current.offsetWidth <= sc.clientWidth + 4) return
    scrollToDistrict((layout.pins.find(p => states[p.id] === 'open') ?? layout.pins[0]).district, false)
  }, [layout, states, scrollToDistrict])

  const focusPin = useCallback((id: string) => { setActiveId(id); pinRefs.current.get(id)?.focus() }, [])
  const select = useCallback((id: string) => { setSelectedId(id); setActiveId(id) }, [])
  const close = useCallback(() => {
    const id = selectedId
    setSelectedId(null)
    if (id) requestAnimationFrame(() => pinRefs.current.get(id)?.focus())
  }, [selectedId])
  useEffect(() => { if (selectedId) cardRef.current?.focus({ preventScroll: true }) }, [selectedId])

  function onPinKey(e: KeyboardEvent<HTMLButtonElement>, from: CasePin) {
    const dir = ({ ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] } as Record<string, number[]>)[e.key]
    if (!dir) return
    e.preventDefault()
    let best: CasePin | null = null, bestScore = Infinity
    for (const p of layout.pins) {
      if (p === from) continue
      const dx = p.cx - from.cx, dy = p.cy - from.cy
      const along = dx * dir[0] + dy * dir[1]
      if (along <= 4) continue
      const score = along + (Math.abs(dx * dir[1]) + Math.abs(dy * dir[0])) * 2.2
      if (score < bestScore) { best = p; bestScore = score }
    }
    if (best) focusPin(best.id)
  }

  if (!puzzles.length) {
    return (
      <div className="ct-root ct-loading" data-testid="city-map" role="status">
        <p>{game.catalogProgress
          ? `A montar o índice de casos — ${game.catalogProgress.done} de ${game.catalogProgress.total}`
          : 'A acender as luzes de Portinhal…'}</p>
      </div>
    )
  }

  const medalEarned: Record<string, boolean> = {
    'primeira-noite': !!layout.pins[0] && progress.solved.has(layout.pins[0].id),
    'olho-clinico': !!badges.find(b => b.id === 'unaided')?.earned,
    vizinhanca: DISTRICTS.some(d => progress.hoods[d.id].state === 'complete'),
    arquivista: solvedTotal >= 12,
    // No per-attempt data exists yet for these two (full build).
    'sem-rasuras': false,
    'meia-noite': false,
  }
  const medalsEarned = MEDALS.filter(m => medalEarned[m.id]).length
  const shelfD = DISTRICT_BY_ID[shelfId]
  const shelfPins = layout.pins.filter(p => p.district === shelfId)
  const shelfSolved = shelfPins.filter(p => progress.solved.has(p.id)).length
  const boards = [0, 1, 2].map(b => shelfPins.slice(b * 4, b * 4 + 4))
  const hoodRange = (id: DistrictId) => { const h = progress.hoods[id]; return `${roman(h.first + 1)}–${roman(h.last + 1)}` }
  const selState = selected ? states[selected.id] : null
  const noHints = selected && selState === 'solved' && game.records?.[selected.id]?.hints === 0

  return (
    <div className="ct-root" data-testid="city-map">
      <header className="ct-head">
        <a className="ct-back" href="/" aria-label="Voltar ao jogo"><span aria-hidden="true">←</span><span className="ct-back-t">Jogo</span></a>
        <div className="ct-title">
          <p className="ct-eyebrow">Murdoku · Livro de casos</p>
          <h1>Portinhal <span aria-hidden="true">—</span> Casebook</h1>
        </div>
        <div className="ct-total" role="group" aria-label={`${solvedTotal} de ${layout.pins.length} casos resolvidos`}>
          <span className="ct-total-n">{solvedTotal}<span className="ct-total-of"> / {layout.pins.length}</span></span>
          <span className="ct-total-l">casos resolvidos</span>
          <span className="ct-bar" aria-hidden="true"><span style={{ width: `${(solvedTotal / Math.max(1, layout.pins.length)) * 100}%` }} /></span>
        </div>
      </header>

      <main className="ct-main">
        <section className="ct-mapcol" aria-label="Mapa da cidade">
          <div className="ct-frame">
            <div className="ct-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Mapa de Portinhal, deslize para explorar"
              onKeyDown={e => { if (e.key === 'Escape' && selectedId) { e.stopPropagation(); close() } }}>
              <div className="ct-canvas" ref={canvasRef} style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
                <MapArt layout={layout} progress={progress} />

                {DISTRICTS.map(d => {
                  const h = progress.hoods[d.id]
                  return (
                    <div key={d.id} className="ct-plate" data-state={h.state} role="group"
                      aria-label={`${d.name}: ${h.state === 'locked' ? 'trancado' : `${h.solved} de ${h.total} resolvidos`}`}
                      style={{ left: `${(d.plate.x / MAP_W) * 100}%`, top: `${(d.plate.y / MAP_H) * 100}%` }}>
                      <DistrictBadge id={d.id} state={h.state} numerals={hoodRange(d.id)} fraction={h.total ? h.solved / h.total : 0} />
                      <span className="ct-plate-t">
                        <span className="ct-plate-n">{d.name}</span>
                        <span className="ct-plate-s">{STYLE_NAME[d.style]} · {h.state === 'locked' ? 'Trancado' : `${h.solved}/${h.total}`}</span>
                      </span>
                    </div>
                  )
                })}

                {layout.pins.map(p => {
                  const st = states[p.id]
                  return (
                    <button
                      key={p.id} type="button" className="ct-pin" data-state={st} data-selected={p.id === selectedId || undefined}
                      data-testid={`pin-${p.id}`}
                      ref={el => { if (el) pinRefs.current.set(p.id, el); else pinRefs.current.delete(p.id) }}
                      tabIndex={p.id === rovingId ? 0 : -1}
                      aria-haspopup="dialog" aria-expanded={p.id === selectedId}
                      aria-label={`${p.title}, caso ${p.numeral}. ${DISTRICT_BY_ID[p.district].name}. Estilo ${STYLE_NAME[p.style]}. ${DIFFICULTY_PT[p.difficulty]}. ${STATE_PT[st]}.`}
                      style={{ left: `${(p.cx / MAP_W) * 100}%`, top: `${(p.cy / MAP_H) * 100}%` }}
                      onClick={() => select(p.id)} onFocus={() => setActiveId(p.id)} onKeyDown={e => onPinKey(e, p)}
                    >
                      {st !== 'locked' && <span className="ct-mark"><PinMark kind={st} /></span>}
                      <span className="ct-tag" aria-hidden="true">{p.numeral} · {p.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {demo > 0 && <p className="ct-demo" role="note">Pré-visualização: {demo} casos simulados como resolvidos (nada é guardado).</p>}
          <p className="ct-hint">Arraste o mapa para explorar · setas do teclado movem entre as casas</p>
        </section>

        <aside className="ct-side">
          <nav className="ct-hoods" aria-label="Bairros">
            <h2 className="ct-sr">Bairros</h2>
            <ul>
              {DISTRICTS.map(d => {
                const h = progress.hoods[d.id]
                return (
                  <li key={d.id}>
                    <button type="button" className="ct-hood" data-state={h.state} aria-label={`${d.name}, ${HOOD_PT[h.state]}, ${h.solved} de ${h.total} casos resolvidos`}
                      onClick={() => {
                        scrollToDistrict(d.id, true)
                        setShelfHood(d.id)
                        const first = layout.pins.find(p => p.district === d.id && states[p.id] === 'open') ?? layout.pins.find(p => p.district === d.id)
                        if (first) { setActiveId(first.id); pinRefs.current.get(first.id)?.focus({ preventScroll: true }) }
                      }}>
                      <DistrictBadge id={d.id} state={h.state} size={48} numerals={hoodRange(d.id)} fraction={h.total ? h.solved / h.total : 0} />
                      <span className="ct-hood-t">
                        <span className="ct-hood-n">{d.name}</span>
                        <span className="ct-hood-s">{STYLE_NAME[d.style]} · casos {hoodRange(d.id)}</span>
                        <span className="ct-hood-st">{h.state === 'locked' ? <><Padlock size={12} color="#efe3c8" /> Trancado</> : `${HOOD_PT[h.state]} · ${h.solved}/${h.total}`}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <section className="ct-shelf" aria-labelledby="ct-shelf-h">
            <div className="ct-sec-head">
              <h2 id="ct-shelf-h">Arquivo de Provas</h2>
              <span className="ct-count">{shelfSolved} de {shelfPins.length}</span>
            </div>
            <p className="ct-shelf-for">{shelfD.name}</p>
            <div className="ct-shelf-case" role="group" aria-label={`Prateleira de ${shelfD.name}`}>
              {boards.map((row, bi) => (
                <div key={bi} className="ct-board">
                  <ul>
                    {row.map(p => {
                      const got = progress.solved.has(p.id)
                      const hero = heroOf(p)
                      return (
                        <li key={p.id} className="ct-ev" data-got={got || undefined}>
                          <span className="ct-ev-tile" role="img" aria-label={got ? `Prova do caso ${p.numeral}: ${hero.name}` : `Prova do caso ${p.numeral}: por descobrir`}>
                            {got ? <EvidenceIcon id={hero.id} size={40} /> : <span className="ct-ev-q" aria-hidden="true">?</span>}
                          </span>
                          <span className="ct-ev-plate" aria-hidden="true">{p.numeral}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              {shelfPins.length > 0 && shelfSolved >= shelfPins.length && <p className="ct-plaque">{shelfD.name}</p>}
            </div>
            <p className="ct-shelf-hero">Objetos de {STYLE_NAME[shelfD.style]}: {HERO[shelfD.style].map(h => h.name.toLowerCase()).join(', ')}.</p>
          </section>

          <section className="ct-medals" aria-labelledby="ct-medals-h">
            <div className="ct-sec-head">
              <h2 id="ct-medals-h">Medalhas</h2>
              <span className="ct-count">{medalsEarned} de {MEDALS.length}</span>
            </div>
            <ul className="ct-medal-row">
              {MEDALS.map(m => {
                const e = medalEarned[m.id]
                return (
                  <li key={m.id} className="ct-medal" data-earned={e || undefined}>
                    <Medal id={m.id} earned={e} />
                    <span className="ct-medal-n">{m.name}</span>
                    <span className="ct-medal-d">{m.text}</span>
                    <span className="ct-sr">{e ? 'Alcançada' : 'Por alcançar'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </aside>
      </main>

      {selected && selState && (
        <aside className="ct-card" ref={cardRef} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="ct-card-title" data-testid="case-card"
          onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close() } }}>
          <button type="button" className="ct-x" onClick={close} aria-label="Fechar cartão do caso"><span aria-hidden="true">×</span></button>
          <div className="ct-card-top">
            <BuildingThumb style={selected.style} seed={selected.seed} lit={selState === 'locked' ? 0 : selState === 'open' ? 'one' : 'all'} />
            <div>
              <p className="ct-eyebrow">Caso N.º {selected.numeral} · {DISTRICT_BY_ID[selected.district].name}</p>
              <h2 id="ct-card-title">{selected.title}</h2>
            </div>
          </div>
          <ul className="ct-facts">
            <li><span>Estilo</span><b>{STYLE_NAME[selected.style]}</b></li>
            <li>
              <span>Dificuldade</span>
              <b>{DIFFICULTY_PT[selected.difficulty]}{' '}
                <span className="ct-dots" role="img" aria-label={`${DIFFICULTY_DOTS[selected.difficulty]} de 5`}>
                  {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= DIFFICULTY_DOTS[selected.difficulty] || undefined} />)}
                </span>
              </b>
            </li>
            <li><span>Estado</span><b data-state={selState}>{noHints ? 'Resolvido sem pistas' : STATE_PT[selState]}</b></li>
          </ul>
          <p className="ct-note">{STYLE_NOTE[selected.style]}.</p>
          <div className="ct-vig" aria-label="Interiores deste estilo">
            {([0, 1, 2] as const).map(n => (
              <figure key={n}><Vignette style={selected.style} n={n} /><figcaption>{VIGNETTES[selected.style][n]}</figcaption></figure>
            ))}
          </div>
          {selState === 'locked'
            ? <p className="ct-lock"><Padlock size={16} /> <span>{lockReason(selected, layout.pins, progress)}</span></p>
            : <>
                <p className="ct-flavor">{selected.flavor}</p>
                <a className="ct-go" href={`/?ref=illustrated&case=${encodeURIComponent(selected.id)}`}>
                  {selState === 'solved' ? 'Rever o caso' : 'Investigar'}<span aria-hidden="true"> →</span>
                </a>
              </>}
        </aside>
      )}
    </div>
  )
}
