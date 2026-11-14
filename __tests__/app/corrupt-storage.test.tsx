import { act, render, screen, within } from '@testing-library/react'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const variant = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(1), now: () => 1 })

const good = {
  id: 'good',
  title: 'Sano',
  description: '',
  variables: [sales, region],
  excludedCombinations: [],
  generationHistory: [variant],
  createdAt: 1,
  updatedAt: 5,
}

async function loadFromStorage(state: unknown) {
  act(() => useDashboardStore.getState().reset())
  // reset() persists the empty state, so the corrupted value is written after it.
  localStorage.setItem('dashboard-storage', JSON.stringify({ version: 1, state }))
  await act(async () => {
    await useDashboardStore.persist.rehydrate()
  })
}

beforeEach(() => localStorage.clear())

describe('corrupted storage', () => {
  it('still renders the landing, dropping unusable dashboards and repairing the rest', async () => {
    await loadFromStorage({
      showLanding: true,
      savedDashboards: [
        good,
        { id: 'broken', title: 42, variables: 'roto', generationHistory: [{ id: 'v', palette: null }], updatedAt: 'ayer' },
        { title: 'Sin id' },
        null,
        'texto',
      ],
      activeDashboardId: 'good',
    })
    act(() => useDashboardStore.setState({ showLanding: true }))

    render(<DashboardGenerator />)

    const list = screen.getByRole('list', { name: 'Tus dashboards' })
    const titles = within(list).getAllByRole('heading').map((h) => h.textContent)
    expect(titles).toEqual(['Sano', 'Dashboard sin título'])

    const repaired = useDashboardStore.getState().savedDashboards.find((d) => d.id === 'broken')!
    expect(repaired).toEqual({
      id: 'broken',
      title: '',
      description: '',
      variables: [],
      excludedCombinations: [],
      generationHistory: [],
      createdAt: 0,
      updatedAt: 0,
    })
  })

  it('repairs a corrupted open workspace so the builder renders', async () => {
    await loadFromStorage({
      dashboardTitle: { no: 'texto' },
      dashboardDescription: null,
      variables: [sales, { id: 'x', name: 'Sin tipo' }, 7],
      excludedCombinations: [{ id: 'e' }],
      generationHistory: [variant, { id: 'roto', combinations: 'no' }],
      selectedVariant: { id: 'roto' },
      savedDashboards: 'no es una lista',
      activeDashboardId: 99,
    })

    const state = useDashboardStore.getState()
    expect(state).toMatchObject({
      dashboardTitle: '',
      dashboardDescription: '',
      variables: [sales],
      excludedCombinations: [],
      generationHistory: [variant],
      selectedVariant: null,
    })
    expect(state.activeDashboardId).not.toBe(99)

    act(() => useDashboardStore.setState({ showLanding: false }))
    render(<DashboardGenerator />)
    expect(screen.getByRole('button', { name: /Generar Nuevo Layout|Generar Layout/ })).toBeInTheDocument()
  })

  it('ignores corrupted entries written by another tab', () => {
    act(() => {
      useDashboardStore.getState().reset()
      useDashboardStore.getState().setDashboardTitle('Local')
    })
    const newValue = JSON.stringify({
      version: 1,
      state: { savedDashboards: [good, { id: 'mal', variables: 'roto', updatedAt: 'x' }, 5] },
    })

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard-storage', newValue, storageArea: localStorage }))
    })

    const saved = useDashboardStore.getState().savedDashboards
    expect(saved.map((d) => d.id).sort()).toEqual(['good', 'mal', useDashboardStore.getState().activeDashboardId].sort())
    expect(saved.find((d) => d.id === 'mal')!.variables).toEqual([])
    act(() => useDashboardStore.setState({ showLanding: true }))
    render(<DashboardGenerator />)
    expect(within(screen.getByRole('list', { name: 'Tus dashboards' })).getAllByRole('listitem')).toHaveLength(3)
  })
})
