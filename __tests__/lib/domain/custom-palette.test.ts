import { CUSTOM_SCHEMES, buildCustomPalette, validatePalette } from '@/lib/domain/custom-palette'
import { contrastRatio, fromOklch, toOklch } from '@/lib/domain/color'
import { PALETTES } from '@/lib/domain/palettes'

const SURFACE = { light: '#f8f8f8', dark: '#060606' } as const
const bases = ['#0054ee', '#ff0000', '#ffeb3b', '#00ff00', '#7c3aed', '#00bcd4', '#ff9800', '#e91e63', '#9e9e9e', '#000000', '#ffffff']
const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

describe('validatePalette', () => {
  it('accepts every built-in palette, the reference for the checks', () => {
    for (const palette of PALETTES) {
      expect({ name: palette.name, light: validatePalette(palette.colors, 'light').ok }).toEqual({ name: palette.name, light: true })
      expect({ name: palette.name, dark: validatePalette(palette.darkColors!, 'dark').ok }).toEqual({ name: palette.name, dark: true })
    }
  })

  it('flags colours too light to read on the light surface', () => {
    const result = validatePalette(['#fff7cc', '#0d9488', '#8b5cf6', '#ec4899', '#b45309'], 'light')
    expect(result.ok).toBe(false)
    expect(result.issues).toContain('contrast')
  })
})

describe('buildCustomPalette', () => {
  it.each(CUSTOM_SCHEMES.map((s) => s.id))('%s: every colour reads on both surfaces, from any starting colour', (scheme) => {
    for (const base of bases) {
      const { palette } = buildCustomPalette(base, scheme)
      expect(palette.colors).toHaveLength(5)
      expect(palette.darkColors).toHaveLength(5)
      for (const color of palette.colors) expect({ base, color, ok: contrastRatio(color, SURFACE.light) >= 3 }).toEqual({ base, color, ok: true })
      for (const color of palette.darkColors!) expect({ base, color, ok: contrastRatio(color, SURFACE.dark) >= 3 }).toEqual({ base, color, ok: true })
    }
  })

  it('keeps the hue of the chosen colour in the first slot and only adjusts its lightness', () => {
    const { palette, original } = buildCustomPalette('#ffeb3b', 'analogous')
    expect(original).toBe('#ffeb3b')
    const [, , pickedHue] = toOklch('#ffeb3b')
    for (const adjusted of [palette.colors[0], palette.darkColors![0]]) expect(hueDistance(toOklch(adjusted)[2], pickedHue)).toBeLessThan(8)
    expect(toOklch(palette.colors[0])[0]).toBeLessThan(toOklch('#ffeb3b')[0])
  })

  it('reports whether the colour had to be adjusted', () => {
    expect(buildCustomPalette('#ffeb3b', 'analogous').adjusted).toEqual({ light: true, dark: true })
    const safe = PALETTES[0].colors[0]
    expect(buildCustomPalette(safe, 'analogous').adjusted.light).toBe(false)
  })

  it('builds categorical schemes that pass the full checks for typical brand colours', () => {
    for (const scheme of ['analogous', 'complementary', 'triadic'] as const)
      for (const base of ['#0054ee', '#e91e63', '#ff9800', '#7c3aed']) {
        const { validation } = buildCustomPalette(base, scheme)
        expect({ scheme, base, light: validation.light.ok, dark: validation.dark.ok }).toEqual({ scheme, base, light: true, dark: true })
      }
  })

  it.each(CUSTOM_SCHEMES.map((s) => s.id))('%s passes every check in both modes across the colour wheel', (scheme) => {
    for (let hue = 0; hue < 360; hue += 20)
      for (const [L, C] of [[0.6, 0.15], [0.8, 0.12], [0.4, 0.2]]) {
        const base = fromOklch(L, C, hue)
        const { validation } = buildCustomPalette(base, scheme)
        expect({ base, light: validation.light.issues, dark: validation.dark.issues }).toEqual({ base, light: [], dark: [] })
      }
  })

  it('builds shades of one colour as an ordered ramp of a single hue', () => {
    const { palette, validation } = buildCustomPalette('#0054ee', 'monochromatic')
    const [, , hue] = toOklch('#0054ee')
    for (const color of palette.colors) expect(hueDistance(toOklch(color)[2], hue)).toBeLessThan(12)
    const lightness = palette.colors.map((c) => toOklch(c)[0])
    for (let i = 1; i < lightness.length; i++) expect(Math.abs(lightness[i] - lightness[i - 1])).toBeGreaterThanOrEqual(0.06)
    expect(validation.light.ok && validation.dark.ok).toBe(true)
  })

  it('names the palette after the scheme and the chosen colour', () => {
    const { palette } = buildCustomPalette('#0054EE', 'triadic')
    expect(palette.name).toBe('Personalizada (triádica)')
    expect(palette.description).toBe('Combinación triádica a partir de #0054ee, ajustada para leerse en modo claro y oscuro.')
  })

  it('rejects text that is not a colour', () => {
    expect(() => buildCustomPalette('azul', 'analogous')).toThrow()
  })
})
