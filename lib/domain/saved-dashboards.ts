import type { ExcludedCombination, LayoutVariant, Variable } from "@/types/dashboard"

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

export const defaultSavedDashboardDeps: SavedDashboardDeps = {
  now: () => Date.now(),
  createId: () => crypto.randomUUID(),
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
  return JSON.stringify(workspaceOf(a)) === JSON.stringify(workspaceOf(b))
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

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const asString = (value: unknown): string => (typeof value === "string" ? value : "")

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
 * Upgrades what an older version of the app left in storage. Version 0 kept a single dashboard; it becomes the
 * first saved dashboard so the user loses nothing.
 */
export function migratePersistedState(
  persisted: unknown,
  version: number,
  deps: SavedDashboardDeps = defaultSavedDashboardDeps,
): PersistedDashboardStateV1 {
  const state = (persisted && typeof persisted === "object" ? persisted : {}) as Record<string, unknown>
  if (version >= PERSISTED_STATE_VERSION) return state as unknown as PersistedDashboardStateV1

  const base = {
    dashboardTitle: asString(state.dashboardTitle),
    dashboardDescription: asString(state.dashboardDescription),
    variables: asArray<Variable>(state.variables),
    excludedCombinations: asArray<ExcludedCombination>(state.excludedCombinations),
    generationHistory: asArray<LayoutVariant>(state.generationHistory),
    selectedVariant: (state.selectedVariant as LayoutVariant | null | undefined) ?? null,
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
