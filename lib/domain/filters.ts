import type { VariableCombination } from "@/types/dashboard"
import { randomFor } from "./sample-data"
import type { RandomSource } from "./random"

/** Active preview filters: variable id → selected value. "All" is represented by the key being absent. */
export type ActiveFilters = Readonly<Record<string, string>>

export const NO_FILTERS: ActiveFilters = {}

/** Value used by filter selects to mean "no filter". */
export const ALL_VALUES = "default"

/** Sample time points for each period a temporal filter offers. */
export const PERIOD_TIME_POINTS: Readonly<Record<string, readonly string[]>> = {
  "last-7-days": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  "last-30-days": ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
  "last-3-months": ["Abr", "May", "Jun"],
  "last-6-months": ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  "last-year": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
}

/** Returns a copy of the filters with `variableId` set, or removed when the value means "all". */
export function setFilter(filters: ActiveFilters, variableId: string, value: string): ActiveFilters {
  const next = { ...filters }
  if (value === ALL_VALUES) delete next[variableId]
  else next[variableId] = value
  return next
}

/** Seed key that changes when filters change, and equals `key` when no filter is active. */
export function filterSeedKey(key: string, filters: ActiveFilters): string {
  const entries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return key
  return `${key}|${entries.map(([id, value]) => `${id}=${value}`).join("&")}`
}

/**
 * Random source for a chart's sample data. Filtering simulates a subset of the dataset,
 * so every number changes consistently with the active filters.
 */
export function chartRandom(key: string, filters: ActiveFilters): RandomSource {
  return randomFor(filterSeedKey(key, filters))
}

/** Keeps only the selected category when the chart breaks down by a filtered variable. */
export function filterChartData<T extends { name: string }>(
  data: T[],
  combination: VariableCombination,
  filters: ActiveFilters,
): T[] {
  const dimension = combination.categoricalVariable
  if (!dimension || dimension.type === "temporal") return data
  const selected = filters[dimension.id]
  if (!selected) return data
  const filtered = data.filter((row) => row.name === selected)
  return filtered.length > 0 ? filtered : data
}

/** Time points for a chart over a filtered temporal variable, or undefined to use the defaults. */
export function timePointsFor(combination: VariableCombination, filters: ActiveFilters): string[] | undefined {
  const dimension = combination.categoricalVariable
  if (!dimension || dimension.type !== "temporal") return undefined
  const points = PERIOD_TIME_POINTS[filters[dimension.id] ?? ""]
  return points ? [...points] : undefined
}
