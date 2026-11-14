/** A source of uniformly distributed numbers in [0, 1), compatible with Math.random. */
export type RandomSource = () => number

/**
 * Deterministic pseudo-random generator (mulberry32).
 * The same seed always yields the same sequence, which makes generation reproducible in tests.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Picks a uniformly random element. The caller guarantees a non-empty array. */
export function pickRandom<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)]
}
