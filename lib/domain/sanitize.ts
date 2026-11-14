import type {
  ColorPalette,
  ExcludedCombination,
  LayoutVariant,
  Variable,
  VariableCombination,
  VariablePriority,
  VariableType,
} from "@/types/dashboard"
import type { SavedDashboard } from "@/lib/domain/saved-dashboards"

/**
 * Storage is outside the app's control (other tabs, older versions, manual edits, extensions), so everything read
 * from it is rebuilt into valid shapes: invalid items are dropped, missing scalars get neutral defaults.
 */

type Unknown = Record<string, unknown>

const isObject = (value: unknown): value is Unknown => typeof value === "object" && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === "string"
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0
const text = (value: unknown): string => (isString(value) ? value : "")
const timestamp = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0)

/** Keeps the items `parse` accepts; anything that is not an array becomes an empty list. */
function listOf<T>(value: unknown, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return []
  const out: T[] = []
  for (const item of value) {
    const parsed = parse(item)
    if (parsed !== null) out.push(parsed)
  }
  return out
}

const VARIABLE_TYPES = new Set<VariableType>([
  "numeric",
  "categorical",
  "temporal",
  "percentage-progress",
  "percentage-ratio",
  "text",
  "binary",
])
const PRIORITIES = new Set<VariablePriority>(["alta", "media", "baja"])
const CHART_TYPES = new Set<VariableCombination["chartType"]>([
  "bar",
  "horizontal-bar",
  "line",
  "pie",
  "area",
  "donut",
  "radial",
  "progress",
  "metric",
])

export function sanitizeVariable(value: unknown): Variable | null {
  if (!isObject(value)) return null
  const { id, name, type, priority } = value
  if (!isNonEmptyString(id) || !isString(name)) return null
  if (!VARIABLE_TYPES.has(type as VariableType) || !PRIORITIES.has(priority as VariablePriority)) return null
  return { id, name, type: type as VariableType, priority: priority as VariablePriority }
}

export function sanitizeExcludedCombination(value: unknown): ExcludedCombination | null {
  if (!isObject(value) || !isNonEmptyString(value.id)) return null
  if (!Array.isArray(value.variableIds) || !value.variableIds.every(isString)) return null
  return { id: value.id, description: text(value.description), variableIds: [...value.variableIds] }
}

function sanitizeCombination(value: unknown): VariableCombination | null {
  if (!isObject(value) || !isNonEmptyString(value.id) || !isString(value.name)) return null
  if (!CHART_TYPES.has(value.chartType as VariableCombination["chartType"])) return null
  const numericVariable = sanitizeVariable(value.numericVariable)
  if (!numericVariable) return null
  const combination: VariableCombination = {
    id: value.id,
    name: value.name,
    numericVariable,
    chartType: value.chartType as VariableCombination["chartType"],
  }
  if (value.categoricalVariable !== undefined) {
    const categoricalVariable = sanitizeVariable(value.categoricalVariable)
    if (!categoricalVariable) return null
    combination.categoricalVariable = categoricalVariable
  }
  return combination
}

const isColorList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)

function sanitizePalette(value: unknown): ColorPalette | null {
  if (!isObject(value) || !isString(value.name) || !isColorList(value.colors)) return null
  const palette: ColorPalette = { name: value.name, colors: [...value.colors], description: text(value.description) }
  if (isColorList(value.darkColors)) palette.darkColors = [...value.darkColors]
  return palette
}

/** A variant is kept only whole: a missing combination would silently change its layout. */
export function sanitizeVariant(value: unknown): LayoutVariant | null {
  if (!isObject(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.layout)) return null
  const palette = sanitizePalette(value.palette)
  if (!palette || !Array.isArray(value.combinations)) return null
  const combinations = listOf(value.combinations, sanitizeCombination)
  if (combinations.length !== value.combinations.length) return null
  return {
    id: value.id,
    layout: value.layout,
    palette,
    variables: listOf(value.variables, sanitizeVariable),
    combinations,
    layoutDescription: text(value.layoutDescription),
  }
}

export function sanitizeSavedDashboard(value: unknown): SavedDashboard | null {
  if (!isObject(value) || !isNonEmptyString(value.id)) return null
  return {
    id: value.id,
    title: text(value.title),
    description: text(value.description),
    variables: listOf(value.variables, sanitizeVariable),
    excludedCombinations: listOf(value.excludedCombinations, sanitizeExcludedCombination),
    generationHistory: listOf(value.generationHistory, sanitizeVariant),
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt),
  }
}

/** Valid saved dashboards; the first entry wins when two share an id. */
export function sanitizeSavedDashboards(value: unknown): SavedDashboard[] {
  const seen = new Set<string>()
  return listOf(value, sanitizeSavedDashboard).filter((d) => !seen.has(d.id) && (seen.add(d.id), true))
}

export interface SanitizedPersistedState {
  dashboardTitle: string
  dashboardDescription: string
  variables: Variable[]
  excludedCombinations: ExcludedCombination[]
  generationHistory: LayoutVariant[]
  selectedVariant: LayoutVariant | null
  savedDashboards: SavedDashboard[]
  activeDashboardId: string | null
}

export function sanitizePersistedState(value: unknown): SanitizedPersistedState {
  const state = isObject(value) ? value : {}
  return {
    dashboardTitle: text(state.dashboardTitle),
    dashboardDescription: text(state.dashboardDescription),
    variables: listOf(state.variables, sanitizeVariable),
    excludedCombinations: listOf(state.excludedCombinations, sanitizeExcludedCombination),
    generationHistory: listOf(state.generationHistory, sanitizeVariant),
    selectedVariant: sanitizeVariant(state.selectedVariant),
    savedDashboards: sanitizeSavedDashboards(state.savedDashboards),
    activeDashboardId: isNonEmptyString(state.activeDashboardId) ? state.activeDashboardId : null,
  }
}
