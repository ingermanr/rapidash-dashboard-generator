"use client"

import { useCallback } from "react"
import { BuilderView } from "@/components/generator/builder-view"
import { LandingView } from "@/components/generator/landing-view"
import { VariantDetailView } from "@/components/generator/variant-detail-view"
import { StorageStatusBanner } from "@/components/storage-status-banner"
import { useDashboardInfo, useDashboardStore, useLayouts } from "@/store"

export default function DashboardGenerator() {
  const { selectedVariant, setSelectedVariant, regenerateVariantPalette } = useLayouts()
  const { dashboardTitle, dashboardDescription, showLanding, setShowLanding } = useDashboardInfo()
  const savedDashboards = useDashboardStore((state) => state.savedDashboards)
  const startNewDashboard = useDashboardStore((state) => state.startNewDashboard)
  const openDashboard = useDashboardStore((state) => state.openDashboard)
  const renameDashboard = useDashboardStore((state) => state.renameDashboard)
  const deleteDashboard = useDashboardStore((state) => state.deleteDashboard)

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
