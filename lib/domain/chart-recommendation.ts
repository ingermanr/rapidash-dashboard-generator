import type { VariableCombination, VariableType } from "@/types/dashboard"

type Chart = VariableCombination["chartType"]

/** Size of a dashboard cell: columns of the 12-column grid and rows (one row ≈ 280px on screen). */
export interface CellSize {
  width: number
  height: number
}

/** A medium card, assumed before the layout decides where a chart goes. */
const MEDIUM_CELL: CellSize = { width: 4, height: 1 }

/** Narrowest cell where vertical columns keep their category labels readable. */
const MIN_COLUMNS_WIDTH = 6
/** Narrowest cell where a donut and its legend stay readable. */
const MIN_DONUT_WIDTH = 4
/** A cell this wide is a hero card: a filled area reads better than a thin line. */
const MIN_AREA_WIDTH = 8

const isRatio = (type: VariableType) => type === "percentage-ratio"
const isProgress = (type: VariableType) => type === "percentage-progress"

/**
 * The chart that shows a combination usefully and legibly in a cell of the given size. The data's job picks the
 * family (trend, comparison, share, single value) and the cell size picks the most legible member of it.
 *
 * | Data | Chart |
 * | --- | --- |
 * | measure over time | line; area in a hero cell (≥ 8 columns) |
 * | measure by category | columns (bar) when wide (≥ 6 columns, one row); horizontal bars otherwise |
 * | share (ratio) by category | donut with room (≥ 4 columns); horizontal bars otherwise |
 * | progress by category or by yes/no | horizontal bars, one per group |
 * | measure by yes/no | two columns (bar) |
 * | share (ratio) by yes/no, a lone ratio or progress, a lone yes/no | meter (progress) |
 * | a lone measure | big number (metric) |
 * | distribution of a lone category | horizontal bars |
 *
 * Pie and radial charts are never recommended: bars on a shared baseline compare values more exactly. They still
 * render for layouts saved by earlier versions.
 */
export function recommendChart(combination: VariableCombination, cell: CellSize = MEDIUM_CELL): Chart {
  const measure = combination.numericVariable.type
  const partner = combination.categoricalVariable?.type

  if (!partner) {
    if (measure === "categorical") return "horizontal-bar"
    if (measure === "binary" || isRatio(measure) || isProgress(measure)) return "progress"
    return "metric"
  }
  if (partner === "temporal") return cell.width >= MIN_AREA_WIDTH ? "area" : "line"
  if (isProgress(measure)) return "horizontal-bar"
  if (partner === "binary") return isRatio(measure) ? "progress" : "bar"
  if (isRatio(measure)) return cell.width >= MIN_DONUT_WIDTH ? "donut" : "horizontal-bar"
  return cell.width >= MIN_COLUMNS_WIDTH && cell.height === 1 ? "bar" : "horizontal-bar"
}
