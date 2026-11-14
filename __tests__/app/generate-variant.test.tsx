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
})
