import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardGenerator from '@/app/page'
import { Toaster } from '@/components/ui/toaster'
import { useDashboardStore } from '@/store'
import { EXPORT_FORMAT, buildExport } from '@/lib/domain/dashboard-transfer'
import type { SavedDashboard } from '@/lib/domain/saved-dashboards'
import type { Variable } from '@/types/dashboard'
import { readFileText } from '@/lib/browser/read-file'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }

function dashboard(id: string, title: string, updatedAt = 1): SavedDashboard {
  return { id, title, description: '', variables: [sales], excludedCombinations: [], generationHistory: [], createdAt: 1, updatedAt }
}

function setup(savedDashboards: SavedDashboard[]) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState({ showLanding: true, savedDashboards })
  })
  render(
    <>
      <DashboardGenerator />
      <Toaster />
    </>,
  )
}

/** Captures what the page downloads: file name and parsed JSON content. */
function captureDownloads() {
  const downloads: Array<{ name: string; blob: Blob }> = []
  let lastBlob: Blob | null = null
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => ((lastBlob = blob), 'blob:test') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} })
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: lastBlob! })
  })
  return downloads
}

const jsonFile = (content: unknown, name = 'dashboards.json') =>
  new File([typeof content === 'string' ? content : JSON.stringify(content)], name, { type: 'application/json' })

afterEach(() => jest.restoreAllMocks())

describe('export', () => {
  it('downloads one dashboard as a JSON file named after it', async () => {
    const downloads = captureDownloads()
    setup([dashboard('a', 'Ventas')])

    await userEvent.click(screen.getByRole('button', { name: 'Exportar Ventas' }))

    expect(downloads.map((d) => d.name)).toEqual(['dashboard-ventas.json'])
    expect(downloads[0].blob.type).toBe('application/json')
    const content = JSON.parse(await readFileText(downloads[0].blob))
    expect(content).toMatchObject({ format: EXPORT_FORMAT, version: 1, dashboards: [dashboard('a', 'Ventas')] })
  })

  it('downloads every saved dashboard with "Exportar todos"', async () => {
    const downloads = captureDownloads()
    setup([dashboard('a', 'Ventas', 1), dashboard('b', 'Marketing', 2)])

    await userEvent.click(screen.getByRole('button', { name: 'Exportar todos' }))

    expect(downloads[0].name).toMatch(/^dashboards-\d{4}-\d{2}-\d{2}\.json$/)
    const content = JSON.parse(await readFileText(downloads[0].blob))
    expect(content.dashboards.map((d: SavedDashboard) => d.id).sort()).toEqual(['a', 'b'])
  })
})

describe('import', () => {
  it('is available even when nothing is saved yet', () => {
    setup([])
    expect(screen.getByLabelText('Importar dashboards')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Exportar todos' })).not.toBeInTheDocument()
  })

  it('adds the dashboards from an export file first, without replacing existing ones, and reports it', async () => {
    setup([dashboard('a', 'Existente')])

    const file = jsonFile(buildExport([dashboard('a', 'Importado'), dashboard('b', 'Otro'), { title: 'roto' } as unknown as SavedDashboard]))
    await userEvent.upload(screen.getByLabelText('Importar dashboards'), file)

    const titles = await screen.findAllByRole('heading', { level: 3 })
    const saved = useDashboardStore.getState().savedDashboards
    expect(saved.map((d) => d.title).sort()).toEqual(['Existente', 'Importado', 'Otro'])
    expect(saved.find((d) => d.title === 'Existente')!.id).toBe('a')
    expect(saved.find((d) => d.title === 'Importado')!.id).not.toBe('a')
    expect(within(screen.getByRole('list', { name: 'Tus dashboards' })).getAllByRole('listitem')).toHaveLength(3)
    expect(titles.length).toBeGreaterThan(0)
    expect(await screen.findByText('Se importaron 2 dashboards. Se descartó 1 por estar dañado.')).toBeInTheDocument()
  })

  it.each([
    ['{no es json', 'El archivo no es un JSON válido.'],
    [{ hola: 'mundo' }, 'El archivo no es una exportación de Dashboard Generator.'],
    [{ format: EXPORT_FORMAT, version: 9, dashboards: [] }, 'El archivo viene de una versión más nueva de Dashboard Generator.'],
    [{ format: EXPORT_FORMAT, version: 1, dashboards: [] }, 'El archivo no contiene dashboards válidos.'],
  ])('explains why a file cannot be imported (%#)', async (content, message) => {
    setup([dashboard('a', 'Existente')])

    await userEvent.upload(screen.getByLabelText('Importar dashboards'), jsonFile(content))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(useDashboardStore.getState().savedDashboards.map((d) => d.id)).toEqual(['a'])
  })
})
