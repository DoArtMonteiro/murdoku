// Print one depth case for reading: board, clues, and the solving chain.
//   node scripts/depth-show.mjs <config A-E> <seed> [--mode ac|anchored]
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const [cfg, seedArg] = args
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'ac'
const vite = await createServer({ root, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } })
const depth = await vite.ssrLoadModule('/src/core/depth/index.ts')
const c = depth.generateDepthCase(depth.DEPTH_SPECS[cfg], Number(seedArg), { engine: 'never', recipe: { ...depth.DEFAULT_RECIPE, mode } })
const p = c.draft
if (!p) { console.log('no draft', c.rejected); await vite.close(); process.exit(0) }
console.log(`${p.id} ${p.size}x${p.size} floors ${p.floors ?? 1} people ${p.people.length} rejected: ${c.rejected.join(',') || '-'}`)
const sym = Object.fromEntries(p.people.map(x => [x.id, x.name[0]]))
for (let f = 0; f < (p.floors ?? 1); f++) {
  const map = p.roomOfByFloor ? p.roomOfByFloor[f] : p.roomOf
  console.log(`floor ${f}`)
  for (let r = 0; r < p.size; r++) {
    let line = ''
    for (let col = 0; col < p.size; col++) {
      const who = p.people.find(x => (p.solution[x.id].floor ?? 0) === f && p.solution[x.id].row === r && p.solution[x.id].col === col)
      const room = p.rooms.find(x => x.id === map[r][col])
      line += (who ? sym[who.id] + (who.isVictim ? '*' : ' ') : '. ') + room.name.slice(0, 3) + ' '
    }
    console.log('  ' + line)
  }
}
console.log('rooms:', p.rooms.map(r => `${r.id}=${r.name}`).join(' '))
for (const ct of p.clues) console.log(`  ${p.people.find(x => x.id === ct.clue.person).name}: ${ct.text}`)
const a = c.analysis
console.log(JSON.stringify({ ...a, steps: undefined, kindMix: a.kindMix }))
console.log(a.steps.map(s => `${s.n}.${p.people.find(x => x.id === s.person).name}[${s.via}/r${s.round}]`).join(' '))
await vite.close()
