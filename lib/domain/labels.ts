import type { VariableCombination, VariablePriority, VariableType } from "@/types/dashboard"

/** Spanish names for every variable type, shared by the builder and the PDF. */
export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  numeric: "Numérico",
  categorical: "Categórico",
  temporal: "Temporal",
  "percentage-progress": "Porcentaje (Progreso)",
  "percentage-ratio": "Porcentaje (Ratio)",
  binary: "Binario",
  text: "Texto",
}

/** Spanish names for every chart type, shared by the preview cards and the PDF. */
export const CHART_TYPE_LABELS: Record<VariableCombination["chartType"], string> = {
  bar: "Barras",
  "horizontal-bar": "Barras horizontales",
  line: "Líneas",
  area: "Área",
  pie: "Circular",
  donut: "Dona",
  radial: "Radial",
  progress: "Progreso",
  metric: "Métrica",
}

export const PRIORITY_LABELS: Record<VariablePriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}
