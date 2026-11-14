"use client"

import { useRef, useState } from "react"
import { Check, Download, FolderOpen, Pencil, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { displayTitle, sortByRecent, type SavedDashboard } from "@/lib/domain/saved-dashboards"

export interface SavedDashboardsListProps {
  dashboards: SavedDashboard[]
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onExportAll: () => void
  onImport: (file: File) => void
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" })

/**
 * Dashboards stored in this browser, most recently edited first, with export and import. The import stays
 * available when nothing is saved yet, so work can be brought over from another browser.
 */
export function SavedDashboardsList({ dashboards, onOpen, onRename, onDelete, onExport, onExportAll, onImport }: SavedDashboardsListProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <section aria-labelledby="saved-dashboards-heading" className="mb-20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="saved-dashboards-heading" className="text-3xl font-bold text-foreground">
          Tus dashboards
        </h2>
        <div className="flex flex-wrap gap-2">
          {dashboards.length > 0 && (
            <Button variant="outline" size="sm" onClick={onExportAll}>
              <Download className="h-4 w-4" />
              Exportar todos
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Importar dashboards"
            tabIndex={-1}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // Reset so choosing the same file again still triggers a change.
              event.target.value = ""
              if (file) onImport(file)
            }}
          />
        </div>
      </div>
      {dashboards.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no hay dashboards guardados en este navegador. Puedes importar un archivo exportado desde otro.
        </p>
      ) : (
        <ul aria-label="Tus dashboards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortByRecent(dashboards).map((dashboard) => (
            <SavedDashboardItem
              key={dashboard.id}
              dashboard={dashboard}
              onOpen={onOpen}
              onRename={onRename}
              onDelete={onDelete}
              onExport={onExport}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface SavedDashboardItemProps extends Pick<SavedDashboardsListProps, "onOpen" | "onRename" | "onDelete" | "onExport"> {
  dashboard: SavedDashboard
}

function SavedDashboardItem({ dashboard, onOpen, onRename, onDelete, onExport }: SavedDashboardItemProps) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm-delete">("view")
  const [draft, setDraft] = useState(dashboard.title)
  const title = displayTitle(dashboard)

  const submitRename = () => {
    onRename(dashboard.id, draft)
    setMode("view")
  }

  return (
    <li>
      <Card className="flex h-full flex-col gap-4 border-2 border-border/60 bg-card p-5">
        {mode === "rename" ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              submitRename()
            }}
          >
            <Input
              autoFocus
              aria-label={`Nuevo nombre para ${title}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setDraft(dashboard.title)
                  setMode("view")
                }
              }}
            />
            <Button type="submit" size="icon" aria-label="Guardar nombre">
              <Check className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        )}

        <p className="text-sm text-muted-foreground">
          {plural(dashboard.variables.length, "variable", "variables")} ·{" "}
          {plural(dashboard.generationHistory.length, "layout", "layouts")} · Editado{" "}
          <time dateTime={new Date(dashboard.updatedAt).toISOString()}>{dateFormat.format(dashboard.updatedAt)}</time>
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {mode === "confirm-delete" ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => onDelete(dashboard.id)} aria-label={`Confirmar eliminación de ${title}`}>
                <Trash2 className="h-4 w-4" />
                Eliminar definitivamente
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode("view")}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => onOpen(dashboard.id)} aria-label={`Abrir ${title}`}>
                <FolderOpen className="h-4 w-4" />
                Abrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(dashboard.title)
                  setMode("rename")
                }}
                aria-label={`Renombrar ${title}`}
              >
                <Pencil className="h-4 w-4" />
                Renombrar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport(dashboard.id)} aria-label={`Exportar ${title}`}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode("confirm-delete")} aria-label={`Eliminar ${title}`}>
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </Card>
    </li>
  )
}
