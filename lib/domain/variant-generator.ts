import type { Variable, LayoutVariant, VariableCombination, ExcludedCombination } from "@/types/dashboard"
import { getRealLayoutDivisions } from "@/lib/layout-engine"
import { recommendChart } from "./chart-recommendation"
import { pickPalette } from "./palettes"
import type { RandomSource } from "./random"

/** Side-effect sources used by generation. Inject them to make results reproducible. */
export interface GeneratorDeps {
  random: RandomSource
  now: () => number
}

const defaultDeps: GeneratorDeps = { random: Math.random, now: Date.now }

const LAYOUT_REQUIREMENTS = {
  SINGLE: 1,
  PAIR: 2,
  TRIPLE: 3,
  QUAD: 4,
  PENTA: 5,
  HEXA: 6,
  LARGE_MIN: 11,
  LARGE_MAX: 15,
} as const

export function getSuitableLayouts(combinationCount: number): string[] {
  // Single combination - layouts que maximizan el impacto de un elemento
  if (combinationCount === LAYOUT_REQUIREMENTS.SINGLE) {
    return ["Hero + Grid", "Spotlight", "Golden Ratio", "Accordion", "Grid"]
  }
  
  // Two combinations - layouts que balancean contenido pareado
  if (combinationCount === LAYOUT_REQUIREMENTS.PAIR) {
    return ["Split View", "Golden Ratio", "Dashboard Grid", "Asymmetric", "Magazine Layout", "Compact Grid"]
  }
  
  // Three combinations - layouts que manejan distribución triangular
  if (combinationCount === LAYOUT_REQUIREMENTS.TRIPLE) {
    return ["Pyramid", "Magazine Layout", "Mosaic", "Asymmetric", "Dashboard Grid", "Newspaper"]
  }
  
  // Four combinations - layouts optimizados para distribución cuádruple
  if (combinationCount === LAYOUT_REQUIREMENTS.QUAD) {
    return ["Dashboard Grid", "Tile Grid", "Z-Pattern", "Mosaic", "Magazine Layout", "Grid"]
  }
  
  // Five combinations - layouts que manejan elemento destacado + cuarteto
  if (combinationCount === LAYOUT_REQUIREMENTS.PENTA) {
    return ["F-Pattern", "Spotlight", "Sidebar Focus", "Magazine Layout", "Accordion", "Dashboard Grid"]
  }
  
  // Six combinations - layouts que sobresalen en distribución hexagonal
  if (combinationCount === LAYOUT_REQUIREMENTS.HEXA) {
    return ["Dashboard Grid", "Tile Grid", "F-Pattern", "Masonry", "Magazine Layout", "Mosaic"]
  }
  
  // Medium range (7-8) - layouts para complejidad moderada
  if (combinationCount >= 7 && combinationCount <= 8) {
    return ["Masonry", "Tile Grid", "Column Flow", "F-Pattern", "Dashboard Grid", "Sidebar Focus"]
  }
  
  // Medium-high range (9-10) - layouts con mejor organización
  if (combinationCount >= 9 && combinationCount <= 10) {
    return ["Masonry", "Column Flow", "Dashboard Grid", "F-Pattern", "Staggered", "Focus Grid"]
  }
  
  // Large range (11-15) - layouts para alta complejidad con buena organización
  if (combinationCount >= LAYOUT_REQUIREMENTS.LARGE_MIN && combinationCount <= LAYOUT_REQUIREMENTS.LARGE_MAX) {
    return ["Masonry", "Column Flow", "Staggered", "Dashboard Grid", "Focus Grid", "Tile Grid"]
  }
  
  // Very large (16-20) - layouts que manejan contenido extenso con gracia
  if (combinationCount >= 16 && combinationCount <= 20) {
    return ["Adaptive Flow", "Ultra Dense Grid", "Dashboard Grid", "Column Flow", "Hierarchical Dense", "Masonry"]
  }
  
  // Ultra large (21-30) - layouts especializados para datasets muy grandes
  if (combinationCount >= 21 && combinationCount <= 30) {
    return ["Ultra Dense Grid", "Adaptive Flow", "Hierarchical Dense", "Dashboard Grid", "Column Flow"]
  }
  
  // Extreme (31+) - layouts para casos extremos de alta densidad
  return ["Ultra Dense Grid", "Adaptive Flow", "Dashboard Grid", "Column Flow", "Grid"]
}

export function generateCombinations(
  variables: Variable[],
  excludedCombinations: ExcludedCombination[] = [],
  { random, now }: GeneratorDeps = defaultDeps,
): VariableCombination[] {
  const combinations: VariableCombination[] = []

  const isCombinationExcluded = (variableIds: string[]): boolean => {
    const key = [...variableIds].sort().join("|")
    return excludedCombinations.some((excluded) => [...excluded.variableIds].sort().join("|") === key)
  }
  const numericVars = variables.filter(
    (v) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio",
  )
  const categoricalVars = variables.filter((v) => v.type === "categorical")
  const binaryVars = variables.filter((v) => v.type === "binary")
  const temporalVars = variables.filter((v) => v.type === "temporal")

  let combinationCounter = 0 // Unique counter per generation

  /** Adds a combination unless excluded. Its chart is provisional until the layout places it in a cell. */
  const add = (measure: Variable, partner: Variable | undefined, name: string) => {
    const variableIds = partner ? [measure.id, partner.id] : [measure.id]
    if (isCombinationExcluded(variableIds)) return
    const combination: VariableCombination = {
      id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
      numericVariable: measure,
      ...(partner ? { categoricalVariable: partner } : {}),
      name,
      chartType: "metric",
    }
    combination.chartType = recommendChart(combination)
    combinations.push(combination)
  }

  for (const numeric of numericVars) for (const temporal of temporalVars) add(numeric, temporal, `${numeric.name} en ${temporal.name}`)
  for (const numeric of numericVars) for (const categorical of categoricalVars) add(numeric, categorical, `${numeric.name} por ${categorical.name}`)
  for (const numeric of numericVars) for (const binary of binaryVars) add(numeric, binary, `${numeric.name} por ${binary.name}`)

  if (categoricalVars.length === 0 && binaryVars.length === 0 && temporalVars.length === 0) {
    for (const numeric of numericVars) add(numeric, undefined, numeric.name)
  }
  if (numericVars.length === 0) {
    for (const categorical of categoricalVars) add(categorical, undefined, `Distribución de ${categorical.name}`)
    for (const binary of binaryVars) add(binary, undefined, `Distribución de ${binary.name}`)
  }

  return combinations
}

export function sortCombinationsByPriority(
  combinations: VariableCombination[],
  { random }: Pick<GeneratorDeps, "random"> = defaultDeps,
): VariableCombination[] {
  const priorityOrder = { 'alta': 1, 'media': 2, 'baja': 3 }
  
  return combinations.sort((a, b) => {
    // Obtener la prioridad más alta de las variables en cada combinación
    const aPriority = Math.min(
      priorityOrder[a.numericVariable?.priority || 'media'],
      priorityOrder[a.categoricalVariable?.priority || 'media']
    )
    const bPriority = Math.min(
      priorityOrder[b.numericVariable?.priority || 'media'], 
      priorityOrder[b.categoricalVariable?.priority || 'media']
    )
    
    // Ordenar por prioridad primero, luego por nombre para consistencia
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // Si tienen la misma prioridad, mantener un poco de aleatoriedad
    return random() - 0.5
  })
}

export function generateSingleLayoutVariant(
  variables: Variable[],
  history: LayoutVariant[],
  excludedCombinations: ExcludedCombination[] = [],
  deps: GeneratorDeps = defaultDeps,
): LayoutVariant {
  const { random, now } = deps
  // Generar combinaciones y ordenarlas por prioridad
  const rawCombinations = generateCombinations(variables, excludedCombinations, deps)
  const combinations = sortCombinationsByPriority(rawCombinations, deps)
  const combinationCount = combinations.length

  const suitableLayouts = getSuitableLayouts(combinationCount)


  const usedLayouts = history.map((v) => v.layout)

  // Sistema inteligente de selección de layouts con pesos y preferencias
  const recentLayouts = history.slice(-7).map((v) => v.layout) // Ampliar seguimiento a 7 layouts
  const veryRecentLayouts = history.slice(-3).map((v) => v.layout) // Últimos 3 muy recientes
  
  // Crear sistema de scoring para layouts
  const layoutScores = suitableLayouts.map(layout => {
    let score = 100 // Score base
    
    // Penalizar layouts usados (más penalización si son más recientes)
    const timesUsed = usedLayouts.filter(l => l === layout).length
    score -= timesUsed * 30
    
    // Penalización extra por uso reciente (últimos 7)
    if (recentLayouts.includes(layout)) {
      const recentIndex = recentLayouts.lastIndexOf(layout)
      score -= (7 - recentIndex) * 10 // Más penalización si es más reciente
    }
    
    // Penalización máxima para los muy recientes (últimos 3)
    if (veryRecentLayouts.includes(layout)) {
      const veryRecentIndex = veryRecentLayouts.lastIndexOf(layout)
      score -= (3 - veryRecentIndex) * 25
    }
    
    // Bonus para layouts que nunca se han usado
    if (!usedLayouts.includes(layout)) {
      score += 50
    }
    
    // Bonus especial para layouts específicos según la cantidad de elementos
    if (combinationCount <= 3 && ["Golden Ratio", "Magazine Layout", "Spotlight"].includes(layout)) {
      score += 20
    }
    if (combinationCount >= 4 && combinationCount <= 6 && ["Dashboard Grid", "Tile Grid", "Mosaic"].includes(layout)) {
      score += 20
    }
    if (combinationCount >= 7 && combinationCount <= 15 && ["Masonry", "Column Flow", "Staggered"].includes(layout)) {
      score += 15
    }
    if (combinationCount >= 16 && combinationCount <= 25 && ["Adaptive Flow", "Ultra Dense Grid", "Hierarchical Dense"].includes(layout)) {
      score += 25
    }
    if (combinationCount >= 26 && ["Ultra Dense Grid", "Adaptive Flow"].includes(layout)) {
      score += 30
    }
    
    return { layout, score: Math.max(score, 1) } // Asegurar score mínimo de 1
  })
  
  // Ordenar por score descendente
  layoutScores.sort((a, b) => b.score - a.score)
  
  // Selección ponderada: mayor probabilidad para scores altos
  const totalScore = layoutScores.reduce((sum, item) => sum + item.score, 0)
  let randomValue = random() * totalScore
  let layout: string = layoutScores[0].layout // Fallback
  
  for (const item of layoutScores) {
    randomValue -= item.score
    if (randomValue <= 0) {
      layout = item.layout
      break
    }
  }

  const palette = pickPalette(history, random)

  // Now that the layout decides each card's size, pick the chart that reads best in it.
  const divisions = getRealLayoutDivisions(layout, combinations.length)
  const placed = combinations.map((combination, index) => ({
    ...combination,
    chartType: recommendChart(combination, divisions[index]),
  }))

  return {
    id: `variant-${now()}-${Math.floor(random() * 100000)}`,
    layout,
    palette,
    variables,
    combinations: placed,
    layoutDescription: getLayoutDescription(layout, combinations.length),
  }
}

export function getLayoutDescription(layout: string, combinationCount: number): string {
  const descriptions: Record<string, string> = {
    "F-Pattern": `Optimizado para ${combinationCount} visualizaciones. Los usuarios escanean en forma de F, ideal para priorizar métricas clave arriba y a la izquierda.`,
    "Z-Pattern": `Diseñado para ${combinationCount} visualizaciones. Guía la vista en patrón Z, perfecto para dashboards narrativos con flujo claro.`,
    Grid: `Layout balanceado para ${combinationCount} visualizaciones. Peso visual igual crea armonía y fácil comparación entre métricas.`,
    Asymmetric: `Layout dinámico para ${combinationCount} visualizaciones. Enfatiza métricas importantes con tamaños variados para jerarquía visual.`,
    "Sidebar Focus": `Layout con barra lateral para ${combinationCount} visualizaciones. Métricas principales en el centro con detalles en la barra lateral.`,
    "Hero + Grid": `Layout hero para ${combinationCount} visualizaciones. Métrica principal destacada arriba con grid de métricas secundarias abajo.`,
    Masonry: `Layout tipo Pinterest para ${combinationCount} visualizaciones. Distribución orgánica que se adapta al contenido de cada métrica.`,
    "Dashboard Classic": `Layout clásico para ${combinationCount} visualizaciones. Diseño tradicional con métricas principales arriba y detalles abajo.`,
    "Split View": `Layout dividido para ${combinationCount} visualizaciones. Dos secciones principales que permiten comparación directa.`,
    "Compact Grid": `Layout compacto para ${combinationCount} visualizaciones. Maximiza el espacio con visualizaciones densas pero legibles.`,
    "Pinned Sidebar": `Layout con barra fija para ${combinationCount} visualizaciones. Métricas prioritarias siempre visibles en sidebar, resto fluye dinámicamente.`,
    "Ultra Dense Grid": `Layout de ultra alta densidad para ${combinationCount} visualizaciones. Optimiza el espacio con grid compacto manteniendo legibilidad.`,
    "Adaptive Flow": `Layout adaptativo inteligente para ${combinationCount} visualizaciones. Se ajusta automáticamente según cantidad para máximo aprovechamiento.`,
    "Hierarchical Dense": `Layout jerárquico denso para ${combinationCount} visualizaciones. Combina elementos destacados con grid compacto para información densa.`,
    Pyramid: `Layout piramidal para ${combinationCount} visualizaciones. Métrica principal arriba, distribución jerárquica que guía la atención naturalmente.`,
    "Column Flow": `Layout de columnas para ${combinationCount} visualizaciones. Flujo vertical organizado que permite scroll natural y agrupación lógica.`,
    Staggered: `Layout escalonado para ${combinationCount} visualizaciones. Distribución alternada que crea ritmo visual y facilita la lectura secuencial.`,
    "Focus Grid": `Layout de grid enfocado para ${combinationCount} visualizaciones. Grid inteligente con métricas principales destacadas para máximo impacto.`,
    "Golden Ratio": `Layout con proporción áurea para ${combinationCount} visualizaciones. Usa la razón 1.618 para crear equilibrio visual natural y agradable.`,
    "Magazine Layout": `Layout editorial para ${combinationCount} visualizaciones. Inspirado en revistas, combina artículo principal con elementos secundarios organizados.`,
    "Dashboard Grid": `Grid inteligente para ${combinationCount} visualizaciones. Distribución optimizada que se adapta automáticamente al número de elementos.`,
    "Newspaper": `Layout periodístico para ${combinationCount} visualizaciones. Jerarquía clara con titular principal y distribución en columnas informativas.`,
    "Mosaic": `Layout de mosaico para ${combinationCount} visualizaciones. Patrón irregular pero balanceado que crea interés visual manteniendo la funcionalidad.`,
    "Accordion": `Layout acordeón para ${combinationCount} visualizaciones. Diseño vertical expandible que prioriza el primer elemento con flujo secuencial.`,
    "Spotlight": `Layout con foco para ${combinationCount} visualizaciones. Elemento principal destacado con elementos secundarios organizados lateralmente.`,
    "Tile Grid": `Grid de azulejos para ${combinationCount} visualizaciones. Combina elementos de diferentes tamaños en un patrón ordenado tipo Metro/Material.`,
  }
  return descriptions[layout] || `Layout personalizado optimizado para ${combinationCount} visualizaciones con distribución inteligente de espacios.`
}
