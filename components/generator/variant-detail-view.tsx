"use client"

import { useState } from "react"
import { ArrowLeft, Share2, Sparkles, WandSparkles } from "lucide-react"
import { AiHandoffPanel } from "@/components/generator/ai-handoff-panel"
import { DashboardDetailedPreview } from "@/components/dashboard-detailed-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LayoutVariant } from "@/types/dashboard"

export interface VariantDetailViewProps {
  variant: LayoutVariant
  title: string
  description: string
  onBack: () => void
  onStartOver: () => void
  onRegeneratePalette?: () => void
  onShare: () => void
  /** Link to copy by hand, shown when the clipboard is not available. */
  manualShareLink?: string | null
}

/** Full-page detail of one generated variant. */
export function VariantDetailView({
  variant,
  title,
  description,
  onBack,
  onStartOver,
  onRegeneratePalette,
  onShare,
  manualShareLink,
}: VariantDetailViewProps) {
  const [showAiPanel, setShowAiPanel] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onBack} variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a Variantes
            </Button>
            <Button onClick={onStartOver} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Nuevo Dashboard
            </Button>
            <Button onClick={onShare} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
            <Button
              onClick={() => setShowAiPanel((open) => !open)}
              variant="outline"
              className="gap-2"
              aria-expanded={showAiPanel}
              aria-controls="ai-handoff"
            >
              <WandSparkles className="h-4 w-4" />
              Construir con IA
            </Button>
          </div>
          <ThemeToggle />
        </div>

        {showAiPanel && <AiHandoffPanel id="ai-handoff" variant={variant} title={title} description={description} />}

        {manualShareLink && (
          <div className="mb-6 space-y-2 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              No se pudo copiar automáticamente. Copia este link para compartir el layout:
            </p>
            <Input
              readOnly
              aria-label="Link para compartir"
              value={manualShareLink}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        )}

        <DashboardDetailedPreview
          variant={variant}
          dashboardTitle={title}
          dashboardDescription={description}
          onRegeneratePalette={onRegeneratePalette}
        />
      </div>
    </div>
  )
}
