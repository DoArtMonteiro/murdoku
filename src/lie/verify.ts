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
import { clueHolds, countSolutions, findMurderer, isSolution, roomIdAt, unaryClueHolds } from '../core/engine'
import type { Cell, Clue, Puzzle } from '../core/types'
import type { LieCase, Statement } from './model'

export interface LieVerifyReport {
  /** 0 = a dead end appears by singles alone, 1 = it needed one suppose, null = not found. */
  legibilityLevel: 0 | 1 | null
  /** How the dead end appears, for the author. */
  legibilityDetail: string
  /** Number of one-level supposes the true plan needed (null if it could not be reached). */
  reconstructionSupposes: number | null
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

export const satisfiable = (p: Puzzle, stmts: readonly Statement[]): boolean => countSolutions(puzzleOf(p, stmts), 1) > 0

const key = (c: Cell) => `${c.row},${c.col}`
const same = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col

/**
 * Minimal unsatisfiable subsets (by statement id) that contain `lieId`, of size 2..maxSize.
 * Enumerated by increasing size; a set containing a smaller unsatisfiable one is skipped.
 */
export function findMinimalCores(p: Puzzle, all: readonly Statement[], lieId: string, maxSize = 4): string[][] {
  const lie = all.find(s => s.id === lieId)
  if (!lie) return []
  const others = all.filter(s => s.id !== lieId)
  const cores: string[][] = []
  const pick = (start: number, k: number, chosen: Statement[]) => {
    if (chosen.length === k) {
      const ids = [lieId, ...chosen.map(s => s.id)]
      if (cores.some(core => core.every(id => ids.includes(id)))) return
      if (!satisfiable(p, [lie, ...chosen])) cores.push(ids)
      return
    }
    for (let i = start; i < others.length; i++) pick(i + 1, k, [...chosen, others[i]])
  }
  for (let k = 1; k <= maxSize - 1; k++) pick(0, k, [])
  return cores
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
function propagate(net: Net, start: Placed): Propagation {
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
    for (const axis of ['row', 'col'] as const) {
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
export function reconstruct(p: Puzzle, trueStmts: readonly Statement[], maxBranches = 2): { placed: Placed | null; supposes: number; detail: string } {
  const net = buildNet(p, trueStmts.map(s => s.clue))
  let placed: Placed = {}
  let supposes = 0
  for (;;) {
    const r = propagate(net, placed)
    placed = r.placed
    if (r.dead) return { placed: null, supposes, detail: `dead end for ${r.dead} in the true statements` }
    if (r.complete) return { placed, supposes, detail: `${supposes} supposes` }
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
    if (!advanced) return { placed: null, supposes, detail: 'singles stall and no one-level suppose settles anyone' }
  }
}

// ------------------------------------------------------------------ the checks

/** Statements counted per suspect (scene facts are the victim's and are not accounts). */
const accountsOf = (all: readonly Statement[], id: string) => all.filter(s => s.author === id && !s.scene)

export function verifyLieCase(c: LieCase): LieVerifyResult {
  const failures: string[] = []
  const fail = (msg: string) => failures.push(msg)
  const report: LieVerifyReport = { legibilityLevel: null, legibilityDetail: '', reconstructionSupposes: null }
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
    if (satisfiable(p, all.filter(s => s.id !== d.id))) fail(`check 3: doubting ${d.id} instead of the lie leaves a consistent world`)
  }

  // 4. two minimal collisions meeting only in the lie
  const [A, B] = c.collisions
  const cores: string[][] = [A, B]
  cores.forEach((core, i) => {
    const tag = `check 4 (collision ${i + 1})`
    if (new Set(core).size !== core.length) return fail(`${tag}: repeats an id`)
    const members = core.map(id => byId.get(id))
    if (members.some(m => !m)) return fail(`${tag}: names an unknown statement`)
    const ms = members as Statement[]
    if (!core.includes(c.lieId)) return fail(`${tag}: does not contain the lie`)
    if (core.length < 2 || core.length > 4) fail(`${tag}: has ${core.length} statements, expected 2 to 4`)
    if (satisfiable(p, ms)) return fail(`${tag}: is satisfiable, not a collision`)
    for (const m of ms) if (!satisfiable(p, ms.filter(x => x.id !== m.id))) fail(`${tag}: not minimal, ${m.id} is not needed`)
    const rest = ms.filter(m => m.id !== c.lieId)
    if (!rest.some(m => m.author !== lie.author && !m.scene)) fail(`${tag}: holds no other suspect's statement`)
    if (rest.some(m => m.author === lie.author)) fail(`${tag}: includes the liar's other statement; a collision must be between accounts`)
  })
  const inter = A.filter(id => B.includes(id))
  if (inter.length !== 1 || inter[0] !== c.lieId) fail(`check 4: the collisions intersect in [${inter.join(', ')}], expected only ${c.lieId}`)
  const authorsOf = (core: string[]) => new Set(core.filter(id => id !== c.lieId).map(id => byId.get(id)?.author))
  const aa = authorsOf(A), bb = authorsOf(B)
  if ([...aa].some(x => bb.has(x))) fail('check 4: the two collisions share an author besides the liar')

  // 5. the lie is not refuted by physical evidence alone
  const scene = all.filter(s => s.scene)
  if (!satisfiable(p, [lie])) fail('check 5: the lie alone is unsatisfiable')
  for (const s of scene) if (!satisfiable(p, [lie, s])) fail(`check 5: scene fact ${s.id} alone refutes the lie`)
  if (scene.length && !satisfiable(p, [lie, ...scene])) fail('check 5: the scene facts together refute the lie')
  const liarOther = accountsOf(all, lie.author).find(s => s.id !== c.lieId)
  if (liarOther && !satisfiable(p, [lie, liarOther])) fail('check 5: the liar contradicts themself, no testimony from anyone else needed')

  // 6. no surface tell
  const counts = suspects.map(id => accountsOf(all, id).length)
  if (new Set(counts).size !== 1) fail(`check 6: statement counts differ between suspects (${counts.join(', ')})`)
  if (!truths.some(s => !s.scene && s.clue.kind === lie.clue.kind)) fail(`check 6: no true statement shares the lie's clue kind (${lie.clue.kind})`)
  const vRoom = roomIdAt(p, sol[p.victimId])
  const names = (s: Statement) => (s.clue.kind === 'room' || s.clue.kind === 'notRoom') && s.clue.roomId === vRoom
  if (names(lie) && !truths.some(s => !s.scene && names(s))) fail("check 6: the lie is the only account naming the victim's room")

  // 7. a player can find a collision by hand
  const leg = legibility(p, all)
  report.legibilityLevel = leg.level
  report.legibilityDetail = leg.detail
  if (leg.level === null || leg.level > 1) fail(`check 7: no collision by singles or one suppose (${leg.detail})`)

  // 8. the true plan can be reached by hand once the lie is removed
  const rec = reconstruct(p, truths)
  report.reconstructionSupposes = rec.placed ? rec.supposes : null
  if (!rec.placed) fail(`check 8: ${rec.detail}`)
  else if (p.people.some(x => !same(rec.placed![x.id], sol[x.id]))) fail('check 8: the hand-reached plan differs from puzzle.solution')

  return { ok: failures.length === 0, failures, report }
}
