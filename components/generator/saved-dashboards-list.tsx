"use client"

import { useState } from "react"
import { Check, FolderOpen, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { displayTitle, sortByRecent, type SavedDashboard } from "@/lib/domain/saved-dashboards"

export interface SavedDashboardsListProps {
  dashboards: SavedDashboard[]
  onOpen: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" })

/** Dashboards stored in this browser, most recently edited first. Renders nothing when there are none. */
export function SavedDashboardsList({ dashboards, onOpen, onRename, onDelete }: SavedDashboardsListProps) {
  if (dashboards.length === 0) return null

  return (
    <section aria-labelledby="saved-dashboards-heading" className="mb-20">
      <h2 id="saved-dashboards-heading" className="mb-6 text-3xl font-bold text-foreground">
        Tus dashboards
      </h2>
      <ul aria-label="Tus dashboards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortByRecent(dashboards).map((dashboard) => (
          <SavedDashboardItem key={dashboard.id} dashboard={dashboard} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  )
}

interface SavedDashboardItemProps extends Omit<SavedDashboardsListProps, "dashboards"> {
  dashboard: SavedDashboard
}

function SavedDashboardItem({ dashboard, onOpen, onRename, onDelete }: SavedDashboardItemProps) {
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
