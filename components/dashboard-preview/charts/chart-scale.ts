/**
 * Typography and axes scaled to the room a chart really has on screen. Grid columns are not enough: a 2-column card
 * leaves a plot of about 140×120 px, where full-size labels crowd out the data.
 */

export type ChartDensity = "compact" | "regular" | "roomy"

export interface ChartBox {
  width: number
  height: number
}

/** Below this the chart drops its value axis and keeps only the labels needed to read it. */
const COMPACT = { width: 260, height: 150 }
const ROOMY = { width: 520, height: 220 }

export function chartDensity({ width, height }: ChartBox): ChartDensity {
  if (!width || !height) return "regular"
  if (width < COMPACT.width || height < COMPACT.height) return "compact"
  if (width >= ROOMY.width && height >= ROOMY.height) return "roomy"
  return "regular"
}

export const AXIS_FONT_SIZE: Record<ChartDensity, number> = { compact: 9, regular: 11, roomy: 12 }

const trim = (value: number) => value.toFixed(1).replace(/\.0$/, "").replace(".", ",")

/** Axis numbers in short form: 1500 → "1,5k", 2400000 → "2,4M". */
export function compactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`
  if (abs >= 1_000) return `${trim(value / 1_000)}k`
  return String(Math.round(value))
}

/** Average glyph width relative to the font size, for the app's sans-serif (a little generous, so labels never wrap). */
const CHAR_WIDTH = 0.64
const MAX_LABEL_SHARE = 0.4
/** Tick line (6px) plus the gap between it and the label (5px), plus a little slack. */
const TICK_SPACE = 16

/**
 * Width of a category axis that fits its longest label (up to 40% of the chart), and a formatter that shortens
 * labels which still do not fit.
 */
export function categoryAxis(labels: string[], fontSize: number, chartWidth: number) {
  const charWidth = fontSize * CHAR_WIDTH
  const longest = Math.max(1, ...labels.map((label) => label.length))
  const width = Math.round(Math.min(longest * charWidth + TICK_SPACE, Math.max(chartWidth * MAX_LABEL_SHARE, 36)))
  const maxChars = Math.max(3, Math.floor((width - TICK_SPACE) / charWidth))
  const format = (label: string) => (label.length <= maxChars ? label : `${label.slice(0, maxChars - 1).trimEnd()}…`)
  return { width, format }
}
