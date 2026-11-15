import {
  componentRows,
  diagramBoxes,
  pdfFileName,
  readableTextColor,
  variableRows,
} from '@/lib/pdf/spec-content'
import { CHART_TYPE_LABELS, VARIABLE_TYPE_LABELS } from '@/lib/domain/labels'
import { getRealLayoutDivisions } from '@/lib/layout-engine'
import type { LayoutVariant, Variable, VariableCombination, VariableType } from '@/types/dashboard'

const allTypes: VariableType[] = ['numeric', 'categorical', 'temporal', 'percentage-progress', 'percentage-ratio', 'text', 'binary']
const sales: Variable = { id: 's', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'r', name: 'Región', type: 'categorical', priority: 'media' }
const unused: Variable = { id: 'u', name: 'Comentario', type: 'text', priority: 'baja' }

function variant(layout: string, combinations: VariableCombination[], variables: Variable[] = [sales, region, unused]): LayoutVariant {
  return {
    id: 'v',
    layout,
    palette: { name: 'Aurora', colors: ['#8b5cf6', '#0d9488'], description: '' },
    variables,
    combinations,
    layoutDescription: '',
  }
}

const metric = (i: number): VariableCombination => ({
  id: `m${i}`,
  name: `Métrica ${i}`,
  chartType: 'metric',
  numericVariable: { ...sales, id: `n${i}`, name: `Métrica ${i}` },
})

describe('labels', () => {
  it('has a Spanish label for every variable type and chart type', () => {
    for (const type of allTypes) expect(VARIABLE_TYPE_LABELS[type]).toMatch(/^[A-ZÁÉÍÓÚ]/)
    expect(VARIABLE_TYPE_LABELS['percentage-ratio']).toBe('Porcentaje (Ratio)')
    expect(CHART_TYPE_LABELS['horizontal-bar']).toBe('Barras horizontales')
  })
})

describe('componentRows', () => {
  it('lists every component with its number, chart label, variables and grid size', () => {
    const combos: VariableCombination[] = [
      { id: 'a', name: 'Ventas por Región', chartType: 'horizontal-bar', numericVariable: sales, categoricalVariable: region },
      ...Array.from({ length: 19 }, (_, i) => metric(i)),
    ]
    const rows = componentRows(variant('Dashboard Grid', combos))
    const divisions = getRealLayoutDivisions('Dashboard Grid', 20)

    expect(rows).toHaveLength(20)
    expect(rows[0]).toEqual({
      number: 1,
      name: 'Ventas por Región',
      chart: 'Barras horizontales',
      variables: 'Ventas × Región',
      size: `${divisions[0].width} × ${divisions[0].height}`,
    })
    expect(rows[19]).toMatchObject({ number: 20, name: 'Métrica 18', chart: 'Métrica', variables: 'Métrica 18' })
  })
})

describe('variableRows', () => {
  it('lists every variable with type and priority labels and how many components use it', () => {
    const combos: VariableCombination[] = [
      { id: 'a', name: 'Ventas por Región', chartType: 'bar', numericVariable: sales, categoricalVariable: region },
      { id: 'b', name: 'Ventas', chartType: 'metric', numericVariable: sales },
    ]
    expect(variableRows(variant('Grid', combos))).toEqual([
      { name: 'Ventas', type: 'Numérico', priority: 'Alta', usedIn: 2 },
      { name: 'Región', type: 'Categórico', priority: 'Media', usedIn: 1 },
      { name: 'Comentario', type: 'Texto', priority: 'Baja', usedIn: 0 },
    ])
  })
})

describe('diagramBoxes', () => {
  const area = { x: 20, y: 40, width: 170, height: 110 }
  const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

  it.each([
    ['Dashboard Grid', 15],
    ['Masonry', 13],
    ['Grid', 5],
    ['Ultra Dense Grid', 30],
    ['Adaptive Flow', 20],
  ])('places one box per component for %s (%i) inside the area, without overlaps', (layout, count) => {
    const boxes = diagramBoxes(layout, count, area)

    expect(boxes.map((b) => b.number)).toEqual(Array.from({ length: count }, (_, i) => i + 1))
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(area.x)
      expect(box.y).toBeGreaterThanOrEqual(area.y)
      expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width + 1e-6)
      expect(box.y + box.height).toBeLessThanOrEqual(area.y + area.height + 1e-6)
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) expect({ i, j, overlap: overlaps(boxes[i], boxes[j]) }).toEqual({ i, j, overlap: false })
  })

  it('keeps the relative positions of the on-screen layout', () => {
    const boxes = diagramBoxes('Dashboard Grid', 7, area)
    const divisions = getRealLayoutDivisions('Dashboard Grid', 7)
    const order = (values: number[]) => values.map((v) => values.filter((other) => other < v).length)
    expect(order(boxes.map((b) => b.x))).toEqual(order(divisions.map((d) => d.x)))
    expect(order(boxes.map((b) => b.y))).toEqual(order(divisions.map((d) => d.y)))
  })
})

describe('readableTextColor', () => {
  it('picks white on dark fills and near-black on light fills', () => {
    expect(readableTextColor('#0054ee')).toBe('#ffffff')
    expect(readableTextColor('#facc15')).toBe('#0f172a')
  })
})

describe('pdfFileName', () => {
  it('slugs the title, accents included, and falls back for an empty title', () => {
    expect(pdfFileName('Ventas Región Q1')).toBe('dashboard-ventas-region-q1.pdf')
    expect(pdfFileName('')).toBe('dashboard-specification.pdf')
  })
})
