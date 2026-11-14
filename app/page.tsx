"use client"

import { useCallback } from "react"
import { BuilderView } from "@/components/generator/builder-view"
import { LandingView } from "@/components/generator/landing-view"
import { VariantDetailView } from "@/components/generator/variant-detail-view"
import { useDashboardInfo, useLayouts, useVariables } from "@/store"

export default function DashboardGenerator() {
  const { clearVariables } = useVariables()
  const { selectedVariant, setSelectedVariant, clearHistory, regenerateVariantPalette } = useLayouts()
  const {
    dashboardTitle,
    dashboardDescription,
    showLanding,
    setDashboardTitle,
    setDashboardDescription,
    setShowLanding,
  } = useDashboardInfo()

  const handleStartCreating = useCallback(() => {
    // Limpiar todos los datos anteriores cuando se inicia una nueva sesión
    clearVariables()
    clearHistory()
    setDashboardTitle('')
    setDashboardDescription('')
    setShowLanding(false)
  }, [setShowLanding, clearVariables, clearHistory, setDashboardTitle, setDashboardDescription])

  const handleBackToVariants = useCallback(() => {
    setSelectedVariant(null)
  }, [setSelectedVariant])

  if (showLanding) {
    return (
      <main>
        <LandingView onStart={handleStartCreating} />
      </main>
    )
  }

  if (selectedVariant) {
    return (
      <main>
        <VariantDetailView
          variant={selectedVariant}
          title={dashboardTitle}
          description={dashboardDescription}
          onBack={handleBackToVariants}
          onStartOver={handleStartCreating}
          onRegeneratePalette={() => regenerateVariantPalette(selectedVariant.id)}
        />
      </main>
    )
  }

  return (
    <main>
      <BuilderView onStartOver={handleStartCreating} />
    </main>
  )
}
