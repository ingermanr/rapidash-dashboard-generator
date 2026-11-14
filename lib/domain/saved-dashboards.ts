import type { ExcludedCombination, LayoutVariant, Variable } from "@/types/dashboard"
import { sanitizePersistedState } from "@/lib/domain/sanitize"

/** The editable state of one dashboard, as the builder works on it. */
export interface DashboardWorkspace {
  title: string
  description: string
  variables: Variable[]
  excludedCombinations: ExcludedCombination[]
  generationHistory: LayoutVariant[]
}

export interface SavedDashboard extends DashboardWorkspace {
  id: string
  createdAt: number
  updatedAt: number
}

export interface SavedDashboardDeps {
  now: () => number
  createId: () => string
}

export const UNTITLED_DASHBOARD = "Dashboard sin título"

/**
 * RFC 4122 v4 id. `crypto.randomUUID` only exists in secure contexts (HTTPS, localhost); `getRandomValues` works
 * everywhere, so plain-HTTP deployments keep working.
 */
export function createDashboardId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const defaultSavedDashboardDeps: SavedDashboardDeps = {
  now: () => Date.now(),
  createId: createDashboardId,
}

export function isWorkspaceEmpty(workspace: DashboardWorkspace): boolean {
  return (
    workspace.title.trim() === "" &&
    workspace.description.trim() === "" &&
    workspace.variables.length === 0 &&
    workspace.generationHistory.length === 0
  )
}

function workspaceOf(d: DashboardWorkspace): DashboardWorkspace {
  return {
    title: d.title,
    description: d.description,
    variables: d.variables,
    excludedCombinations: d.excludedCombinations,
    generationHistory: d.generationHistory,
  }
}

/** Content equality, so reloading the same data from storage does not count as an edit. */
function sameWorkspace(a: DashboardWorkspace, b: DashboardWorkspace): boolean {
  return canonicalJson(workspaceOf(a)) === canonicalJson(workspaceOf(b))
}

export function displayTitle(dashboard: Pick<DashboardWorkspace, "title">): string {
  return dashboard.title.trim() || UNTITLED_DASHBOARD
}

/**
 * Stores the workspace under the active dashboard. An empty workspace with no active dashboard is not saved,
 * so opening the builder and leaving does not leave blank entries behind.
 */
export function upsertSavedDashboard(
  saved: SavedDashboard[],
  activeId: string | null,
  workspace: DashboardWorkspace,
  deps: SavedDashboardDeps = defaultSavedDashboardDeps,
): { saved: SavedDashboard[]; activeId: string | null } {
  if (activeId === null) {
    if (isWorkspaceEmpty(workspace)) return { saved, activeId }
    const now = deps.now()
    const id = deps.createId()
    return { saved: [{ ...workspace, id, createdAt: now, updatedAt: now }, ...saved], activeId: id }
  }

  const existing = saved.find((d) => d.id === activeId)
  if (existing && sameWorkspace(existing, workspace)) return { saved, activeId }
  const now = deps.now()
  if (!existing) {
    return { saved: [{ ...workspace, id: activeId, createdAt: now, updatedAt: now }, ...saved], activeId }
  }
  return {
    saved: saved.map((d) => (d.id === activeId ? { ...workspace, id: d.id, createdAt: d.createdAt, updatedAt: now } : d)),
    activeId,
  }
}

export function renameSavedDashboard(
  saved: SavedDashboard[],
  id: string,
  title: string,
  now: () => number = defaultSavedDashboardDeps.now,
): SavedDashboard[] {
  return saved.map((d) => (d.id === id ? { ...d, title: title.trim(), updatedAt: now() } : d))
}

export function deleteSavedDashboard(saved: SavedDashboard[], id: string): SavedDashboard[] {
  return saved.filter((d) => d.id !== id)
}

export function sortByRecent(saved: SavedDashboard[]): SavedDashboard[] {
  return [...saved].sort((a, b) => b.updatedAt - a.updatedAt)
}

export interface PersistedDashboardStateV1 {
  dashboardTitle: string
  dashboardDescription: string
  variables: Variable[]
  excludedCombinations: ExcludedCombination[]
  generationHistory: LayoutVariant[]
  selectedVariant: LayoutVariant | null
  savedDashboards: SavedDashboard[]
  activeDashboardId: string | null
}

export const PERSISTED_STATE_VERSION = 1

/**
 * Upgrades and repairs what an older version of the app left in storage. Version 0 kept a single dashboard; it
 * becomes the first saved dashboard so the user loses nothing. Invalid items are dropped (see `sanitize`).
 */
export function migratePersistedState(
  persisted: unknown,
  version: number,
  deps: SavedDashboardDeps = defaultSavedDashboardDeps,
): PersistedDashboardStateV1 {
  if (version >= PERSISTED_STATE_VERSION) return repairPersistedState(persisted)
  const state = sanitizePersistedState(persisted)

  const base = {
    dashboardTitle: state.dashboardTitle,
    dashboardDescription: state.dashboardDescription,
    variables: state.variables,
    excludedCombinations: state.excludedCombinations,
    generationHistory: state.generationHistory,
    selectedVariant: state.selectedVariant,
  }
  const { saved, activeId } = upsertSavedDashboard(
    [],
    null,
    {
      title: base.dashboardTitle,
      description: base.dashboardDescription,
      variables: base.variables,
      excludedCombinations: base.excludedCombinations,
      generationHistory: base.generationHistory,
    },
    deps,
  )
  return { ...base, savedDashboards: saved, activeDashboardId: activeId }
}

/**
 * Valid, self-consistent state from whatever storage holds. When the open workspace disagrees with its saved
 * entry (only possible after corruption or manual edits), the saved entry wins: it is what the user sees and picks,
 * and keeping the workspace would make autosave overwrite it.
 */
export function repairPersistedState(value: unknown): PersistedDashboardStateV1 {
  const state = sanitizePersistedState(value)
  const active = state.savedDashboards.find((d) => d.id === state.activeDashboardId)
  if (!active) return state
  const workspace: DashboardWorkspace = {
    title: state.dashboardTitle,
    description: state.dashboardDescription,
    variables: state.variables,
    excludedCombinations: state.excludedCombinations,
    generationHistory: state.generationHistory,
  }
  if (sameWorkspace(active, workspace)) return state
  return {
    ...state,
    dashboardTitle: active.title,
    dashboardDescription: active.description,
    variables: active.variables,
    excludedCombinations: active.excludedCombinations,
    generationHistory: active.generationHistory,
    selectedVariant: active.generationHistory.some((v) => v.id === state.selectedVariant?.id) ? state.selectedVariant : null,
  }
}

/** JSON with object keys sorted, so equal content compares equal whatever order its keys were built in. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )
}

/** Same dashboards with the same content, in any order. */
export function sameDashboardList(a: SavedDashboard[], b: SavedDashboard[]): boolean {
  if (a.length !== b.length) return false
  const key = (list: SavedDashboard[]) => canonicalJson([...list].sort((x, y) => x.id.localeCompare(y.id)))
  return key(a) === key(b)
}

/**
 * List to adopt when another tab wrote `incoming`. That tab's version of each dashboard wins (last writer wins);
 * the dashboard open here is added back only when the other tab does not have it, so tabs converge instead of
 * re-saving each other's writes forever.
 */
export function mergeFromOtherTab(
  incoming: SavedDashboard[],
  activeId: string | null,
  workspace: DashboardWorkspace,
  deps: SavedDashboardDeps = defaultSavedDashboardDeps,
): SavedDashboard[] {
  if (activeId === null || incoming.some((d) => d.id === activeId)) return incoming
  return upsertSavedDashboard(incoming, activeId, workspace, deps).saved
}
