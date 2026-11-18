import { describe, expect, it } from 'vitest'
import { resolveScene, type Box3 } from '../src/scene3d/resolve'
import { twoStoreyReferenceUpper } from '../src/scene3d/scenes/two-storey-reference-upper'
import { CELL, type Vec3 } from '../src/scene3d/units'

// A privacidade mede a geometria que aparece na imagem, incluindo os intervalos
// das guardas. Uma barreira de circulação invisível não bloqueia uma vista.
const scene = resolveScene(twoStoreyReferenceUpper, 8)
const barriers = scene.walls.filter(wall => wall.kind !== 'foundation')
  .flatMap(wall => wall.visualPieces ?? wall.pieces)

function blocksSegment(origin: Vec3, target: Vec3, box: Box3): boolean {
  let first = 0
  let last = 1
  for (const axis of [0, 1, 2] as const) {
    const direction = target[axis] - origin[axis]
    if (Math.abs(direction) < 1e-9) {
      if (origin[axis] < box.min[axis] || origin[axis] > box.max[axis]) return false
      continue
    }
    const a = (box.min[axis] - origin[axis]) / direction
    const b = (box.max[axis] - origin[axis]) / direction
    first = Math.max(first, Math.min(a, b))
    last = Math.min(last, Math.max(a, b))
    if (first > last) return false
  }
  return first > 1e-6 && first < 1 - 1e-6
}

function exposedSightlines(id: string): string[] {
  const object = scene.objects.find(candidate => candidate.id === id)!
  const box = object.box
  const surfaces = [0.05, 0.5, 0.95].flatMap(x => [0.05, 0.5, 0.95].map(z => [
    box.min[0] + (box.max[0] - box.min[0]) * x,
    box.max[1],
    box.min[2] + (box.max[2] - box.min[2]) * z,
  ] as Vec3))
  const targets = id === 'bed' ? surfaces : [...surfaces, [
    (box.min[0] + box.max[0]) / 2,
    0.9,
    (box.min[2] + box.max[2]) / 2,
  ] as Vec3]
  // Alturas de observação dentro da escala da casa, abaixo da parede de 1,29.
  const arrivals = [5.1, 5.4, 5.75].flatMap(x => [0.2, 0.6, 1].flatMap(z =>
    [0.9, 1.1].map(y => [x * CELL, y, z * CELL] as Vec3)))
  const landing = twoStoreyReferenceUpper.circulation!.landing
  for (const origin of arrivals) {
    expect(origin[0]).toBeGreaterThanOrEqual(landing[0] * CELL)
    expect(origin[0]).toBeLessThanOrEqual(landing[2] * CELL)
    expect(origin[2]).toBeGreaterThanOrEqual(landing[1] * CELL)
    expect(origin[2]).toBeLessThanOrEqual(landing[3] * CELL)
  }
  return arrivals.flatMap(origin => targets
    .filter(target => !barriers.some(box => blocksSegment(origin, target, box)))
    .map(target => `${id}: ${origin.map(n => n.toFixed(2))} -> ${target.map(n => n.toFixed(2))}`))
}

describe('privacidade residencial na chegada da escada', () => {
  it('interrompe a vista para os pontos amostrados da cama sem presumir uma porta fechada', () => {
    const exposed = exposedSightlines('bed')
    expect(exposed.length, exposed.slice(0, 6).join('\n')).toBe(0)
  })

  it.each(['bath', 'toilet'])('interrompe a vista direta para %s', id => {
    const exposed = exposedSightlines(id)
    expect(exposed.length, exposed.slice(0, 6).join('\n')).toBe(0)
  })
})
