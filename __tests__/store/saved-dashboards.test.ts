import { act } from '@testing-library/react'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const v1 = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(1), now: () => 1 })
const v2 = generateSingleLayoutVariant([sales, region], [v1], [], { random: createSeededRandom(2), now: () => 2 })

const store = () => useDashboardStore.getState()

beforeEach(() => {
  localStorage.clear()
  act(() => store().reset())
})

describe('saved dashboards', () => {
  it('autosaves the workspace into a new saved dashboard as soon as it has content', () => {
    expect(store().savedDashboards).toEqual([])

    act(() => store().setDashboardTitle('Ventas 2026'))
    act(() => store().addVariable(sales))

    const { savedDashboards, activeDashboardId } = store()
    expect(savedDashboards).toHaveLength(1)
    expect(savedDashboards[0]).toMatchObject({ id: activeDashboardId, title: 'Ventas 2026', variables: [sales] })
  })

  it('starts a new dashboard without losing the previous one', () => {
    act(() => store().setDashboardTitle('Primero'))
    act(() => store().addVariable(sales))
    const firstId = store().activeDashboardId

    act(() => store().startNewDashboard())

    expect(store()).toMatchObject({
      dashboardTitle: '',
      dashboardDescription: '',
      variables: [],
      generationHistory: [],
      currentVariant: null,
      selectedVariant: null,
      activeDashboardId: null,
      showLanding: false,
    })
    expect(store().savedDashboards.map((d) => [d.id, d.title])).toEqual([[firstId, 'Primero']])
  })

  it('opens a saved dashboard into the builder with its last generated layout', () => {
    act(() => {
      store().setDashboardTitle('Primero')
      store().setDashboardDescription('KPIs')
      store().setVariables([sales, region])
      store().addToHistory(v1)
      store().addToHistory(v2)
    })
    const firstId = store().activeDashboardId!
    act(() => store().startNewDashboard())
    act(() => store().setDashboardTitle('Segundo'))

    act(() => store().openDashboard(firstId))

    expect(store()).toMatchObject({
      activeDashboardId: firstId,
      dashboardTitle: 'Primero',
      dashboardDescription: 'KPIs',
      variables: [sales, region],
      generationHistory: [v1, v2],
      currentVariant: v2,
      selectedVariant: null,
      showLanding: false,
    })
    expect(store().savedDashboards.map((d) => d.title).sort()).toEqual(['Primero', 'Segundo'])
  })

  it('renames a dashboard, including the open one', () => {
    act(() => store().setDashboardTitle('Viejo'))
    const id = store().activeDashboardId!

    act(() => store().renameDashboard(id, 'Nuevo'))

    expect(store().dashboardTitle).toBe('Nuevo')
    expect(store().savedDashboards[0].title).toBe('Nuevo')
  })

  it('deletes a dashboard and clears the workspace when it was the open one', () => {
    act(() => store().setDashboardTitle('Borrar'))
    const id = store().activeDashboardId!

    act(() => store().deleteDashboard(id))

    expect(store().savedDashboards).toEqual([])
    expect(store().activeDashboardId).toBeNull()
    expect(store().dashboardTitle).toBe('')
  })

  it('keeps the open workspace when another dashboard is deleted', () => {
    act(() => store().setDashboardTitle('Otro'))
    const otherId = store().activeDashboardId!
    act(() => store().startNewDashboard())
    act(() => store().setDashboardTitle('Abierto'))

    act(() => store().deleteDashboard(otherId))

    expect(store().dashboardTitle).toBe('Abierto')
    expect(store().savedDashboards.map((d) => d.title)).toEqual(['Abierto'])
  })

  it('persists the saved dashboards with the schema version', () => {
    act(() => store().setDashboardTitle('Persistido'))

    const stored = JSON.parse(localStorage.getItem('dashboard-storage')!)
    expect(stored.version).toBe(1)
    expect(stored.state.savedDashboards.map((d: { title: string }) => d.title)).toEqual(['Persistido'])
    expect(stored.state.activeDashboardId).toBe(store().activeDashboardId)
  })

  it('keeps dashboards saved by another tab and re-saves the one open here', () => {
    act(() => store().setDashboardTitle('Esta pestaña'))
    const ownId = store().activeDashboardId!
    const otherTab = {
      id: 'other',
      title: 'Otra pestaña',
      description: '',
      variables: [region],
      excludedCombinations: [],
      generationHistory: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const newValue = JSON.stringify({
      version: 1,
      state: { dashboardTitle: 'Otra pestaña', savedDashboards: [otherTab], activeDashboardId: 'other' },
    })

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue, storageArea: localStorage }))
    })

    expect(store().dashboardTitle).toBe('Esta pestaña')
    expect(store().activeDashboardId).toBe(ownId)
    expect(store().savedDashboards.map((d) => d.title).sort()).toEqual(['Esta pestaña', 'Otra pestaña'])
    const stored = JSON.parse(localStorage.getItem('dashboard-storage')!)
    expect(stored.state.savedDashboards.map((d: { title: string }) => d.title).sort()).toEqual(['Esta pestaña', 'Otra pestaña'])
  })

  it('does not write back when another tab echoes the same saved list (no ping-pong)', () => {
    act(() => store().setDashboardTitle('Aquí'))
    const current = store().savedDashboards
    const echo = JSON.stringify({
      version: 1,
      state: { dashboardTitle: 'Otra cosa en la otra pestaña', savedDashboards: [...current].reverse(), activeDashboardId: 'x' },
    })
    const setItem = jest.spyOn(Storage.prototype, 'setItem')

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue: echo, storageArea: localStorage }))
    })

    expect(setItem).not.toHaveBeenCalled()
    expect(store().savedDashboards).toBe(current)
    setItem.mockRestore()
  })

  it('adopts the other tab version of the dashboard open here without re-saving it (lists converge)', () => {
    act(() => store().setDashboardTitle('Versión local'))
    const id = store().activeDashboardId!
    const theirs = { ...store().savedDashboards[0], title: 'Versión de la otra pestaña', updatedAt: 777 }
    const newValue = JSON.stringify({ version: 1, state: { savedDashboards: [theirs], activeDashboardId: id } })

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue, storageArea: localStorage }))
    })

    expect(store().savedDashboards).toEqual([theirs])
    expect(store().dashboardTitle).toBe('Versión local')

    // The write this tab just made echoes back unchanged: nothing more happens.
    const setItem = jest.spyOn(Storage.prototype, 'setItem')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue, storageArea: localStorage }))
    })
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('ignores storage events for other keys or with unreadable data', () => {
    act(() => store().setDashboardTitle('Intacto'))
    const before = store().savedDashboards

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark', storageArea: localStorage }))
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue: '{roto', storageArea: localStorage }))
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue: null, storageArea: localStorage }))
    })

    expect(store().savedDashboards).toBe(before)
  })

  it('migrates the single dashboard stored by the previous version on load', async () => {
    localStorage.setItem(
      'dashboard-storage',
      JSON.stringify({
        version: 0,
        state: {
          dashboardTitle: 'Legado',
          dashboardDescription: '',
          variables: [sales],
          excludedCombinations: [],
          generationHistory: [v1],
          selectedVariant: null,
        },
      }),
    )

    await act(async () => {
      await useDashboardStore.persist.rehydrate()
    })

    expect(store().dashboardTitle).toBe('Legado')
    expect(store().savedDashboards).toHaveLength(1)
    expect(store().savedDashboards[0]).toMatchObject({ id: store().activeDashboardId, title: 'Legado', variables: [sales], generationHistory: [v1] })
  })
})
