"use client"

import { useCallback } from "react"
import { BuilderView } from "@/components/generator/builder-view"
import { LandingView } from "@/components/generator/landing-view"
import { VariantDetailView } from "@/components/generator/variant-detail-view"
import { StorageStatusBanner } from "@/components/storage-status-banner"
import { useToast } from "@/hooks/use-toast"
import { downloadJson } from "@/lib/browser/download"
import { readFileText } from "@/lib/browser/read-file"
import { buildExport, exportFileName, parseImport, type ImportError } from "@/lib/domain/dashboard-transfer"
import type { SavedDashboard } from "@/lib/domain/saved-dashboards"
import { useDashboardInfo, useDashboardStore, useLayouts } from "@/store"

const IMPORT_ERRORS: Record<ImportError, string> = {
  "too-large": "El archivo es demasiado grande (máximo 10 MB).",
  "invalid-json": "El archivo no es un JSON válido.",
  "wrong-format": "El archivo no es una exportación de Dashboard Generator.",
  "newer-version": "El archivo viene de una versión más nueva de Dashboard Generator.",
  empty: "El archivo no contiene dashboards válidos.",
}

function importSummary(imported: number, discarded: number): string {
  const done = imported === 1 ? "Se importó 1 dashboard." : `Se importaron ${imported} dashboards.`
  if (discarded === 0) return done
  return `${done} ${discarded === 1 ? "Se descartó 1 por estar dañado." : `Se descartaron ${discarded} por estar dañados.`}`
}

export default function DashboardGenerator() {
  const { selectedVariant, setSelectedVariant, regenerateVariantPalette } = useLayouts()
  const { dashboardTitle, dashboardDescription, showLanding, setShowLanding } = useDashboardInfo()
  const savedDashboards = useDashboardStore((state) => state.savedDashboards)
  const startNewDashboard = useDashboardStore((state) => state.startNewDashboard)
  const openDashboard = useDashboardStore((state) => state.openDashboard)
  const renameDashboard = useDashboardStore((state) => state.renameDashboard)
  const deleteDashboard = useDashboardStore((state) => state.deleteDashboard)
  const importDashboards = useDashboardStore((state) => state.importDashboards)
  const { toast } = useToast()

  const exportDashboards = useCallback((dashboards: SavedDashboard[]) => {
    downloadJson(exportFileName(dashboards), buildExport(dashboards))
  }, [])

  const handleImport = useCallback(
    async (file: File) => {
      let text: string
      try {
        text = await readFileText(file)
      } catch {
        toast({ title: "No se pudo importar", description: "No se pudo leer el archivo.", variant: "destructive" })
        return
      }
      const result = parseImport(text, useDashboardStore.getState().savedDashboards)
      if (!result.ok) {
        toast({ title: "No se pudo importar", description: IMPORT_ERRORS[result.error], variant: "destructive" })
        return
      }
      importDashboards(result.dashboards)
      toast({ title: "Importación completada", description: importSummary(result.dashboards.length, result.discarded) })
    },
    [importDashboards, toast],
  )

  const handleBackToVariants = useCallback(() => {
    setSelectedVariant(null)
  }, [setSelectedVariant])

  const handleShowDashboards = useCallback(() => {
    setSelectedVariant(null)
    setShowLanding(true)
  }, [setSelectedVariant, setShowLanding])

  if (showLanding) {
    return (
      <main>
        <StorageStatusBanner />
        <LandingView
          onStart={startNewDashboard}
          savedDashboards={savedDashboards}
          onOpenDashboard={openDashboard}
          onRenameDashboard={renameDashboard}
          onDeleteDashboard={deleteDashboard}
          onExportDashboard={(id) => exportDashboards(savedDashboards.filter((d) => d.id === id))}
          onExportAllDashboards={() => exportDashboards(savedDashboards)}
          onImportDashboards={handleImport}
        />
      </main>
    )
  }

  if (selectedVariant) {
    return (
      <main>
        <StorageStatusBanner />
        <VariantDetailView
          variant={selectedVariant}
          title={dashboardTitle}
          description={dashboardDescription}
          onBack={handleBackToVariants}
          onStartOver={startNewDashboard}
          onRegeneratePalette={() => regenerateVariantPalette(selectedVariant.id)}
        />
      </main>
    )
  }

  return (
    <main>
      <StorageStatusBanner />
      <BuilderView onStartOver={startNewDashboard} onShowDashboards={handleShowDashboards} />
    </main>
  )
}
