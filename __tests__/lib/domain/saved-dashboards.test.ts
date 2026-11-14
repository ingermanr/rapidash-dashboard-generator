import {
  UNTITLED_DASHBOARD,
  createDashboardId,
  deleteSavedDashboard,
  displayTitle,
  isWorkspaceEmpty,
  migratePersistedState,
  renameSavedDashboard,
  sortByRecent,
  upsertSavedDashboard,
  type DashboardWorkspace,
  type SavedDashboard,
} from '@/lib/domain/saved-dashboards'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const empty: DashboardWorkspace = { title: '', description: '', variables: [], excludedCombinations: [], generationHistory: [] }
const workspace: DashboardWorkspace = { ...empty, title: 'Ventas 2026', variables: [sales] }
const deps = (now = 100, id = 'new-id') => ({ now: () => now, createId: () => id })

function saved(id: string, updatedAt: number, overrides: Partial<SavedDashboard> = {}): SavedDashboard {
  return { ...workspace, id, createdAt: 1, updatedAt, ...overrides }
}

describe('isWorkspaceEmpty', () => {
  it('is empty with no title, description, variables or history', () => {
    expect(isWorkspaceEmpty(empty)).toBe(true)
    expect(isWorkspaceEmpty({ ...empty, title: '   ' })).toBe(true)
  })

  it('is not empty as soon as any of them has content', () => {
    expect(isWorkspaceEmpty({ ...empty, title: 'A' })).toBe(false)
    expect(isWorkspaceEmpty({ ...empty, description: 'B' })).toBe(false)
    expect(isWorkspaceEmpty({ ...empty, variables: [sales] })).toBe(false)
  })
})

describe('upsertSavedDashboard', () => {
  it('does not create an entry for an empty workspace', () => {
    const list: SavedDashboard[] = []
    const result = upsertSavedDashboard(list, null, empty, deps())
    expect(result.saved).toBe(list)
    expect(result.activeId).toBeNull()
  })

  it('creates a new entry with a fresh id when there is no active dashboard', () => {
    const result = upsertSavedDashboard([saved('a', 5)], null, workspace, deps(100, 'b'))
    expect(result.activeId).toBe('b')
    expect(result.saved).toEqual([{ ...workspace, id: 'b', createdAt: 100, updatedAt: 100 }, saved('a', 5)])
  })

  it('updates the active entry in place, keeping its id and creation time', () => {
    const changed = { ...workspace, title: 'Nuevo nombre' }
    const result = upsertSavedDashboard([saved('a', 5), saved('b', 6)], 'b', changed, deps(200))
    expect(result.activeId).toBe('b')
    expect(result.saved).toEqual([saved('a', 5), { ...changed, id: 'b', createdAt: 1, updatedAt: 200 }])
  })

  it('leaves the list untouched when the workspace equals the stored entry', () => {
    const list = [saved('a', 5)]
    const reloaded = JSON.parse(JSON.stringify(workspace)) as DashboardWorkspace
    const result = upsertSavedDashboard(list, 'a', reloaded, deps(999))
    expect(result.saved).toBe(list)
  })

  it('recreates the active entry when it is missing from the list', () => {
    const result = upsertSavedDashboard([], 'gone', workspace, deps(300))
    expect(result.saved).toEqual([{ ...workspace, id: 'gone', createdAt: 300, updatedAt: 300 }])
  })
})

describe('rename, delete and order', () => {
  it('renames only the matching entry and trims the title', () => {
    const result = renameSavedDashboard([saved('a', 5), saved('b', 6)], 'b', '  Marketing  ', () => 50)
    expect(result.map((d) => [d.id, d.title, d.updatedAt])).toEqual([
      ['a', 'Ventas 2026', 5],
      ['b', 'Marketing', 50],
    ])
  })

  it('deletes only the matching entry', () => {
    expect(deleteSavedDashboard([saved('a', 5), saved('b', 6)], 'a').map((d) => d.id)).toEqual(['b'])
  })

  it('sorts by most recently updated without mutating the list', () => {
    const list = [saved('a', 5), saved('b', 9), saved('c', 7)]
    expect(sortByRecent(list).map((d) => d.id)).toEqual(['b', 'c', 'a'])
    expect(list.map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('shows a placeholder for dashboards without a title', () => {
    expect(displayTitle({ title: '  ' })).toBe(UNTITLED_DASHBOARD)
    expect(displayTitle({ title: 'Ventas' })).toBe('Ventas')
  })
})

describe('migratePersistedState', () => {
  const v0 = {
    dashboardTitle: 'Ventas 2026',
    dashboardDescription: 'KPIs',
    variables: [sales],
    excludedCombinations: [],
    generationHistory: [],
    selectedVariant: null,
  }

  it('turns the single dashboard saved by version 0 into the first saved dashboard', () => {
    const result = migratePersistedState(v0, 0, deps(400, 'legacy'))
    expect(result).toEqual({
      ...v0,
      activeDashboardId: 'legacy',
      savedDashboards: [
        { id: 'legacy', title: 'Ventas 2026', description: 'KPIs', variables: [sales], excludedCombinations: [], generationHistory: [], createdAt: 400, updatedAt: 400 },
      ],
    })
  })

  it('migrates an empty version 0 state to an empty list', () => {
    const result = migratePersistedState({ ...v0, dashboardTitle: '', dashboardDescription: '', variables: [] }, 0, deps())
    expect(result.savedDashboards).toEqual([])
    expect(result.activeDashboardId).toBeNull()
  })

  it('tolerates missing or malformed fields', () => {
    const result = migratePersistedState({ dashboardTitle: 'Solo título', variables: 'roto' }, 0, deps(1, 'x'))
    expect(result.variables).toEqual([])
    expect(result.savedDashboards.map((d) => [d.id, d.title, d.variables])).toEqual([['x', 'Solo título', []]])
    expect(migratePersistedState(null, 0, deps()).savedDashboards).toEqual([])
  })

  it('keeps a version 1 state as it is', () => {
    const v1 = { ...v0, savedDashboards: [saved('a', 5)], activeDashboardId: 'a' }
    expect(migratePersistedState(v1, 1, deps())).toEqual(v1)
  })
})

describe('createDashboardId', () => {
  it('works without crypto.randomUUID (plain HTTP outside localhost is not a secure context)', () => {
    const original = crypto.randomUUID
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      const a = createDashboardId()
      const b = createDashboardId()
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      expect(a).not.toBe(b)
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
    }
  })
})
