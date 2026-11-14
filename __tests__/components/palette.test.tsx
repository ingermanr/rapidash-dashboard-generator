import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { PaletteSwatches } from '@/components/palette-swatches'
import { PALETTES } from '@/lib/domain/palettes'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const vars: Variable[] = [
  { id: 'a', name: 'Ventas', type: 'numeric', priority: 'alta' },
  { id: 'b', name: 'Region', type: 'categorical', priority: 'media' },
]

afterEach(() => document.documentElement.classList.remove('dark'))

describe('PaletteSwatches', () => {
  it('renders one labelled button per colour', () => {
    render(<PaletteSwatches palette={PALETTES[0]} />)
    const group = screen.getByRole('group', { name: `Paleta ${PALETTES[0].name}` })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(
      PALETTES[0].colors.map((color, i) => `Copiar color ${i + 1}: ${color}`),
    )
  })

  it('switches to the dark set when the theme becomes dark', async () => {
    render(<PaletteSwatches palette={PALETTES[0]} />)
    await act(async () => {
      document.documentElement.classList.add('dark')
    })
    const labels = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(labels).toEqual(PALETTES[0].darkColors!.map((color, i) => `Copiar color ${i + 1}: ${color}`))
  })
})

describe('"Otra paleta" in the builder', () => {
  it('changes the palette and keeps the layout of the current variant', async () => {
    const variant = generateSingleLayoutVariant(vars, [], [], { random: createSeededRandom(4), now: () => 4 })
    act(() => {
      useDashboardStore.getState().reset()
      useDashboardStore.setState({ showLanding: false, variables: vars, currentVariant: variant, generationHistory: [variant] })
    })
    render(<DashboardGenerator />)

    await userEvent.click(screen.getAllByRole('button', { name: /Otra paleta/ })[0])

    const current = useDashboardStore.getState().currentVariant!
    expect(current.palette.name).not.toBe(variant.palette.name)
    expect(current.layout).toBe(variant.layout)
    expect(current.combinations).toEqual(variant.combinations)
    expect(screen.getAllByRole('group', { name: `Paleta ${current.palette.name}` }).length).toBeGreaterThan(0)
  })
})
