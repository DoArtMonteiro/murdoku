// One False Alibi: search for the true statements around an authored skeleton.
//
//   node scripts/lie-search.mjs --case ofa-02 [--shape 1|2|3] [--keep s1,s4] [--per 2] [--seed N]
//                               [--trials N] [--max N] [--best N] [--skip kind,kind]
//                               [--w kind=weight,...] [--out file.jsonl] [--debug]
//
//   --keep   ids of statements in the case file that stay fixed (the lie is always kept)
//   --best   keep every hit and print the N with the fewest direction/edge/negative statements
//   --w      sampling weights per clue kind (defaults favour room, furniture and beside)
//   --loose  speakers (ids, comma separated) kept to notRoom, edge and relations among themselves
//   --liarkinds  clue kinds the liar's other statement may use
//   --steps  hill-climbing steps towards a unique solution (default 80)
//   --debug  print the first few rejected sets with the verifier's reasons
//
// The author decides the story first: the house, the true plan, who lied and what they claimed.
// That is the skeleton, read from src/lie/cases/<case>.ts (its puzzle, its lie statement, and any
// statements named in --keep, which stay fixed). The search then draws the remaining true statements
// (--per per suspect, the liar one fewer, 1-2 scene facts), hill-climbs to a unique solution, and
// keeps the sets that pass verifyLieCase with the shape's promises:
//
//   shape 1  two collisions meeting only in the lie, different witnesses, at least one lane-free;
//            the cheapest proof is two cores, all legible
//   shape 2  a pair and a triple that chains through two witnesses, lane-free somewhere, the liar's
//            true square needs a lane step or a suppose, and no two pairs prove the lie
//   shape 3  no two cores prove the lie, three do; the first two of the three share the lie and one
//            more statement; the true plan needs a suppose (hard: see the ofa-03 header)
//
// verify.ts is loaded through vite (no build step), so the search and the tests share ONE definition
// of "sound". Hits are printed with ids, authors and sentences; the author writes each `display`.
import { createServer } from 'vite'
import { appendFileSync } from 'node:fs'

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const CASE = arg('case', '')
if (!CASE) throw new Error('usage: node scripts/lie-search.mjs --case ofa-02 [--shape 1|2|3] ...')
const SEED = Number(arg('seed', 1))
const TRIALS = Number(arg('trials', 20000))
const SHAPE = Number(arg('shape', CASE === 'ofa-01' ? 1 : CASE === 'ofa-02' ? 2 : 3))
const PER = Number(arg('per', 2))
const MAX = Number(arg('max', 12))
const KEEP = new Set((arg('keep', '') || '').split(',').filter(Boolean))
const SKIP = new Set((arg('skip', '') || '').split(',').filter(Boolean))
const OUT = arg('out', '')
const DEBUG = process.argv.includes('--debug')
const STEPS = Number(arg('steps', 80))

const server = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' })
const eng = await server.ssrLoadModule('/src/core/engine.ts')
const ver = await server.ssrLoadModule('/src/lie/verify.ts')
const mod = await server.ssrLoadModule(`/src/lie/cases/${CASE}.ts`)
const skel = Object.values(mod).find(v => v && typeof v === 'object' && v.puzzle && v.statements)
if (!skel) throw new Error(`src/lie/cases/${CASE}.ts exports no LieCase`)

// ------------------------------------------------------------------ the skeleton
const P = skel.puzzle
const N = P.size
const people = P.people
const IDS = people.map(x => x.id)
const VICTIM = P.victimId
const LIAR = P.murdererId
const SUSPECTS = IDS.filter(id => id !== VICTIM)
const sol = P.solution
const base = { ...P, clues: [] }
const lieSt = skel.statements.find(s => s.id === skel.lieId)
const roomName = id => P.rooms.find(r => r.id === id).name
const countType = t => P.furniture.filter(f => f.type === t).length
const nameOf = id => people.find(x => x.id === id).name
const pinned = skel.statements.filter(s => KEEP.has(s.id) && s.id !== skel.lieId)
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

// ------------------------------------------------------------------ rng
let s = SEED >>> 0
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const pick = a => a[Math.floor(rnd() * a.length)]
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[b[i], b[j]] = [b[j], b[i]] } return b }

// ------------------------------------------------------------------ clue language
function candidates(id) {
  const out = []
  const types = [...new Set(P.furniture.map(f => f.type))]
  for (const r of P.rooms) { out.push({ kind: 'room', person: id, roomId: r.id }); out.push({ kind: 'notRoom', person: id, roomId: r.id }) }
  for (const t of types) { out.push({ kind: 'onFurniture', person: id, furniture: t }); out.push({ kind: 'besideFurniture', person: id, furniture: t }) }
  out.push({ kind: 'edge', person: id })
  if (id !== VICTIM) {
    for (const o of IDS) {
      if (o === id || o === VICTIM) continue
      out.push({ kind: 'sameRoomAs', person: id, other: o }, { kind: 'notSameRoomAs', person: id, other: o })
      for (const dir of ['N', 'S', 'E', 'W']) out.push({ kind: 'direction', person: id, other: o, dir })
    }
  }
  return out.filter(c => !SKIP.has(c.kind) && eng.clueHolds(base, c, sol))
}
const WEIGHT = { room: 3, onFurniture: 3, besideFurniture: 2.5, direction: 2, sameRoomAs: 2, notRoom: 1.5, notSameRoomAs: 1.5, edge: 1 }
for (const kv of (arg('w', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); WEIGHT[k] = Number(v) }
function wpick(list) {
  const tot = list.reduce((a, c) => a + WEIGHT[c.kind], 0)
  let x = rnd() * tot
  for (const c of list) { x -= WEIGHT[c.kind]; if (x <= 0) return c }
  return list[list.length - 1]
}
const TRUES = Object.fromEntries(IDS.map(id => [id, candidates(id)]))
// --loose p0,p3,p4: these speakers only say things that pin nobody down: notRoom, edge, or a relation to another loose speaker
const LOOSE = (arg('loose', '') || '').split(',').filter(Boolean)
// a speaker listed as p2! (with a bang) may only say notRoom or edge, and nobody may name them
const QUIET = LOOSE.filter(x => x.endsWith('!')).map(x => x.slice(0, -1))
const TALK = LOOSE.map(x => x.replace('!', '')).filter(x => !QUIET.includes(x))
for (const id of LOOSE.map(x => x.replace('!', ''))) TRUES[id] = TRUES[id].filter(c => ['notRoom', 'edge'].includes(c.kind) || (!QUIET.includes(id) && c.other !== undefined && TALK.includes(c.other)))
const SCENE_KINDS = ['room', 'onFurniture', 'besideFurniture', 'edge']
const jc = c => JSON.stringify(c)

// ------------------------------------------------------------------ fast solver (engine truth tables)
const cellOf = i => ({ row: Math.floor(i / N), col: i % N })
const unaryCache = new Map(), relCache = new Map()
const REL = new Set(['sameRoomAs', 'notSameRoomAs', 'direction'])
function unaryTable(clue) {
  const k = jc(clue)
  let t = unaryCache.get(k)
  if (!t) { t = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) t[i] = eng.unaryClueHolds(base, clue, cellOf(i)) ? 1 : 0; unaryCache.set(k, t) }
  return t
}
function relTable(clue) {
  const k = jc(clue)
  let t = relCache.get(k)
  if (!t) {
    t = new Uint8Array(N * N * N * N)
    for (let a = 0; a < N * N; a++) for (let b = 0; b < N * N; b++) t[a * N * N + b] = eng.clueHolds(base, clue, { [clue.person]: cellOf(a), [clue.other]: cellOf(b) }) ? 1 : 0
    relCache.set(k, t)
  }
  return t
}
function count(clues, cap = 2) {
  const dom = {}
  for (const id of IDS) dom[id] = Array.from({ length: N * N }, (_, i) => i)
  const rels = Object.fromEntries(IDS.map(id => [id, []]))
  for (const c of clues) {
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

// --liarkinds notRoom,edge: the liar's other statement may only be of these kinds
const LIARKINDS = (arg('liarkinds', '') || '').split(',').filter(Boolean)
if (LIARKINDS.length) TRUES[LIAR] = TRUES[LIAR].filter(c => LIARKINDS.includes(c.kind))
// the liar's own true statements must not refute the lie by themselves (check 5)
TRUES[LIAR] = TRUES[LIAR].filter(c => count([c, lieSt.clue], 1) > 0)
// ... and must not by itself put the liar in the victim's room (that would be a tell)
const vRoom = eng.roomIdAt(base, sol[VICTIM])
TRUES[LIAR] = TRUES[LIAR].filter(c => REL.has(c.kind) || unaryTable(c).some((v, i) => v && eng.roomIdAt(base, cellOf(i)) !== vRoom))

// ------------------------------------------------------------------ shapes
const authorOf = (c, id) => c.statements.find(x => x.id === id).author
const sizeOfInter = (a, b) => a.filter(id => b.includes(id)).length
const othersOf = (c, core) => core.filter(id => id !== c.lieId)

/** Pick the stored collisions for the shape, or null. */
function chooseCollisions(c, cores) {
  const lf = core => ver.laneFree(c, core)
  const authorsOf = core => new Set(othersOf(c, core).map(id => authorOf(c, id)))
  const disjoint = (a, b) => ![...authorsOf(a)].some(x => authorsOf(b).has(x))
  const noLiarOther = core => !othersOf(c, core).some(id => authorOf(c, id) === LIAR)
  const usable = cores.filter(core => core.length >= 2 && noLiarOther(core) && !ver.satisfiable(c, core, { scene: false }) && ver.exposure(c, core).ok)
  const options = []
  if (SHAPE === 1) {
    for (let i = 0; i < usable.length; i++) for (let j = i + 1; j < usable.length; j++) {
      const a = usable[i], b = usable[j]
      if (sizeOfInter(a, b) !== 1 || !disjoint(a, b)) continue
      if (!lf(a) && !lf(b)) continue
      options.push([a, b])
    }
  } else if (SHAPE === 2) {
    for (const a of usable.filter(x => x.length === 2)) for (const b of usable.filter(x => x.length === 3)) {
      if (sizeOfInter(a, b) !== 1 || !disjoint(a, b)) continue
      if (!lf(a) && !lf(b)) continue
      const bo = othersOf(c, b).map(id => c.statements.find(x => x.id === id))
      const bAuthors = new Set(bo.map(x => x.author))
      if (bAuthors.size !== 2) continue
      const chained = bo.some(x => x.clue.other && bAuthors.has(x.clue.other)) || c.statements.find(x => x.id === c.lieId).clue.other !== undefined
      if (!chained) continue
      options.push([a, b])
    }
  } else {
    // no two cores may prove the lie; three must, and the first two of them share the lie and one more
    const paths = ver.proofPaths(c, 3, cores)
    if (paths.length === 0 || paths.some(x => x.cores.length === 2)) return null
    const ok = new Set(usable.map(k => k.join(',')))
    for (const path of paths.filter(x => x.cores.length === 3 && x.cores.every(k => ok.has(k.join(','))))) {
      for (const [a, b, d] of [[0, 1, 2], [0, 2, 1], [1, 2, 0]]) {
        if (sizeOfInter(path.cores[a], path.cores[b]) === 2) { options.push([path.cores[a], path.cores[b], path.cores[d]]); break }
      }
    }
  }
  if (!options.length) return null
  // prefer the smallest, then the most lane-free
  options.sort((x, y) => x.flat().length - y.flat().length || y.filter(lf).length - x.filter(lf).length)
  return options[0]
}

const EXPECT = SHAPE === 1 ? { laneFreeAtLeast: 1, proofCoresAtMost: 2, cheapestLegibleAtLeast: 2, allCoresLegible: true }
  : SHAPE === 2 ? { laneFreeAtLeast: 1, liarBeyondSingles: true, noPairPairProof: true, cheapestLegibleAtLeast: 1 }
    : { proofCoresAtLeast: 3, cheapestLegibleAtLeast: 2, supposesAtLeast: 1, firstTwoShare: 2 }

// ------------------------------------------------------------------ one trial
const stats = { trials: 0, unique: 0, noKind: 0, lieUnsat: 0, check3: 0, shaped: 0, verified: 0 }
const rejects = {}
let shown = 0
let shownCores = 0
const seen = new Set()
const found = []
const BEST = Number(arg('best', 0))
const scoreOf = statements => statements.reduce((a, x) => a + (x.clue.kind === 'direction' ? 1 : x.clue.kind === 'edge' ? 1 : x.clue.kind === 'notRoom' ? 0.5 : x.clue.kind === 'notSameRoomAs' ? 0.7 : 0), 0)
const reject = fs => { for (const f of fs) { const k = f.replace(/s\d+/g, 'sN').slice(0, 110); rejects[k] = (rejects[k] ?? 0) + 1 } }

function trial() {
  stats.trials++
  const want = Object.fromEntries(SUSPECTS.map(id => [id, id === LIAR ? PER - 1 : PER]))
  const pins = Object.fromEntries(IDS.map(id => [id, pinned.filter(x => x.author === id)]))
  const sceneWant = Math.max(pins[VICTIM].length, rnd() < 0.5 ? 1 : 2)
  want[VICTIM] = sceneWant
  const chosen = Object.fromEntries(IDS.map(id => [id, pins[id].map(x => ({ clue: x.clue, fixed: true }))]))
  const pool = id => TRUES[id].filter(c => id !== VICTIM || SCENE_KINDS.includes(c.kind))
  for (const id of IDS) {
    while (chosen[id].length < want[id]) {
      const c = wpick(pool(id))
      if (chosen[id].some(x => jc(x.clue) === jc(c))) continue
      chosen[id].push({ clue: c, fixed: false })
    }
  }
  const clues = () => IDS.flatMap(id => chosen[id].map(x => x.clue))
  let n = count(clues())
  for (let step = 0; step < STEPS && n > 1; step++) {
    const id = pick(IDS)
    const free = chosen[id].map((x, i) => (x.fixed ? -1 : i)).filter(i => i >= 0)
    if (!free.length) continue
    const i = pick(free)
    const old = chosen[id][i]
    const c = wpick(pool(id))
    if (chosen[id].some(x => jc(x.clue) === jc(c))) continue
    chosen[id][i] = { clue: c, fixed: false }
    const m = count(clues())
    if (m <= n) n = m
    else chosen[id][i] = old
  }
  if (DEBUG && stats.trials < 4) console.log('n after climb', n, JSON.stringify(clues().map(c => c.kind + ':' + c.person)))
  if (n !== 1) return
  stats.unique++
  const trues = clues()
  // cheap prefilter for check 6: someone else must use the lie's kind
  if (!IDS.some(id => id !== VICTIM && chosen[id].some(x => x.clue.kind === lieSt.clue.kind))) { stats.noKind++; return }
  const withLie = [...trues, lieSt.clue]
  if (count(withLie, 1) > 0) return
  stats.lieUnsat++
  const all = IDS.flatMap(id => (id === LIAR ? [...chosen[id].map(x => x.clue), lieSt.clue] : chosen[id].map(x => x.clue)))
  for (let k = 0; k < all.length; k++) {
    if (all[k].person === VICTIM || jc(all[k]) === jc(lieSt.clue)) continue
    if (count(all.filter((_, j) => j !== k), 1) > 0) return
  }
  stats.check3++
  // reading order: suspects by id, liar's two statements in random order, scene facts last
  const ordered = IDS.flatMap(id => {
    const mine = id === LIAR ? shuffle([...chosen[id].map(x => x.clue), lieSt.clue]) : chosen[id].map(x => x.clue)
    return mine.map(clue => ({ author: id, clue }))
  })
  const statements = ordered.map((x, i) => ({ id: `s${i + 1}`, author: x.author, clue: x.clue, text: textOf(x.clue), ...(x.author === VICTIM ? { scene: true } : {}) }))
  const key = statements.map(x => jc(x.clue)).sort().join('|')
  if (seen.has(key)) return
  seen.add(key)
  const lieId = statements.find(x => x.author === LIAR && jc(x.clue) === jc(lieSt.clue)).id
  const lc = {
    ...skel, id: skel.id, lieId, statements, collisions: [],
    puzzle: { ...P, clues: [...statements.filter(x => x.id !== lieId).map(x => ({ clue: x.clue, text: x.text })), { clue: { kind: 'victim', person: VICTIM }, text: 'The victim — found alone with the murderer.' }] },
  }
  const cores = ver.findMinimalCores(lc, 4)
  const pair = chooseCollisions(lc, cores)
  if (DEBUG && !pair && shownCores++ < 4) { console.log('NOPATH cores', JSON.stringify(cores), 'two-core proofs', ver.proofPaths(lc, 3, cores).filter(x => x.cores.length === 2).length); for (const x of statements) console.log('   ', x.id, nameOf(x.author), x.id === lieId ? '(LIE)' : '', x.text) }
  if (!pair) return
  stats.shaped++
  lc.collisions = pair
  const res = ver.verifyLieCase(lc, EXPECT)
  if (!res.ok) {
    reject(res.failures)
    if (DEBUG && shown++ < 4) { console.log('REJECT', JSON.stringify(res.failures), JSON.stringify(pair)); for (const x of statements) console.log('   ', x.id, nameOf(x.author), x.id === lieId ? '(LIE)' : '', x.text) }
    return
  }
  stats.verified++
  const rec = { seed: SEED, report: res.report, collisions: pair, lieId, statements: statements.map(({ id, author, clue, text, scene }) => ({ id, author, clue, text, ...(scene ? { scene } : {}) })) }
  rec.score = scoreOf(statements)
  rec.lc = lc
  found.push(rec)
  if (BEST) return
  if (OUT) appendFileSync(OUT, JSON.stringify(rec) + '\n')
  const r = res.report
  const nm = id => nameOf(id)
  console.log(`\nFOUND #${found.length} lie=${lieId} collisions=${JSON.stringify(pair)} laneFree=${JSON.stringify(r.laneFree)} legibility=${r.legibilityLevel} supposes=${r.reconstructionSupposes} laneSteps=${r.reconstructionLaneSteps} liarBySingles=${r.liarPlacedBySingles} cores=${JSON.stringify(r.allCores)}`)
  for (const x of statements) console.log(`  ${x.id} ${nm(x.author)}${x.id === lieId ? ' (LIE)' : ''}${x.scene ? ' (scene)' : ''}: ${x.text}`)
}

const t0 = Date.now()
for (let i = 0; i < TRIALS && found.length < MAX; i++) {
  trial()
  if ((i + 1) % 5000 === 0) console.log(`... ${i + 1} trials, ${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(stats))
}
if (BEST) {
  found.sort((a, b) => a.score - b.score)
  for (const rec of found.slice(0, BEST)) {
    const r = rec.report
    console.log(`
BEST score=${rec.score} lie=${rec.lieId} collisions=${JSON.stringify(rec.collisions)} laneFree=${JSON.stringify(r.laneFree)} legibility=${r.legibilityLevel} supposes=${r.reconstructionSupposes} laneSteps=${r.reconstructionLaneSteps} liarBySingles=${r.liarPlacedBySingles} cores=${JSON.stringify(r.allCores)}`)
    for (const x of rec.statements) console.log(`  ${x.id} ${nameOf(x.author)}${x.id === rec.lieId ? ' (LIE)' : ''}${x.scene ? ' (scene)' : ''}: ${x.text}`)
    console.log('  exposure ' + rec.report.exposure.map(e => e.detail).join(' | '))
  }
}
console.log('DONE', JSON.stringify(stats), 'found', found.length)
console.log('reject reasons', JSON.stringify(rejects, null, 1))
await server.close()
