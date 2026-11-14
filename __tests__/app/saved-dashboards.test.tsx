import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import type { SavedDashboard } from '@/lib/domain/saved-dashboards'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }

function dashboard(id: string, title: string, updatedAt: number, variables: Variable[] = [sales]): SavedDashboard {
  return { id, title, description: '', variables, excludedCombinations: [], generationHistory: [], createdAt: 1, updatedAt }
}

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

const list = () => screen.getByRole('list', { name: 'Tus dashboards' })

describe('saved dashboards on the landing', () => {
  it('does not show the list when nothing is saved', () => {
    setState({ showLanding: true })
    render(<DashboardGenerator />)
    expect(screen.queryByRole('list', { name: 'Tus dashboards' })).not.toBeInTheDocument()
  })

  it('lists saved dashboards, most recent first, with a placeholder for untitled ones', () => {
    setState({
      showLanding: true,
      savedDashboards: [dashboard('a', 'Ventas', 1), dashboard('b', '', 3, [sales, region]), dashboard('c', 'Marketing', 2)],
    })
    render(<DashboardGenerator />)

    const items = within(list()).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Dashboard sin título',
      'Marketing',
      'Ventas',
    ])
    expect(items[0]).toHaveTextContent('2 variables')
    expect(items[2]).toHaveTextContent('1 variable')
  })

  it('opens a saved dashboard in the builder', async () => {
    setState({ showLanding: true, savedDashboards: [dashboard('a', 'Ventas', 1, [sales, region])] })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir Ventas' }))

    const state = useDashboardStore.getState()
    expect(state.showLanding).toBe(false)
    expect(state.activeDashboardId).toBe('a')
    expect(state.variables).toEqual([sales, region])
    expect(screen.getByDisplayValue('Ventas')).toBeInTheDocument()
  })

  it('renames with Enter and cancels with Escape', async () => {
    setState({ showLanding: true, savedDashboards: [dashboard('a', 'Ventas', 1)] })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Ventas' }))
    const input = screen.getByRole('textbox', { name: 'Nuevo nombre para Ventas' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Ventas Q1{Enter}')
    expect(useDashboardStore.getState().savedDashboards[0].title).toBe('Ventas Q1')
    expect(within(list()).getByRole('heading', { name: 'Ventas Q1' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar Ventas Q1' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Nuevo nombre para Ventas Q1' }), ' cambiado{Escape}')
    expect(useDashboardStore.getState().savedDashboards[0].title).toBe('Ventas Q1')
    expect(screen.queryByRole('textbox', { name: /Nuevo nombre/ })).not.toBeInTheDocument()
  })

  it('asks for confirmation before deleting', async () => {
    setState({ showLanding: true, savedDashboards: [dashboard('a', 'Ventas', 1), dashboard('b', 'Marketing', 2)] })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Ventas' }))
    expect(useDashboardStore.getState().savedDashboards).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación de Ventas' }))
    expect(useDashboardStore.getState().savedDashboards.map((d) => d.id)).toEqual(['b'])
    expect(within(list()).getAllByRole('listitem')).toHaveLength(1)
  })

  it('keeps the previous dashboard when starting a new one and shows both from the builder', async () => {
    setState({ showLanding: false })
    render(<DashboardGenerator />)

    act(() => {
      useDashboardStore.getState().setDashboardTitle('Primero')
      useDashboardStore.getState().addVariable(sales)
    })
    await userEvent.click(screen.getByRole('button', { name: /Empezar Nuevo/ }))
    act(() => useDashboardStore.getState().setDashboardTitle('Segundo'))

    await userEvent.click(screen.getByRole('button', { name: 'Mis dashboards' }))

    expect(useDashboardStore.getState().showLanding).toBe(true)
    const titles = within(list()).getAllByRole('heading').map((h) => h.textContent)
    expect(titles.sort()).toEqual(['Primero', 'Segundo'])
  })
})
