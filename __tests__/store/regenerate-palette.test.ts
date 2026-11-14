import { act } from '@testing-library/react'
import { useDashboardStore } from '@/store'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const vars: Variable[] = [
  { id: 'a', name: 'Ventas', type: 'numeric', priority: 'alta' },
  { id: 'b', name: 'Region', type: 'categorical', priority: 'media' },
]
const v1 = generateSingleLayoutVariant(vars, [], [], { random: createSeededRandom(1), now: () => 1 })
const v2 = generateSingleLayoutVariant(vars, [v1], [], { random: createSeededRandom(2), now: () => 2 })

describe('regenerateVariantPalette', () => {
  beforeEach(() => {
    act(() => {
      useDashboardStore.getState().reset()
      useDashboardStore.setState({ generationHistory: [v1, v2], currentVariant: v2, selectedVariant: v2 })
    })
  })

  it('swaps the palette of the variant everywhere it appears and keeps its layout', () => {
    act(() => useDashboardStore.getState().regenerateVariantPalette(v2.id))
    const { generationHistory, currentVariant, selectedVariant } = useDashboardStore.getState()

    expect(currentVariant?.palette.name).not.toBe(v2.palette.name)
    expect(selectedVariant).toEqual(currentVariant)
    expect(generationHistory[1]).toEqual(currentVariant)
    expect({ ...currentVariant, palette: v2.palette }).toEqual(v2)
  })

  it('leaves other variants untouched', () => {
    act(() => useDashboardStore.getState().regenerateVariantPalette(v2.id))
    expect(useDashboardStore.getState().generationHistory[0]).toEqual(v1)
  })

  it('ignores unknown ids', () => {
    const before = useDashboardStore.getState()
    act(() => useDashboardStore.getState().regenerateVariantPalette('missing'))
    expect(useDashboardStore.getState().generationHistory).toBe(before.generationHistory)
  })
})
