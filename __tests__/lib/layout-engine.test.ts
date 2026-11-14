import { analyzeLayoutQuality, getRealLayoutDivisions } from '@/lib/layout-engine'
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
})
