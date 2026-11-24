// One False Alibi: search for a sound 6x6 case on a fixed, hand-built house.
//
//   node scripts/lie-search.mjs [--seed N] [--trials N] [--out file.jsonl]
//
// Loads src/lie/verify.ts through vite (no build step) so the search and the test share ONE
// definition of "sound". For each trial: random true plan (victim's room holds exactly one
// suspect, the liar), 2 true statements per suspect (one for the liar) + 1-2 scene facts,
// hill-climbed to a unique solution; then every false statement the liar could have made is
// tried as the lie. Survivors are run through verifyLieCase and printed as JSON.
import { createServer } from 'vite'
import { appendFileSync } from 'node:fs'

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const SEED = Number(arg('seed', 1))
const TRIALS = Number(arg('trials', 20000))
const OUT = arg('out', '')

const server = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' })
const eng = await server.ssrLoadModule('/src/core/engine.ts')
const ver = await server.ssrLoadModule('/src/lie/verify.ts')

// ------------------------------------------------------------------ the house
const rect = (r0, c0, r1, c1) => {
  const out = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c })
  return out
}
export const ROOMS = [
  { id: 'room0', name: 'Kitchen', hue: 20, cells: rect(0, 0, 1, 2) },
  { id: 'room1', name: 'Workshop', hue: 210, cells: rect(0, 3, 2, 5) },
  { id: 'room2', name: 'Living Room', hue: 150, cells: rect(2, 0, 5, 2) },
  { id: 'room3', name: 'Courtyard', hue: 95, cells: rect(3, 3, 5, 5) },
]
const piece = (type, row, col, w = 1, h = 1) => ({ type, row, col, w, h, rotation: w < h ? 90 : 0, floor: 0 })
export const FURNITURE = [
  piece('stove', 0, 0), piece('counter', 0, 1, 2, 1), piece('table', 1, 1), piece('chair', 1, 2),
  piece('desk', 0, 4), piece('lamp', 1, 5), piece('box', 2, 3), piece('chair', 2, 5),
  piece('bookshelf', 2, 0), piece('clock', 2, 2), piece('sofa', 3, 1, 2, 1), piece('rug', 4, 0, 2, 2), piece('plant', 5, 2),
  piece('shrub', 3, 5), piece('table', 4, 4), piece('box', 5, 3),
]
const N = 6
const roomOf = Array.from({ length: N }, () => Array(N).fill(''))
for (const r of ROOMS) for (const c of r.cells) roomOf[c.row][c.col] = r.id
const NAMES = ['Rui', 'Inês', 'Tomé', 'Marta', 'Lúcia', 'Álvaro']
const people = NAMES.map((name, i) => ({ id: `p${i}`, name, avatarSeed: `${name}-ofa1-${i}`, accent: '#8A7CA8', ...(i === 5 ? { isVictim: true } : {}) }))
const IDS = people.map(x => x.id)
const VICTIM = 'p5'
const base = { id: 'ofa-01', title: 'ofa-01', caseNumber: 'One False Alibi 1', difficulty: 'Medium', size: 6, rooms: ROOMS, roomOf, furniture: FURNITURE, people, clues: [], solution: {}, victimId: VICTIM, murdererId: '', flavor: '', source: 'custom' }
const roomName = id => ROOMS.find(r => r.id === id).name
const countType = t => FURNITURE.filter(f => f.type === t).length

// ------------------------------------------------------------------ rng
let s = SEED >>> 0
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const pick = a => a[Math.floor(rnd() * a.length)]
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[b[i], b[j]] = [b[j], b[i]] } return b }

// ------------------------------------------------------------------ clue language
const nameOf = id => people.find(x => x.id === id).name
const DIRWORD = { N: 'north', S: 'south', E: 'east', W: 'west' }
function textOf(c) {
  switch (c.kind) {
    case 'room': return `In the ${roomName(c.roomId)}.`
    case 'notRoom': return `Never set foot in the ${roomName(c.roomId)}.`
    case 'onFurniture': return `On ${countType(c.furniture) === 1 ? 'the' : 'a'} ${c.furniture}.`
    case 'besideFurniture': return `Beside ${countType(c.furniture) === 1 ? 'the' : 'a'} ${c.furniture}.`
    case 'sameRoomAs': return `In the same room as ${nameOf(c.other)}.`
    case 'notSameRoomAs': return `Was not in the same room as ${nameOf(c.other)}.`
    case 'edge': return 'On the outer edge of the board.'
    case 'direction': return `Somewhere ${DIRWORD[c.dir]} of ${nameOf(c.other)}.`
  }
  throw new Error(c.kind)
}
const stmtOf = (id, clue, extra = {}) => ({ author: id, clue, text: textOf(clue), ...extra })

/** Every clue `id` could say about the plan `sol`, each tagged with whether it is true. */
function candidates(id, sol, suspectsOnly = true) {
  const out = []
  const types = [...new Set(FURNITURE.map(f => f.type))]
  for (const r of ROOMS) { out.push({ kind: 'room', person: id, roomId: r.id }); out.push({ kind: 'notRoom', person: id, roomId: r.id }) }
  for (const t of types) { out.push({ kind: 'onFurniture', person: id, furniture: t }); out.push({ kind: 'besideFurniture', person: id, furniture: t }) }
  out.push({ kind: 'edge', person: id })
  if (id !== VICTIM) {
    for (const o of IDS) {
      if (o === id || o === VICTIM) continue
      out.push({ kind: 'sameRoomAs', person: id, other: o }, { kind: 'notSameRoomAs', person: id, other: o })
      for (const dir of ['N', 'S', 'E', 'W']) out.push({ kind: 'direction', person: id, other: o, dir })
    }
  }
  const pz = { ...base, clues: [], solution: sol }
  return out.map(c => ({ clue: c, true: eng.clueHolds(pz, c, sol) }))
}
const WEIGHT = { room: 3, onFurniture: 3, besideFurniture: 2.5, direction: 2, sameRoomAs: 2, notRoom: 1.5, notSameRoomAs: 1, edge: 1 }
function wpick(list) {
  const tot = list.reduce((a, c) => a + WEIGHT[c.clue.kind], 0)
  let x = rnd() * tot
  for (const c of list) { x -= WEIGHT[c.clue.kind]; if (x <= 0) return c }
  return list[list.length - 1]
}

// ------------------------------------------------------------------ fast solver
// Same semantics as the engine (each clue's truth table is built by the engine's own
// unaryClueHolds / clueHolds); only the search is specialised. The finished case is
// re-verified by verifyLieCase on the real engine.
const cellOf = i => ({ row: Math.floor(i / N), col: i % N })
const unaryCache = new Map()
const relCache = new Map()
const REL = new Set(['sameRoomAs', 'notSameRoomAs', 'direction'])
function unaryTable(clue) {
  const k = JSON.stringify(clue)
  let t = unaryCache.get(k)
  if (!t) { t = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) t[i] = eng.unaryClueHolds(base, clue, cellOf(i)) ? 1 : 0; unaryCache.set(k, t) }
  return t
}
function relTable(clue) {
  const k = JSON.stringify(clue)
  let t = relCache.get(k)
  if (!t) {
    t = new Uint8Array(N * N * N * N)
    for (let a = 0; a < N * N; a++) for (let b = 0; b < N * N; b++) t[a * N * N + b] = eng.clueHolds(base, clue, { [clue.person]: cellOf(a), [clue.other]: cellOf(b) }) ? 1 : 0
    relCache.set(k, t)
  }
  return t
}
function count(stmts, cap = 2) {
  const dom = {}
  for (const id of IDS) dom[id] = Array.from({ length: N * N }, (_, i) => i)
  const rels = Object.fromEntries(IDS.map(id => [id, []]))
  for (const st of stmts) {
    const c = st.clue
    if (REL.has(c.kind)) {
      const t = relTable(c)
      rels[c.person].push({ other: c.other, t, self: 'a' })
      rels[c.other].push({ other: c.person, t, self: 'b' })
    } else {
      const t = unaryTable(c)
      dom[c.person] = dom[c.person].filter(i => t[i])
    }
  }
  const order = [...IDS].sort((x, y) => dom[x].length - dom[y].length)
  if (dom[order[0]].length === 0) return 0
  const placed = {}
  const rowUsed = new Array(N).fill(false), colUsed = new Array(N).fill(false)
  let n = 0
  const rec = d => {
    if (d === order.length) { n++; return }
    const id = order[d]
    for (const i of dom[id]) {
      const r = Math.floor(i / N), cc = i % N
      if (rowUsed[r] || colUsed[cc]) continue
      let ok = true
      for (const rel of rels[id]) {
        const o = placed[rel.other]
        if (o === undefined) continue
        if (!(rel.self === 'a' ? rel.t[i * N * N + o] : rel.t[o * N * N + i])) { ok = false; break }
      }
      if (!ok) continue
      placed[id] = i; rowUsed[r] = colUsed[cc] = true
      rec(d + 1)
      rowUsed[r] = colUsed[cc] = false; delete placed[id]
      if (n >= cap) return
    }
  }
  rec(0)
  return n
}
const sat = stmts => count(stmts, 1) > 0
function minimalCores(statements, lieId, maxSize = 4) {
  const lie = statements.find(x => x.id === lieId)
  const others = statements.filter(x => x.id !== lieId)
  const cores = []
  const pickK = (start, k, chosen) => {
    if (chosen.length === k) {
      const ids = [lieId, ...chosen.map(x => x.id)]
      if (cores.some(core => core.every(id => ids.includes(id)))) return
      if (!sat([lie, ...chosen])) cores.push(ids)
      return
    }
    for (let i = start; i < others.length; i++) pickK(i + 1, k, [...chosen, others[i]])
  }
  for (let k = 1; k <= maxSize - 1; k++) pickK(0, k, [])
  return cores
}

// ------------------------------------------------------------------ one trial
const stats = { trials: 0, planOk: 0, unique: 0, lieUnsat: 0, check3: 0, cores: 0, tells: 0, verified: 0 }
const found = []

function randomPlan() {
  const cols = shuffle([0, 1, 2, 3, 4, 5])
  const rowsFor = shuffle(IDS)
  const sol = {}
  rowsFor.forEach((id, row) => { sol[id] = { row, col: cols[row], floor: 0 } })
  const pz = { ...base, solution: sol }
  const vRoom = eng.roomIdAt(pz, sol[VICTIM])
  const mates = IDS.filter(id => id !== VICTIM && eng.roomIdAt(pz, sol[id]) === vRoom)
  if (mates.length !== 1) return null
  return { sol, liar: mates[0], vRoom }
}

/** A lie is an alibi only if it puts the liar somewhere other than the victim's room. */
function placesElsewhere(clue, plan) {
  const inV = i => base.roomOf[Math.floor(i / N)][i % N] === plan.vRoom
  if (clue.kind === 'sameRoomAs') return eng.roomIdAt(base, plan.sol[clue.other]) !== plan.vRoom
  if (clue.kind === 'notSameRoomAs' || clue.kind === 'direction') return clue.kind === 'direction'
  const t = unaryTable(clue)
  for (let i = 0; i < N * N; i++) if (t[i] && inV(i)) return false
  return true
}
const countOf = stmts => count(stmts, 12)

function trial() {
  stats.trials++
  const plan = randomPlan()
  if (!plan) return
  stats.planOk++
  const { sol, liar } = plan
  const suspects = IDS.filter(id => id !== VICTIM)
  const cand = Object.fromEntries(IDS.map(id => [id, candidates(id, sol)]))
  const trues = Object.fromEntries(IDS.map(id => [id, cand[id].filter(c => c.true)]))
  const lies = cand[liar].filter(c => !c.true)

  // true statements: 2 per suspect except the liar (1), scene facts for the victim (1-2)
  const want = Object.fromEntries(suspects.map(id => [id, id === liar ? 1 : 2]))
  want[VICTIM] = rnd() < 0.5 ? 1 : 2
  const chosen = Object.fromEntries(IDS.map(id => [id, []]))
  for (const id of IDS) {
    const list = trues[id].filter(c => id !== VICTIM || ['room', 'onFurniture', 'besideFurniture', 'edge'].includes(c.clue.kind))
    for (let k = 0; k < want[id]; k++) {
      let c
      do { c = wpick(list) } while (chosen[id].some(x => JSON.stringify(x.clue) === JSON.stringify(c.clue)))
      chosen[id].push(c)
    }
  }
  const flat = () => IDS.flatMap(id => chosen[id].map(c => stmtOf(id, c.clue)))
  let n = countOf(flat())
  for (let step = 0; step < 80 && n > 1; step++) {
    const id = pick(IDS)
    const i = Math.floor(rnd() * chosen[id].length)
    const old = chosen[id][i]
    const list = trues[id].filter(c => id !== VICTIM || ['room', 'onFurniture', 'besideFurniture', 'edge'].includes(c.clue.kind))
    const c = wpick(list)
    if (chosen[id].some(x => JSON.stringify(x.clue) === JSON.stringify(c.clue))) continue
    chosen[id][i] = c
    const m = countOf(flat())
    if (m <= n) n = m
    else chosen[id][i] = old
  }
  if (n !== 1) return
  stats.unique++

  const trueStmts = flat()
  // try every lie the liar could have told
  for (const L of shuffle(lies)) {
    if (!placesElsewhere(L.clue, plan)) continue
    const lieStmt = stmtOf(liar, L.clue)
    const all = [...trueStmts, lieStmt]
    if (sat(all)) continue
    stats.lieUnsat++
    // doubting any other doubtable statement must still leave no consistent world
    let ok = true
    for (const d of all) {
      if (d === lieStmt || d.author === VICTIM) continue
      if (sat(all.filter(x => x !== d))) { ok = false; break }
    }
    if (!ok) continue
    stats.check3++
    // assemble in reading order: suspects p0..p4 by author, victim scene facts last
    const ordered = IDS.flatMap(id => {
      const mine = all.filter(x => x.author === id)
      return id === liar ? shuffle(mine) : mine
    })
    // ids s1..sN; liar's pair order randomised above
    const statements = ordered.map((x, i) => ({ id: `s${i + 1}`, author: x.author, clue: x.clue, text: x.text, ...(x.author === VICTIM ? { scene: true } : {}) }))
    const lieId = statements.find(x => x.author === liar && JSON.stringify(x.clue) === JSON.stringify(L.clue)).id
    const probe = { ...base, solution: sol, murdererId: liar }
    const cores = minimalCores(statements, lieId, 4)
    const usable = cores.filter(core => !core.some(id => id !== lieId && statements.find(x => x.id === id).author === liar))
    let pair = null
    for (let i = 0; i < usable.length && !pair; i++) {
      for (let j = i + 1; j < usable.length && !pair; j++) {
        const a = usable[i], b = usable[j]
        if (a.filter(id => b.includes(id)).length !== 1) continue
        const au = new Set(a.filter(id => id !== lieId).map(id => statements.find(x => x.id === id).author))
        const bu = new Set(b.filter(id => id !== lieId).map(id => statements.find(x => x.id === id).author))
        if ([...au].some(x => bu.has(x))) continue
        pair = [a, b]
      }
    }
    if (!pair) continue
    stats.cores++
    const puzzle = { ...base, solution: sol, murdererId: liar, clues: [...statements.filter(x => x.id !== lieId).map(x => ({ clue: x.clue, text: x.text })), { clue: { kind: 'victim', person: VICTIM }, text: 'The victim — found alone with the murderer.' }] }
    const lc = { id: 'ofa-01', puzzle, statements, lieId, collisions: pair, story: null }
    const res = ver.verifyLieCase(lc)
    if (res.failures.some(f => f.startsWith('check 6'))) stats.tells++
    if (!res.ok) { rejectCount(res.failures); continue }
    stats.verified++
    const rec = { seed: SEED, level: res.report.legibilityLevel, supposes: res.report.reconstructionSupposes, detail: res.report.legibilityDetail, case: lc }
    found.push(rec)
    const line = JSON.stringify(rec)
    if (OUT) appendFileSync(OUT, line + '\n')
    console.log(`FOUND level=${rec.level} supposes=${rec.supposes} liar=${liar} lie="${lieStmt.text}" cores=${JSON.stringify(pair)}`)
  }
}

const rejects = {}
function rejectCount(fs) {
  for (const f of fs) { const k = f.replace(/ (s\d+|\d+).*/, '').slice(0, 60); rejects[k] = (rejects[k] ?? 0) + 1 }
}

const t0 = Date.now()
for (let i = 0; i < TRIALS; i++) {
  trial()
  if ((i + 1) % 2000 === 0) console.log(`... ${i + 1} trials, ${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(stats))
}
console.log('DONE', JSON.stringify(stats), 'found', found.length)
console.log('reject reasons', JSON.stringify(rejects, null, 1))
await server.close()
