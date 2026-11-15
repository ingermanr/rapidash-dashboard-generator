import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { DashboardDetailedPreview } from '@/components/dashboard-detailed-preview'
import { VariableInput } from '@/components/variable-input'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

let finishPdf: () => void = () => {}
jest.mock('@/lib/pdf/dashboard-spec-pdf', () => ({
  exportDashboardSpecPdf: jest.fn(() => new Promise<void>((resolve) => (finishPdf = resolve))),
}))

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const make = (seed: number) => generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(seed), now: () => seed })

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

describe('variant names', () => {
  it('numbers each layout by its generation order, so no two share a name', () => {
    const history = [make(1), make(2), make(3)]
    setState({ showLanding: false, variables: [sales, region], generationHistory: history, currentVariant: history[2] })
    render(<DashboardGenerator />)

    const names = screen.getAllByRole('heading', { name: /^Variante \d+$/ }).map((h) => h.textContent)
    expect(names).toEqual(['Variante 3', 'Variante 2', 'Variante 1'])
  })
})

describe('variable form labels', () => {
  it('ties every visible label to its field', async () => {
    setState({ showLanding: false })
    render(<VariableInput />)

    const name = screen.getByLabelText('Nombre de la Variable')
    expect(name.tagName).toBe('INPUT')
    expect(screen.getByLabelText('Tipo')).toHaveAttribute('role', 'combobox')
    expect(screen.getByLabelText('Importancia')).toHaveAttribute('role', 'combobox')

    await userEvent.click(screen.getByText('Nombre de la Variable'))
    expect(name).toHaveFocus()
  })

  it('adds the variable when Enter is pressed in the name field', async () => {
    setState({ showLanding: false })
    render(<VariableInput />)

    await userEvent.type(screen.getByLabelText('Nombre de la Variable'), 'Margen{Enter}')

    expect(useDashboardStore.getState().variables.map((v) => v.name)).toEqual(['Margen'])
  })
})

describe('PDF button', () => {
  it('shows progress and cannot be clicked twice while the PDF is being generated', async () => {
    render(<DashboardDetailedPreview variant={make(1)} dashboardTitle="Ventas" />)

    await userEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    const busy = screen.getByRole('button', { name: /Generando PDF/ })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')

    await act(async () => finishPdf())
    await waitFor(() => expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled())
  })
})
