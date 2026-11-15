import { contrastRatio, deltaE, fromOklch, parseHex, toOklch } from "@/lib/domain/color"
import type { ColorMode } from "@/lib/domain/palettes"
import type { ColorPalette } from "@/types/dashboard"

/**
 * Palettes built from a colour the user picks. The chosen hue is kept; lightness (and chroma, when it is too low to
 * read as a colour) is adjusted until every colour passes the same checks as the built-in palettes.
 */

export type CustomScheme = "monochromatic" | "analogous" | "complementary" | "triadic"

export const CUSTOM_SCHEMES: readonly { id: CustomScheme; label: string; adjective: string }[] = [
  { id: "monochromatic", label: "Tonos de un color", adjective: "monocromática" },
  { id: "analogous", label: "Análoga", adjective: "análoga" },
  { id: "complementary", label: "Complementaria", adjective: "complementaria" },
  { id: "triadic", label: "Triádica", adjective: "triádica" },
]

/** Card surfaces the palettes are validated against. */
const SURFACE: Record<ColorMode, string> = { light: "#f8f8f8", dark: "#060606" }
/** OKLCH lightness band where categorical colours read well on each surface. */
const BAND: Record<ColorMode, [number, number]> = { light: [0.43, 0.77], dark: [0.48, 0.67] }
const CHROMA_FLOOR = 0.1
const MIN_CONTRAST = 3
/**
 * Colour-vision separation: 8 is the target, 6 the floor the built-in palettes rely on (legal because every chart
 * names its series with labels and a legend, never colour alone).
 */
const CVD_MIN = 6
const CVD_TARGET = 8
const NORMAL_MIN = 15
const ORDINAL_MIN_GAP = 0.06
const SLOTS = 5

export type PaletteIssue = "contrast" | "band" | "chroma" | "cvd" | "normal" | "ramp"

export interface PaletteValidation {
  ok: boolean
  issues: PaletteIssue[]
}

/**
 * Checks a palette for one mode. Categorical palettes need every colour in the lightness band, above the chroma floor
 * and at 3:1 against the surface, and neighbouring slots told apart (ΔE ≥ 6 under colour-vision deficiency, ≥ 15 with
 * normal vision). An ordinal palette (shades of one colour) needs 3:1 and steps at least 0.06 apart in lightness.
 */
export function validatePalette(colors: string[], mode: ColorMode, { ordinal = false } = {}): PaletteValidation {
  const issues = new Set<PaletteIssue>()
  for (const color of colors) if (contrastRatio(color, SURFACE[mode]) < MIN_CONTRAST - 1e-9) issues.add("contrast")
  const pairs = colors.slice(1).map((color, i) => [colors[i], color] as const)
  if (ordinal) {
    const lightness = colors.map((c) => toOklch(c)[0])
    if (lightness.slice(1).some((l, i) => Math.abs(l - lightness[i]) < ORDINAL_MIN_GAP)) issues.add("ramp")
  } else {
    const [lo, hi] = BAND[mode]
    for (const color of colors) {
      const [L, C] = toOklch(color)
      if (L < lo || L > hi) issues.add("band")
      if (C < CHROMA_FLOOR) issues.add("chroma")
    }
    for (const [a, b] of pairs) {
      if (Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan")) < CVD_MIN) issues.add("cvd")
      if (deltaE(a, b) < NORMAL_MIN) issues.add("normal")
    }
  }
  return { ok: issues.size === 0, issues: [...issues] }
}

const readable = (hex: string, mode: ColorMode) => contrastRatio(hex, SURFACE[mode]) >= MIN_CONTRAST

/** Lightest (light mode) or darkest (dark mode) lightness at which this hue still reaches 3:1 on the surface. */
function contrastLimit(C: number, H: number, mode: ColorMode): number {
  // Light mode: contrast falls as L rises; dark mode: contrast rises with L. Bisect for the boundary.
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const ok = readable(fromOklch(mid, C, H), mode)
    if (mode === "light" ? ok : !ok) lo = mid
    else hi = mid
  }
  return mode === "light" ? lo : hi
}

/** Allowed lightness range for a categorical colour of this hue and chroma. */
function lightnessRange(C: number, H: number, mode: ColorMode): [number, number] {
  const [lo, hi] = BAND[mode]
  const limit = contrastLimit(C, H, mode)
  // Margins keep rounding to 8-bit hex from pushing a colour just outside the band or under 3:1.
  const margin = 0.005
  return mode === "light"
    ? [lo + margin, Math.min(hi - margin, limit - margin)]
    : [Math.max(lo + margin, limit + margin), hi - margin]
}

/**
 * The colour of this hue nearest to lightness `L` inside `[lo, hi]` that sRGB can show with at least the chroma floor.
 * Some hues lose chroma at the ends of the range (displayable blues are dark, yellows are light).
 */
function colorAt(L: number, C: number, H: number, [lo, hi]: [number, number]): string {
  const target = Math.min(hi, Math.max(lo, L))
  for (let step = 0; step <= 100; step++) {
    for (const candidate of [target - step * 0.005, target + step * 0.005]) {
      if (candidate < lo || candidate > hi) continue
      const hex = fromOklch(candidate, C, H)
      if (toOklch(hex)[1] >= CHROMA_FLOOR) return hex
    }
  }
  return fromOklch(target, C, H)
}

/** The colour itself when it already passes for this mode; otherwise the same hue with corrected lightness/chroma. */
function fitColor(hex: string, mode: ColorMode, L?: number): string {
  const [L0, C0, H] = toOklch(hex)
  const C = Math.max(C0, CHROMA_FLOOR + 0.02)
  const [lo, hi] = lightnessRange(C, H, mode)
  if (L === undefined) {
    const passes = readable(hex, mode) && L0 >= BAND[mode][0] && L0 <= BAND[mode][1] && C0 >= CHROMA_FLOOR
    if (passes) return hex
    L = L0
  }
  return colorAt(L, C, H, [lo, hi])
}

const HUE_OFFSETS: Record<Exclude<CustomScheme, "monochromatic">, number[]> = {
  analogous: [0, 40, -40, 80, -80],
  complementary: [0, 180, 35, 215, -35],
  triadic: [0, 120, 240, 60, 180],
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]))
}

/** How close a colour order is to passing separation: ≥ 1 passes, the higher the better. */
function separationScore(colors: string[]): number {
  let worst = Infinity
  for (let i = 1; i < colors.length; i++) {
    const [a, b] = [colors[i - 1], colors[i]]
    const cvd = Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan")) / CVD_TARGET
    worst = Math.min(worst, cvd, deltaE(a, b) / NORMAL_MIN)
  }
  return worst
}

/**
 * Builds the categorical colours for one mode from hues: the chosen colour keeps its lightness when it can; the others
 * try natural, alternating (low/high) and reverse-alternating lightness, keeping the best-separated result.
 */
function categoricalForMode(base: string, hues: number[], mode: ColorMode): string[][] {
  const [, C0] = toOklch(base)
  const chroma = Math.max(C0, 0.14)
  const first = fitColor(base, mode)
  const patterns = [null, [0.25, 0.85, 0.25, 0.85], [0.85, 0.25, 0.85, 0.25], [0.5, 0.15, 0.85, 0.5]]
  return patterns.map((pattern) =>
    [
      first,
      ...hues.slice(1).map((H, i) => {
        const [lo, hi] = lightnessRange(chroma, H, mode)
        const L = pattern ? lo + (hi - lo) * pattern[i] : (lo + hi) / 2
        return colorAt(L, chroma, H, [lo, hi])
      }),
    ],
  )
}

function buildCategorical(base: string, scheme: Exclude<CustomScheme, "monochromatic">) {
  const [, , H] = toOklch(base)
  const hues = HUE_OFFSETS[scheme].map((offset) => (H + offset + 360) % 360)
  const candidates = { light: categoricalForMode(base, hues, "light"), dark: categoricalForMode(base, hues, "dark") }

  // The slot order must be the same in both modes (a series keeps its hue when the theme changes): choose the
  // order of the four suggested hues, and each mode's lightness pattern, that separates neighbours best.
  let best = { score: -Infinity, light: [] as string[], dark: [] as string[] }
  for (const order of permutations([1, 2, 3, 4])) {
    const pick = (mode: ColorMode) =>
      candidates[mode]
        .map((colors) => [colors[0], ...order.map((i) => colors[i])])
        .reduce((a, b) => (separationScore(b) > separationScore(a) ? b : a))
    const light = pick("light")
    const dark = pick("dark")
    const score = Math.min(separationScore(light), separationScore(dark))
    if (score > best.score) best = { score, light, dark }
    if (score >= 1.3) break
  }
  return { light: best.light, dark: best.dark }
}

/** Shades of the chosen colour, ordered dark to light (light mode) and light to dark (dark mode). */
function buildMonochromatic(base: string) {
  const [, C0, H] = toOklch(base)
  const C = Math.max(C0, CHROMA_FLOOR + 0.02)
  const ramp = (mode: ColorMode) => {
    const limit = contrastLimit(C, H, mode)
    const [from, to] = mode === "light" ? [0.3, limit - 0.01] : [0.92, limit + 0.01]
    return Array.from({ length: SLOTS }, (_, i) => fromOklch(from + ((to - from) * i) / (SLOTS - 1), C, H))
  }
  return { light: ramp("light"), dark: ramp("dark") }
}

export interface CustomPaletteResult {
  palette: ColorPalette
  /** The colour the user picked, normalised. */
  original: string
  /** The picked colour as used in each mode, after adjustment. */
  base: Record<ColorMode, string>
  /** Whether the picked colour had to change to be legible in each mode. */
  adjusted: Record<ColorMode, boolean>
  validation: Record<ColorMode, PaletteValidation>
}

export function buildCustomPalette(color: string, scheme: CustomScheme): CustomPaletteResult {
  const original = parseHex(color)
  if (!original) throw new Error(`Not a hex colour: ${color}`)
  const ordinal = scheme === "monochromatic"
  const { light, dark } = ordinal ? buildMonochromatic(original) : buildCategorical(original, scheme)
  const base = { light: fitColor(original, "light"), dark: fitColor(original, "dark") }
  const adjective = CUSTOM_SCHEMES.find((s) => s.id === scheme)!.adjective
  return {
    palette: {
      name: `Personalizada (${adjective})`,
      colors: light,
      darkColors: dark,
      description: `${ordinal ? "Tonos" : "Combinación"} ${adjective} a partir de ${original}, ajustada para leerse en modo claro y oscuro.`,
    },
    original,
    base,
    adjusted: { light: base.light !== original, dark: base.dark !== original },
    validation: { light: validatePalette(light, "light", { ordinal }), dark: validatePalette(dark, "dark", { ordinal }) },
  }
}
