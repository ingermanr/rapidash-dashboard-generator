import type { ColorPalette, LayoutVariant } from "@/types/dashboard"
import type { RandomSource } from "./random"

/**
 * Categorical palettes for the dashboard charts.
 *
 * Every palette has a light and a dark set (the same hues, stepped for each surface) and was
 * validated with the data-viz palette checks against the app's card surfaces (#f8f8f8 light,
 * #060606 dark): lightness band, chroma floor, colour-blind separation of adjacent slots
 * (ΔE ≥ 8), normal-vision separation (ΔE ≥ 15) and 3:1 contrast. The slot order is part of
 * the validation: do not reorder or edit a hex without re-running the checks.
 */
export const PALETTES: readonly ColorPalette[] = [
  {
    name: "Aurora",
    colors: ["#8b5cf6", "#0d9488", "#ec4899", "#3b82f6", "#b45309"],
    darkColors: ["#8b5cf6", "#0d9488", "#ec4899", "#3b82f6", "#d97706"],
    description: "Violeta, verde azulado y rosa: moderna y luminosa para productos digitales.",
  },
  {
    name: "Océano",
    colors: ["#3b82f6", "#0d9488", "#b45309", "#6366f1", "#f43f5e"],
    darkColors: ["#3b82f6", "#0d9488", "#d97706", "#6366f1", "#f43f5e"],
    description: "Azules profundos con acentos cálidos: sobria y confiable para finanzas y operaciones.",
  },
  {
    name: "Atardecer",
    colors: ["#ea580c", "#8b5cf6", "#f43f5e", "#0284c7", "#b45309"],
    darkColors: ["#ea580c", "#8b5cf6", "#f43f5e", "#0284c7", "#d97706"],
    description: "Naranja y violeta con contrapunto azul: enérgica para marketing y ventas.",
  },
  {
    name: "Bosque",
    colors: ["#059669", "#b45309", "#0284c7", "#f43f5e", "#8b5cf6"],
    darkColors: ["#059669", "#d97706", "#0284c7", "#f43f5e", "#8b5cf6"],
    description: "Verde esmeralda y ámbar: natural y equilibrada para sostenibilidad y salud.",
  },
  {
    name: "Vibrante",
    colors: ["#d946ef", "#0891b2", "#4d7c0f", "#6366f1", "#ea580c"],
    darkColors: ["#d946ef", "#0891b2", "#65a30d", "#6366f1", "#ea580c"],
    description: "Fucsia, cian y lima: atrevida para dashboards de producto y crecimiento.",
  },
  {
    name: "Corporativo",
    colors: ["#6366f1", "#0369a1", "#059669", "#b45309", "#f43f5e"],
    darkColors: ["#4f46e5", "#0284c7", "#059669", "#d97706", "#e11d48"],
    description: "Índigo y azul con verde y ámbar: profesional para reportes ejecutivos.",
  },
  {
    name: "Cítrico",
    colors: ["#4d7c0f", "#0891b2", "#ea580c", "#ec4899", "#8b5cf6"],
    darkColors: ["#65a30d", "#0891b2", "#ea580c", "#ec4899", "#8b5cf6"],
    description: "Lima, cian y naranja: fresca para retail y consumo.",
  },
  {
    name: "Nórdico",
    colors: ["#0284c7", "#f43f5e", "#0d9488", "#b45309", "#6366f1"],
    darkColors: ["#0284c7", "#f43f5e", "#0d9488", "#d97706", "#6366f1"],
    description: "Azul cielo y coral: limpia y legible para métricas de uso diario.",
  },
  {
    name: "Lavanda",
    colors: ["#a855f7", "#0d9488", "#f43f5e", "#0284c7", "#4d7c0f"],
    darkColors: ["#a855f7", "#0d9488", "#f43f5e", "#0284c7", "#65a30d"],
    description: "Púrpura suave con verde azulado: elegante para equipos de diseño y contenido.",
  },
  {
    name: "Brasa",
    colors: ["#ef4444", "#0284c7", "#b45309", "#8b5cf6", "#059669"],
    darkColors: ["#ef4444", "#0284c7", "#d97706", "#8b5cf6", "#059669"],
    description: "Rojo intenso con azul y ámbar: urgente para operaciones y monitoreo.",
  },
  {
    name: "Medianoche",
    colors: ["#6366f1", "#0891b2", "#d946ef", "#b45309", "#059669"],
    darkColors: ["#6366f1", "#0891b2", "#d946ef", "#d97706", "#059669"],
    description: "Índigo, cian y fucsia: tecnológica, pensada para el modo oscuro.",
  },
]

export type ColorMode = "light" | "dark"

/** The colours of a palette for the given mode (older palettes without a dark set reuse the light one). */
export function paletteColors(palette: ColorPalette, mode: ColorMode): string[] {
  return mode === "dark" && palette.darkColors?.length ? palette.darkColors : palette.colors
}

/**
 * Picks a palette, preferring ones not used in the history, then ones not used recently,
 * and never `excludeName` when another palette is available.
 */
export function pickPalette(
  history: readonly LayoutVariant[],
  random: RandomSource,
  excludeName?: string,
  palettes: readonly ColorPalette[] = PALETTES,
): ColorPalette {
  const candidates = palettes.filter((p) => p.name !== excludeName)
  const pool = candidates.length > 0 ? candidates : palettes
  const used = history.map((v) => v.palette.name)
  const recent = history.slice(-5).map((v) => v.palette.name)

  const unused = pool.filter((p) => !used.includes(p.name))
  const fresh = unused.filter((p) => !recent.includes(p.name))
  const notLast = pool.filter((p) => p.name !== recent[recent.length - 1])
  const choices = fresh.length > 0 ? fresh : unused.length > 0 ? unused : notLast.length > 0 ? notLast : pool
  return choices[Math.floor(random() * choices.length)]
}

/** Returns the variant with a different palette; layout and combinations are kept. */
export function regeneratePalette(
  variant: LayoutVariant,
  history: readonly LayoutVariant[],
  random: RandomSource = Math.random,
): LayoutVariant {
  return { ...variant, palette: pickPalette(history, random, variant.palette.name) }
}
