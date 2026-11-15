import { act, render, screen } from '@testing-library/react'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import type { Variable, VariableCombination } from '@/types/dashboard'

const sales: Variable = { id: 'var-sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'var-region', name: 'Region', type: 'categorical', priority: 'media' }

const combinesSalesAndRegion = (combination: VariableCombination) =>
  combination.numericVariable.id === sales.id && combination.categoricalVariable?.id === region.id

async function clickGenerate(label: RegExp) {
  act(() => {
    screen.getByRole('button', { name: label }).click()
  })
  await act(async () => {
    jest.advanceTimersByTime(1000)
  })
}

describe('DashboardGenerator variant generation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    act(() => {
      useDashboardStore.getState().reset()
      useDashboardStore.setState({ showLanding: false, variables: [sales, region] })
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('respects exclusions added after the variables were loaded', async () => {
    // A temporal variable keeps a chart available (Ventas over time) once Ventas × Region is excluded.
    act(() => {
      useDashboardStore.getState().addVariable({ id: 'var-month', name: 'Mes', type: 'temporal', priority: 'baja' })
    })
    render(<DashboardGenerator />)

    await clickGenerate(/^Generar Layout$/)
    const first = useDashboardStore.getState().currentVariant
    expect(first?.combinations.some(combinesSalesAndRegion)).toBe(true)

    act(() => {
      useDashboardStore.getState().addExcludedCombination({
        id: 'exclusion-1',
        description: 'Ventas no se cruza con Region',
        variableIds: [sales.id, region.id],
      })
    })

    await clickGenerate(/^Generar Nuevo Layout$/)
    const second = useDashboardStore.getState().currentVariant
    expect(second).not.toBe(first)
    expect(second?.combinations.some(combinesSalesAndRegion)).toBe(false)
  })

  it('builds the layout from the variables present when it is produced, not when the button was clicked', async () => {
    const date: Variable = { id: 'var-date', name: 'Fecha', type: 'temporal', priority: 'baja' }
    render(<DashboardGenerator />)

    act(() => {
      screen.getByRole('button', { name: /^Generar Layout$/ }).click()
    })
    act(() => {
      useDashboardStore.getState().addVariable(date)
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    const variant = useDashboardStore.getState().currentVariant
    expect(variant?.variables.map((v) => v.id)).toEqual([sales.id, region.id, date.id])
  })

  it('drops a pending layout when the user leaves the builder before it is ready', async () => {
    render(<DashboardGenerator />)

    act(() => {
      screen.getByRole('button', { name: /^Generar Layout$/ }).click()
    })
    act(() => {
      screen.getByRole('button', { name: /Mis dashboards/ }).click()
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    const state = useDashboardStore.getState()
    expect(state.currentVariant).toBeNull()
    expect(state.generationHistory).toEqual([])
    expect(state.isGenerating).toBe(false)
  })
})
