import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import { buildCustomPalette } from '@/lib/domain/custom-palette'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const variant = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(3), now: () => 1 })
const other = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(9), now: () => 2 })

function openDetail() {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState({
      showLanding: false,
      variables: [sales, region],
      generationHistory: [other, variant],
      currentVariant: variant,
      selectedVariant: variant,
    })
  })
  render(<DashboardGenerator />)
}

afterEach(() => {
  // @ts-expect-error test-only cleanup of the optional browser API
  delete window.EyeDropper
})

async function openCustomizer() {
  await userEvent.click(screen.getByRole('button', { name: /Personalizar colores/ }))
  return screen.getByRole('region', { name: 'Personalizar colores' })
}

describe('custom palette', () => {
  it('previews the palette built from the chosen colour and shows the original next to the adjusted one', async () => {
    openDetail()
    const panel = await openCustomizer()

    fireEvent.change(within(panel).getByLabelText('Color base'), { target: { value: '#ffeb3b' } })
    await userEvent.click(within(panel).getByRole('radio', { name: 'Complementaria' }))

    const expected = buildCustomPalette('#ffeb3b', 'complementary')
    expect(within(panel).getByText('#ffeb3b')).toBeInTheDocument()
    expect(within(panel).getByText(expected.base.light)).toBeInTheDocument()
    expect(within(panel).getByText(/Ajustamos la luminosidad/)).toBeInTheDocument()
    expect(within(panel).getByText('Pasa las validaciones de contraste y diferenciación en modo claro y oscuro.')).toBeInTheDocument()
  })

  it('applies the palette to the shown layout only, keeping its layout and charts', async () => {
    openDetail()
    const panel = await openCustomizer()

    fireEvent.change(within(panel).getByLabelText('Color base'), { target: { value: '#0054ee' } })
    await userEvent.click(within(panel).getByRole('radio', { name: 'Tonos de un color' }))
    await userEvent.click(within(panel).getByRole('button', { name: 'Aplicar paleta' }))

    const { palette } = buildCustomPalette('#0054ee', 'monochromatic')
    const state = useDashboardStore.getState()
    expect(state.selectedVariant).toEqual({ ...variant, palette })
    expect(state.currentVariant).toEqual({ ...variant, palette })
    expect(state.generationHistory).toEqual([other, { ...variant, palette }])
    expect(screen.queryByRole('region', { name: 'Personalizar colores' })).not.toBeInTheDocument()
  })

  it('offers the eyedropper only where the browser supports it, and uses the picked colour', async () => {
    openDetail()
    let panel = await openCustomizer()
    expect(within(panel).queryByRole('button', { name: /Gotero/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Personalizar colores/ }))

    // @ts-expect-error test double for the EyeDropper API
    window.EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#e91e63' })
      }
    }
    panel = await openCustomizer()
    await userEvent.click(within(panel).getByRole('button', { name: /Gotero/ }))

    expect(within(panel).getByLabelText('Color base')).toHaveValue('#e91e63')
  })
})
