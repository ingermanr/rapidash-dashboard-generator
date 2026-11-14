import { exportDashboardSpecPdf } from '@/lib/pdf/dashboard-spec-pdf'
import { getRealLayoutDivisions } from '@/lib/layout-engine'
import type { LayoutVariant, Variable, VariableCombination } from '@/types/dashboard'

type Call = [string, ...unknown[]]
const calls: Call[] = []

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() =>
    new Proxy({ internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } } } as Record<string, unknown>, {
      get(target, prop: string) {
        if (prop in target) return target[prop]
        return (...args: unknown[]) => {
          calls.push([prop, ...args])
          if (prop === 'splitTextToSize') return [String(args[0])]
          if (prop === 'getTextWidth') return String(args[0]).length * 2
          return undefined
        }
      },
    }),
  ),
}))

type Box = { x: number; y: number; w: number; h: number }

/**
 * Component boxes in the layout diagram are a gray-filled rect (220, 220, 220) followed by a
 * stroked rect with the same geometry.
 */
function diagramBoxes(): Box[] {
  const boxes: Box[] = []
  let gray = false
  let lastFill: unknown[] | null = null
  for (const [name, ...args] of calls) {
    if (name === 'setFillColor') gray = args[0] === 220 && args[1] === 220 && args[2] === 220
    if (name !== 'rect') continue
    if (args[4] === 'F') lastFill = gray ? args : null
    else if (args[4] === 'S' && lastFill && lastFill.slice(0, 4).every((v, k) => v === args[k])) {
      const [x, y, w, h] = args as number[]
      boxes.push({ x, y, w, h })
      lastFill = null
    } else lastFill = null
  }
  return boxes
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const numeric = (i: number): Variable => ({ id: `n${i}`, name: `Metrica ${i}`, type: 'numeric', priority: 'media' })

function variantWith(layout: string, count: number): LayoutVariant {
  const combinations: VariableCombination[] = Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    numericVariable: numeric(i),
    name: `Metrica ${i}`,
    chartType: 'metric',
  }))
  return {
    id: 'v',
    layout,
    palette: { name: 'Ocean Blue', colors: ['#3B82F6', '#60A5FA', '#93C5FD'], description: '' },
    variables: combinations.map((c) => c.numericVariable),
    combinations,
    layoutDescription: '',
  }
}

describe('exportDashboardSpecPdf layout diagram', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each([
    ['Dashboard Grid', 15],
    ['Masonry', 13],
    ['Grid', 5],
    ['Ultra Dense Grid', 30],
    ['Adaptive Flow', 20],
  ])('draws one separate box per component for %s with %i components', async (layout, count) => {
    await exportDashboardSpecPdf({ variant: variantWith(layout, count), title: 'T', description: 'D' })

    const boxes = diagramBoxes()
    expect(boxes).toHaveLength(count)
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) expect({ i, j, overlap: overlaps(boxes[i], boxes[j]) }).toEqual({ i, j, overlap: false })
  })

  it('places boxes in the same relative positions as the on-screen layout', async () => {
    await exportDashboardSpecPdf({ variant: variantWith('Dashboard Grid', 7), title: 'T', description: 'D' })

    const boxes = diagramBoxes()
    const divisions = getRealLayoutDivisions('Dashboard Grid', 7)
    const order = (values: number[]) => values.map((v) => values.filter((other) => other < v).length)
    expect(order(boxes.map((b) => b.x))).toEqual(order(divisions.map((d) => d.x)))
    expect(order(boxes.map((b) => b.y))).toEqual(order(divisions.map((d) => d.y)))
  })
})
