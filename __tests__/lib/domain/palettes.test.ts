import { PALETTES, paletteColors, pickPalette, regeneratePalette } from '@/lib/domain/palettes'
import { createSeededRandom } from '@/lib/domain/random'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import type { ColorPalette, LayoutVariant, Variable } from '@/types/dashboard'

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('PALETTES', () => {
  it('has unique names and five valid colours per mode', () => {
    expect(new Set(PALETTES.map((p) => p.name)).size).toBe(PALETTES.length)
    for (const palette of PALETTES) {
      for (const colors of [palette.colors, palette.darkColors ?? []]) {
        expect(colors).toHaveLength(5)
        for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/)
        expect(new Set(colors).size).toBe(5)
      }
    }
  })

  it.each(PALETTES.map((p) => [p.name, p] as const))('%s keeps 3:1 contrast against the card surfaces', (_name, palette) => {
    for (const color of palette.colors) expect(contrast(color, '#f8f8f8')).toBeGreaterThanOrEqual(3)
    for (const color of palette.darkColors ?? []) expect(contrast(color, '#060606')).toBeGreaterThanOrEqual(3)
  })
})

describe('paletteColors', () => {
  const legacy: ColorPalette = { name: 'Legacy', colors: ['#111111'], description: '' }

  it('returns the dark set in dark mode and the light set otherwise', () => {
    expect(paletteColors(PALETTES[0], 'dark')).toBe(PALETTES[0].darkColors)
    expect(paletteColors(PALETTES[0], 'light')).toBe(PALETTES[0].colors)
  })

  it('falls back to the light set for palettes saved without dark colours', () => {
    expect(paletteColors(legacy, 'dark')).toBe(legacy.colors)
  })
})

describe('pickPalette and regeneratePalette', () => {
  const vars: Variable[] = [
    { id: 'a', name: 'Ventas', type: 'numeric', priority: 'alta' },
    { id: 'b', name: 'Region', type: 'categorical', priority: 'media' },
  ]
  const variant = generateSingleLayoutVariant(vars, [], [], { random: createSeededRandom(1), now: () => 1 })

  it('never returns the excluded palette', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(pickPalette([], createSeededRandom(seed), 'Aurora').name).not.toBe('Aurora')
    }
  })

  it('prefers palettes that are not in the history', () => {
    const history: LayoutVariant[] = PALETTES.slice(0, -1).map((palette, i) => ({ ...variant, id: `v${i}`, palette }))
    expect(pickPalette(history, createSeededRandom(3)).name).toBe(PALETTES[PALETTES.length - 1].name)
  })

  it('changes only the palette of a variant', () => {
    const next = regeneratePalette(variant, [variant], createSeededRandom(7))
    expect(next.palette.name).not.toBe(variant.palette.name)
    expect({ ...next, palette: variant.palette }).toEqual(variant)
  })
})
