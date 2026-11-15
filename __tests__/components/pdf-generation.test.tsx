import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardDetailedPreview } from '@/components/dashboard-detailed-preview'
import { Toaster } from '@/components/ui/toaster'
import type { LayoutVariant, Variable } from '@/types/dashboard'

/** Records what the PDF prints; the renderer itself is covered in __tests__/lib/pdf. */
const printed: string[] = []
let saved: string | null = null
let failSave = false

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => {
    let pages = 1
    let current = 1
    const doc: Record<string, unknown> = {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addPage: () => {
        pages += 1
        current = pages
      },
      setPage: (n: number) => {
        current = n
      },
      getNumberOfPages: () => pages,
      getCurrentPageInfo: () => ({ pageNumber: current }),
      getTextWidth: (text: string) => text.length * 2,
      splitTextToSize: (text: string) => [text],
      text: (value: string | string[]) => {
        printed.push(...(Array.isArray(value) ? value : [value]))
      },
      save: (name: string) => {
        if (failSave) throw new Error('disk full')
        saved = name
      },
    }
    const proxy: unknown = new Proxy(doc, { get: (target, prop: string) => (prop in target ? target[prop] : () => proxy) })
    return proxy
  }),
}))

const sales: Variable = { id: '1', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: '2', name: 'Región', type: 'categorical', priority: 'media' }
const variant: LayoutVariant = {
  id: 'v',
  layout: 'Grid',
  palette: { name: 'Océano', colors: ['#3b82f6', '#0d9488'], description: 'Azules' },
  variables: [sales, region],
  combinations: [
    { id: 'a', name: 'Ventas por Región', chartType: 'bar', numericVariable: sales, categoricalVariable: region },
    { id: 'b', name: 'Ventas', chartType: 'metric', numericVariable: sales },
  ],
  layoutDescription: 'Cuadrícula uniforme',
}

beforeEach(() => {
  printed.length = 0
  saved = null
  failSave = false
})

describe('PDF download from the detail view', () => {
  it('downloads the specification of the shown layout under the dashboard title', async () => {
    render(<DashboardDetailedPreview variant={variant} dashboardTitle="Ventas Q1" dashboardDescription="KPIs" />)

    await userEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    await waitFor(() => expect(saved).toBe('dashboard-ventas-q1.pdf'))
    for (const text of ['Ventas Q1', 'KPIs', 'Ventas por Región', 'Región', 'Océano', '#3B82F6', 'Barras', 'Categórico'])
      expect(printed).toContain(text)
  })

  it('uses a generic file name for an untitled dashboard', async () => {
    render(<DashboardDetailedPreview variant={variant} />)

    await userEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    await waitFor(() => expect(saved).toBe('dashboard-specification.pdf'))
    expect(printed).toContain('Dashboard sin título')
  })

  it('tells the user when the PDF could not be generated', async () => {
    failSave = true
    jest.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <>
        <DashboardDetailedPreview variant={variant} dashboardTitle="Ventas" />
        <Toaster />
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }))

    expect(await screen.findByText('No se pudo generar el PDF')).toBeInTheDocument()
  })
})
