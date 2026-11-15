import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { Toaster } from '@/components/ui/toaster'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const make = (seed: number) => generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(seed), now: () => seed })

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

describe('deleting the current layout', () => {
  it('shows the newest remaining layout as the current one instead of hiding it', async () => {
    const [oldest, middle, newest] = [make(1), make(2), make(3)]
    setState({ showLanding: false, variables: [sales, region], generationHistory: [oldest, middle, newest], currentVariant: newest })
    render(<DashboardGenerator />)

    const current = screen.getByRole('heading', { name: 'Layout Generado' }).closest('.mb-12') as HTMLElement
    await userEvent.click(within(current).getByRole('button', { name: 'Eliminar layout' }))

    const state = useDashboardStore.getState()
    expect(state.generationHistory).toEqual([oldest, middle])
    expect(state.currentVariant).toEqual(middle)
    expect(screen.getByRole('heading', { name: 'Layout Generado' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Eliminar layout' })).toHaveLength(2)
  })

  it('lists every other layout in the history even when the current one is not the last generated', () => {
    const [oldest, middle, newest] = [
      { ...make(1), layout: 'Grid' },
      { ...make(2), layout: 'Masonry' },
      { ...make(3), layout: 'Spotlight' },
    ]
    setState({ showLanding: false, variables: [sales, region], generationHistory: [oldest, middle, newest], currentVariant: middle })
    render(<DashboardGenerator />)

    for (const layout of ['Grid', 'Masonry', 'Spotlight']) expect(screen.getAllByText(layout, { exact: true })).toHaveLength(1)
  })
})

describe('generating with no possible chart', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('creates no empty layout and explains what is missing', async () => {
    const notes: Variable = { id: 'notes', name: 'Notas', type: 'text', priority: 'media' }
    setState({ showLanding: false, variables: [notes] })
    render(
      <>
        <DashboardGenerator />
        <Toaster />
      </>,
    )

    act(() => {
      screen.getByRole('button', { name: /^Generar Layout$/ }).click()
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    const state = useDashboardStore.getState()
    expect(state.generationHistory).toEqual([])
    expect(state.currentVariant).toBeNull()
    expect(state.isGenerating).toBe(false)
    expect(
      screen.getByText('Estas variables no permiten armar ningún gráfico. Agrega una variable numérica, de porcentaje o categórica, o revisa las combinaciones excluidas.'),
    ).toBeInTheDocument()
  })
})

describe('removing a variable', () => {
  it('drops the exclusions that mention it, so none are left orphaned', () => {
    setState({
      variables: [sales, region],
      excludedCombinations: [
        { id: 'e1', description: 'Ventas no se cruza con Region', variableIds: ['sales', 'region'] },
        { id: 'e2', description: 'otra', variableIds: ['region', 'date'] },
        { id: 'e3', description: 'sin relación', variableIds: ['sales', 'date'] },
      ],
    })

    act(() => useDashboardStore.getState().removeVariable('region'))

    const state = useDashboardStore.getState()
    expect(state.variables).toEqual([sales])
    expect(state.excludedCombinations.map((e) => e.id)).toEqual(['e3'])
  })
})
