import {
  calculateMedian,
  calculateStdDev,
  generateBarData,
  generateCategoriesForVariable,
  generateLineData,
  generateMetricForVariable,
  generateMetricValue,
  generatePieData,
  generateProgressValue,
  generateRadialData,
  getTimePointsFromCombination,
  hashString,
  randomFor,
} from '@/lib/domain/sample-data'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable, VariableCombination } from '@/types/dashboard'

const variable = (name: string, type: Variable['type']): Variable => ({ id: `id-${name}`, name, type, priority: 'media' })
const combo = (numeric: Variable, categorical?: Variable): VariableCombination => ({
  id: `combo-${numeric.name}-${categorical?.name ?? 'solo'}`,
  numericVariable: numeric,
  categoricalVariable: categorical,
  name: numeric.name,
  chartType: 'bar',
})

describe('seeding helpers', () => {
  it('hashString is stable and distinguishes keys', () => {
    expect(hashString('combo-1')).toBe(hashString('combo-1'))
    expect(hashString('combo-1')).not.toBe(hashString('combo-2'))
  })

  it('randomFor yields the same sequence for the same key', () => {
    const a = randomFor('combo-1')
    const b = randomFor('combo-1')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe('statistics', () => {
  it('calculateMedian handles odd and even lengths', () => {
    expect(calculateMedian([3, 1, 2])).toBe(2)
    expect(calculateMedian([4, 1, 3, 2])).toBe(2)
  })

  it('calculateStdDev returns the floored population standard deviation', () => {
    expect(calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
  })
})

describe('generateCategoriesForVariable', () => {
  it.each([
    ['Region', 'categorical', ['Norte', 'Sur', 'Este', 'Oeste', 'Centro']],
    ['Canal', 'categorical', ['Online', 'Tienda', 'Móvil', 'Tel', 'Email']],
    ['Activo', 'binary', ['Activo', 'Inactivo']],
    ['Otro', 'binary', ['Sí', 'No']],
    ['Cualquiera', 'categorical', ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E']],
  ] as const)('maps %s (%s) to domain categories', (name, type, expected) => {
    expect(generateCategoriesForVariable(variable(name, type))).toEqual(expected)
  })
})

describe('chart data', () => {
  const sales = variable('Ventas', 'numeric')
  const region = variable('Region', 'categorical')

  it('bar data has one bounded value per category', () => {
    const data = generateBarData(combo(sales, region), createSeededRandom(1))
    expect(data.map((d) => d.name)).toEqual(['Norte', 'Sur', 'Este', 'Oeste', 'Centro'])
    for (const d of data) {
      expect(d.value).toBeGreaterThanOrEqual(1000)
      expect(d.value).toBeLessThan(6000)
    }
  })

  it('line data follows the time points implied by variable names', () => {
    expect(getTimePointsFromCombination(combo(variable('Ventas mes', 'numeric')))).toEqual(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'])
    const quarterly = variable('Ventas trimestre', 'numeric')
    expect(getTimePointsFromCombination(combo(quarterly))).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(generateLineData(combo(quarterly), createSeededRandom(1)).map((d) => d.name)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  it('pie values stay between 20 and 119', () => {
    for (const d of generatePieData(combo(sales, region), createSeededRandom(2))) {
      expect(d.value).toBeGreaterThanOrEqual(20)
      expect(d.value).toBeLessThan(120)
    }
  })

  it('radial data uses at most five categories and cycles the palette', () => {
    const data = generateRadialData(combo(sales, region), ['#111', '#222'], createSeededRandom(3))
    expect(data).toHaveLength(5)
    expect(data.map((d) => d.fill)).toEqual(['#111', '#222', '#111', '#222', '#111'])
  })

  it('is reproducible for the same seed', () => {
    expect(generateBarData(combo(sales, region), createSeededRandom(9))).toEqual(
      generateBarData(combo(sales, region), createSeededRandom(9)),
    )
  })
})

describe('headline values', () => {
  it('progress stays between 50 and 89', () => {
    const random = createSeededRandom(4)
    for (let i = 0; i < 200; i++) {
      const value = generateProgressValue(random)
      expect(value).toBeGreaterThanOrEqual(50)
      expect(value).toBeLessThanOrEqual(89)
    }
  })

  it('metric change is a one-decimal percentage between -10 and 20', () => {
    const { value, change } = generateMetricValue(createSeededRandom(5))
    expect(value).toBeGreaterThanOrEqual(10000)
    expect(change).toMatch(/^-?\d+\.\d$/)
    expect(Number(change)).toBeGreaterThanOrEqual(-10)
    expect(Number(change)).toBeLessThanOrEqual(20)
  })
})

describe('generateMetricForVariable', () => {
  it('returns one of the numeric aggregations', () => {
    const metric = generateMetricForVariable(variable('Ventas', 'numeric'), createSeededRandom(6))
    expect(['Total', 'Promedio', 'Mediana', 'Desv. Estándar']).toContain(metric.label)
  })

  it('reports the top category for categorical variables', () => {
    const metric = generateMetricForVariable(variable('Region', 'categorical'), createSeededRandom(6))
    expect(metric.label).toBe('Categoría Principal')
    expect(['Norte', 'Sur', 'Este', 'Oeste', 'Centro']).toContain(metric.value)
  })

  it('formats percentage variables', () => {
    expect(generateMetricForVariable(variable('Avance', 'percentage-progress'), createSeededRandom(1)).value).toMatch(/^\d+%$/)
    expect(generateMetricForVariable(variable('Cuota', 'percentage-ratio'), createSeededRandom(1)).value).toMatch(/^\d+%$/)
  })
})
