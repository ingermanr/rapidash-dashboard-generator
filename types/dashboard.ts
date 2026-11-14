export type VariableType =
  | "numeric"
  | "categorical"
  | "temporal"
  | "percentage-progress"
  | "percentage-ratio"
  | "text"
  | "binary"

export type VariablePriority = "alta" | "media" | "baja"

export interface Variable {
  id: string
  name: string
  type: VariableType
  priority: VariablePriority
}

export interface ExcludedCombination {
  id: string
  description: string
  variableIds: string[]
}

export interface VariableCombination {
  id: string
  numericVariable: Variable
  categoricalVariable?: Variable
  name: string
  chartType: "bar" | "horizontal-bar" | "line" | "pie" | "area" | "donut" | "radial" | "progress" | "metric"
}

export interface ColorPalette {
  name: string
  /** Colours for light surfaces, in validated slot order. */
  colors: string[]
  /** Same hues stepped for dark surfaces. Optional so variants saved before it was added still load. */
  darkColors?: string[]
  description: string
}

export interface LayoutVariant {
  id: string
  layout: string
  palette: ColorPalette
  variables: Variable[]
  combinations: VariableCombination[]
  layoutDescription: string
}
