// Suspect avatars are drawn in the browser from the bundled DiceBear
// "notionists" style, so showing a suspect never makes a network request. The
// generator is a separate chunk: the home screen does not need it, and the
// service worker precaches it for offline play.
type MakeAvatar = (seed: string, accent: string) => string

let maker: Promise<MakeAvatar> | undefined
const cache = new Map<string, string>()
const keyOf = (seed: string, accent: string) => `${accent}|${seed}`

function loadMaker(): Promise<MakeAvatar> {
  maker ??= Promise.all([import('@dicebear/core'), import('@dicebear/notionists')]).then(
    ([core, style]) =>
      (seed, accent) =>
        core
          .createAvatar(style, {
            seed,
            backgroundColor: [accent.replace('#', '')],
            backgroundType: ['gradientLinear'],
            radius: 12,
          })
          .toDataUri(),
  )
  // A failed chunk load must not stick: the next suspect to render tries again.
  maker.catch(() => { maker = undefined })
  return maker
}

/** Start loading the generator ahead of the first suspect. Never throws. */
export function warmAvatars(): void {
  loadMaker().catch(() => {})
}

/** The avatar if it is already made, so a repeat render needs no effect. */
export function cachedAvatar(seed: string, accent: string): string | undefined {
  return cache.get(keyOf(seed, accent))
}

export async function makeAvatar(seed: string, accent: string): Promise<string> {
  const key = keyOf(seed, accent)
  const hit = cache.get(key)
  if (hit) return hit
  const url = (await loadMaker())(seed, accent)
  cache.set(key, url)
  return url
}
