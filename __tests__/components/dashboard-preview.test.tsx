import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardDetailedPreview } from '@/components/dashboard-detailed-preview'
import { CombinationCard } from '@/components/dashboard-preview/combination-card'
import { DashboardGrid } from '@/components/dashboard-preview/dashboard-grid'
import { FilterCard } from '@/components/dashboard-preview/filter-card'
import type { LayoutVariant, Variable, VariableCombination } from '@/types/dashboard'

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }))
jest.mock('@/store', () => ({ useDashboardInfo: () => ({ dashboardTitle: 'Ventas', dashboardDescription: '' }) }))

const mockJsPdf = jest.fn()
jest.mock('jspdf', () => ({ jsPDF: jest.fn().mockImplementation(() => mockJsPdf()) }))

// Radix Select relies on pointer-capture and scrolling APIs that jsdom does not implement.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

beforeEach(() => {
  mockToast.mockReset()
  mockJsPdf.mockReset()
})

const revenue: Variable = { id: 'revenue', name: 'Ingresos', type: 'numeric', priority: 'alta' }
const completion: Variable = { id: 'completion', name: 'Avance', type: 'percentage-progress', priority: 'media' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const palette: LayoutVariant['palette'] = { name: 'Ocean Blue', colors: ['#3B82F6', '#60A5FA'], description: '' }

const combination = (overrides: Partial<VariableCombination>): VariableCombination => ({
  id: 'combo',
  numericVariable: revenue,
  name: 'Ingresos',
  chartType: 'metric',
  ...overrides,
})

const variant = (combinations: VariableCombination[], variables: Variable[] = [revenue, region]): LayoutVariant => ({
  id: 'variant',
  layout: 'Dashboard Grid',
  palette,
  variables,
  combinations,
  layoutDescription: '',
})

describe('CombinationCard', () => {
  it('shows the combination name as its title', () => {
    render(<CombinationCard combination={combination({ name: 'Ingresos por Region' })} palette={palette} index={0} size="medium" />)
    expect(screen.getByRole('heading', { name: 'Ingresos por Region' })).toBeInTheDocument()
  })

  it('renders a progress percentage for progress combinations', () => {
    const { container } = render(
      <CombinationCard
        combination={combination({ id: 'p', numericVariable: completion, name: 'Avance', chartType: 'progress' })}
        palette={palette}
        index={0}
        size="medium"
      />,
    )
    expect(container.textContent).toMatch(/\b(5\d|6\d|7\d|8\d)%/)
  })
})

describe('DashboardGrid', () => {
  it('renders one card per combination', () => {
    const combos = ['A', 'B', 'C'].map((name) => combination({ id: `c-${name}`, name }))
    render(<DashboardGrid variant={variant(combos)} />)
    for (const name of ['A', 'B', 'C']) expect(screen.getByRole('heading', { name })).toBeInTheDocument()
  })
})

describe('FilterCard', () => {
  it('reports the selected category', async () => {
    const onChange = jest.fn()
    render(<FilterCard variable={region} value="default" onChange={onChange} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Norte' }))

    expect(onChange).toHaveBeenCalledWith('Norte')
  })
})

describe('DashboardDetailedPreview', () => {
  it('shows a "Limpiar" action once a filter is active and hides it after clearing', async () => {
    render(<DashboardDetailedPreview variant={variant([combination({})])} />)
    expect(screen.queryByRole('button', { name: /Limpiar/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Sur' }))
    await userEvent.click(screen.getByRole('button', { name: /Limpiar/ }))

    expect(screen.queryByRole('button', { name: /Limpiar/ })).not.toBeInTheDocument()
  })

  it('does not count "Todas las categorías" as an active filter', async () => {
    render(<DashboardDetailedPreview variant={variant([combination({})])} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Sur' }))
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Todas las categorías' }))

    expect(screen.queryByRole('button', { name: /Limpiar/ })).not.toBeInTheDocument()
  })

  it('updates the sample numbers when a filter is applied and restores them when cleared', async () => {
    render(<DashboardDetailedPreview variant={variant([combination({ id: 'kpi', name: 'Ingresos totales' })])} />)
    const chartCard = () => screen.getByRole('heading', { name: 'Ingresos totales' }).closest('[data-slot="card"]')?.textContent
    const unfiltered = chartCard()
    expect(unfiltered).toMatch(/\d/)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Norte' }))
    expect(chartCard()).not.toBe(unfiltered)

    await userEvent.click(screen.getByRole('button', { name: /Limpiar/ }))
    expect(chartCard()).toBe(unfiltered)
  })

  it('reports PDF failures with a toast instead of a blocking alert', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockJsPdf.mockImplementation(() => {
      throw new Error('boom')
    })

    render(<DashboardDetailedPreview variant={variant([combination({})])} />)
    await act(async () => {
      fireEvent.click(screen.getByText('Descargar PDF'))
    })

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', title: 'No se pudo generar el PDF' }))
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
