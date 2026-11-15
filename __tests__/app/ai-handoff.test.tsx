import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { Toaster } from '@/components/ui/toaster'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { LayoutVariant, Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const variant = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(5), now: () => 1 })

function openDetail(shown: LayoutVariant = variant) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState({
      showLanding: false,
      dashboardTitle: 'Ventas Q1',
      variables: [sales, region],
      generationHistory: [shown],
      currentVariant: shown,
      selectedVariant: shown,
    })
  })
  render(
    <>
      <DashboardGenerator />
      <Toaster />
    </>,
  )
}

afterEach(() => jest.restoreAllMocks())

describe('building the dashboard with AI', () => {
  it('opens a panel that explains the steps and says the data never goes through Rapidash', async () => {
    openDetail()
    const toggle = screen.getByRole('button', { name: /Construir con IA/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('region', { name: 'Construir con IA' })
    expect(within(panel).getByText(/Adjunta tu archivo de datos/)).toBeInTheDocument()
    expect(within(panel).getByText(/Rapidash no envía tus datos/)).toBeInTheDocument()
  })

  it('copies the prompt with the dashboard contract', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    openDetail()

    await userEvent.click(screen.getByRole('button', { name: /Construir con IA/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Copiar prompt' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const prompt: string = writeText.mock.calls[0][0]
    expect(prompt).toContain('dashboard web interactivo')
    expect(prompt).toContain('"title":"Ventas Q1"')
    expect(await screen.findByText('Pégalo en tu asistente de IA junto con tu archivo de datos.')).toBeInTheDocument()
  })

  it('offers links that open Claude and ChatGPT in a new tab with the prompt prefilled', async () => {
    openDetail()
    await userEvent.click(screen.getByRole('button', { name: /Construir con IA/ }))

    for (const [name, prefix] of [
      ['Abrir en Claude', 'https://claude.ai/new?q='],
      ['Abrir en ChatGPT', 'https://chatgpt.com/?q='],
    ]) {
      const link = screen.getByRole('link', { name: new RegExp(name) })
      expect(link.getAttribute('href')!.startsWith(prefix)).toBe(true)
      expect(decodeURIComponent(link.getAttribute('href')!.slice(prefix.length))).toContain('"title":"Ventas Q1"')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('shows the prompt to copy by hand when the clipboard is not available', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    openDetail()

    await userEvent.click(screen.getByRole('button', { name: /Construir con IA/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Copiar prompt' }))

    const field = await screen.findByRole('textbox', { name: 'Prompt para la IA' })
    expect((field as HTMLTextAreaElement).value).toContain('```json')
  })

  it('drops the open links for a prompt too long for a URL and keeps copying available', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ ...variant.combinations[0], id: `c${i}`, name: `Componente con un nombre largo ${i}` }))
    openDetail({ ...variant, layout: 'Ultra Dense Grid', combinations: many })

    await userEvent.click(screen.getByRole('button', { name: /Construir con IA/ }))

    expect(screen.queryByRole('link', { name: /Abrir en/ })).not.toBeInTheDocument()
    expect(screen.getByText(/es largo para abrirlo con un link/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar prompt' })).toBeEnabled()
  })
})
