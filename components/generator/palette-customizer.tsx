"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Pipette, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CUSTOM_SCHEMES, buildCustomPalette, type CustomScheme } from "@/lib/domain/custom-palette"
import type { ColorPalette } from "@/types/dashboard"

/** The EyeDropper API: Chromium-based browsers only. */
interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>
}
type EyeDropperConstructor = new () => EyeDropperApi

export interface PaletteCustomizerProps {
  id: string
  /** Colour the picker starts from, usually the layout's first palette colour. */
  initialColor: string
  onApply: (palette: ColorPalette) => void
  onCancel: () => void
}

function Swatches({ colors, surface, label }: { colors: string[]; surface: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1.5 rounded-md border border-border p-2" style={{ backgroundColor: surface }}>
        {colors.map((color, index) => (
          <span key={`${color}-${index}`} title={color} className="h-8 flex-1 rounded" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  )
}

/** Builds a palette from a colour the user picks; lightness is adjusted so every colour reads on both themes. */
export function PaletteCustomizer({ id, initialColor, onApply, onCancel }: PaletteCustomizerProps) {
  const [color, setColor] = useState(initialColor)
  const [scheme, setScheme] = useState<CustomScheme>("analogous")
  const [eyeDropper, setEyeDropper] = useState<EyeDropperConstructor | null>(null)
  const deferredColor = useDeferredValue(color)

  // Detected after mount: the API exists only in the browser, and only in some browsers.
  useEffect(() => {
    const api = (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper
    setEyeDropper(() => api ?? null)
  }, [])

  const result = useMemo(() => buildCustomPalette(deferredColor, scheme), [deferredColor, scheme])
  const valid = result.validation.light.ok && result.validation.dark.ok

  const pickWithEyeDropper = async () => {
    if (!eyeDropper) return
    try {
      const { sRGBHex } = await new eyeDropper().open()
      setColor(sRGBHex.toLowerCase())
    } catch {
      // The user cancelled the eyedropper (Escape): keep the current colour.
    }
  }

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mb-6 space-y-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold text-card-foreground">
          Personalizar colores
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige un color y un tipo de paleta. Si hace falta, corregimos su luminosidad para que todos los gráficos se lean
          bien en modo claro y oscuro; el layout no cambia.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-color`} className="text-sm font-medium text-foreground">
            Color base
          </label>
          <input
            id={`${id}-color`}
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value.toLowerCase())}
            className="block h-10 w-16 cursor-pointer rounded-md border border-border bg-background p-1"
          />
        </div>
        {eyeDropper && (
          <Button type="button" variant="outline" onClick={pickWithEyeDropper} className="gap-2">
            <Pipette className="h-4 w-4" aria-hidden="true" />
            Gotero
          </Button>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Tipo de paleta</legend>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_SCHEMES.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                name={`${id}-scheme`}
                value={option.id}
                checked={scheme === option.id}
                onChange={() => setScheme(option.id)}
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Swatches label="Modo claro" colors={result.palette.colors} surface="#f8f8f8" />
        <Swatches label="Modo oscuro" colors={result.palette.darkColors ?? []} surface="#060606" />
      </div>

      <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {[
            ["Tu color", result.original],
            ["En modo claro", result.base.light],
            ["En modo oscuro", result.base.dark],
          ].map(([label, hex]) => (
            <span key={label} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: hex }} aria-hidden="true" />
              <span className="text-muted-foreground">{label}:</span>
              <code className="text-xs text-foreground">{hex}</code>
            </span>
          ))}
        </div>
        <p className="text-muted-foreground">
          {result.adjusted.light || result.adjusted.dark
            ? "Ajustamos la luminosidad de tu color, sin cambiar su tono, para que se lea bien sobre el fondo."
            : "Tu color ya se lee bien en los dos modos: lo usamos tal cual."}
        </p>
        <p className={`flex items-start gap-2 ${valid ? "text-foreground" : "text-destructive"}`}>
          {valid ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {valid
            ? "Pasa las validaciones de contraste y diferenciación en modo claro y oscuro."
            : "Algunos colores vecinos se parecen: los gráficos los distinguen por sus etiquetas. Prueba otro tipo de paleta."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => onApply(result.palette)}>
          Aplicar paleta
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </section>
  )
}
