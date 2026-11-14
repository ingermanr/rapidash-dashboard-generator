import {
  EXPORT_FORMAT,
  MAX_IMPORT_BYTES,
  buildExport,
  exportFileName,
  parseImport,
} from '@/lib/domain/dashboard-transfer'
import type { SavedDashboard } from '@/lib/domain/saved-dashboards'
import type { Variable } from '@/types/dashboard'

const sales: Variable = { id: 'sales', name: 'Ventas', type: 'numeric', priority: 'alta' }

function dashboard(id: string, title: string): SavedDashboard {
  return { id, title, description: '', variables: [sales], excludedCombinations: [], generationHistory: [], createdAt: 1, updatedAt: 2 }
}

const deps = (ids: string[] = ['n1', 'n2', 'n3']) => {
  const queue = [...ids]
  return { now: () => 500, createId: () => queue.shift()! }
}

describe('buildExport', () => {
  it('wraps dashboards with the format marker, version and export time', () => {
    expect(buildExport([dashboard('a', 'Ventas')], () => 123)).toEqual({
      format: EXPORT_FORMAT,
      version: 1,
      exportedAt: 123,
      dashboards: [dashboard('a', 'Ventas')],
    })
  })
})

describe('exportFileName', () => {
  it('uses the title for a single dashboard and the date for several', () => {
    expect(exportFileName([dashboard('a', 'Ventas Q1 / 2026')], new Date('2026-11-14T10:00:00Z'))).toBe('dashboard-ventas-q1-2026.json')
    expect(exportFileName([dashboard('a', '  ')], new Date('2026-11-14T10:00:00Z'))).toBe('dashboard-sin-titulo.json')
    expect(exportFileName([dashboard('a', 'A'), dashboard('b', 'B')], new Date('2026-11-14T10:00:00Z'))).toBe('dashboards-2026-11-14.json')
  })
})

describe('parseImport', () => {
  const file = (dashboards: unknown[], extra: object = {}) =>
    JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: 1, dashboards, ...extra })

  it('round-trips an export', () => {
    const text = JSON.stringify(buildExport([dashboard('a', 'Ventas'), dashboard('b', 'Marketing')]))
    const result = parseImport(text, [], deps())
    expect(result).toEqual({
      ok: true,
      discarded: 0,
      dashboards: [
        { ...dashboard('a', 'Ventas'), updatedAt: 500 },
        { ...dashboard('b', 'Marketing'), updatedAt: 500 },
      ],
    })
  })

  it('gives a new id to dashboards that clash with existing ones or with each other, never overwriting', () => {
    const result = parseImport(file([dashboard('a', 'Importado'), dashboard('b', 'B'), dashboard('b', 'B otra vez')]), [dashboard('a', 'Existente')], deps())
    expect(result.ok && result.dashboards.map((d) => [d.id, d.title])).toEqual([
      ['n1', 'Importado'],
      ['b', 'B'],
      ['n2', 'B otra vez'],
    ])
  })

  it('counts dashboards discarded because they are damaged', () => {
    const result = parseImport(file([dashboard('a', 'Sano'), { title: 'Sin id' }, 7]), [], deps())
    expect(result).toMatchObject({ ok: true, discarded: 2 })
    expect(result.ok && result.dashboards.map((d) => d.title)).toEqual(['Sano'])
  })

  it('rejects text that is not JSON', () => {
    expect(parseImport('{no es json', [], deps())).toEqual({ ok: false, error: 'invalid-json' })
  })

  it('rejects JSON that is not a Dashboard Generator export or has a newer version', () => {
    expect(parseImport(JSON.stringify({ dashboards: [] }), [], deps())).toEqual({ ok: false, error: 'wrong-format' })
    expect(parseImport(JSON.stringify([dashboard('a', 'A')]), [], deps())).toEqual({ ok: false, error: 'wrong-format' })
    expect(parseImport(file([dashboard('a', 'A')], { version: 2 }), [], deps())).toEqual({ ok: false, error: 'newer-version' })
  })

  it('rejects an export without any usable dashboard', () => {
    expect(parseImport(file([]), [], deps())).toEqual({ ok: false, error: 'empty' })
    expect(parseImport(file([{ title: 'roto' }]), [], deps())).toEqual({ ok: false, error: 'empty' })
    expect(parseImport(file('no' as unknown as unknown[]), [], deps())).toEqual({ ok: false, error: 'empty' })
  })

  it('rejects files that are too large before parsing them', () => {
    expect(parseImport(' '.repeat(MAX_IMPORT_BYTES + 1), [], deps())).toEqual({ ok: false, error: 'too-large' })
  })
})
