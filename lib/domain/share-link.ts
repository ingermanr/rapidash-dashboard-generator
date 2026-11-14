import { sanitizeExcludedCombination, sanitizeVariable, sanitizeVariant } from "@/lib/domain/sanitize"
import type { ExcludedCombination, LayoutVariant, Variable } from "@/types/dashboard"

/**
 * A dashboard definition plus one layout, carried in the URL fragment (`#share=...`). The fragment is never sent
 * to the server, so the shared data only travels inside the link itself.
 */
export interface SharePayload {
  title: string
  description: string
  variables: Variable[]
  excludedCombinations: ExcludedCombination[]
  variant: LayoutVariant
}

export const SHARE_HASH_KEY = "share"
const SHARE_FORMAT = "dashboard-generator-share"
const SHARE_VERSION = 1
const COMPRESSED = "z."
const PLAIN = "j."

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/** Pipes bytes through a (de)compression stream and collects the output. */
async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const writer = stream.writable.getWriter()
  void writer.write(bytes).then(() => writer.close()).catch(() => {})
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = JSON.stringify({ format: SHARE_FORMAT, version: SHARE_VERSION, ...payload })
  const bytes = new TextEncoder().encode(json)
  if (typeof CompressionStream === "undefined") return PLAIN + toBase64Url(bytes)
  return COMPRESSED + toBase64Url(await transform(bytes, new CompressionStream("deflate-raw")))
}

/** The shared dashboard, sanitized like stored data, or null when the link is broken or not ours. */
export async function decodeShare(encoded: string): Promise<SharePayload | null> {
  try {
    let bytes: Uint8Array<ArrayBuffer>
    if (encoded.startsWith(COMPRESSED)) {
      if (typeof DecompressionStream === "undefined") return null
      bytes = await transform(fromBase64Url(encoded.slice(COMPRESSED.length)), new DecompressionStream("deflate-raw"))
    } else if (encoded.startsWith(PLAIN)) {
      bytes = fromBase64Url(encoded.slice(PLAIN.length))
    } else {
      return null
    }
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
    if (!data || data.format !== SHARE_FORMAT || typeof data.version !== "number" || data.version > SHARE_VERSION) return null

    const variant = sanitizeVariant(data.variant)
    if (!variant) return null
    const list = <T>(value: unknown, parse: (item: unknown) => T | null): T[] =>
      Array.isArray(value) ? value.map(parse).filter((item): item is T => item !== null) : []
    return {
      title: typeof data.title === "string" ? data.title : "",
      description: typeof data.description === "string" ? data.description : "",
      variables: list(data.variables, sanitizeVariable),
      excludedCombinations: list(data.excludedCombinations, sanitizeExcludedCombination),
      variant,
    }
  } catch {
    return null
  }
}

export function buildShareUrl(base: string, encoded: string): string {
  return `${base.split("#")[0]}#${SHARE_HASH_KEY}=${encoded}`
}

export function readShareFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""))
  return params.get(SHARE_HASH_KEY)
}
