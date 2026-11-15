import { slug } from "@/lib/domain/dashboard-transfer"
import { CHART_TYPE_LABELS, PRIORITY_LABELS, VARIABLE_TYPE_LABELS } from "@/lib/domain/labels"
import { GRID_CONFIG, getRealLayoutDivisions } from "@/lib/layout-engine"
import type { LayoutVariant } from "@/types/dashboard"

/** Content of the specification PDF, independent of how it is drawn. */

export interface ComponentRow {
  number: number
  name: string
  chart: string
  variables: string
  /** Grid footprint as "columns × rows". */
  size: string
}

export interface VariableRow {
  name: string
  type: string
  priority: string
  /** Number of components that use the variable. */
  usedIn: number
}

export interface Area {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramBox extends Area {
  number: number
}

export function componentRows(variant: LayoutVariant): ComponentRow[] {
  const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
  return variant.combinations.map((combination, index) => {
    const division = divisions[index]
    return {
      number: index + 1,
      name: combination.name,
      chart: CHART_TYPE_LABELS[combination.chartType] ?? combination.chartType,
      variables: [combination.numericVariable.name, combination.categoricalVariable?.name].filter(Boolean).join(" × "),
      size: division ? `${division.width} × ${division.height || GRID_CONFIG.DEFAULT_HEIGHT}` : "—",
    }
  })
}

export function variableRows(variant: LayoutVariant): VariableRow[] {
  return variant.variables.map((variable) => ({
    name: variable.name,
    type: VARIABLE_TYPE_LABELS[variable.type] ?? variable.type,
    priority: PRIORITY_LABELS[variable.priority] ?? variable.priority,
    usedIn: variant.combinations.filter(
      (c) => c.numericVariable.id === variable.id || c.categoricalVariable?.id === variable.id,
    ).length,
  }))
}

/** Gap between diagram boxes, in the same unit as the area (mm). */
const DIAGRAM_GAP = 2
/** Tallest a grid row may be drawn, so short layouts do not become towers. */
const MAX_ROW_HEIGHT = 22

/** Boxes of the layout diagram: the layout engine's 12-column placement scaled into `area`. */
export function diagramBoxes(layout: string, count: number, area: Area): DiagramBox[] {
  const divisions = getRealLayoutDivisions(layout, count).slice(0, count)
  if (divisions.length === 0) return []
  const rows = Math.max(...divisions.map((d) => d.y + (d.height || GRID_CONFIG.DEFAULT_HEIGHT)))
  const columnWidth = (area.width + DIAGRAM_GAP) / GRID_CONFIG.COLUMNS
  const rowHeight = Math.min((area.height + DIAGRAM_GAP) / rows, MAX_ROW_HEIGHT)
  return divisions.map((d, index) => ({
    number: index + 1,
    x: area.x + d.x * columnWidth,
    y: area.y + d.y * rowHeight,
    width: d.width * columnWidth - DIAGRAM_GAP,
    height: (d.height || GRID_CONFIG.DEFAULT_HEIGHT) * rowHeight - DIAGRAM_GAP,
  }))
}

function relativeLuminance(hex: string): number {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return 0
  const [r, g, b] = match.slice(1).map((part) => {
    const c = parseInt(part, 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** White or near-black, whichever contrasts more with `background`. */
export function readableTextColor(background: string): "#ffffff" | "#0f172a" {
  const l = relativeLuminance(background)
  const dark = relativeLuminance("#0f172a")
  return (1.05) / (l + 0.05) >= (l + 0.05) / (dark + 0.05) ? "#ffffff" : "#0f172a"
}

export function pdfFileName(title: string): string {
  return title.trim() ? `dashboard-${slug(title)}.pdf` : "dashboard-specification.pdf"
}
