import { cn } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('cn function (className merger)', () => {
    it('should merge classes correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('should handle false conditions', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting classes by keeping the last one
      const result = cn('p-4', 'p-8')
      expect(result).toBe('p-8')
    })

    it('should handle array of classes', () => {
      const result = cn(['flex', 'items-center'], 'justify-center')
      expect(result).toBe('flex items-center justify-center')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class')
      expect(result).toBe('base-class another-class')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle complex conditional logic', () => {
      const variant = 'primary'
      const size = 'lg'
      const disabled = false

      const result = cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        disabled && 'btn-disabled'
      )

      expect(result).toBe('btn btn-primary btn-lg')
    })
  })
})