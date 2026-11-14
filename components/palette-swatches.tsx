"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { usePaletteColors } from "@/components/dashboard-preview/use-color-mode"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { ColorPalette } from "@/types/dashboard"

interface PaletteSwatchesProps {
  palette: ColorPalette
  size?: "sm" | "md"
  className?: string
}

/** A palette as a strip of swatches; each one is a button that copies its hex code. */
export function PaletteSwatches({ palette, size = "sm", className }: PaletteSwatchesProps) {
  const colors = usePaletteColors(palette)
  const { toast } = useToast()
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopied(color)
      toast({ description: `Código copiado: ${color}`, duration: 2000 })
      setTimeout(() => setCopied((current) => (current === color ? null : current)), 2000)
    } catch (error) {
      console.error("Failed to copy color:", error)
    }
  }

  return (
    <div role="group" aria-label={`Paleta ${palette.name}`} className={cn("flex gap-0.5", className)}>
      {colors.map((color, index) => (
        <button
          key={`${color}-${index}`}
          type="button"
          onClick={() => copy(color)}
          title={`Copiar ${color}`}
          aria-label={`Copiar color ${index + 1}: ${color}`}
          className={cn(
            "group/swatch relative flex-1 overflow-hidden transition-transform first:rounded-l-md last:rounded-r-md hover:-translate-y-0.5 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            size === "sm" ? "h-6" : "h-9",
          )}
          style={{ backgroundColor: color }}
        >
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-[10px] font-medium uppercase text-white opacity-0 transition-opacity group-hover/swatch:opacity-100 group-focus-visible/swatch:opacity-100">
            {copied === color ? <Check className="h-3 w-3" aria-hidden="true" /> : color.replace("#", "")}
          </span>
        </button>
      ))}
    </div>
  )
}
