import {
  sanitizeExcludedCombination,
  sanitizePersistedState,
  sanitizeSavedDashboards,
  sanitizeVariable,
  sanitizeVariant,
} from '@/lib/domain/sanitize'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'region', name: 'Region', type: 'categorical', priority: 'media' }
const variant = generateSingleLayoutVariant([sales, region], [], [], { random: createSeededRandom(1), now: () => 1 })
// What JSON storage gives back: no undefined keys, plain objects.
const stored = <T>(value: T): T => JSON.parse(JSON.stringify(value))

describe('sanitize', () => {
  it('keeps valid data unchanged', () => {
    expect(sanitizeVariable(sales)).toEqual(sales)
    expect(sanitizeVariant(stored(variant))).toEqual(stored(variant))
    const state = {
      dashboardTitle: 'T',
      dashboardDescription: 'D',
      variables: [sales],
      excludedCombinations: [{ id: 'e', description: 'x', variableIds: ['sales'] }],
      generationHistory: [variant],
      selectedVariant: variant,
      savedDashboards: [{ id: 'a', title: 'A', description: '', variables: [sales], excludedCombinations: [], generationHistory: [variant], createdAt: 1, updatedAt: 2 }],
      activeDashboardId: 'a',
    }
    expect(sanitizePersistedState(stored(state))).toEqual(stored(state))
  })

  it('rejects variables with an unknown type or priority, or without id', () => {
    expect(sanitizeVariable({ ...sales, type: 'imaginario' })).toBeNull()
    expect(sanitizeVariable({ ...sales, priority: 'urgente' })).toBeNull()
    expect(sanitizeVariable({ ...sales, id: '' })).toBeNull()
    expect(sanitizeVariable('Ventas')).toBeNull()
  })

  it('rejects exclusions without a list of variable ids', () => {
    expect(sanitizeExcludedCombination({ id: 'e', variableIds: [1, 2] })).toBeNull()
    expect(sanitizeExcludedCombination({ id: 'e', variableIds: ['a'] })).toEqual({ id: 'e', description: '', variableIds: ['a'] })
  })

  it('drops a variant as a whole when its palette or any combination is unusable', () => {
    expect(sanitizeVariant({ ...stored(variant), palette: { name: 'x', colors: [] } })).toBeNull()
    expect(sanitizeVariant({ ...stored(variant), combinations: [...stored(variant).combinations, { id: 'c' }] })).toBeNull()
    expect(sanitizeVariant({ ...stored(variant), combinations: 'no' })).toBeNull()
    expect(sanitizeVariant({ ...stored(variant), palette: { ...variant.palette, darkColors: 'no' } })?.palette.darkColors).toBeUndefined()
  })

  it('keeps the first saved dashboard when two share an id and drops entries without id', () => {
    const list = sanitizeSavedDashboards([{ id: 'a', title: 'Primero' }, { id: 'a', title: 'Duplicado' }, { title: 'Sin id' }, 3])
    expect(list.map((d) => [d.id, d.title])).toEqual([['a', 'Primero']])
  })

  it('turns anything that is not an object into an empty state', () => {
    for (const value of [null, undefined, 'texto', 5, []]) {
      expect(sanitizePersistedState(value)).toEqual({
        dashboardTitle: '',
        dashboardDescription: '',
        variables: [],
        excludedCombinations: [],
        generationHistory: [],
        selectedVariant: null,
        savedDashboards: [],
        activeDashboardId: null,
      })
    }
  })
})
