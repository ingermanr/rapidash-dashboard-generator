import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const variables: Variable[] = [
  { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' },
  { id: 'region', name: 'Region', type: 'categorical', priority: 'media' },
]
const variant = generateSingleLayoutVariant(variables, [], [], { random: createSeededRandom(1), now: () => 1 })

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

describe('DashboardGenerator navigation', () => {
  it('starts on the landing and moves to an empty builder', async () => {
    setState({ showLanding: true, variables, dashboardTitle: 'Viejo' })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getAllByRole('button', { name: /Comenzar a Crear/ })[0])

    const state = useDashboardStore.getState()
    expect(state.showLanding).toBe(false)
    expect(state.variables).toEqual([])
    expect(state.dashboardTitle).toBe('')
    expect(screen.getByRole('button', { name: /Generar Layout/ })).toBeDisabled()
  })

  it('opens the detail view for the current variant and goes back', async () => {
    setState({ showLanding: false, variables, currentVariant: variant, generationHistory: [variant] })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getAllByRole('button', { name: /Ver Detallada/ })[0])
    expect(useDashboardStore.getState().selectedVariant).toEqual(variant)
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Volver a Variantes/ }))
    expect(useDashboardStore.getState().selectedVariant).toBeNull()
    expect(screen.getByRole('button', { name: /Generar Nuevo Layout/ })).toBeInTheDocument()
  })

  it('starts over from the builder, clearing variables and history', async () => {
    setState({ showLanding: false, variables, currentVariant: variant, generationHistory: [variant] })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getByRole('button', { name: /Empezar Nuevo/ }))

    const state = useDashboardStore.getState()
    expect(state.variables).toEqual([])
    expect(state.generationHistory).toEqual([])
  })
})
