import { suggestCombinations, withExclusions } from '@/lib/domain/suggested-combinations'
import type { Variable } from '@/types/dashboard'

const v = (id: string, type: Variable['type'], priority: Variable['priority'] = 'media'): Variable => ({ id, name: id.toUpperCase(), type, priority })

describe('suggestCombinations', () => {
  it('pairs each measure with categories, binaries and dates, highest priority first, with stable ids', () => {
    const sales = v('sales', 'numeric', 'baja')
    const margin = v('margin', 'percentage-ratio', 'alta')
    const region = v('region', 'categorical')
    const churn = v('churn', 'binary')
    const month = v('month', 'temporal')

    const suggestions = suggestCombinations([sales, margin, region, churn, month])

    expect(suggestions.map((s) => s.text)).toEqual([
      'MARGIN por REGION',
      'MARGIN por CHURN',
      'MARGIN en MONTH',
      'SALES por REGION',
      'SALES por CHURN',
      'SALES en MONTH',
    ])
    expect(suggestions[0]).toEqual({ id: 'combo-margin-region', text: 'MARGIN por REGION', maxPriority: 1, variableIds: ['margin', 'region'] })
  })

  it('suggests a lone measure only when there is nothing to pair it with', () => {
    expect(suggestCombinations([v('sales', 'numeric')]).map((s) => s.text)).toEqual(['SALES'])
    expect(suggestCombinations([v('notes', 'text')])).toEqual([])
  })
})

describe('withExclusions', () => {
  it('marks excluded suggestions and numbers the active ones in order', () => {
    const suggestions = suggestCombinations([v('a', 'numeric'), v('b', 'categorical'), v('c', 'categorical'), v('d', 'temporal')])
    const marked = withExclusions(suggestions, [{ id: 'x', description: '', variableIds: ['c', 'a'] }])

    expect(marked.map((m) => [m.text, m.excluded, m.activeNumber])).toEqual([
      ['A por B', false, 1],
      ['A por C', true, null],
      ['A en D', false, 2],
    ])
  })
})
