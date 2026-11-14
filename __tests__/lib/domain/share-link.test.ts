import {
  SHARE_HASH_KEY,
  buildShareUrl,
  decodeShare,
  encodeShare,
  readShareFromHash,
  type SharePayload,
} from '@/lib/domain/share-link'
import { generateSingleLayoutVariant } from '@/lib/domain/variant-generator'
import { createSeededRandom } from '@/lib/domain/random'
import type { Variable } from '@/types/dashboard'

const types = ['numeric', 'categorical', 'temporal'] as const
const variables: Variable[] = Array.from({ length: 10 }, (_, i) => ({
  id: 'v' + i,
  name: 'Variable ' + i,
  type: types[i % 3],
  priority: 'media',
}))
const variant = generateSingleLayoutVariant(variables, [], [], { random: createSeededRandom(7), now: () => 1 })
const payload: SharePayload = {
  title: 'Ventas Q1',
  description: 'KPIs del trimestre',
  variables,
  excludedCombinations: [{ id: 'e', description: 'x', variableIds: ['v0', 'v1'] }],
  variant: JSON.parse(JSON.stringify(variant)),
}

describe('share link', () => {
  it('round-trips the definition and the layout through a compressed, URL-safe string', async () => {
    const encoded = await encodeShare(payload)
    expect(encoded).toMatch(/^z\.[A-Za-z0-9_-]+$/)
    expect(await decodeShare(encoded)).toEqual(payload)
  })

  it('keeps a 10-variable dashboard link short enough for chats and email', async () => {
    const url = buildShareUrl('https://example.com/app', await encodeShare(payload))
    expect(url.startsWith(`https://example.com/app#${SHARE_HASH_KEY}=z.`)).toBe(true)
    expect(url.length).toBeLessThan(4000)
  })

  it('falls back to plain JSON when the browser cannot compress, and still decodes it', async () => {
    const original = globalThis.CompressionStream
    // @ts-expect-error simulate an old browser
    delete globalThis.CompressionStream
    try {
      const encoded = await encodeShare(payload)
      expect(encoded.startsWith('j.')).toBe(true)
      expect(await decodeShare(encoded)).toEqual(payload)
    } finally {
      globalThis.CompressionStream = original
    }
  })

  it('returns null for broken or foreign links instead of throwing', async () => {
    const valid = await encodeShare(payload)
    for (const broken of ['', 'z.', 'z.%%%', 'x.abc', valid.slice(0, valid.length / 2), 'j.' + btoa('{"hola":1}')]) {
      await expect(decodeShare(broken)).resolves.toBeNull()
    }
  })

  it('sanitizes what it decodes: invalid variables are dropped, a broken layout rejects the link', async () => {
    const withBadVariable = await encodeShare({ ...payload, variables: [...variables, { id: 'x', name: 'roto' } as unknown as Variable] })
    expect((await decodeShare(withBadVariable))?.variables).toEqual(variables)

    const withBadVariant = await encodeShare({ ...payload, variant: { ...payload.variant, combinations: 'no' } as never })
    await expect(decodeShare(withBadVariant)).resolves.toBeNull()
  })

  it('reads the share value from a location hash', () => {
    expect(readShareFromHash('#share=z.abc')).toBe('z.abc')
    expect(readShareFromHash('#otra=1&share=j.xyz')).toBe('j.xyz')
    expect(readShareFromHash('#nada')).toBeNull()
    expect(readShareFromHash('')).toBeNull()
  })
})
