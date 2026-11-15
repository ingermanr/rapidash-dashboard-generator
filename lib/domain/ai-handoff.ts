import { GRID_CONFIG, getRealLayoutDivisions } from "@/lib/layout-engine"
import type { LayoutVariant, VariableCombination, VariablePriority, VariableType } from "@/types/dashboard"

/**
 * Hands a designed dashboard to any AI assistant: a versioned JSON contract plus a self-contained prompt that the
 * user pastes next to their own data. Rapidash never sends the data anywhere.
 */

export const AI_SPEC_FORMAT = "rapidash-dashboard-spec"
export const AI_SPEC_VERSION = 1
/**
 * Longest prompt offered through "Abrir en Claude / ChatGPT" links. Claude Desktop cuts a prefilled prompt at about
 * 14,000 characters, and once percent-encoded the URL grows further; past this the user copies the prompt instead.
 */
export const MAX_DEEP_LINK_PROMPT = 6000

export interface DashboardSpec {
  format: typeof AI_SPEC_FORMAT
  version: typeof AI_SPEC_VERSION
  title: string
  description: string
  variables: { name: string; type: VariableType; priority: VariablePriority }[]
  layout: {
    name: string
    columns: number
    components: {
      id: number
      title: string
      chart: VariableCombination["chartType"]
      measure: string
      dimension?: string
      /** 1-based column and row on the grid; width in columns, height in rows. */
      position: { column: number; row: number; width: number; height: number }
    }[]
  }
  palette: { name: string; light: string[]; dark: string[] }
}

export interface DashboardSpecInput {
  variant: LayoutVariant
  title: string
  description: string
}

export function buildDashboardSpec({ variant, title, description }: DashboardSpecInput): DashboardSpec {
  const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
  return {
    format: AI_SPEC_FORMAT,
    version: AI_SPEC_VERSION,
    title: title.trim() || "Dashboard sin título",
    description: description.trim(),
    variables: variant.variables.map(({ name, type, priority }) => ({ name, type, priority })),
    layout: {
      name: variant.layout,
      columns: GRID_CONFIG.COLUMNS,
      components: variant.combinations.map((combination, index) => {
        const d = divisions[index] ?? { x: 0, y: index, width: GRID_CONFIG.COLUMNS, height: 1 }
        return {
          id: index + 1,
          title: combination.name,
          chart: combination.chartType,
          measure: combination.numericVariable.name,
          ...(combination.categoricalVariable ? { dimension: combination.categoricalVariable.name } : {}),
          position: { column: d.x + 1, row: d.y + 1, width: d.width, height: d.height || GRID_CONFIG.DEFAULT_HEIGHT },
        }
      }),
    },
    palette: {
      name: variant.palette.name,
      light: [...variant.palette.colors],
      dark: [...(variant.palette.darkColors ?? variant.palette.colors)],
    },
  }
}

/** The text the user pastes into the assistant, with the contract embedded as JSON. */
export function buildAiPrompt(spec: DashboardSpec): string {
  return `Construye un dashboard web interactivo a partir del diseño que te paso abajo y de los datos que voy a adjuntar.

Diseño: "${spec.title}". Lo armé con Rapidash; la especificación completa está en el JSON al final.

Cómo trabajar:
1. Si todavía no adjunté un archivo de datos (CSV, Excel o similar), pídemelo antes de construir nada.
2. Asocia cada variable del diseño a una columna de mis datos. Muéstrame esa asociación y, si alguna variable no tiene una columna clara, pregunta antes de seguir.
3. No inventes datos: usa solo los del archivo. Si falta información para un gráfico, dímelo.
4. Construye un dashboard web interactivo en un único archivo (React con Recharts, o HTML con una librería de gráficos), listo para ver y usar.

Reglas del diseño:
- Respeta la posición y el tamaño de cada componente en la grilla de ${spec.layout.columns} columnas ("position": columna y fila iniciales, ancho en columnas, alto en filas).
- Usa el tipo de gráfico indicado en "chart" para cada componente: bar, horizontal-bar, line, area, pie, donut, radial, progress o metric (un KPI destacado).
- "measure" es la variable que se mide y "dimension" la que la agrupa o la ordena en el tiempo.
- Usa los colores de la paleta en el orden dado: "light" en modo claro y "dark" en modo oscuro.
- Agrega un filtro por cada variable categórica, que actualice todos los gráficos.
- Muestra tooltips con los valores y adapta el diseño a pantallas chicas apilando los componentes.

Especificación:
\`\`\`json
${JSON.stringify(spec)}
\`\`\``
}

export interface AiDeepLinks {
  claude: string
  chatgpt: string
}

/** Links that open a new chat with the prompt prefilled, or null when the prompt is too long for a URL. */
export function aiDeepLinks(prompt: string): AiDeepLinks | null {
  if (prompt.length > MAX_DEEP_LINK_PROMPT) return null
  const q = encodeURIComponent(prompt)
  return { claude: `https://claude.ai/new?q=${q}`, chatgpt: `https://chatgpt.com/?q=${q}` }
}
