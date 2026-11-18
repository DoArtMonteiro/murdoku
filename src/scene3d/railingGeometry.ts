import type { Box3 } from './resolve'

/** Visible members only. The original box remains the continuous barrier. */
export function railingPieces(box: Box3, axis: 'x' | 'z'): Box3[] {
  const index = axis === 'x' ? 0 : 2
  const length = box.max[index] - box.min[index]
  const height = box.max[1] - box.min[1]
  const railHeight = Math.min(0.04, height)
  const rail: Box3 = { min: [...box.min], max: [...box.max] }
  const cross = axis === 'x' ? 2 : 0
  const centre = (box.min[cross] + box.max[cross]) / 2
  const railWidth = Math.min(0.04, box.max[cross] - box.min[cross])
  rail.min[cross] = centre - railWidth / 2
  rail.max[cross] = centre + railWidth / 2
  rail.min[1] = box.max[1] - railHeight
  if (height <= railHeight || length <= 0.025) return [rail]
  const width = Math.min(0.025, length)
  const intervals = Math.max(1, Math.ceil((length - width) / 0.18))
  const posts = Array.from({ length: intervals + 1 }, (_, i): Box3 => {
    const post: Box3 = { min: [...box.min], max: [...box.max] }
    post.min[index] = box.min[index] + (length - width) * i / intervals
    post.max[index] = i === intervals ? box.max[index] : post.min[index] + width
    post.max[1] = rail.min[1]
    const postDepth = Math.min(0.025, box.max[cross] - box.min[cross])
    post.min[cross] = centre - postDepth / 2
    post.max[cross] = centre + postDepth / 2
    return post
  })
  return [rail, ...posts]
}
