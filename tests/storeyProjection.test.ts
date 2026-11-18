import { OrthographicCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { makeFrame, makeStoreyFrame, PX_PER_UNIT } from '../src/scene3d/units'

describe('shared storey camera and interaction projection', () => {
  it('retains the single-storey elevation and opens the view into multi-storey voids', () => {
    expect(makeFrame(8).cameraDirection[1]).toBeCloseTo(Math.sin(32 * Math.PI / 180))
    expect(makeStoreyFrame(8, 1, 'ghost').cameraDirection[1]).toBeCloseTo(Math.sin(42 * Math.PI / 180))
  })

  it.each([['ghost', 0], ['ghost', 1], ['exploded', 0], ['exploded', 1]] as const)(
    'aligns real camera projection and floor hit testing in %s on floor %i', (view, floor) => {
      const frame = makeStoreyFrame(8, floor, view)
      const camera = new OrthographicCamera(-frame.viewWidthUnits / 2, frame.viewWidthUnits / 2,
        frame.viewHeightUnits / 2, -frame.viewHeightUnits / 2, -50, 50)
      const centre = new Vector3(...frame.centre)
      camera.position.copy(centre).addScaledVector(new Vector3(...frame.cameraDirection), 20)
      camera.lookAt(centre)
      camera.updateMatrixWorld(true)
      for (const point of [[0, 0, 0], [6.4, 0, 6.4], [4, -1.34, 0.48], [2.4, 1.29, 3.2]] as const) {
        const projected = new Vector3(...point).project(camera)
        const [x, y] = frame.project([...point])
        expect(x).toBeCloseTo((projected.x + 1) / 2 * frame.viewWidthUnits * PX_PER_UNIT, 7)
        expect(y).toBeCloseTo((1 - projected.y) / 2 * frame.viewHeightUnits * PX_PER_UNIT, 7)
        if (point[1] === 0) {
          const [worldX, worldZ] = frame.unprojectFloor(x, y)
          expect(worldX).toBeCloseTo(point[0], 7)
          expect(worldZ).toBeCloseTo(point[2], 7)
        }
      }
    },
  )
})
