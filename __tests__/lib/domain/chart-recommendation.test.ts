import { recommendChart } from '@/lib/domain/chart-recommendation'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import { getRealLayoutDivisions } from '@/lib/layout-engine'
import type { Variable, VariableCombination, VariableType } from '@/types/dashboard'

const v = (type: VariableType, id: string = type): Variable => ({ id, name: id, type, priority: 'media' })
const combo = (measure: Variable, partner?: Variable): VariableCombination => ({
  id: 'c',
  name: 'c',
  chartType: 'metric',
  numericVariable: measure,
  ...(partner ? { categoricalVariable: partner } : {}),
})
const cell = (width: number, height = 1) => ({ width, height })

describe('recommendChart', () => {
  const numeric = v('numeric')
  const ratio = v('percentage-ratio')
  const progress = v('percentage-progress')
  const category = v('categorical')
  const binary = v('binary')
  const date = v('temporal')

  it.each([
    // [what, combination, cell, chart]
    ['trend in a normal cell', combo(numeric, date), cell(4), 'line'],
    ['trend in a wide cell', combo(numeric, date), cell(8), 'area'],
    ['trend in a narrow cell', combo(numeric, date), cell(2), 'line'],
    ['comparison across categories, wide', combo(numeric, category), cell(6), 'bar'],
    ['comparison across categories, narrow', combo(numeric, category), cell(3), 'horizontal-bar'],
    ['comparison across categories, tall', combo(numeric, category), cell(6, 2), 'horizontal-bar'],
    ['share across categories, room for a donut', combo(ratio, category), cell(4), 'donut'],
    ['share across categories, small cell', combo(ratio, category), cell(2), 'horizontal-bar'],
    ['progress per category', combo(progress, category), cell(6), 'horizontal-bar'],
    ['measure split in two groups', combo(numeric, binary), cell(2), 'bar'],
    ['share of one of two groups', combo(ratio, binary), cell(4), 'progress'],
    ['progress per two groups', combo(progress, binary), cell(4), 'horizontal-bar'],
    ['single measure', combo(numeric), cell(2), 'metric'],
    ['single ratio', combo(ratio), cell(2), 'progress'],
    ['single progress', combo(progress), cell(12), 'progress'],
    ['distribution of a category', combo(category), cell(4), 'horizontal-bar'],
    ['split of a yes/no variable', combo(binary), cell(4), 'progress'],
  ])('%s → %s', (_what, combination, size, chart) => {
    expect(recommendChart(combination, size)).toBe(chart)
  })

  it('without a cell, assumes a medium card', () => {
    expect(recommendChart(combo(numeric, category))).toBe('horizontal-bar')
    expect(recommendChart(combo(ratio, category))).toBe('donut')
    expect(recommendChart(combo(numeric, date))).toBe('line')
  })
})

describe('generated layouts', () => {
  const types: VariableType[] = ['numeric', 'categorical', 'temporal', 'percentage-ratio', 'binary', 'percentage-progress', 'numeric', 'categorical']

  it('pick each chart for the cell it lands in, never radial or pie', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const count = 2 + (seed % 7)
      const variables = types.slice(0, count).map((type, i) => v(type, `${type}-${i}`))
      const variant = generateSingleLayoutVariant(variables, [], [], { random: createSeededRandom(seed), now: () => seed })
      const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
      variant.combinations.forEach((c, i) => {
        expect({ seed, i, chart: c.chartType }).toEqual({ seed, i, chart: recommendChart(c, divisions[i]) })
        expect(['radial', 'pie']).not.toContain(c.chartType)
      })
    }
  })
})
