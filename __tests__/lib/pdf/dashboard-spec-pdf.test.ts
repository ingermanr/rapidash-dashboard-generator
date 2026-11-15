import { exportDashboardSpecPdf } from '@/lib/pdf/dashboard-spec-pdf'
import type { LayoutVariant, Variable, VariableCombination, VariableType } from '@/types/dashboard'

/**
 * A recording stand-in for jsPDF. Text is measured as 2 mm per character, whatever the font size, and the
 * renderer only ever measures through `getTextWidth`/`splitTextToSize`, so "fits within the margins" can be
 * checked against the same measure the renderer used.
 */
type Call = { method: string; page: number; args: unknown[] }
let calls: Call[] = []
let saved: string | null = null

const PAGE_WIDTH = 210
const MARGIN = 18
const charWidth = (text: string) => text.length * 2

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => {
    let pages = 1
    let current = 1
    const doc: Record<string, unknown> = {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addPage: () => {
        pages += 1
        current = pages
        calls.push({ method: 'addPage', page: current, args: [] })
      },
      setPage: (n: number) => {
        current = n
      },
      getNumberOfPages: () => pages,
      getCurrentPageInfo: () => ({ pageNumber: current }),
      getTextWidth: (text: string) => charWidth(text),
      splitTextToSize: (text: string, width: number) => {
        const lines: string[] = []
        let line = ''
        for (const word of text.split(' ')) {
          const next = line ? `${line} ${word}` : word
          if (charWidth(next) > width && line) {
            lines.push(line)
            line = word
          } else line = next
        }
        if (line) lines.push(line)
        return lines
      },
      save: (name: string) => {
        saved = name
      },
    }
    const proxy: unknown = new Proxy(doc, {
      get(target, prop: string) {
        if (prop in target) return target[prop]
        return (...args: unknown[]) => {
          calls.push({ method: prop, page: current, args })
          return proxy
        }
      },
    })
    return proxy
  }),
}))

const texts = () =>
  calls
    .filter((c) => c.method === 'text')
    .flatMap((c) => {
      const [value, x, y, options] = c.args as [string | string[], number, number, { align?: string } | undefined]
      return (Array.isArray(value) ? value : [value]).map((text) => ({ text, x, y, align: options?.align, page: c.page }))
    })

const types: VariableType[] = ['numeric', 'categorical', 'temporal', 'percentage-progress', 'percentage-ratio', 'text', 'binary']
const variables: Variable[] = Array.from({ length: 30 }, (_, i) => ({
  id: `v${i}`,
  name: `Variable ${i}`,
  type: types[i % types.length],
  priority: 'media',
}))

function variantWith(count: number, layout = 'Dashboard Grid'): LayoutVariant {
  const combinations: VariableCombination[] = Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    name: `Componente ${i}`,
    chartType: 'metric',
    numericVariable: variables[i % variables.length],
  }))
  return {
    id: 'v',
    layout,
    palette: { name: 'Aurora', colors: ['#8b5cf6', '#0d9488', '#ec4899', '#3b82f6', '#b45309'], description: 'Moderna' },
    variables,
    combinations,
    layoutDescription: 'Grid con métricas destacadas.',
  }
}

beforeEach(() => {
  calls = []
  saved = null
})

describe('dashboard specification PDF', () => {
  it('numbers every page as "Página X de N" with the real total', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(40), title: 'Ventas', description: 'KPIs' })

    const total = calls.filter((c) => c.method === 'addPage').length + 1
    expect(total).toBeGreaterThan(4)
    const footers = texts().filter((t) => /^Página \d+ de \d+$/.test(t.text))
    expect(footers.map((f) => f.text)).toEqual(Array.from({ length: total }, (_, i) => `Página ${i + 1} de ${total}`))
    expect(footers.map((f) => f.page)).toEqual(Array.from({ length: total }, (_, i) => i + 1))
  })

  it('lists every component and every variable, repeating the table header on continuation pages', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(40), title: 'Ventas', description: '' })

    const all = texts().map((t) => t.text)
    for (let i = 0; i < 40; i++) expect(all).toContain(`Componente ${i}`)
    for (let i = 0; i < 30; i++) expect(all).toContain(`Variable ${i}`)
    const componentHeaderPages = new Set(texts().filter((t) => t.text === 'COMPONENTE').map((t) => t.page))
    expect(componentHeaderPages.size).toBeGreaterThan(1)
  })

  it('keeps all text inside the margins and wraps a long title and description', async () => {
    const title = 'Tablero integral de ventas regionales, márgenes y rotación de inventario '.repeat(3).trim()
    const description = 'Seguimiento semanal para la dirección comercial con foco en desvíos. '.repeat(12).trim()
    await exportDashboardSpecPdf({ variant: variantWith(12), title, description })

    for (const t of texts()) {
      const right = t.align === 'right' ? t.x : t.align === 'center' ? t.x + charWidth(t.text) / 2 : t.x + charWidth(t.text)
      expect({ text: t.text, fits: right <= PAGE_WIDTH - MARGIN + 1e-6 && t.x >= MARGIN - 1e-6 }).toEqual({ text: t.text, fits: true })
    }
    const coverLines = texts().filter((t) => t.page === 1 && title.includes(t.text) && t.text.length > 10)
    expect(coverLines.length).toBeGreaterThan(1)
    expect(texts().filter((t) => description.includes(t.text) && t.text.length > 10).length).toBeGreaterThan(1)
  })

  it('points the index at the page where each section really starts', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(40), title: 'Ventas', description: '' })

    const sections = ['Layout', 'Componentes', 'Variables', 'Paleta de colores']
    for (const section of sections) {
      const heading = texts().find((t) => t.text === section && t.page > 1)
      expect(heading).toBeDefined()
      const entry = texts().find((t) => t.page === 1 && t.text === section)
      expect(entry).toBeDefined()
      const pageNumber = texts().find((t) => t.page === 1 && Math.abs(t.y - entry!.y) < 0.01 && t.text === String(heading!.page))
      expect({ section, page: pageNumber?.text }).toEqual({ section, page: String(heading!.page) })
    }
  })

  it('numbers one diagram box per component on the layout page', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(13, 'Masonry'), title: 'T', description: '' })

    const layoutPage = texts().find((t) => t.text === 'Layout' && t.page > 1)!.page
    const numbers = texts()
      .filter((t) => t.page === layoutPage && /^\d+$/.test(t.text))
      .map((t) => Number(t.text))
    expect(new Set(numbers)).toEqual(new Set(Array.from({ length: 13 }, (_, i) => i + 1)))
  })

  it('labels every variable type in Spanish and never prints "Desconocido"', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(5), title: 'T', description: '' })

    const all = texts().map((t) => t.text)
    for (const label of ['Numérico', 'Categórico', 'Temporal', 'Porcentaje (Progreso)', 'Porcentaje (Ratio)', 'Texto', 'Binario'])
      expect(all).toContain(label)
    expect(all.join(' ')).not.toMatch(/Desconocido/)
  })

  it('saves the file under the slugged title', async () => {
    await exportDashboardSpecPdf({ variant: variantWith(3), title: 'Ventas Región Q1', description: '' })
    expect(saved).toBe('dashboard-ventas-region-q1.pdf')
  })
})
