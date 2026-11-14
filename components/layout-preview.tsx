"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaletteSwatches } from "@/components/palette-swatches"
import { useToast } from "@/hooks/use-toast"
import { LayoutGrid, TrendingUp, Info, Eye, Shuffle, X } from "lucide-react"
import type { LayoutVariant } from "@/types/dashboard"
import { getRealLayoutDivisions, generateGridStyles, getGridDimensions, analyzeLayoutQuality } from "@/lib/layout-engine"

interface LayoutPreviewProps {
  variant: LayoutVariant
  index: number
  onSelect: () => void
  onDelete: (variantId: string) => void
  /** Swaps the palette while keeping the layout and combinations. */
  onRegeneratePalette?: () => void
}

export function LayoutPreview({ variant, index, onSelect, onDelete, onRegeneratePalette }: LayoutPreviewProps) {
  const { toast } = useToast()
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(variant.id)
    toast({
      description: "Layout eliminado del historial",
      duration: 2000,
    })
  }

  return (
    <Card className="group relative overflow-hidden border-border bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 z-10 h-6 w-6 rounded-full bg-background/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100"
        onClick={handleDelete}
        title="Eliminar layout"
        aria-label="Eliminar layout"
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Header */}
      <div className="border-b border-border bg-secondary/30 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="h-3 w-3 text-primary" />
            <h3 className="text-xs font-semibold text-card-foreground">Variante {index + 1}</h3>
          </div>
          <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0.5 h-5">
            <TrendingUp className="h-2.5 w-2.5" />
            {variant.layout}
          </Badge>
        </div>
      </div>

      {/* Layout Preview */}
      <div className="p-3">
        {/* Layout Description */}
        <div className="mb-3 flex items-start gap-1.5 rounded-sm bg-muted/50 p-1.5">
          <Info className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
          <p className="text-pretty text-xs leading-tight text-muted-foreground">{variant.layoutDescription}</p>
        </div>

        {/* Main Layout: Left Panel (Colors + Button) | Right Panel (Layout Visualization) */}
        <div className="grid grid-cols-5 gap-3">
          {/* Left Panel: Color Palette + Button */}
          <div className="col-span-2 space-y-2">
            {/* Color Palette */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <h4 className="text-xs font-medium text-card-foreground">{variant.palette.name}</h4>
                {onRegeneratePalette && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRegeneratePalette}
                    className="h-6 gap-1 px-1.5 text-xs"
                    title="Cambiar solo la paleta, manteniendo la distribución"
                  >
                    <Shuffle className="h-3 w-3" aria-hidden="true" />
                    Otra paleta
                  </Button>
                )}
              </div>
              <PaletteSwatches palette={variant.palette} className="mb-1.5" />
              <p className="text-pretty text-xs leading-tight text-muted-foreground">{variant.palette.description}</p>
            </div>

            {/* Select Button */}
            <Button onClick={onSelect} className="w-full gap-1.5 h-7 text-xs">
              <Eye className="h-2.5 w-2.5" />
              Ver Detallada
            </Button>
          </div>

          {/* Right Panel: Layout Visualization */}
          <div className="col-span-3">
            <div className="aspect-[4/3] rounded-md border border-border bg-background p-2">
              <LayoutVisualization layout={variant.layout} combinationCount={variant.combinations.length} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function LayoutVisualization({ layout, combinationCount }: { layout: string; combinationCount: number }) {
  // Usar el sistema unificado de layouts
  const divisions = getRealLayoutDivisions(layout, combinationCount)
  
  if (divisions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Sin elementos
      </div>
    )
  }

  // Usar las dimensiones del grid centralizadas y análisis de calidad
  const { maxRows, maxColumns } = getGridDimensions(divisions)
  const quality = analyzeLayoutQuality(divisions)

  return (
    <div className="relative h-full">
      {/* Indicador de calidad del layout */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm border border-border/50 px-1.5 py-0.5">
        <div 
          className={`h-1.5 w-1.5 rounded-full ${
            quality.spaceUtilization >= 70 ? 'bg-green-500' : 
            quality.spaceUtilization >= 50 ? 'bg-orange-500' : 'bg-red-500'
          }`} 
        />
        <span className="text-xs font-medium text-foreground">{quality.spaceUtilization}%</span>
      </div>
      
      <div 
        className="grid h-full gap-0.5 p-1"
        style={{
          gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
          gridTemplateRows: `repeat(${maxRows}, 1fr)`,
        }}
      >
        {divisions.map((division, index) => {
          // Usar los estilos unificados de grid
          const gridStyles = generateGridStyles(division)
          
          return (
            <div
              key={index}
              className="rounded-sm border border-border bg-primary/10 min-h-[4px] transition-all hover:bg-primary/20"
              style={gridStyles}
              title={`Elemento ${index + 1}: ${division.width}×${division.height} en (${division.x}, ${division.y})`}
            />
          )
        })}
      </div>
    </div>
  )
}
