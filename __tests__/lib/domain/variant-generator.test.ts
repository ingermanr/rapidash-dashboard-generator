import { createSeededRandom, pickRandom } from '@/lib/domain/random'
import {
  generateCombinations,
  generateSingleLayoutVariant,
  getLayoutDescription,
  getSuitableLayouts,
  sortCombinationsByPriority,
  type GeneratorDeps,
} from '@/lib/domain/variant-generator'
import type { LayoutVariant, Variable, VariableCombination } from '@/types/dashboard'

const variable = (id: string, type: Variable['type'], priority: Variable['priority'] = 'media'): Variable => ({
  id,
  name: id,
  type,
  priority,
})

const seededDeps = (seed: number): GeneratorDeps => ({ random: createSeededRandom(seed), now: () => 1_700_000_000_000 })

const pairIds = (combination: VariableCombination) =>
  [combination.numericVariable.id, combination.categoricalVariable?.id].filter(Boolean).sort().join('+')

describe('createSeededRandom', () => {
  it('yields the same sequence for the same seed', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b))
  })

  it('yields different sequences for different seeds', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)())
  })

  it('stays within [0, 1)', () => {
    const random = createSeededRandom(7)
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('pickRandom returns an element of the array', () => {
    const items = ['a', 'b', 'c']
    const random = createSeededRandom(3)
    for (let i = 0; i < 20; i++) expect(items).toContain(pickRandom(items, random))
  })
})

describe('generateCombinations', () => {
  const sales = variable('sales', 'numeric')
  const region = variable('region', 'categorical')
  const date = variable('date', 'temporal')
  const active = variable('active', 'binary')

  it('crosses numeric variables with categorical, temporal and binary ones', () => {
    const combinations = generateCombinations([sales, region, date, active], [], seededDeps(1))
    expect(combinations.map(pairIds).sort()).toEqual(['active+sales', 'date+sales', 'region+sales'])
  })

  it('only uses line or area charts for temporal combinations', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const [combination] = generateCombinations([sales, date], [], seededDeps(seed))
      expect(['line', 'area']).toContain(combination.chartType)
    }
  })

  it('uses a progress chart for percentage-progress variables', () => {
    const progress = variable('completion', 'percentage-progress')
    const [combination] = generateCombinations([progress, region], [], seededDeps(1))
    expect(combination.chartType).toBe('progress')
  })

  it('skips excluded pairs regardless of id order', () => {
    const combinations = generateCombinations(
      [sales, region, date],
      [{ id: 'x', description: 'no', variableIds: ['region', 'sales'] }],
      seededDeps(1),
    )
    expect(combinations.map(pairIds)).toEqual(['date+sales'])
  })

  it('shows standalone numeric metrics when there is nothing to cross them with', () => {
    const combinations = generateCombinations([sales], [], seededDeps(1))
    expect(combinations).toHaveLength(1)
    expect(combinations[0].chartType).toBe('metric')
  })

  it('shows standalone distributions for categorical variables without numerics', () => {
    const [combination] = generateCombinations([region], [], seededDeps(1))
    expect(['pie', 'donut', 'radial']).toContain(combination.chartType)
    expect(combination.name).toBe('Distribución de region')
  })

  it('is reproducible with the same seed', () => {
    const vars = [sales, region, date, active]
    expect(generateCombinations(vars, [], seededDeps(9))).toEqual(generateCombinations(vars, [], seededDeps(9)))
  })
})

describe('sortCombinationsByPriority', () => {
  it('puts combinations with higher-priority variables first', () => {
    const low = variable('low', 'numeric', 'baja')
    const high = variable('high', 'numeric', 'alta')
    const region = variable('region', 'categorical', 'baja')
    const combinations = generateCombinations([low, high, region], [], seededDeps(1))
    const sorted = sortCombinationsByPriority(combinations, seededDeps(1))
    expect(sorted[0].numericVariable.id).toBe('high')
  })
})

describe('getSuitableLayouts', () => {
  it.each([1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 25])('offers layouts for %i combinations', (count) => {
    expect(getSuitableLayouts(count).length).toBeGreaterThan(0)
  })
})

describe('generateSingleLayoutVariant', () => {
  const vars = [variable('sales', 'numeric', 'alta'), variable('region', 'categorical'), variable('date', 'temporal')]

  it('is fully reproducible with the same seed and clock', () => {
    expect(generateSingleLayoutVariant(vars, [], [], seededDeps(5))).toEqual(
      generateSingleLayoutVariant(vars, [], [], seededDeps(5)),
    )
  })

  it('builds a variant from the generated combinations', () => {
    const variant = generateSingleLayoutVariant(vars, [], [], seededDeps(5))
    expect(variant.variables).toBe(vars)
    expect(variant.combinations).toHaveLength(2)
    expect(variant.palette.colors.length).toBeGreaterThan(0)
    expect(variant.layoutDescription).toBe(getLayoutDescription(variant.layout, 2))
  })

  it('avoids repeating the palettes of recent variants', () => {
    const history: LayoutVariant[] = []
    for (let i = 0; i < 4; i++) {
      history.push(generateSingleLayoutVariant(vars, history, [], seededDeps(100 + i)))
    }
    const recent = history.map((variant) => variant.palette.name)
    const next = generateSingleLayoutVariant(vars, history, [], seededDeps(200))
    expect(recent).not.toContain(next.palette.name)
  })
})
