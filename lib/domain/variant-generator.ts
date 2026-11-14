import type { Variable, LayoutVariant, VariableCombination, ExcludedCombination } from "@/types/dashboard"
import { getRealLayoutDivisions, analyzeLayoutQuality } from "@/lib/layout-engine"
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
  
  // Función helper para verificar si una combinación está excluida
  const isCombinationExcluded = (variableIds: string[]): boolean => {
    return excludedCombinations.some(excluded => {
      const sortedExcluded = [...excluded.variableIds].sort()
      const sortedInput = [...variableIds].sort()
      return sortedExcluded.length === sortedInput.length && 
             sortedExcluded.every((id, index) => id === sortedInput[index])
    })
  }
  const numericVars = variables.filter(
    (v) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio",
  )
  const categoricalVars = variables.filter((v) => v.type === "categorical")
  const binaryVars = variables.filter((v) => v.type === "binary")
  const temporalVars = variables.filter((v) => v.type === "temporal")

  let barChartIndex = Math.floor(random() * 100) // Start with random index for variety
  let combinationCounter = 0 // Unique counter per generation

  for (const numeric of numericVars) {
    for (const temporal of temporalVars) {
      // Temporal variables ONLY get line or area charts for trend visualization
      const chartTypes: ("line" | "area")[] = ["line", "area"]
      const randomChartType = chartTypes[Math.floor(random() * chartTypes.length)]

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [numeric.id, temporal.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: numeric,
          categoricalVariable: temporal,
          name: `${numeric.name} en ${temporal.name}`,
          chartType: randomChartType,
        })
      }
    }
  }

  for (const numeric of numericVars) {
    for (const categorical of categoricalVars) {
      let chartType: VariableCombination["chartType"]

      if (numeric.type === "percentage-progress") {
        chartType = "progress"
      } else if (numeric.type === "percentage-ratio") {
        // Ratio percentages work well with pie/donut charts
        chartType = barChartIndex % 2 === 0 ? "pie" : "donut"
        barChartIndex++
      } else {
        // Ensure mix of bar and horizontal-bar charts for numeric variables
        if (barChartIndex % 5 === 0) {
          chartType = "bar"
        } else if (barChartIndex % 5 === 1) {
          chartType = "horizontal-bar"
        } else if (barChartIndex % 5 === 2) {
          chartType = "pie"
        } else if (barChartIndex % 5 === 3) {
          chartType = "donut"
        } else {
          chartType = "radial"
        }
        barChartIndex++
      }

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [numeric.id, categorical.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: numeric,
          categoricalVariable: categorical,
          name: `${numeric.name} por ${categorical.name}`,
          chartType: chartType,
        })
      }
    }
  }

  for (const numeric of numericVars) {
    for (const binary of binaryVars) {
      let chartType: VariableCombination["chartType"]

      if (numeric.type === "percentage-progress") {
        chartType = "progress"
      } else if (numeric.type === "percentage-ratio") {
        // Binary ratios work well with pie/donut (2 segments)
        chartType = barChartIndex % 2 === 0 ? "pie" : "donut"
        barChartIndex++
      } else {
        // Binary comparisons work well with bar charts (2 bars) or pie charts (2 segments)
        if (barChartIndex % 3 === 0) {
          chartType = "bar"
        } else if (barChartIndex % 3 === 1) {
          chartType = "horizontal-bar"
        } else {
          chartType = "pie"
        }
        barChartIndex++
      }

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [numeric.id, binary.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: numeric,
          categoricalVariable: binary,
          name: `${numeric.name} por ${binary.name}`,
          chartType: chartType,
        })
      }
    }
  }

  if (categoricalVars.length === 0 && binaryVars.length === 0 && temporalVars.length === 0) {
    for (const numeric of numericVars) {
      const chartType = numeric.type === "percentage-progress" ? "progress" : "metric"

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [numeric.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: numeric,
          name: numeric.name,
          chartType: chartType,
        })
      }
    }
  }

  if (categoricalVars.length > 0 && numericVars.length === 0) {
    for (const categorical of categoricalVars) {
      // Cycle through pie, donut, and radial for standalone categorical
      const chartTypes: ("pie" | "donut" | "radial")[] = ["pie", "donut", "radial"]
      const chartType = chartTypes[barChartIndex % 3]
      barChartIndex++

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [categorical.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: categorical,
          name: `Distribución de ${categorical.name}`,
          chartType: chartType,
        })
      }
    }
  }

  if (binaryVars.length > 0 && numericVars.length === 0) {
    for (const binary of binaryVars) {
      // Binary variables work well with pie/donut (2 segments)
      const chartType = barChartIndex % 2 === 0 ? "pie" : "donut"
      barChartIndex++

      // Verificar si esta combinación está excluida
      const combinationVariableIds = [binary.id]
      if (!isCombinationExcluded(combinationVariableIds)) {
        combinations.push({
          id: `combo-${now()}-${combinationCounter++}-${Math.floor(random() * 10000)}`,
          numericVariable: binary,
          name: `Distribución de ${binary.name}`,
          chartType: chartType,
        })
      }
    }
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

  const palettes = [
    // High contrast complementary schemes
    {
      name: "Ocean Blue",
      colors: ["#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#1E40AF"],
      description: "Alto contraste azul - Profesional y confiable, ideal para dashboards financieros",
    },
    {
      name: "Fire & Ice",
      colors: ["#EF4444", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"],
      description: "Alto contraste complementario - Colores opuestos que crean impacto visual",
    },
    {
      name: "Sunset Contrast",
      colors: ["#F59E0B", "#EC4899", "#8B5CF6", "#3B82F6", "#10B981"],
      description: "Alto contraste cálido-frío - Transición de cálido a frío para jerarquía",
    },
    {
      name: "Neon Pop",
      colors: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF6B00", "#00FF00"],
      description: "Contraste extremo - Colores vibrantes para dashboards creativos",
    },
    {
      name: "Corporate Contrast",
      colors: ["#1E40AF", "#DC2626", "#059669", "#D97706", "#7C3AED"],
      description: "Alto contraste corporativo - Colores distintos para categorías claras",
    },

    // Triadic color schemes
    {
      name: "Primary Triad",
      colors: ["#EF4444", "#3B82F6", "#FBBF24", "#10B981", "#8B5CF6"],
      description: "Esquema triádico - Tres colores equidistantes en el círculo cromático",
    },
    {
      name: "Tropical Triad",
      colors: ["#F43F5E", "#14B8A6", "#F59E0B", "#8B5CF6", "#10B981"],
      description: "Triádico tropical - Colores vibrantes con balance visual",
    },
    {
      name: "Tech Triad",
      colors: ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#14B8A6"],
      description: "Triádico tecnológico - Moderno y dinámico",
    },

    // Split-complementary schemes
    {
      name: "Split Warm",
      colors: ["#EF4444", "#F59E0B", "#FBBF24", "#EC4899", "#DC2626"],
      description: "Complementario dividido cálido - Armonía con variación",
    },
    {
      name: "Split Cool",
      colors: ["#3B82F6", "#8B5CF6", "#14B8A6", "#6366F1", "#0EA5E9"],
      description: "Complementario dividido frío - Profesional y calmado",
    },

    // Analogous with accent
    {
      name: "Forest Accent",
      colors: ["#10B981", "#059669", "#14B8A6", "#F59E0B", "#34D399"],
      description: "Análogo verde con acento naranja - Natural con punto focal",
    },
    {
      name: "Ocean Accent",
      colors: ["#0EA5E9", "#3B82F6", "#6366F1", "#F43F5E", "#38BDF8"],
      description: "Análogo azul con acento rosa - Fresco con contraste",
    },
    {
      name: "Sunset Blend",
      colors: ["#F59E0B", "#F97316", "#EF4444", "#8B5CF6", "#FBBF24"],
      description: "Análogo cálido con acento morado - Energético y vibrante",
    },

    // Monochromatic with high contrast
    {
      name: "Blue Spectrum",
      colors: ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"],
      description: "Monocromático azul - Diferentes intensidades para jerarquía clara",
    },
    {
      name: "Green Spectrum",
      colors: ["#065F46", "#10B981", "#34D399", "#6EE7B7", "#D1FAE5"],
      description: "Monocromático verde - Progresión suave de oscuro a claro",
    },
    {
      name: "Purple Spectrum",
      colors: ["#581C87", "#8B5CF6", "#A78BFA", "#C4B5FD", "#EDE9FE"],
      description: "Monocromático morado - Elegante y sofisticado",
    },

    // Tetradic (double complementary)
    {
      name: "Quad Harmony",
      colors: ["#3B82F6", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"],
      description: "Tetradico armónico - Cuatro colores balanceados para máxima variedad",
    },
    {
      name: "Bold Quad",
      colors: ["#DC2626", "#059669", "#6366F1", "#F59E0B", "#EC4899"],
      description: "Tetradico audaz - Contraste fuerte para dashboards impactantes",
    },

    // Pastel contrasts
    {
      name: "Pastel Contrast",
      colors: ["#93C5FD", "#FCA5A5", "#A7F3D0", "#FDE68A", "#DDD6FE"],
      description: "Contraste pastel - Suave pero distinguible",
    },
    {
      name: "Soft Rainbow",
      colors: ["#BFDBFE", "#FBCFE8", "#D9F99D", "#FED7AA", "#E9D5FF"],
      description: "Arcoíris suave - Colores claros con buena diferenciación",
    },

    // Dark mode optimized
    {
      name: "Dark Neon",
      colors: ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA"],
      description: "Optimizado para modo oscuro - Alto contraste sobre fondos oscuros",
    },
    {
      name: "Cyberpunk",
      colors: ["#00FFFF", "#FF00FF", "#FFFF00", "#00FF00", "#FF0080"],
      description: "Estilo cyberpunk - Neón brillante para interfaces futuristas",
    },

    // Earth tones with contrast
    {
      name: "Earth Contrast",
      colors: ["#92400E", "#059669", "#D97706", "#065F46", "#B45309"],
      description: "Tonos tierra contrastantes - Natural pero distintivo",
    },
    {
      name: "Desert Sunset",
      colors: ["#DC2626", "#F59E0B", "#FBBF24", "#78350F", "#EA580C"],
      description: "Atardecer desértico - Cálido con profundidad",
    },

    // Professional contrasts
    {
      name: "Business Pro",
      colors: ["#1E40AF", "#DC2626", "#047857", "#B45309", "#6D28D9"],
      description: "Profesional contrastante - Serio pero diferenciado",
    },
    {
      name: "Executive Suite",
      colors: ["#1F2937", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
      description: "Suite ejecutiva - Elegante con acentos de color",
    },

    // Vibrant mixes
    {
      name: "Carnival",
      colors: ["#EC4899", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444"],
      description: "Carnaval vibrante - Alegre y energético",
    },
    {
      name: "Festival",
      colors: ["#F43F5E", "#14B8A6", "#FBBF24", "#8B5CF6", "#10B981"],
      description: "Festival de colores - Celebración visual",
    },

    // Minimalist contrasts
    {
      name: "Minimal Bold",
      colors: ["#000000", "#3B82F6", "#FFFFFF", "#EF4444", "#10B981"],
      description: "Minimalista audaz - Blanco y negro con acentos fuertes",
    },
    {
      name: "Clean Contrast",
      colors: ["#1F2937", "#60A5FA", "#F3F4F6", "#34D399", "#FBBF24"],
      description: "Contraste limpio - Moderno y legible",
    },

    // Gradient-inspired
    {
      name: "Gradient Flow",
      colors: ["#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B", "#FBBF24"],
      description: "Flujo de gradiente - Transición suave de morado a amarillo",
    },
    {
      name: "Ocean Depth",
      colors: ["#1E3A8A", "#3B82F6", "#14B8A6", "#10B981", "#34D399"],
      description: "Profundidad oceánica - De azul profundo a verde claro",
    },

    // Nature-inspired combinations
    {
      name: "Spring Garden",
      colors: ["#10B981", "#EC4899", "#FBBF24", "#8B5CF6", "#34D399"],
      description: "Jardín primaveral - Colores frescos y naturales que evocan crecimiento",
    },
    {
      name: "Autumn Leaves",
      colors: ["#DC2626", "#F59E0B", "#92400E", "#FBBF24", "#D97706"],
      description: "Hojas de otoño - Tonos cálidos que transmiten madurez y estabilidad",
    },
    {
      name: "Winter Frost",
      colors: ["#0EA5E9", "#60A5FA", "#E0F2FE", "#BAE6FD", "#0284C7"],
      description: "Escarcha invernal - Azules fríos que comunican claridad y precisión",
    },
    {
      name: "Summer Breeze",
      colors: ["#14B8A6", "#FBBF24", "#F59E0B", "#10B981", "#06B6D4"],
      description: "Brisa de verano - Colores brillantes y energéticos",
    },

    // Seasonal themes
    {
      name: "Cherry Blossom",
      colors: ["#EC4899", "#F9A8D4", "#FDF2F8", "#F472B6", "#DB2777"],
      description: "Flor de cerezo - Rosas delicados con elegancia japonesa",
    },
    {
      name: "Harvest Moon",
      colors: ["#F59E0B", "#EA580C", "#92400E", "#FBBF24", "#D97706"],
      description: "Luna de cosecha - Naranjas y dorados que evocan abundancia",
    },

    // Cultural color schemes
    {
      name: "Mediterranean",
      colors: ["#0EA5E9", "#FBBF24", "#FFFFFF", "#F59E0B", "#06B6D4"],
      description: "Mediterráneo - Azul mar y amarillo sol con blanco brillante",
    },
    {
      name: "Nordic Minimal",
      colors: ["#475569", "#94A3B8", "#E2E8F0", "#64748B", "#334155"],
      description: "Minimalismo nórdico - Grises suaves con elegancia escandinava",
    },
    {
      name: "Tropical Paradise",
      colors: ["#14B8A6", "#EC4899", "#FBBF24", "#10B981", "#F43F5E"],
      description: "Paraíso tropical - Colores vibrantes de playas exóticas",
    },

    // Industry-specific palettes
    {
      name: "Healthcare Plus",
      colors: ["#3B82F6", "#10B981", "#0EA5E9", "#34D399", "#60A5FA"],
      description: "Salud y bienestar - Azules y verdes que transmiten confianza médica",
    },
    {
      name: "Finance Gold",
      colors: ["#1E40AF", "#D97706", "#1F2937", "#B45309", "#3B82F6"],
      description: "Finanzas premium - Azul corporativo con acentos dorados",
    },
    {
      name: "Education Bright",
      colors: ["#F59E0B", "#3B82F6", "#10B981", "#EC4899", "#8B5CF6"],
      description: "Educación vibrante - Colores alegres que inspiran aprendizaje",
    },
    {
      name: "Tech Innovation",
      colors: ["#6366F1", "#14B8A6", "#8B5CF6", "#06B6D4", "#A78BFA"],
      description: "Innovación tecnológica - Púrpuras y cianes futuristas",
    },

    // Retro/vintage combinations
    {
      name: "Retro 80s",
      colors: ["#EC4899", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444"],
      description: "Retro años 80 - Neón nostálgico con energía vintage",
    },
    {
      name: "Vintage Poster",
      colors: ["#DC2626", "#FBBF24", "#1E40AF", "#059669", "#92400E"],
      description: "Póster vintage - Colores apagados con carácter retro",
    },
    {
      name: "Art Deco",
      colors: ["#1F2937", "#D97706", "#FBBF24", "#92400E", "#78350F"],
      description: "Art Déco - Dorados y negros con elegancia de los años 20",
    },

    // Modern tech-inspired
    {
      name: "Silicon Valley",
      colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"],
      description: "Silicon Valley - Colores tech modernos y optimistas",
    },
    {
      name: "Startup Energy",
      colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"],
      description: "Energía startup - Colores audaces que transmiten innovación",
    },
    {
      name: "Cloud Computing",
      colors: ["#60A5FA", "#93C5FD", "#DBEAFE", "#3B82F6", "#2563EB"],
      description: "Computación en la nube - Azules etéreos y ligeros",
    },

    // Food & beverage inspired
    {
      name: "Coffee & Cream",
      colors: ["#78350F", "#92400E", "#FEF3C7", "#D97706", "#B45309"],
      description: "Café y crema - Marrones cálidos con toques cremosos",
    },
    {
      name: "Berry Fresh",
      colors: ["#DC2626", "#EC4899", "#8B5CF6", "#F43F5E", "#DB2777"],
      description: "Frutos del bosque - Rojos y morados jugosos y frescos",
    },
    {
      name: "Citrus Burst",
      colors: ["#F59E0B", "#FBBF24", "#FDE047", "#F97316", "#EA580C"],
      description: "Explosión cítrica - Amarillos y naranjas energizantes",
    },

    // Luxury & premium
    {
      name: "Royal Purple",
      colors: ["#581C87", "#7C3AED", "#A78BFA", "#D97706", "#1F2937"],
      description: "Púrpura real - Morados profundos con acentos dorados",
    },
    {
      name: "Emerald Luxury",
      colors: ["#065F46", "#10B981", "#34D399", "#D97706", "#1F2937"],
      description: "Lujo esmeralda - Verdes ricos con toques premium",
    },
  ]

  const usedLayouts = history.map((v) => v.layout)
  const usedPalettes = history.map((v) => v.palette.name)

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

  // Enhanced palette selection with similar logic
  const recentPalettes = history.slice(-5).map((v) => v.palette.name) // Track last 5 palettes
  const availablePalettes = palettes.filter((p) => !usedPalettes.includes(p.name))
  const freshPalettes = availablePalettes.filter((p) => !recentPalettes.includes(p.name))
  
  let palette: typeof palettes[0]
  if (freshPalettes.length > 0) {
    // Priority: completely fresh palettes
    palette = freshPalettes[Math.floor(random() * freshPalettes.length)]
  } else if (availablePalettes.length > 0) {
    // Secondary: unused but maybe recent
    palette = availablePalettes[Math.floor(random() * availablePalettes.length)]
  } else {
    // Fallback: avoid the most recent palette if possible
    const fallbackPalettes = palettes.filter((p) => p.name !== recentPalettes[recentPalettes.length - 1])
    palette = fallbackPalettes.length > 0
      ? fallbackPalettes[Math.floor(random() * fallbackPalettes.length)]
      : palettes[Math.floor(random() * palettes.length)]
  }

  // Validación y optimización del layout seleccionado
  const divisions = getRealLayoutDivisions(layout, combinations.length)
  const quality = analyzeLayoutQuality(divisions)
  
  // Si el aprovechamiento del espacio es muy bajo, intentar un layout más eficiente
  if (quality.spaceUtilization < 60 && layoutScores.length > 1) {
    // Buscar un layout alternativo con mejor aprovechamiento
    for (let i = 1; i < Math.min(3, layoutScores.length); i++) {
      const alternativeLayout = layoutScores[i].layout
      const altDivisions = getRealLayoutDivisions(alternativeLayout, combinations.length)
      const altQuality = analyzeLayoutQuality(altDivisions)
      
      if (altQuality.spaceUtilization > quality.spaceUtilization + 15) {
        layout = alternativeLayout
        break
      }
    }
  }

  return {
    id: `variant-${now()}-${Math.floor(random() * 100000)}`,
    layout,
    palette,
    variables,
    combinations,
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
