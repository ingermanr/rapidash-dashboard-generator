import { AXIS_FONT_SIZE, categoryAxis, chartDensity, compactNumber } from '@/components/dashboard-preview/charts/chart-scale'

describe('chartDensity', () => {
  it('scales by the room the chart really has, not by grid columns', () => {
    expect(chartDensity({ width: 140, height: 120 })).toBe('compact')
    expect(chartDensity({ width: 300, height: 130 })).toBe('compact')
    expect(chartDensity({ width: 320, height: 200 })).toBe('regular')
    expect(chartDensity({ width: 700, height: 360 })).toBe('roomy')
  })

  it('assumes a regular chart before it has been measured', () => {
    expect(chartDensity({ width: 0, height: 0 })).toBe('regular')
  })

  it('uses smaller axis text the less room there is', () => {
    expect(AXIS_FONT_SIZE.compact).toBeLessThan(AXIS_FONT_SIZE.regular)
    expect(AXIS_FONT_SIZE.regular).toBeLessThan(AXIS_FONT_SIZE.roomy)
  })
})

describe('compactNumber', () => {
  it('shortens axis numbers so they take less room', () => {
    expect(compactNumber(0)).toBe('0')
    expect(compactNumber(850)).toBe('850')
    expect(compactNumber(1500)).toBe('1,5k')
    expect(compactNumber(6000)).toBe('6k')
    expect(compactNumber(2_400_000)).toBe('2,4M')
  })
})

describe('categoryAxis', () => {
  it('fits the label column to the longest label, never more than 40% of the chart', () => {
    expect(categoryAxis(['Norte', 'Sur'], 9, 400).width).toBeLessThan(50)
    expect(categoryAxis(['Una categoría con un nombre muy largo'], 9, 140).width).toBeLessThanOrEqual(56)
  })

  it('leaves room for the tick and its gap, so short labels stay on one line', () => {
    const { width, format } = categoryAxis(['Cat A', 'Cat B'], 9, 140)
    expect(format('Cat A')).toBe('Cat A')
    expect(width).toBeGreaterThanOrEqual(Math.ceil(5 * 9 * 0.6) + 11)
  })

  it('shortens labels that do not fit with an ellipsis', () => {
    const { format } = categoryAxis(['Una categoría con un nombre muy largo', 'Sur'], 9, 140)
    expect(format('Sur')).toBe('Sur')
    expect(format('Una categoría con un nombre muy largo')).toMatch(/^Una.*…$/)
    expect(format('Una categoría con un nombre muy largo').length).toBeLessThan(15)
  })
})
