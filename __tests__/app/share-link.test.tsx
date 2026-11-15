import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { Toaster } from '@/components/ui/toaster'
import { useDashboardStore } from '@/store'
import { decodeShare, encodeShare, readShareFromHash } from '@/lib/domain/share-link'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { SavedDashboard } from '@/lib/domain/saved-dashboards'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const variant = JSON.parse(JSON.stringify(generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(4), now: () => 1 })))
const existing: SavedDashboard = {
  id: 'mine',
  title: 'Mío',
  description: '',
  variables: [sales],
  excludedCombinations: [],
  generationHistory: [],
  createdAt: 1,
  updatedAt: 1,
}

function renderApp(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
  render(
    <>
      <DashboardGenerator />
      <Toaster />
    </>,
  )
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
  jest.restoreAllMocks()
})

describe('opening a share link', () => {
  it('creates a new dashboard with the shared layout, keeps existing ones and clears the link from the address bar', async () => {
    const encoded = await encodeShare({ title: 'Compartido', description: 'De un colega', variables: [sales, region], excludedCombinations: [], variant })
    window.history.replaceState(null, '', `/#share=${encoded}`)

    renderApp({ showLanding: true, savedDashboards: [existing] })

    expect(await screen.findByText('Se abrió un dashboard compartido. Ya está guardado en tus dashboards.')).toBeInTheDocument()
    const state = useDashboardStore.getState()
    expect(state).toMatchObject({
      showLanding: false,
      dashboardTitle: 'Compartido',
      dashboardDescription: 'De un colega',
      variables: [sales, region],
      generationHistory: [variant],
      currentVariant: variant,
      selectedVariant: variant,
    })
    expect(state.activeDashboardId).not.toBe('mine')
    expect(state.savedDashboards.map((d) => d.title).sort()).toEqual(['Compartido', 'Mío'])
    expect(window.location.hash).toBe('')
    expect(screen.getByRole('button', { name: /Compartir/ })).toBeInTheDocument()
  })

  it('explains a broken link and changes nothing', async () => {
    window.history.replaceState(null, '', '/#share=z.roto')

    renderApp({ showLanding: true, savedDashboards: [existing] })

    expect(await screen.findByText('El link para compartir no es válido o está incompleto.')).toBeInTheDocument()
    expect(useDashboardStore.getState().savedDashboards).toEqual([existing])
    expect(useDashboardStore.getState().showLanding).toBe(true)
    expect(window.location.hash).toBe('')
  })
})

describe('sharing from the detail view', () => {
  const detail = { showLanding: false, variables: [sales, region], generationHistory: [variant], currentVariant: variant, selectedVariant: variant, dashboardTitle: 'Ventas' }

  it('copies a link that reopens exactly this layout', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderApp(detail)

    await userEvent.click(screen.getByRole('button', { name: /Compartir/ }))

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const url = new URL(writeText.mock.calls[0][0])
    const shared = await decodeShare(readShareFromHash(url.hash)!)
    expect(shared).toEqual({ title: 'Ventas', description: '', variables: [sales, region], excludedCombinations: [], variant })
    expect(await screen.findByText('Link copiado. Quien lo abra verá este layout.')).toBeInTheDocument()
  })

  it('shows the link to copy by hand when the clipboard is not available', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    renderApp(detail)

    await userEvent.click(screen.getByRole('button', { name: /Compartir/ }))

    const field = await screen.findByRole('textbox', { name: 'Link para compartir' })
    expect((field as HTMLInputElement).value).toMatch(/#share=z\./)
  })
})
