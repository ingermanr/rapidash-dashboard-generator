import { sanitizeSavedDashboard } from "@/lib/domain/sanitize"
import { defaultSavedDashboardDeps, type SavedDashboard, type SavedDashboardDeps } from "@/lib/domain/saved-dashboards"

/** Marker that identifies a file as a Dashboard Generator export. */
export const EXPORT_FORMAT = "dashboard-generator"
export const EXPORT_VERSION = 1
/** Larger files are refused before parsing; real exports are a few hundred KB. */
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024

export interface DashboardExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  exportedAt: number
  dashboards: SavedDashboard[]
}

export type ImportError = "too-large" | "invalid-json" | "wrong-format" | "newer-version" | "empty"

export type ImportResult =
  | { ok: true; dashboards: SavedDashboard[]; discarded: number }
  | { ok: false; error: ImportError }

export function buildExport(dashboards: SavedDashboard[], now: () => number = Date.now): DashboardExport {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now(), dashboards }
}

function slug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sin-titulo"
  )
}

export function exportFileName(dashboards: SavedDashboard[], date: Date = new Date()): string {
  if (dashboards.length === 1) return `dashboard-${slug(dashboards[0].title)}.json`
  return `dashboards-${date.toISOString().slice(0, 10)}.json`
}

/**
 * Reads an export file. Every dashboard goes through the same sanitizer as browser storage; damaged ones are
 * counted and dropped. Imported dashboards never replace existing ones: a clashing id gets a fresh one.
 */
export function parseImport(
  text: string,
  existing: SavedDashboard[],
  deps: SavedDashboardDeps = defaultSavedDashboardDeps,
): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: "too-large" }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "invalid-json" }
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return { ok: false, error: "wrong-format" }
  const file = data as Record<string, unknown>
  if (file.format !== EXPORT_FORMAT) return { ok: false, error: "wrong-format" }
  if (typeof file.version !== "number" || file.version > EXPORT_VERSION) return { ok: false, error: "newer-version" }

  const raw = Array.isArray(file.dashboards) ? file.dashboards : []
  const usedIds = new Set(existing.map((d) => d.id))
  const now = deps.now()
  const dashboards: SavedDashboard[] = []
  for (const item of raw) {
    const dashboard = sanitizeSavedDashboard(item)
    if (!dashboard) continue
    const id = usedIds.has(dashboard.id) ? deps.createId() : dashboard.id
    usedIds.add(id)
    dashboards.push({ ...dashboard, id, updatedAt: now })
  }
  if (dashboards.length === 0) return { ok: false, error: "empty" }
  return { ok: true, dashboards, discarded: raw.length - dashboards.length }
}
