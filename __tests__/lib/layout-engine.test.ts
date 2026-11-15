import { analyzeLayoutQuality, calculateSpaceUtilization, fillEmptySpace, getGridDimensions, getRealLayoutDivisions } from '@/lib/layout-engine'
import { getSuitableLayouts } from '@/lib/domain/variant-generator'

describe('layout engine coverage', () => {
  const counts = Array.from({ length: 30 }, (_, i) => i + 1)

  it.each(counts)('produces one non-overlapping division per combination for every suitable layout (%i)', (count) => {
    for (const layout of getSuitableLayouts(count)) {
      const divisions = getRealLayoutDivisions(layout, count)
      const quality = analyzeLayoutQuality(divisions)
      expect({ layout, count, divisions: divisions.length, overlaps: quality.hasOverlaps }).toEqual({
        layout,
        count,
        divisions: count,
        overlaps: false,
      })
    }
  })

  it.each(counts)('fills the whole grid with no empty cells for every suitable layout (%i)', (count) => {
    for (const layout of getSuitableLayouts(count)) {
      const divisions = getRealLayoutDivisions(layout, count)
      expect({ layout, count, utilization: calculateSpaceUtilization(divisions) }).toEqual({ layout, count, utilization: 100 })
    }
  })
})

/** Layouts older versions generated: saved, imported and shared dashboards can still contain them. */
const LEGACY_LAYOUTS = ['F-Pattern', 'Z-Pattern', 'Dashboard Classic', 'Pinned Sidebar', 'Ultra Dense Grid', 'Adaptive Flow', 'Hierarchical Dense']

describe('legacy layouts', () => {
  it.each(LEGACY_LAYOUTS)('%s still renders one card per combination, inside the grid and without overlaps', (layout) => {
    for (let count = 1; count <= 30; count++) {
      const divisions = getRealLayoutDivisions(layout, count)
      const quality = analyzeLayoutQuality(divisions)
      const inside = divisions.every((d) => d.x >= 0 && d.y >= 0 && d.width > 0 && d.height > 0 && d.x + d.width <= 12)
      expect({ layout, count, divisions: divisions.length, overlaps: quality.hasOverlaps, inside }).toEqual({
        layout,
        count,
        divisions: count,
        overlaps: false,
        inside: true,
      })
    }
  })
})

describe('fillEmptySpace', () => {
  it('stretches a lone card across the full width', () => {
    expect(fillEmptySpace([{ x: 0, y: 0, width: 4, height: 1 }])).toEqual([{ x: 0, y: 0, width: 12, height: 1 }])
  })

  it('splits an incomplete row evenly instead of growing only the last card', () => {
    const divisions = fillEmptySpace([
      { x: 0, y: 0, width: 4, height: 1 },
      { x: 4, y: 0, width: 4, height: 1 },
      { x: 8, y: 0, width: 4, height: 1 },
      { x: 0, y: 1, width: 4, height: 1 },
      { x: 4, y: 1, width: 4, height: 1 },
    ])
    expect(divisions.slice(3)).toEqual([
      { x: 0, y: 1, width: 6, height: 1 },
      { x: 6, y: 1, width: 6, height: 1 },
    ])
  })

  it('keeps the dashboard height and the number of cards', () => {
    const input = [
      { x: 0, y: 0, width: 8, height: 2 },
      { x: 8, y: 0, width: 4, height: 1 },
    ]
    const output = fillEmptySpace(input)
    expect(output).toHaveLength(2)
    expect(getGridDimensions(output).maxRows).toBe(2)
    expect(calculateSpaceUtilization(output)).toBe(100)
  })

  it('does not mutate its input', () => {
    const input = [{ x: 0, y: 0, width: 4, height: 1 }]
    fillEmptySpace(input)
    expect(input).toEqual([{ x: 0, y: 0, width: 4, height: 1 }])
  })
})
