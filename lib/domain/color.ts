/**
 * Colour math for palette validation: sRGB ↔ OKLab/OKLCH, WCAG contrast and colour-difference (ΔE in OKLab ×100),
 * including colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009, severity 1.0). These are the
 * same formulas the built-in palettes were validated with.
 */

type Vec3 = [number, number, number]

const HEX = /^#?([0-9a-f]{6})$/i

/** Normalises "#ABCDEF" / "abcdef" to "#abcdef", or returns null for anything else. */
export function parseHex(value: string): string | null {
  const match = HEX.exec(value.trim())
  return match ? `#${match[1].toLowerCase()}` : null
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexToLinear(hex: string): Vec3 {
  const h = parseHex(hex)
  if (!h) throw new Error(`Not a hex colour: ${hex}`)
  return [1, 3, 5].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255)) as Vec3
}

function linearToHex(rgb: Vec3): string {
  return `#${rgb
    .map((c) => Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255).toString(16).padStart(2, "0"))
    .join("")}`
}

function oklabFromLinear([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function linearFromOklab([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** [lightness 0–1, chroma, hue in degrees]. */
export function toOklch(hex: string): Vec3 {
  const [L, a, b] = oklabFromLinear(hexToLinear(hex))
  const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  return [L, Math.hypot(a, b), hue]
}

const inGamut = (rgb: Vec3) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4)

/** The colour at this lightness and hue, with chroma lowered as little as needed to stay displayable in sRGB. */
export function fromOklch(L: number, C: number, H: number): string {
  const rad = (H * Math.PI) / 180
  const at = (c: number) => linearFromOklab([L, c * Math.cos(rad), c * Math.sin(rad)])
  if (inGamut(at(C))) return linearToHex(at(C))
  let lo = 0
  let hi = C
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(at(mid))) lo = mid
    else hi = mid
  }
  return linearToHex(at(lo))
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const MACHADO: Record<"protan" | "deutan", [Vec3, Vec3, Vec3]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
}

function simulate(rgb: Vec3, kind: keyof typeof MACHADO): Vec3 {
  const clamp = (c: number) => Math.min(1, Math.max(0, c))
  return MACHADO[kind].map((row) => clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])) as Vec3
}

/** Colour difference in OKLab ×100, for normal vision or simulated protanopia/deuteranopia. */
export function deltaE(a: string, b: string, kind?: keyof typeof MACHADO): number {
  const la = hexToLinear(a)
  const lb = hexToLinear(b)
  const [x, y] = [oklabFromLinear(kind ? simulate(la, kind) : la), oklabFromLinear(kind ? simulate(lb, kind) : lb)]
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}
