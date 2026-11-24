// One False Alibi: the pure verifier for a LieCase.
//
// One definition of "this case is sound", used by the case test and by the search script
// (scripts/lie-search.mjs). Every clue set is derived from `statements`; the engine
// (src/core/engine.ts) is the only authority on what a clue means.
//
// The legibility checks (7 and 8) model what a player can do by hand: place a person who has
// one legal square left, place into a row or column that has only one legal square left, and
// (one level, never nested) suppose a square for a person with two legal squares and see
// whether the world dead-ends. A "dead end" is an unplaced person with no legal square.
//
// The player's rulings (the game UI) use the pure functions `satisfiable`, `isMinimalContradiction`
// and `laneFree` below. They always include the scene facts, never consult `puzzle.solution`, and
// run on their own small solver so a ruling is instant. tests/lie/verify.test.ts pins them to the engine.
import { clueHolds, countSolutions, findMurderer, isSolution, roomIdAt, unaryClueHolds } from '../core/engine'
import type { Cell, Clue, Puzzle } from '../core/types'
import type { LieCase, Statement } from './model'

export interface CoreExposure {
  core: string[]
  ok: boolean
  /** The most tiles any witness had to choose between, in the best order (null when no order works). */
  maxTiles: number | null
  detail: string
}

export interface LieVerifyReport {
  /** 0 = a dead end appears by singles alone, 1 = it needed one suppose, null = not found. */
  legibilityLevel: 0 | 1 | null
  /** How the dead end appears, for the author. */
  legibilityDetail: string
  /** Number of one-level supposes the true plan needed (null if it could not be reached). */
  reconstructionSupposes: number | null
  /** Hidden-single (row or column lane) steps on the way to the true plan (null if it could not be reached). */
  reconstructionLaneSteps: number | null
  /** True when the true statements, by plain singles only, already place the liar. */
  liarPlacedBySingles: boolean | null
  /** One flag per stored collision: still unsatisfiable when the row/column rule is ignored. */
  laneFree: boolean[]
  /** Every minimal contradiction of size <= 4 in the case (scene facts implicit), lie-bearing by construction. */
  allCores: string[][]
  exposure: CoreExposure[]
}

/** What a case promises beyond the shared checks. Each unmet promise is a failure. */
export interface CaseExpectations {
  /** At least this many stored collisions are lane-free. */
  laneFreeAtLeast?: number
  /** The true plan needs at least this many one-level supposes. */
  supposesAtLeast?: number
  /** The true plan needs a lane deduction or a suppose before the liar's square is known. */
  liarBeyondSingles?: boolean
  /** The first two stored collisions share exactly this many statements (the lie included). */
  firstTwoShare?: number
}

export interface LieVerifyResult {
  ok: boolean
  failures: string[]
  report: LieVerifyReport
}

/** Clue kinds the mode allows. No row, col, corner, stepped direction or besidePerson. */
export const ALLOWED_KINDS: readonly Clue['kind'][] = [
  'room', 'notRoom', 'onFurniture', 'besideFurniture', 'sameRoomAs', 'notSameRoomAs', 'edge', 'direction',
]

// ---------------------------------------------------------------- clue sets

export const otherOf = (c: Clue): string | undefined => ('other' in c ? c.other : undefined)

/** The puzzle with exactly these statements as its clues (no victim marker: it asserts nothing). */
export function puzzleOf(p: Puzzle, stmts: readonly Pick<Statement, 'clue' | 'text'>[]): Puzzle {
  return { ...p, clues: stmts.map(s => ({ clue: s.clue, text: s.text })) }
}

/** Engine-backed satisfiability of exactly these statements (no implicit scene facts). Authority for checks 1-3 and 5. */
const satisfiableStmts = (p: Puzzle, stmts: readonly Statement[]): boolean => countSolutions(puzzleOf(p, stmts), 1) > 0

const key = (c: Cell) => `${c.row},${c.col}`
const same = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col

// ------------------------------------------------- rulings: the pure functions the UI calls

/** The statements a ruling reasons about: the cited ones plus every scene fact. Unknown ids throw. */
function cited(c: LieCase, ids: readonly string[], withScene = true): Statement[] {
  const want = new Set(ids)
  const known = new Set(c.statements.map(s => s.id))
  for (const id of want) if (!known.has(id)) throw new Error(`unknown statement id ${id}`)
  return c.statements.filter(s => want.has(s.id) || (withScene && s.scene))
}

/**
 * Is there a world in which every clue holds? People named by no clue are unconstrained, and with lanes
 * on they always fit in the rows and columns left over, so only the named people are searched.
 * `lanes: false` drops the one-per-row and one-per-column rule: what is left is what the statements
 * and the plan of the house say by themselves.
 */
function solvable(p: Puzzle, clues: readonly Clue[], lanes: boolean): boolean {
  const ids = [...new Set(clues.flatMap(cl => [cl.person, otherOf(cl)].filter((x): x is string => !!x)))]
  const cells: Cell[] = []
  for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) cells.push({ row, col })
  const dom = new Map(ids.map(id => {
    const own = clues.filter(cl => cl.person === id)
    return [id, cells.filter(cell => own.every(cl => unaryClueHolds(p, cl, cell)))] as const
  }))
  if (ids.some(id => dom.get(id)!.length === 0)) return false
  const order = [...ids].sort((a, b) => dom.get(a)!.length - dom.get(b)!.length)
  const rel = clues.filter(cl => otherOf(cl))
  const placed: Placed = {}
  const rows = new Set<number>(), cols = new Set<number>()
  const rec = (i: number): boolean => {
    if (i === order.length) return true
    const id = order[i]
    for (const cell of dom.get(id)!) {
      if (lanes && (rows.has(cell.row) || cols.has(cell.col))) continue
      placed[id] = cell
      const fine = rel.every(cl => {
        const o = otherOf(cl)!
        return (cl.person !== id && o !== id) || !placed[cl.person] || !placed[o] || clueHolds(p, cl, placed)
      })
      if (fine) {
        rows.add(cell.row); cols.add(cell.col)
        if (rec(i + 1)) return true
        rows.delete(cell.row); cols.delete(cell.col)
      }
      delete placed[id]
    }
    return false
  }
  return rec(0)
}

/** Can all these statements (and the scene facts) be true together? */
export function satisfiable(c: LieCase, statementIds: readonly string[], opts: { lanes?: boolean; scene?: boolean } = {}): boolean {
  return solvable(c.puzzle, cited(c, statementIds, opts.scene !== false).map(s => s.clue), opts.lanes !== false)
}

/**
 * A contradiction that survives without the row/column rule (and without the scene facts): a person
 * can see it from the words and the plan of the house alone.
 */
export const laneFree = (c: LieCase, statementIds: readonly string[]): boolean => !satisfiable(c, statementIds, { lanes: false, scene: false })

/** The citation is a contradiction and every statement in it is needed (drop any one and a world remains). */
export function isMinimalContradiction(c: LieCase, statementIds: readonly string[]): boolean {
  const ids = [...new Set(statementIds)].filter(id => !c.statements.find(s => s.id === id)?.scene)
  if (ids.length === 0 || satisfiable(c, ids)) return false
  return ids.every(id => satisfiable(c, ids.filter(x => x !== id)))
}

/**
 * Minimal contradictions (by statement id) of size 2..maxSize in the whole case, scene facts implicit.
 * The lie is in every one of them (check 3 proves nothing else could be). Increasing size; a set that
 * contains a smaller contradiction is skipped.
 */
export function findMinimalCores(c: LieCase, maxSize = 4): string[][] {
  const doubtable = c.statements.filter(s => !s.scene).map(s => s.id)
  const cores: string[][] = []
  const pick = (start: number, k: number, chosen: string[]) => {
    if (chosen.length === k) {
      if (cores.some(core => core.every(id => chosen.includes(id)))) return
      if (!satisfiable(c, chosen)) cores.push([...chosen])
      return
    }
    for (let i = start; i < doubtable.length; i++) pick(i + 1, k, [...chosen, doubtable[i]])
  }
  for (let k = 2; k <= maxSize; k++) pick(0, k, [])
  return cores
}

/**
 * Can this collision be shown on the plan? Some order of the core's other authors places each of them
 * on one of at most MAX_TILES squares their own account allows (their whole account, the squares
 * already taken, and the row/column rule), after which the liar has no square left that satisfies the
 * core's statements.
 */
export const EXPOSE_MAX_TILES = 2

export function exposure(c: LieCase, coreIds: readonly string[]): CoreExposure {
  const p = c.puzzle
  const lie = c.statements.find(s => s.id === c.lieId)!
  const members = coreIds.map(id => c.statements.find(s => s.id === id)!)
  const witnesses = [...new Set(members.filter(m => m.id !== c.lieId).map(m => m.author))]
  const own = new Map(witnesses.map(w => [w, buildNet(p, c.statements.filter(s => s.author === w && !s.scene).map(s => s.clue))] as const))
  const coreNet = buildNet(p, members.map(m => m.clue))
  let best: { order: string[]; maxTiles: number } | null = null
  const rec = (placed: Placed, order: string[], widest: number) => {
    if (best) return
    if (order.length === witnesses.length) {
      if (legalCells(coreNet, lie.author, placed).length === 0) best = { order: [...order], maxTiles: widest }
      return
    }
    for (const w of witnesses.filter(x => !order.includes(x))) {
      const tiles = legalCells(own.get(w)!, w, placed)
      if (tiles.length === 0 || tiles.length > EXPOSE_MAX_TILES) continue
      for (const t of tiles) rec({ ...placed, [w]: t }, [...order, w], Math.max(widest, tiles.length))
    }
  }
  rec({}, [], 0)
  const b = best as { order: string[]; maxTiles: number } | null
  return {
    core: [...coreIds],
    ok: b !== null,
    maxTiles: b?.maxTiles ?? null,
    detail: b ? `place ${b.order.join(' then ')} (at most ${b.maxTiles} tile${b.maxTiles === 1 ? '' : 's'} each), then ${lie.author} has no square` : `no order of ${witnesses.join(', ')} pins each witness to <= ${EXPOSE_MAX_TILES} tiles and leaves ${lie.author} none`,
  }
}

/** Does the lie put the liar somewhere other than the victim's room? (A direction or "not with" claim cannot.) */
export function liePlacesOutside(c: LieCase): boolean {
  const p = c.puzzle
  const lie = c.statements.find(s => s.id === c.lieId)!
  const vRoom = roomIdAt(p, p.solution[p.victimId])
  const cl = lie.clue
  switch (cl.kind) {
    case 'room': return cl.roomId !== vRoom
    case 'notRoom': return cl.roomId === vRoom
    case 'sameRoomAs': return roomIdAt(p, p.solution[cl.other]) !== vRoom
    case 'notSameRoomAs': case 'direction': return false
    default: {
      for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) {
        if (roomIdAt(p, { row, col }) === vRoom && unaryClueHolds(p, cl, { row, col })) return false
      }
      return true
    }
  }
}

// ------------------------------------------------------- hand-style propagation

type Placed = Record<string, Cell>

interface Net {
  p: Puzzle
  ids: string[]
  /** Every clue that mentions a person, as author or as the other party. */
  about: Map<string, Clue[]>
}

function buildNet(p: Puzzle, clues: readonly Clue[]): Net {
  const about = new Map<string, Clue[]>(p.people.map(x => [x.id, []]))
  for (const c of clues) {
    about.get(c.person)?.push(c)
    const o = otherOf(c)
    if (o) about.get(o)?.push(c)
  }
  return { p, ids: p.people.map(x => x.id), about }
}

/** Squares `id` may stand on, given what is placed: lanes, own statements, statements with placed people. */
function legalCells(net: Net, id: string, placed: Placed): Cell[] {
  const { p } = net
  const usedRows = new Set(Object.values(placed).map(c => c.row))
  const usedCols = new Set(Object.values(placed).map(c => c.col))
  const out: Cell[] = []
  for (let row = 0; row < p.size; row++) {
    if (usedRows.has(row)) continue
    for (let col = 0; col < p.size; col++) {
      if (usedCols.has(col)) continue
      const cell: Cell = { row, col }
      const trial: Placed = { ...placed, [id]: cell }
      let ok = true
      for (const c of net.about.get(id) ?? []) {
        if (c.person === id) {
          const o = otherOf(c)
          if (o === undefined) { if (!unaryClueHolds(p, c, cell)) { ok = false; break } }
          else if (placed[o] && !clueHolds(p, c, trial)) { ok = false; break }
        } else if (placed[c.person] && !clueHolds(p, c, trial)) { ok = false; break }
      }
      if (ok) out.push(cell)
    }
  }
  return out
}

interface Propagation {
  placed: Placed
  /** The person left with no legal square, or null. */
  dead: string | null
  complete: boolean
  steps: string[]
}

/** Singles, then hidden singles in rows and columns, until a dead end, completion or a stall. */
function propagate(net: Net, start: Placed, lanes = true): Propagation {
  const placed: Placed = { ...start }
  const steps: string[] = []
  for (;;) {
    const open = net.ids.filter(id => !placed[id])
    if (!open.length) return { placed, dead: null, complete: true, steps }
    const legal = new Map(open.map(id => [id, legalCells(net, id, placed)]))
    const zero = open.find(id => legal.get(id)!.length === 0)
    if (zero) return { placed, dead: zero, complete: false, steps }
    const single = open.find(id => legal.get(id)!.length === 1)
    if (single) {
      placed[single] = legal.get(single)![0]
      steps.push(`${single} single ${key(placed[single])}`)
      continue
    }
    let moved = false
    for (const axis of lanes ? (['row', 'col'] as const) : []) {
      for (let k = 0; k < net.p.size && !moved; k++) {
        const pairs = open.flatMap(id => legal.get(id)!.filter(c => c[axis] === k).map(c => ({ id, c })))
        if (pairs.length === 1) {
          placed[pairs[0].id] = pairs[0].c
          steps.push(`${pairs[0].id} lane ${axis} ${k} -> ${key(pairs[0].c)}`)
          moved = true
        }
      }
      if (moved) break
    }
    if (!moved) return { placed, dead: null, complete: false, steps }
  }
}

/**
 * Can a player reach a visible collision in ALL the statements (the lie included)?
 * Level 0: singles alone. Level 1: one person with two legal squares, and both dead-end by singles.
 */
export function legibility(p: Puzzle, all: readonly Statement[], maxBranches = 2): { level: 0 | 1 | null; detail: string } {
  const net = buildNet(p, all.map(s => s.clue))
  const base = propagate(net, {})
  if (base.dead) return { level: 0, detail: `singles: ${base.dead} has no square after ${base.steps.length} placements` }
  if (base.complete) return { level: null, detail: 'singles placed everyone without a collision' }
  for (const id of net.ids.filter(x => !base.placed[x])) {
    const cells = legalCells(net, id, base.placed)
    if (cells.length < 2 || cells.length > maxBranches) continue
    const runs = cells.map(c => propagate(net, { ...base.placed, [id]: c }))
    if (runs.every(r => r.dead)) return { level: 1, detail: `suppose ${id}: each of ${cells.map(key).join(' / ')} dead-ends (${runs.map(r => r.dead).join(', ')})` }
  }
  return { level: null, detail: 'singles stall and no one-level suppose dead-ends' }
}

/**
 * Reach the true plan from the true statements: singles plus one-level supposes (a person with two
 * legal squares where exactly one dead-ends by singles, so the other is placed).
 */
export function reconstruct(p: Puzzle, trueStmts: readonly Statement[], maxBranches = 2): { placed: Placed | null; supposes: number; laneSteps: number; detail: string } {
  const net = buildNet(p, trueStmts.map(s => s.clue))
  let placed: Placed = {}
  let supposes = 0
  let laneSteps = 0
  for (;;) {
    const r = propagate(net, placed)
    placed = r.placed
    laneSteps += r.steps.filter(x => x.includes(' lane ')).length
    if (r.dead) return { placed: null, supposes, laneSteps, detail: `dead end for ${r.dead} in the true statements` }
    if (r.complete) return { placed, supposes, laneSteps, detail: `${supposes} supposes, ${laneSteps} lane steps` }
    let advanced = false
    for (const id of net.ids.filter(x => !placed[x])) {
      const cells = legalCells(net, id, placed)
      if (cells.length < 2 || cells.length > maxBranches) continue
      const runs = cells.map(c => propagate(net, { ...placed, [id]: c }))
      const live = cells.filter((_, i) => !runs[i].dead)
      if (live.length === 1) {
        placed = { ...placed, [id]: live[0] }
        supposes++
        advanced = true
        break
      }
    }
    if (!advanced) return { placed: null, supposes, laneSteps, detail: 'singles stall and no one-level suppose settles anyone' }
  }
}

/** Who the true statements place by plain singles alone (no hidden-single lane step, no suppose). */
export function placedBySingles(p: Puzzle, trueStmts: readonly Statement[]): Placed {
  return propagate(buildNet(p, trueStmts.map(s => s.clue)), {}, false).placed
}

// ------------------------------------------------------- one speaker, independent claims

/**
 * Pairs [implied, by] of a speaker's own (non-scene) statements where the second makes the first
 * redundant, given only the house: every way of satisfying `by` also satisfies `implied`
 * (placements and the row/column rule ignored). A unary claim is compared by the squares it allows;
 * a relational one by the squares it allows the speaker (some partner square exists), and two
 * relational claims about the same person by the pairs of squares they allow.
 */
export function impliedStatements(c: LieCase): Array<[string, string]> {
  const p = c.puzzle
  const cells: Cell[] = []
  for (let row = 0; row < p.size; row++) for (let col = 0; col < p.size; col++) cells.push({ row, col })
  const tiles = (cl: Clue): Set<string> => new Set(cells.filter(x => {
    const o = otherOf(cl)
    return o === undefined ? unaryClueHolds(p, cl, x) : cells.some(y => clueHolds(p, cl, { [cl.person]: x, [o]: y }))
  }).map(key))
  const pairs = (cl: Clue): Set<string> => {
    const o = otherOf(cl)!
    const out = new Set<string>()
    for (const x of cells) for (const y of cells) if (clueHolds(p, cl, { [cl.person]: x, [o]: y })) out.add(`${key(x)}|${key(y)}`)
    return out
  }
  const subset = (a: Set<string>, b: Set<string>) => [...a].every(k => b.has(k))
  const implies = (by: Clue, implied: Clue): boolean => {
    const oi = otherOf(implied), ob = otherOf(by)
    if (oi === undefined) return subset(tiles(by), tiles(implied))
    if (ob === undefined || ob !== oi) return false
    return subset(pairs(by), pairs(implied))
  }
  const out: Array<[string, string]> = []
  for (const person of p.people) {
    const mine = c.statements.filter(s => s.author === person.id && !s.scene)
    for (const a of mine) for (const b of mine) if (a !== b && implies(b.clue, a.clue)) out.push([a.id, b.id])
  }
  return out
}

// ------------------------------------------------------------------ the checks

/** Statements counted per suspect (scene facts are the victim's and are not accounts). */
const accountsOf = (all: readonly Statement[], id: string) => all.filter(s => s.author === id && !s.scene)

export function verifyLieCase(c: LieCase, expect: CaseExpectations = {}): LieVerifyResult {
  const failures: string[] = []
  const fail = (msg: string) => failures.push(msg)
  const report: LieVerifyReport = {
    legibilityLevel: null, legibilityDetail: '', reconstructionSupposes: null, reconstructionLaneSteps: null,
    liarPlacedBySingles: null, laneFree: [], allCores: [], exposure: [],
  }
  const p = c.puzzle
  const all = c.statements
  const lie = all.find(s => s.id === c.lieId)
  const byId = new Map(all.map(s => [s.id, s]))

  // structure the numbered checks rely on
  if (new Set(all.map(s => s.id)).size !== all.length) fail('structure: statement ids are not unique')
  if (!lie) { fail(`structure: lieId ${c.lieId} is not a statement`); return { ok: false, failures, report } }
  const suspects = p.people.filter(x => x.id !== p.victimId).map(x => x.id)
  if (lie.scene) fail('structure: the lie is a scene fact')
  if (!suspects.includes(lie.author)) fail('structure: the lie author is not a suspect')
  if (p.murdererId !== lie.author) fail(`structure: puzzle.murdererId ${p.murdererId} is not the lie author ${lie.author}`)
  for (const s of all) {
    if (s.clue.person !== s.author) fail(`structure: ${s.id} author ${s.author} differs from clue.person ${s.clue.person}`)
    if (!ALLOWED_KINDS.includes(s.clue.kind)) fail(`structure: ${s.id} uses clue kind ${s.clue.kind}, which this mode does not allow`)
    if (s.clue.kind === 'direction' && s.clue.steps !== undefined) fail(`structure: ${s.id} is a stepped direction`)
    if (s.scene && s.author !== p.victimId) fail(`structure: scene fact ${s.id} is not the victim's`)
    if (!s.scene && s.author === p.victimId) fail(`structure: ${s.id} is a victim statement that is not a scene fact`)
    const o = otherOf(s.clue)
    if (o === p.victimId) fail(`structure: ${s.id} is relational to the victim`)
  }
  const sol = p.solution
  const rows = new Set(p.people.map(x => sol[x.id]?.row))
  const cols = new Set(p.people.map(x => sol[x.id]?.col))
  if (p.people.some(x => !sol[x.id]) || rows.size !== p.people.length || cols.size !== p.people.length) fail('structure: solution is not one person per row and column')
  if (p.people.length !== p.size) fail(`structure: ${p.people.length} people on a ${p.size}x${p.size} board`)
  const truths = all.filter(s => s.id !== c.lieId)
  for (const s of truths) if (!clueHolds(p, s.clue, sol)) fail(`structure: true statement ${s.id} does not hold in puzzle.solution`)
  if (clueHolds(p, lie.clue, sol)) fail(`structure: the lie ${lie.id} holds in puzzle.solution`)
  const real = p.clues.filter(ct => ct.clue.kind !== 'victim')
  const expected = truths.map(s => JSON.stringify({ clue: s.clue, text: s.text }))
  if (JSON.stringify(real.map(ct => JSON.stringify({ clue: ct.clue, text: ct.text }))) !== JSON.stringify(expected)) {
    fail('structure: puzzle.clues (without the victim marker) is not exactly the statements minus the lie, in order')
  }
  if (failures.length) return { ok: false, failures, report }

  // 1. everything together has no solution
  if (countSolutions(puzzleOf(p, all), 1) !== 0) fail('check 1: all statements together still have a solution')

  // 2. the lie removed: exactly one solution, equal to puzzle.solution, murderer = liar
  if (countSolutions(p, 2) !== 1) fail('check 2: puzzle.clues does not have exactly one solution')
  else if (!isSolution(p, sol)) fail('check 2: puzzle.solution does not satisfy puzzle.clues')
  if (findMurderer(p, sol) !== lie.author) fail(`check 2: findMurderer is ${findMurderer(p, sol)}, the liar is ${lie.author}`)

  // 3. doubting any other doubtable statement never yields a consistent world
  for (const d of all) {
    if (d.id === c.lieId || d.scene) continue
    if (satisfiableStmts(p, all.filter(s => s.id !== d.id))) fail(`check 3: doubting ${d.id} instead of the lie leaves a consistent world`)
  }

  // 4. two or three minimal collisions; the lie is the only statement they all share
  const cores = c.collisions
  if (cores.length < 2 || cores.length > 3) fail(`check 4: ${cores.length} collisions stored, expected 2 or 3`)
  cores.forEach((core, i) => {
    const tag = `check 4 (collision ${i + 1})`
    if (new Set(core).size !== core.length) return fail(`${tag}: repeats an id`)
    const members = core.map(id => byId.get(id))
    if (members.some(m => !m)) return fail(`${tag}: names an unknown statement`)
    const ms = members as Statement[]
    if (ms.some(m => m.scene)) return fail(`${tag}: names a scene fact; those are implicit`)
    if (!core.includes(c.lieId)) return fail(`${tag}: does not contain the lie`)
    if (core.length < 2 || core.length > 4) fail(`${tag}: has ${core.length} statements, expected 2 to 4`)
    if (satisfiable(c, core)) return fail(`${tag}: is satisfiable, not a collision`)
    if (satisfiable(c, core, { scene: false })) fail(`${tag}: only collides with help from a scene fact`)
    for (const m of ms) if (!satisfiable(c, core.filter(x => x !== m.id))) fail(`${tag}: not minimal, ${m.id} is not needed`)
    const rest = ms.filter(m => m.id !== c.lieId)
    if (!rest.some(m => m.author !== lie.author && !m.scene)) fail(`${tag}: holds no other suspect's statement`)
    if (rest.some(m => m.author === lie.author)) fail(`${tag}: includes the liar's other statement; a collision must be between accounts`)
  })
  const inter = cores.length ? cores.reduce((acc, core) => acc.filter(id => core.includes(id))) : []
  if (inter.length !== 1 || inter[0] !== c.lieId) fail(`check 4: the collisions intersect in [${inter.join(', ')}], expected only ${c.lieId}`)
  if (cores.length === 2) {
    // two witnesses are only independent if they are different people
    const authorsOf = (core: string[]) => new Set(core.filter(id => id !== c.lieId).map(id => byId.get(id)?.author))
    const aa = authorsOf(cores[0]), bb = authorsOf(cores[1])
    if ([...aa].some(x => bb.has(x))) fail('check 4: the two collisions share an author besides the liar')
  }
  report.laneFree = cores.map(core => core.every(id => byId.has(id)) && laneFree(c, core))
  report.allCores = findMinimalCores(c, 4)
  for (const core of report.allCores) if (!core.includes(c.lieId)) fail(`check 4: minimal contradiction [${core.join(', ')}] does not contain the lie`)

  // 5. the lie is not refuted by physical evidence alone
  const scene = all.filter(s => s.scene)
  if (!satisfiableStmts(p, [lie])) fail('check 5: the lie alone is unsatisfiable')
  for (const s of scene) if (!satisfiableStmts(p, [lie, s])) fail(`check 5: scene fact ${s.id} alone refutes the lie`)
  if (scene.length && !satisfiableStmts(p, [lie, ...scene])) fail('check 5: the scene facts together refute the lie')
  const liarOther = accountsOf(all, lie.author).find(s => s.id !== c.lieId)
  if (liarOther && !satisfiableStmts(p, [lie, liarOther])) fail('check 5: the liar contradicts themself, no testimony from anyone else needed')

  // 6. no surface tell
  const counts = suspects.map(id => accountsOf(all, id).length)
  if (new Set(counts).size !== 1) fail(`check 6: statement counts differ between suspects (${counts.join(', ')})`)
  if (!truths.some(s => !s.scene && s.clue.kind === lie.clue.kind)) fail(`check 6: no true statement shares the lie's clue kind (${lie.clue.kind})`)
  const vRoom = roomIdAt(p, sol[p.victimId])
  const names = (s: Statement) => (s.clue.kind === 'room' || s.clue.kind === 'notRoom') && s.clue.roomId === vRoom
  if (names(lie) && !truths.some(s => !s.scene && names(s))) fail("check 6: the lie is the only account naming the victim's room")

  // every statement says something its speaker's other statement does not
  for (const [implied, by] of impliedStatements(c)) fail(`check 6: ${implied} is implied by ${by}, the same speaker's other statement`)

  // the liar's own true statement must not hand the answer over by placing them in the victim's room
  if (liarOther && liarOther.clue.kind !== 'sameRoomAs' && !otherOf(liarOther.clue)) {
    let outside = false
    for (let row = 0; row < p.size && !outside; row++) for (let col = 0; col < p.size; col++) {
      const cell = { row, col }
      if (roomIdAt(p, cell) !== vRoom && unaryClueHolds(p, liarOther.clue, cell)) { outside = true; break }
    }
    if (!outside) fail("check 6: the liar's other statement already places them in the victim's room")
  }

  // 7. a player can find a collision by hand
  const leg = legibility(p, all)
  report.legibilityLevel = leg.level
  report.legibilityDetail = leg.detail
  if (leg.level === null || leg.level > 1) fail(`check 7: no collision by singles or one suppose (${leg.detail})`)

  // 8. the true plan can be reached by hand once the lie is removed
  const rec = reconstruct(p, truths)
  report.reconstructionSupposes = rec.placed ? rec.supposes : null
  report.reconstructionLaneSteps = rec.placed ? rec.laneSteps : null
  if (!rec.placed) fail(`check 8: ${rec.detail}`)
  else if (p.people.some(x => !same(rec.placed![x.id], sol[x.id]))) fail('check 8: the hand-reached plan differs from puzzle.solution')
  report.liarPlacedBySingles = !!placedBySingles(p, truths)[lie.author]

  // 9. the lie is an alibi: it puts the liar outside the victim's room
  if (!liePlacesOutside(c)) fail("check 9: the lie does not put the liar outside the victim's room")

  // 10. every stored collision can be shown on the plan
  report.exposure = cores.filter(core => core.every(id => byId.has(id))).map(core => exposure(c, core))
  for (const e of report.exposure) if (!e.ok) fail(`check 10: collision [${e.core.join(', ')}] cannot be exposed: ${e.detail}`)

  // what this case promises beyond the shared checks
  const nLaneFree = report.laneFree.filter(Boolean).length
  if (expect.laneFreeAtLeast !== undefined && nLaneFree < expect.laneFreeAtLeast) fail(`expect: ${nLaneFree} lane-free collisions, expected at least ${expect.laneFreeAtLeast}`)
  if (expect.supposesAtLeast !== undefined && (report.reconstructionSupposes ?? 0) < expect.supposesAtLeast) fail(`expect: reconstruction used ${report.reconstructionSupposes} supposes, expected at least ${expect.supposesAtLeast}`)
  if (expect.liarBeyondSingles && (report.liarPlacedBySingles || ((report.reconstructionSupposes ?? 0) + (report.reconstructionLaneSteps ?? 0)) === 0)) fail("expect: the liar's true square is found by singles alone")
  if (expect.firstTwoShare !== undefined && cores.length >= 2) {
    const shared = cores[0].filter(id => cores[1].includes(id)).length
    if (shared !== expect.firstTwoShare) fail(`expect: the first two collisions share ${shared} statements, expected ${expect.firstTwoShare}`)
  }

  return { ok: failures.length === 0, failures, report }
}
