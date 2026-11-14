"use client"

import { useState } from "react"
import { BarChart3, Download, Filter, Shuffle, TrendingUp, X } from "lucide-react"
import { DashboardGrid } from "@/components/dashboard-preview/dashboard-grid"
import { FilterCard } from "@/components/dashboard-preview/filter-card"
import { PreviewFiltersProvider } from "@/components/dashboard-preview/preview-filters"
import { usePaletteColors } from "@/components/dashboard-preview/use-color-mode"
import { PaletteSwatches } from "@/components/palette-swatches"
import { IndependentVariableCard } from "@/components/dashboard-preview/independent-variable-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ALL_VALUES, NO_FILTERS, setFilter, type ActiveFilters } from "@/lib/domain/filters"
import { getIndependentVariables } from "@/lib/domain/variables"
import { analyzeLayoutQuality, getGridDimensions, getRealLayoutDivisions } from "@/lib/layout-engine"
import { exportDashboardSpecPdf } from "@/lib/pdf/dashboard-spec-pdf"
import { useDashboardInfo } from "@/store"
import type { LayoutVariant } from "@/types/dashboard"

/** Responsive column classes that use the full width for up to four items. */
function columnsFor(count: number): string {
  if (count <= 1) return ""
  if (count === 2) return "sm:grid-cols-2"
  if (count === 3) return "sm:grid-cols-3"
  return "sm:grid-cols-2 lg:grid-cols-4"
}

interface DashboardDetailedPreviewProps {
  variant: LayoutVariant
  dashboardTitle?: string
  dashboardDescription?: string
  /** When provided, shows a button that swaps the palette while keeping the layout. */
  onRegeneratePalette?: () => void
}

export function DashboardDetailedPreview({
  variant,
  dashboardTitle: propTitle,
  dashboardDescription: propDescription,
  onRegeneratePalette,
}: DashboardDetailedPreviewProps) {
  const { combinations, variables } = variant
  const paletteColors = usePaletteColors(variant.palette)
  
  // Get dashboard info from store, fallback to props
  const { dashboardTitle: storeTitle, dashboardDescription: storeDescription } = useDashboardInfo()
  const dashboardTitle = propTitle || storeTitle
  const dashboardDescription = propDescription || storeDescription

  const independentVariables = getIndependentVariables(variables)
  const [filters, setFilters] = useState<ActiveFilters>(NO_FILTERS)

  const filterableVariables = variables.filter(
    (v) => v.type === "categorical" || v.type === "temporal" || v.type === "binary",
  )

  const handleFilterChange = (variableId: string, value: string) => {
    setFilters((prev) => setFilter(prev, variableId, value))
  }

  const clearFilters = () => {
    setFilters(NO_FILTERS)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  const { toast } = useToast()

  const handleDownloadPDF = async () => {
    try {
      await exportDashboardSpecPdf({ variant, title: dashboardTitle, description: dashboardDescription })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        variant: "destructive",
        title: "No se pudo generar el PDF",
        description: "Ocurrió un error al generar la especificación. Inténtalo de nuevo.",
      })
    }
  }


  return (
    <PreviewFiltersProvider value={filters}>
      <div className="space-y-8 px-4 py-6 lg:px-6" data-dashboard-preview="true">
        {/* Modern Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 via-background/50 to-background/30 backdrop-blur-xl border border-border/50 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/20">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {dashboardTitle || "Vista Detallada del Dashboard"}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                        {variant.layout}
                      </Badge>
                      <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 text-xs px-2 py-0.5">
                        {variant.palette.name}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <PaletteSwatches palette={variant.palette} className="w-48" />
                      {onRegeneratePalette && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onRegeneratePalette}
                          className="h-7 gap-1.5 px-2 text-xs"
                        >
                          <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                          Otra paleta
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {dashboardDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {dashboardDescription}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 px-3 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">
                    {combinations.length} Visualizaciones
                  </span>
                </div>
                <Button 
                  onClick={handleDownloadPDF} 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-1.5 px-4 text-xs"
                >
                  <Download className="h-3 w-3" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {filterableVariables.length > 0 && (
          <div className="rounded-lg bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-border/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Filtros Dinámicos</h2>
                  <p className="text-xs text-muted-foreground">Personaliza la vista de tus datos</p>
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                  Limpiar
                </Button>
              )}
            </div>
            <div className={`grid grid-cols-1 gap-3 ${columnsFor(filterableVariables.length)}`}>
              {filterableVariables.map((variable) => (
                <FilterCard
                  key={variable.id}
                  variable={variable}
                  value={filters[variable.id] ?? ALL_VALUES}
                  onChange={(value) => handleFilterChange(variable.id, value)}
                />
              ))}
            </div>
          </div>
        )}

        {independentVariables.length > 0 && (
          <div className="rounded-lg bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent/15 to-primary/15 backdrop-blur-sm border border-accent/20">
                <TrendingUp className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Métricas Principales</h2>
                <p className="text-xs text-muted-foreground">Indicadores clave de rendimiento</p>
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-3 ${columnsFor(independentVariables.length)}`}>
              {independentVariables.map((variable, index) => (
                <IndependentVariableCard
                  key={variable.id}
                  variable={variable}
                  color={paletteColors[index % paletteColors.length]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Layout Preview */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 via-background/50 to-background/30 backdrop-blur-xl border border-border/50 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
        
          {/* Layout Header */}
          <div className="relative border-b border-border/50 bg-gradient-to-r from-background/60 to-background/30 backdrop-blur-sm p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/20">
                  <BarChart3 className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Vista Previa del Dashboard</h3>
                  <p className="text-xs text-muted-foreground">Layout: {variant.layout} • {combinations.length} visualizaciones</p>
                </div>
              </div>
            
              {/* Información de calidad del layout */}
              {(() => {
                const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
                const quality = analyzeLayoutQuality(divisions)
                const { maxRows, maxColumns } = getGridDimensions(divisions)
              
                return (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/60 border border-border/30">
                      <span className="text-muted-foreground">Grid:</span>
                      <span className="font-medium text-foreground">{maxColumns}×{maxRows}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/60 border border-border/30">
                      <span className="text-muted-foreground">Uso:</span>
                      <span className={`font-medium ${
                        quality.spaceUtilization >= 70 ? 'text-green-600' : 
                        quality.spaceUtilization >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {quality.spaceUtilization}%
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Layout Content - Universal renderer that matches PDF exactly */}
          <div id="dashboard-layout-preview" className="relative p-4">
            <DashboardGrid variant={variant} />
          </div>
        </div>
      </div>
    </PreviewFiltersProvider>
  )
}
