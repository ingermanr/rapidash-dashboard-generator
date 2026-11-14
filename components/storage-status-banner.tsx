"use client"

import { AlertTriangle } from "lucide-react"
import { usePersistenceStatus } from "@/store/persistence-status"

const MESSAGES = {
  quota: {
    title: "No se pudieron guardar tus cambios: el almacenamiento del navegador está lleno.",
    detail: "Elimina dashboards o layouts del historial que ya no uses. Tus cambios se guardarán en cuanto haya espacio.",
  },
  unavailable: {
    title: "El navegador no permite guardar datos en este sitio. Tus cambios se perderán al cerrar la pestaña.",
    detail: "Suele pasar en modo privado o con el almacenamiento del sitio bloqueado.",
  },
} as const

/** Tells the user when their work is not being saved, and why. Renders nothing while saving works. */
export function StorageStatusBanner() {
  const lastWrite = usePersistenceStatus((state) => state.lastWrite)
  if (lastWrite === "ok") return null
  const message = MESSAGES[lastWrite]

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-start gap-3 border-b-2 border-destructive/40 bg-background px-4 py-3 text-sm text-foreground shadow-md"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-semibold">{message.title}</p>
        <p className="text-muted-foreground">{message.detail}</p>
      </div>
    </div>
  )
}
