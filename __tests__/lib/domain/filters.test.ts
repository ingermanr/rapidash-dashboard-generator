import {
  ALL_VALUES,
  NO_FILTERS,
  PERIOD_TIME_POINTS,
  chartRandom,
  filterChartData,
  filterSeedKey,
  setFilter,
  timePointsFor,
} from '@/lib/domain/filters'
import { randomFor } from '@/lib/domain/sample-data'
import type { Variable, VariableCombination } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const date: Variable = { id: 'date', name: 'Fecha', type: 'temporal', priority: 'media' }
const byRegion: VariableCombination = { id: 'c1', numericVariable: sales, categoricalVariable: region, name: 'x', chartType: 'bar' }
const overTime: VariableCombination = { id: 'c2', numericVariable: sales, categoricalVariable: date, name: 'y', chartType: 'line' }
const rows = [{ name: 'Norte', value: 1 }, { name: 'Sur', value: 2 }]

describe('setFilter', () => {
  it('sets a value without mutating the previous filters', () => {
    const next = setFilter(NO_FILTERS, 'region', 'Sur')
    expect(next).toEqual({ region: 'Sur' })
    expect(NO_FILTERS).toEqual({})
  })

  it('removes the filter when "all" is selected', () => {
    expect(setFilter({ region: 'Sur', date: 'last-year' }, 'region', ALL_VALUES)).toEqual({ date: 'last-year' })
  })
})

describe('filterSeedKey and chartRandom', () => {
  it('leaves the key unchanged without filters, so unfiltered data stays the same', () => {
    expect(filterSeedKey('c1', NO_FILTERS)).toBe('c1')
    expect(chartRandom('c1', NO_FILTERS)()).toBe(randomFor('c1')())
  })

  it('changes the data when a filter is active and ignores filter order', () => {
    expect(chartRandom('c1', { region: 'Sur' })()).not.toBe(randomFor('c1')())
    expect(filterSeedKey('c1', { a: '1', b: '2' })).toBe(filterSeedKey('c1', { b: '2', a: '1' }))
  })
})

describe('filterChartData', () => {
  it('keeps only the selected category for charts that break down by it', () => {
    expect(filterChartData(rows, byRegion, { region: 'Sur' })).toEqual([{ name: 'Sur', value: 2 }])
  })

  it('leaves charts over other dimensions untouched', () => {
    expect(filterChartData(rows, byRegion, { other: 'Sur' })).toBe(rows)
    expect(filterChartData(rows, overTime, { date: 'last-year' })).toBe(rows)
  })
})

describe('timePointsFor', () => {
  it('uses the period of a filtered temporal variable', () => {
    expect(timePointsFor(overTime, { date: 'last-7-days' })).toEqual([...PERIOD_TIME_POINTS['last-7-days']])
    expect(timePointsFor(overTime, { date: 'last-year' })).toHaveLength(12)
  })

  it('returns undefined when there is no period filter for the chart', () => {
    expect(timePointsFor(overTime, NO_FILTERS)).toBeUndefined()
    expect(timePointsFor(byRegion, { region: 'Sur' })).toBeUndefined()
  })
})
