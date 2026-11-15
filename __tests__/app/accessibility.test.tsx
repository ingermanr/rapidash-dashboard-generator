import { act, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import { PALETTES } from '@/lib/domain/palettes'
import type { Variable } from '@/types/dashboard'

const variables: Variable[] = [
  { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' },
  { id: 'region', name: 'Region', type: 'categorical', priority: 'media' },
  { id: 'month', name: 'Mes', type: 'temporal', priority: 'baja' },
]
const variant = generateSingleLayoutVariant(variables, [], [], { random: createSeededRandom(3), now: () => 1 })

// app/layout.tsx owns <html lang> and <title>; the page is rendered without it here.
beforeAll(() => {
  document.documentElement.lang = 'es'
  document.title = 'Dashboard Generator'
})

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

/** Structural axe rules only: jsdom has no layout, so colour contrast is checked in a real browser instead. */
async function violations(container: HTMLElement) {
  const result = await axe.run(container.ownerDocument.documentElement, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

const screens: Array<[string, Partial<ReturnType<typeof useDashboardStore.getState>>]> = [
  ['landing', { showLanding: true }],
  [
    'landing with saved dashboards',
    {
      showLanding: true,
      savedDashboards: [
        { id: 'a', title: 'Ventas', description: '', variables, excludedCombinations: [], generationHistory: [variant], createdAt: 1, updatedAt: 2 },
      ],
    },
  ],
  ['empty builder', { showLanding: false }],
  ['builder with a variant', { showLanding: false, variables, currentVariant: variant, generationHistory: [variant] }],
  ['variant detail', { showLanding: false, variables, currentVariant: variant, generationHistory: [variant], selectedVariant: variant }],
]

describe('accessibility', () => {
  it.each(screens)('%s has no axe violations', async (_name, state) => {
    setState(state)
    const { container } = render(<DashboardGenerator />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(await violations(container)).toEqual([])
  })

  it('names icon-only delete buttons, hides them only for a mouse and shows them on keyboard focus and touch screens', () => {
    setState({ showLanding: false, variables, currentVariant: variant, generationHistory: [variant] })
    render(<DashboardGenerator />)

    const deleteVariable = screen.getByRole('button', { name: 'Eliminar variable Ventas' })
    const deleteLayout = screen.getAllByRole('button', { name: 'Eliminar layout' })[0]
    for (const button of [deleteVariable, deleteLayout]) {
      const classes = button.className.split(/\s+/)
      expect(classes).not.toContain('opacity-0')
      expect(classes).toEqual(expect.arrayContaining(['pointer-fine:opacity-0', 'pointer-fine:group-hover:opacity-100', 'focus-visible:opacity-100']))
    }
  })

  it('gives every preview chart a text alternative', () => {
    setState({ showLanding: false, variables, currentVariant: variant, selectedVariant: variant })
    render(<DashboardGenerator />)

    const charts = screen.getAllByRole('img', { name: /^Gráfico de ejemplo/ })
    expect(charts.length).toBe(variant.combinations.length)
  })

  it('states the real number of colour palettes on the landing', () => {
    setState({ showLanding: true })
    render(<DashboardGenerator />)

    expect(screen.getByText(`${PALETTES.length} Paletas de Colores`)).toBeInTheDocument()
    expect(screen.queryByText(/50\+ Paletas/)).not.toBeInTheDocument()
  })
})
