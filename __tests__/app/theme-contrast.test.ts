import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Theme tokens are used as text colour on their own 15% tint (chips, badges, links) and as the background of
 * light/dark foreground text (buttons, step numbers). Both uses must reach WCAG AA (4.5:1).
 */
const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8')

function block(selector: string): Record<string, [number, number, number]> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const tokens: Record<string, [number, number, number]> = {}
  for (const [, name, l, c, h] of body.matchAll(/--([\w-]+):\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)) {
    tokens[name] = [Number(l), Number(c), Number(h)]
  }
  return tokens
}

function oklchToLinear([L, C, h]: [number, number, number]): number[] {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** sRGB 0-255, reducing chroma until the colour is displayable (what the browser does, approximately). */
function toSrgb([L, C, h]: [number, number, number]): number[] {
  let chroma = C
  const inGamut = (c: number) => oklchToLinear([L, c, h]).every((v) => v >= -1e-4 && v <= 1 + 1e-4)
  while (chroma > 0 && !inGamut(chroma)) chroma -= 0.002
  return oklchToLinear([L, Math.max(0, chroma), h])
    .map((v) => Math.min(1, Math.max(0, v)))
    .map((v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
}

function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const tint = (color: number[], alpha: number, under: number[]) => color.map((v, i) => v * alpha + under[i] * (1 - alpha))

const TEXT_TOKENS = ['primary', 'accent', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'destructive']
const SOLID_TOKENS = ['primary', 'chart-2', 'chart-3', 'destructive']

describe.each([
  ['light', ':root'],
  ['dark', '.dark'],
])('%s theme tokens', (_theme, selector) => {
  const tokens = block(selector)
  const card = toSrgb(tokens.card)
  const background = toSrgb(tokens.background)
  const onSolid = toSrgb(tokens['primary-foreground'])

  it.each(TEXT_TOKENS)('%s reads at 4.5:1 on the background, the card and its own tint', (name) => {
    const color = toSrgb(tokens[name])
    expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(color, card)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(color, tint(color, 0.15, card))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(SOLID_TOKENS)('primary-foreground reads at 4.5:1 on solid %s', (name) => {
    expect(contrast(onSolid, toSrgb(tokens[name]))).toBeGreaterThanOrEqual(4.5)
  })
})
