"use client"

import { useCallback } from "react"
import { ArrowRight, BarChart3, FileText, Layout, Sparkles } from "lucide-react"
import { LayoutPreview } from "@/components/layout-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { VariableInput } from "@/components/variable-input"
import { generateSingleLayoutVariant } from "@/lib/domain/variant-generator"
import { useDashboardInfo, useLayouts, useVariables } from "@/store"

export interface BuilderViewProps {
  onStartOver: () => void
}

/** Main workspace: define variables, generate layout variants and browse the history. */
export function BuilderView({ onStartOver }: BuilderViewProps) {
  const { variables, excludedCombinations } = useVariables()
  const { 
    currentVariant, 
    generationHistory, 
    isGenerating, 
    setCurrentVariant,
    addToHistory,
    setIsGenerating,
    setSelectedVariant,
    removeFromHistory,
    regenerateVariantPalette,
  } = useLayouts()
  const { dashboardTitle, dashboardDescription, setDashboardTitle, setDashboardDescription } = useDashboardInfo()

  const generateVariant = useCallback(() => {
    setIsGenerating(true)

    setTimeout(() => {
      const newVariant = generateSingleLayoutVariant(variables, generationHistory, excludedCombinations)
      setCurrentVariant(newVariant)
      addToHistory(newVariant)
      setIsGenerating(false)
    }, 800)
  }, [variables, generationHistory, excludedCombinations, setIsGenerating, setCurrentVariant, addToHistory])

  const deleteVariant = useCallback((variantId: string) => {
    removeFromHistory(variantId)
  }, [removeFromHistory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle tech grid pattern */}
      <div
        className="fixed inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated gradient overlays */}
      <div className="fixed left-0 top-0 h-[300px] w-[300px] rounded-full bg-gradient-to-r from-primary/10 to-chart-2/5 blur-3xl animate-soft-pulse" />
      <div className="fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-chart-3/10 to-chart-4/5 blur-3xl animate-soft-pulse [animation-delay:3s]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card/95 via-card to-card/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-primary/30 bg-gradient-to-r from-primary/15 to-chart-2/10 px-6 py-3 text-sm font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30">
                <Sparkles className="h-5 w-5 animate-soft-pulse" />
                Diseño Automático de Dashboards
              </div>
              <div>
                <h1 className="mb-4 text-balance text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  Dashboard Generator
                </h1>
                <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  Transforma tus datos en{" "}
                  <span className="font-semibold text-primary">visualizaciones profesionales</span>.{" "}
                  Define variables, genera layouts optimizados y obtén paletas de color de alto contraste.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={onStartOver} 
                variant="outline" 
                size="sm"
                className="gap-2 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-chart-2/5 shadow-lg transition-all hover:scale-105 hover:shadow-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                Empezar Nuevo
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Info Section */}
        <div className="mb-12">
          <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            {/* Header Section with improved spacing */}
            <div className="relative border-b border-border/20 bg-gradient-to-r from-primary/5 via-transparent to-chart-1/5 px-8 py-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-chart-1/15 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-primary/20">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold tracking-tight text-card-foreground">Información del Dashboard</h2>
                  <p className="mt-1 text-base text-muted-foreground/80">Define el contexto y propósito de tu dashboard para generar visualizaciones más precisas</p>
                </div>
              </div>
            </div>

            {/* Content Section with improved layout */}
            <div className="relative px-8 py-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Title Field */}
                <div className="group/field space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-title" className="text-sm font-semibold text-card-foreground">
                      Título del Dashboard
                    </label>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Requerido
                    </span>
                  </div>
                  <Input
                    id="dashboard-title"
                    placeholder="Ej: Dashboard de Ventas Q4 2024"
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                    className="h-14 border-2 border-border/60 bg-background/80 text-base backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-background focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Un título claro ayuda a generar visualizaciones más enfocadas
                  </p>
                </div>

                {/* Description Field */}
                <div className="group/field space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-description" className="text-sm font-semibold text-card-foreground">
                      Descripción
                    </label>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Opcional
                    </span>
                  </div>
                  <Textarea
                    id="dashboard-description"
                    placeholder="Ej: Análisis completo de ventas por región, categoría de producto y período temporal para identificar tendencias, patrones estacionales y oportunidades de crecimiento en el mercado."
                    value={dashboardDescription}
                    onChange={(e) => setDashboardDescription(e.target.value)}
                    className="min-h-[140px] resize-none border-2 border-border/60 bg-background/80 text-base leading-relaxed backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-background focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Proporciona contexto para generar combinaciones de variables más inteligentes
                  </p>
                </div>
              </div>

              {/* Info Banner */}
              {(dashboardTitle || dashboardDescription) && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-chart-1/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">
                        Información configurada correctamente
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Esta información se utilizará para generar layouts y combinaciones más precisas
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Variable Input Section */}
        <div className="mb-10">
          <VariableInput />
        </div>

        {/* Enhanced Generate Button Section */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-foreground">
              {variables.length === 0 
                ? "Define variables para comenzar" 
                : `${variables.length} ${variables.length === 1 ? 'variable definida' : 'variables definidas'}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {variables.length === 0 
                ? "Agrega al menos una variable para generar tu dashboard" 
                : "Listo para generar visualizaciones profesionales"}
            </p>
          </div>
          
          <Button
            onClick={generateVariant}
            disabled={variables.length === 0 || isGenerating}
            size="lg"
            className="group btn-glow interactive-scale h-16 gap-4 px-12 text-lg font-bold shadow-2xl shadow-glow-primary transition-all hover:shadow-primary/40 bg-gradient-to-r from-primary to-chart-3 hover:from-primary/90 hover:to-chart-3/90 focus-ring disabled:from-muted disabled:to-muted disabled:shadow-none"
          >
            <Sparkles className={`h-6 w-6 transition-transform ${isGenerating ? "animate-spin" : "group-hover:rotate-12"}`} />
            {isGenerating ? "Generando Layout..." : currentVariant ? "Generar Nuevo Layout" : "Generar Layout"}
            {!isGenerating && (
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </div>

        {/* Enhanced Current Variant */}
        {currentVariant && (
          <div className="mb-12">
            <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/10 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">Layout Generado</h2>
                    <p className="text-muted-foreground">Revisa el diseño y explora las opciones de personalización</p>
                  </div>
                </div>
                {generationHistory.length > 1 && (
                  <div className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-gradient-to-r from-primary/15 to-chart-2/10 px-4 py-2 shadow-lg backdrop-blur-md">
                    <div className="h-2 w-2 rounded-full bg-primary animate-soft-pulse" />
                    <span className="text-sm font-bold text-primary">Generación #{generationHistory.length}</span>
                  </div>
                )}
              </div>
            </div>
            <LayoutPreview
              variant={currentVariant}
              index={0}
              onSelect={() => setSelectedVariant(currentVariant)}
              onDelete={deleteVariant}
              onRegeneratePalette={() => regenerateVariantPalette(currentVariant.id)}
            />
          </div>
        )}

        {/* Enhanced Generation History */}
        {generationHistory.length > 1 && (
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/30 to-card/10 p-8 backdrop-blur-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-3/10 shadow-lg">
                <Layout className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Historial de Generaciones</h2>
                <p className="text-muted-foreground">
                  {generationHistory.length - 1}{" "}
                  {generationHistory.length - 1 === 1 ? "variante anterior disponible" : "variantes anteriores disponibles"}
                </p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {generationHistory
                .slice(0, -1)
                .reverse()
                .map((variant, index) => (
                  <LayoutPreview
                    key={variant.id}
                    variant={variant}
                    index={index}
                    onSelect={() => setSelectedVariant(variant)}
                    onDelete={deleteVariant}
                    onRegeneratePalette={() => regenerateVariantPalette(variant.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {!currentVariant && variables.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-card/90 to-chart-3/10 p-16 text-center backdrop-blur-md">
            <div className="absolute left-4 top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl animate-float" />
            <div className="absolute right-4 bottom-4 h-32 w-32 rounded-full bg-chart-3/10 blur-2xl animate-float [animation-delay:2s]" />
            
            <div className="relative mx-auto max-w-lg space-y-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-chart-3/20 p-6 shadow-2xl shadow-primary/20">
                <Sparkles className="h-12 w-12 text-primary animate-soft-pulse" />
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold text-card-foreground">Todo Listo para Generar</h3>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-semibold text-primary">
                  ✓ {variables.length} {variables.length === 1 ? "variable definida" : "variables definidas"}
                </div>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                ¡Perfecto! Tienes todas las variables necesarias. Haz clic en{" "}
                <span className="font-semibold text-primary">&ldquo;Generar Layout&rdquo;</span>{" "}
                para crear un dashboard optimizado con visualizaciones profesionales y paletas de colores de alto contraste.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
