import { AI_SPEC_FORMAT, MAX_DEEP_LINK_PROMPT, aiDeepLinks, buildAiPrompt, buildDashboardSpec } from '@/lib/domain/ai-handoff'
import { getRealLayoutDivisions } from '@/lib/layout-engine'
import type { LayoutVariant, Variable } from '@/types/dashboard'

const sales: Variable = { id: 's', name: 'Ventas', type: 'numeric', priority: 'alta' }
const region: Variable = { id: 'r', name: 'Región', type: 'categorical', priority: 'media' }
const month: Variable = { id: 'm', name: 'Mes', type: 'temporal', priority: 'baja' }

const variant: LayoutVariant = {
  id: 'v',
  layout: 'Hero + Grid',
  palette: { name: 'Aurora', colors: ['#8b5cf6', '#0d9488'], darkColors: ['#a78bfa', '#14b8a6'], description: '' },
  variables: [sales, region, month],
  combinations: [
    { id: 'a', name: 'Ventas por Región', chartType: 'bar', numericVariable: sales, categoricalVariable: region },
    { id: 'b', name: 'Ventas en Mes', chartType: 'line', numericVariable: sales, categoricalVariable: month },
  ],
  layoutDescription: '',
}

describe('buildDashboardSpec', () => {
  it('describes variables, components on the 12-column grid and the palette in a versioned contract', () => {
    const spec = buildDashboardSpec({ variant, title: 'Ventas Q1', description: 'KPIs comerciales' })
    const divisions = getRealLayoutDivisions('Hero + Grid', 2)

    expect(spec).toEqual({
      format: AI_SPEC_FORMAT,
      version: 1,
      title: 'Ventas Q1',
      description: 'KPIs comerciales',
      variables: [
        { name: 'Ventas', type: 'numeric', priority: 'alta' },
        { name: 'Región', type: 'categorical', priority: 'media' },
        { name: 'Mes', type: 'temporal', priority: 'baja' },
      ],
      layout: {
        name: 'Hero + Grid',
        columns: 12,
        components: [
          { id: 1, title: 'Ventas por Región', chart: 'bar', measure: 'Ventas', dimension: 'Región', position: { column: divisions[0].x + 1, row: divisions[0].y + 1, width: divisions[0].width, height: divisions[0].height } },
          { id: 2, title: 'Ventas en Mes', chart: 'line', measure: 'Ventas', dimension: 'Mes', position: { column: divisions[1].x + 1, row: divisions[1].y + 1, width: divisions[1].width, height: divisions[1].height } },
        ],
      },
      palette: { name: 'Aurora', light: ['#8b5cf6', '#0d9488'], dark: ['#a78bfa', '#14b8a6'] },
    })
  })

  it('uses a neutral title for an untitled dashboard and omits a missing dimension', () => {
    const spec = buildDashboardSpec({
      variant: { ...variant, combinations: [{ id: 'k', name: 'Ventas', chartType: 'metric', numericVariable: sales }] },
      title: '  ',
      description: '',
    })
    expect(spec.title).toBe('Dashboard sin título')
    expect(spec.layout.components[0]).not.toHaveProperty('dimension')
  })
})

describe('buildAiPrompt', () => {
  const spec = buildDashboardSpec({ variant, title: 'Ventas Q1', description: '' })
  const prompt = buildAiPrompt(spec)

  it('embeds the exact contract as JSON', () => {
    const json = /```json\n([\s\S]+?)\n```/.exec(prompt)?.[1]
    expect(JSON.parse(json!)).toEqual(spec)
  })

  it('asks for an interactive web dashboard built from the user data, never invented data', () => {
    for (const rule of [
      'dashboard web interactivo',
      'adjunta',
      'columna',
      'No inventes datos',
      'pregunta',
      'posición',
      'paleta',
      'filtro',
    ])
      expect(prompt.toLowerCase()).toContain(rule.toLowerCase())
  })
})

describe('aiDeepLinks', () => {
  it('opens Claude and ChatGPT with the prompt prefilled', () => {
    const links = aiDeepLinks('Hola & chau')
    expect(links).toEqual({
      claude: 'https://claude.ai/new?q=Hola%20%26%20chau',
      chatgpt: 'https://chatgpt.com/?q=Hola%20%26%20chau',
    })
  })

  it('offers no links when the prompt is too long to travel in a URL', () => {
    expect(aiDeepLinks('x'.repeat(MAX_DEEP_LINK_PROMPT))).not.toBeNull()
    expect(aiDeepLinks('x'.repeat(MAX_DEEP_LINK_PROMPT + 1))).toBeNull()
  })
})
