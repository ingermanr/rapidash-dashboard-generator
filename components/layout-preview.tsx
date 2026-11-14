"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LayoutGrid, TrendingUp, Info, Eye, Check, X } from "lucide-react"
import type { LayoutVariant } from "@/types/dashboard"
import { getRealLayoutDivisions, generateGridStyles, getGridDimensions, analyzeLayoutQuality } from "@/lib/layout-engine"

interface LayoutPreviewProps {
  variant: LayoutVariant
  index: number
  onSelect: () => void
  onDelete: (variantId: string) => void
}

export function LayoutPreview({ variant, index, onSelect, onDelete }: LayoutPreviewProps) {
  const { toast } = useToast()
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyColorToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(color)
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Código copiado: {color}</span>
          </div>
        ),
        duration: 2000,
      })
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error("Failed to copy color:", err)
    }
  }

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
        className="absolute right-1.5 top-1.5 z-10 h-6 w-6 rounded-full bg-background/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        onClick={handleDelete}
        title="Eliminar layout"
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
              <h4 className="mb-1.5 text-xs font-medium text-card-foreground">{variant.palette.name}</h4>
              <div className="mb-1.5 grid grid-cols-2 gap-1">
                {variant.palette.colors.map((color, i) => (
                  <div
                    key={i}
                    className="group/color relative h-5 cursor-pointer overflow-hidden rounded-sm border border-border shadow-sm transition-all hover:scale-105 hover:shadow-md"
                    style={{ backgroundColor: color }}
                    onClick={() => copyColorToClipboard(color)}
                  >
                    {/* Overlay que solo aparece al hover directo sobre el color */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-black/0 opacity-0 transition-all duration-200 group-hover/color:bg-black/70 group-hover/color:opacity-100">
                      <span className="text-xs font-mono font-medium text-white">{color}</span>
                    </div>
                    {/* Indicador de copiado */}
                    {copiedColor === color && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-black/80">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
