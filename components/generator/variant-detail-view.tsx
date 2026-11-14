"use client"

import { ArrowLeft, Sparkles } from "lucide-react"
import { DashboardDetailedPreview } from "@/components/dashboard-detailed-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import type { LayoutVariant } from "@/types/dashboard"

export interface VariantDetailViewProps {
  variant: LayoutVariant
  title: string
  description: string
  onBack: () => void
  onStartOver: () => void
}

/** Full-page detail of one generated variant. */
export function VariantDetailView({ variant, title, description, onBack, onStartOver }: VariantDetailViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={onBack} variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a Variantes
            </Button>
            <Button onClick={onStartOver} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Nuevo Dashboard
            </Button>
          </div>
          <ThemeToggle />
        </div>

        <DashboardDetailedPreview
          variant={variant}
          dashboardTitle={title}
          dashboardDescription={description}
        />
      </div>
    </div>
  )
}
