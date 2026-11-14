import { render } from '@testing-library/react'
import { DashboardDetailedPreview } from '@/components/dashboard-detailed-preview'
import type { LayoutVariant, Variable } from '@/types/dashboard'

jest.mock('@/store', () => ({
  useDashboardInfo: () => ({ dashboardTitle: 'Stability', dashboardDescription: '' }),
}))

const revenue: Variable = { id: 'var-revenue', name: 'Ingresos', type: 'numeric', priority: 'alta' }
const completion: Variable = { id: 'var-completion', name: 'Avance', type: 'percentage-progress', priority: 'media' }

const variant: LayoutVariant = {
  id: 'variant-1',
  layout: 'Split View',
  palette: { name: 'Ocean Blue', colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#1E40AF'], description: '' },
  variables: [revenue, completion],
  combinations: [
    { id: 'combo-metric', numericVariable: revenue, name: 'Ingresos', chartType: 'metric' },
    { id: 'combo-progress', numericVariable: completion, name: 'Avance', chartType: 'progress' },
  ],
  layoutDescription: '',
}

describe('DashboardDetailedPreview sample data', () => {
  it('keeps the same sample values across re-renders', () => {
    const { container, rerender } = render(<DashboardDetailedPreview variant={variant} />)
    const before = container.textContent

    for (let i = 0; i < 5; i++) rerender(<DashboardDetailedPreview variant={{ ...variant }} />)

    expect(container.textContent).toBe(before)
  })
})
