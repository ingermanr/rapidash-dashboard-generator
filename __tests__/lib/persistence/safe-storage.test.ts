import { createSafeStorage, type WriteResult } from '@/lib/persistence/safe-storage'

function fakeStorage(setItem: (key: string, value: string) => void): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      setItem(key, value)
      data.set(key, value)
    },
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  }
}

describe('createSafeStorage', () => {
  it('writes and reports ok', () => {
    const results: WriteResult[] = []
    const backing = fakeStorage(() => {})
    const storage = createSafeStorage(() => backing, (r) => results.push(r))

    storage.setItem('k', 'v')

    expect(storage.getItem('k')).toBe('v')
    expect(results).toEqual(['ok'])
  })

  it('reports a full storage instead of throwing', () => {
    const results: WriteResult[] = []
    const storage = createSafeStorage(
      () => fakeStorage(() => { throw new DOMException('full', 'QuotaExceededError') }),
      (r) => results.push(r),
    )

    expect(() => storage.setItem('k', 'v')).not.toThrow()
    expect(results).toEqual(['quota'])
  })

  it('recognises the Firefox quota error name', () => {
    const results: WriteResult[] = []
    const storage = createSafeStorage(
      () => fakeStorage(() => { throw new DOMException('full', 'NS_ERROR_DOM_QUOTA_REACHED') }),
      (r) => results.push(r),
    )

    storage.setItem('k', 'v')

    expect(results).toEqual(['quota'])
  })

  it('reports any other write failure as unavailable', () => {
    const results: WriteResult[] = []
    const storage = createSafeStorage(
      () => fakeStorage(() => { throw new DOMException('denied', 'SecurityError') }),
      (r) => results.push(r),
    )

    expect(() => storage.setItem('k', 'v')).not.toThrow()
    expect(results).toEqual(['unavailable'])
  })

  it('reads nothing and reports unavailable when the storage itself cannot be accessed', () => {
    const results: WriteResult[] = []
    const storage = createSafeStorage(() => { throw new DOMException('blocked', 'SecurityError') }, (r) => results.push(r))

    expect(storage.getItem('k')).toBeNull()
    expect(() => storage.setItem('k', 'v')).not.toThrow()
    expect(() => storage.removeItem('k')).not.toThrow()
    expect(results).toEqual(['unavailable'])
  })
})
