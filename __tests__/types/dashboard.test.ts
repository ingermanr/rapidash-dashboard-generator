import type { 
  Variable, 
  VariableCombination, 
  ColorPalette, 
  LayoutVariant, 
  VariableType 
} from '@/types/dashboard'

describe('Dashboard Types', () => {
  describe('Variable Type', () => {
    it('should accept all valid variable types', () => {
      const validTypes: VariableType[] = [
        'numeric',
        'categorical', 
        'temporal',
        'percentage-progress',
        'percentage-ratio',
        'text',
        'binary'
      ]

      // Verificar que todos los tipos son válidos
      expect(validTypes).toHaveLength(7)
      expect(validTypes).toContain('numeric')
      expect(validTypes).toContain('categorical')
      expect(validTypes).toContain('temporal')
      expect(validTypes).toContain('percentage-progress')
      expect(validTypes).toContain('percentage-ratio')
      expect(validTypes).toContain('text')
      expect(validTypes).toContain('binary')
    })
  })

  describe('Variable Interface', () => {
    it('should create a valid Variable object', () => {
      const variable: Variable = {
        id: 'var-1',
        name: 'Sales',
        type: 'numeric',
        priority: 'alta'
      }

      expect(variable.id).toBe('var-1')
      expect(variable.name).toBe('Sales')
      expect(variable.type).toBe('numeric')
    })
  })

  describe('VariableCombination Interface', () => {
    it('should create a valid VariableCombination object', () => {
      const numericVar: Variable = {
        id: 'var-1',
        name: 'Sales',
        type: 'numeric',
        priority: 'alta'
      }

      const categoricalVar: Variable = {
        id: 'var-2',
        name: 'Region',
        type: 'categorical',
        priority: 'media'
      }

      const combination: VariableCombination = {
        id: 'combo-1',
        numericVariable: numericVar,
        categoricalVariable: categoricalVar,
        name: 'Sales by Region',
        chartType: 'bar'
      }

      expect(combination.id).toBe('combo-1')
      expect(combination.numericVariable).toEqual(numericVar)
      expect(combination.categoricalVariable).toEqual(categoricalVar)
      expect(combination.name).toBe('Sales by Region')
      expect(combination.chartType).toBe('bar')
    })

    it('should accept all valid chart types', () => {
      const numericVar: Variable = {
        id: 'var-1',
        name: 'Sales',
        type: 'numeric',
        priority: 'alta'
      }

      const validChartTypes = [
        'bar', 'horizontal-bar', 'line', 'pie', 
        'area', 'donut', 'radial', 'progress', 'metric'
      ]

      validChartTypes.forEach(chartType => {
        const combination: VariableCombination = {
          id: 'combo-1',
          numericVariable: numericVar,
          name: `Test ${chartType}`,
          chartType: chartType as any
        }

        expect(combination.chartType).toBe(chartType)
      })
    })
  })

  describe('ColorPalette Interface', () => {
    it('should create a valid ColorPalette object', () => {
      const palette: ColorPalette = {
        name: 'Ocean Blue',
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
        description: 'A calming blue palette inspired by ocean depths'
      }

      expect(palette.name).toBe('Ocean Blue')
      expect(palette.colors).toHaveLength(4)
      expect(palette.description).toBe('A calming blue palette inspired by ocean depths')
    })
  })

  describe('LayoutVariant Interface', () => {
    it('should create a valid LayoutVariant object', () => {
      const variables: Variable[] = [
        { id: 'var-1', name: 'Sales', type: 'numeric', priority: 'alta' },
        { id: 'var-2', name: 'Region', type: 'categorical', priority: 'media' }
      ]

      const combinations: VariableCombination[] = [
        {
          id: 'combo-1',
          numericVariable: variables[0],
          categoricalVariable: variables[1],
          name: 'Sales by Region',
          chartType: 'bar'
        }
      ]

      const palette: ColorPalette = {
        name: 'Professional',
        colors: ['#1f2937', '#374151', '#6b7280'],
        description: 'Professional color scheme'
      }

      const layoutVariant: LayoutVariant = {
        id: 'layout-1',
        layout: 'grid-2x2',
        palette: palette,
        variables: variables,
        combinations: combinations,
        layoutDescription: 'A balanced 2x2 grid layout'
      }

      expect(layoutVariant.id).toBe('layout-1')
      expect(layoutVariant.layout).toBe('grid-2x2')
      expect(layoutVariant.palette).toEqual(palette)
      expect(layoutVariant.variables).toEqual(variables)
      expect(layoutVariant.combinations).toEqual(combinations)
      expect(layoutVariant.layoutDescription).toBe('A balanced 2x2 grid layout')
    })
  })
})