"use client"

import { useMemo, useState } from "react"
import { Copy, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { aiDeepLinks, buildAiPrompt, buildDashboardSpec } from "@/lib/domain/ai-handoff"
import type { LayoutVariant } from "@/types/dashboard"

export interface AiHandoffPanelProps {
  id: string
  variant: LayoutVariant
  title: string
  description: string
}

/** Takes the designed dashboard to any AI assistant: copy the prompt, or open Claude / ChatGPT with it prefilled. */
export function AiHandoffPanel({ id, variant, title, description }: AiHandoffPanelProps) {
  const { toast } = useToast()
  const prompt = useMemo(() => buildAiPrompt(buildDashboardSpec({ variant, title, description })), [variant, title, description])
  const links = useMemo(() => aiDeepLinks(prompt), [prompt])
  const [manualCopy, setManualCopy] = useState(false)

  const copyPrompt = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable")
      await navigator.clipboard.writeText(prompt)
      setManualCopy(false)
      toast({ title: "Prompt copiado", description: "Pégalo en tu asistente de IA junto con tu archivo de datos." })
    } catch {
      setManualCopy(true)
    }
  }

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mb-6 space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold text-card-foreground">
          Construir con IA
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lleva este diseño a tu asistente de IA (Claude, ChatGPT u otro) para que construya un dashboard web
          interactivo con tus datos reales.
        </p>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
        <li>Copia el prompt, o abre tu asistente con el prompt ya cargado.</li>
        <li>Adjunta tu archivo de datos (CSV, Excel u otro) en la conversación.</li>
        <li>El asistente asocia cada variable a una columna de tus datos y construye el dashboard.</li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button onClick={copyPrompt} className="gap-2">
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copiar prompt
        </Button>
        {links && (
          <>
            <Button asChild variant="outline" className="gap-2">
              <a href={links.claude} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Abrir en Claude
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href={links.chatgpt} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Abrir en ChatGPT
              </a>
            </Button>
          </>
        )}
      </div>

      {!links && (
        <p className="text-sm text-muted-foreground">
          El prompt de este dashboard es largo para abrirlo con un link: cópialo y pégalo en tu asistente.
        </p>
      )}

      {manualCopy && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">No se pudo copiar automáticamente. Copia este texto:</p>
          <Textarea
            readOnly
            aria-label="Prompt para la IA"
            value={prompt}
            rows={8}
            className="font-mono text-xs"
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Rapidash no envía tus datos: el prompt solo lleva el diseño, y el archivo lo adjuntas tú en el asistente que elijas.
      </p>
    </section>
  )
}
