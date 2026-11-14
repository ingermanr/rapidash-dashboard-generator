import type { Variable, VariableCombination } from "@/types/dashboard"
import { createSeededRandom, type RandomSource } from "./random"

/**
 * Sample (mock) data shown in dashboard previews.
 * Every generator takes a RandomSource; use randomFor(key) so the same chart keeps
 * the same numbers across re-renders.
 */

/** Stable 32-bit FNV-1a hash of a string, used as a seed. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** A deterministic random source derived from a key such as a combination or variable id. */
export function randomFor(key: string): RandomSource {
  return createSeededRandom(hashString(key))
}

/** Progress percentage between 50 and 89. */
export function generateProgressValue(random: RandomSource): number {
  return Math.floor(random() * 40) + 50
}

/** Headline metric value and its percentage change (from -10.0 to 20.0). */
export function generateMetricValue(random: RandomSource): { value: number; change: string } {
  const value = Math.floor(random() * 100000) + 10000
  const change = (random() * 30 - 10).toFixed(1)
  return { value, change }
}

export function generateMetricForVariable(variable: Variable, random: RandomSource): {
  value: string
  label: string
  subtitle?: string
} {
  switch (variable.type) {
    case "numeric": {
      // Generate simulated dataset
      const dataset = Array.from({ length: 20 }, () => Math.floor(random() * 10000) + 1000)

      // Calculate different aggregations
      const aggregations = [
        {
          label: "Total",
          value: dataset.reduce((a, b) => a + b, 0).toLocaleString(),
          subtitle: `Suma de ${dataset.length} registros`,
        },
        {
          label: "Promedio",
          value: Math.floor(dataset.reduce((a, b) => a + b, 0) / dataset.length).toLocaleString(),
          subtitle: `Media de ${dataset.length} registros`,
        },
        {
          label: "Mediana",
          value: calculateMedian(dataset).toLocaleString(),
          subtitle: `Valor central de ${dataset.length} registros`,
        },
        {
          label: "Desv. Estándar",
          value: calculateStdDev(dataset).toLocaleString(),
          subtitle: `Variabilidad de los datos`,
        },
      ]

      // Randomly select one aggregation type
      return aggregations[Math.floor(random() * aggregations.length)]
    }

    case "categorical": {
      // Generate simulated data for categories
      const categories = generateCategoriesForVariable(variable)
      const categoryData = categories.map((cat) => ({
        name: cat,
        value: Math.floor(random() * 50000) + 10000,
      }))

      // Find top category
      const topCategory = categoryData.reduce((max, current) => (current.value > max.value ? current : max))

      return {
        label: "Categoría Principal",
        value: topCategory.name,
        subtitle: `$${topCategory.value.toLocaleString()} en ventas`,
      }
    }

    case "percentage-progress": {
      const value = Math.floor(random() * 40) + 50
      return {
        label: "Progreso",
        value: `${value}%`,
        subtitle: "Completado",
      }
    }

    case "percentage-ratio": {
      const value = Math.floor(random() * 30) + 10
      return {
        label: "Proporción",
        value: `${value}%`,
        subtitle: "Del total",
      }
    }

    case "temporal": {
      return {
        label: "Período",
        value: new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
        subtitle: "Último actualizado",
      }
    }

    case "text": {
      return {
        label: "Estado",
        value: "Activo",
        subtitle: "Sistema operativo",
      }
    }

    case "binary": {
      const value = random() < 0.7 // Simulate a 70% chance of being true
      return {
        label: "Estado",
        value: value ? "Sí" : "No",
        subtitle: "Valor binario",
      }
    }

    default:
      return {
        label: "Valor",
        value: "N/A",
      }
  }
}

export function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

export function calculateStdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.floor(Math.sqrt(variance))
}

export function generateCategoriesForVariable(variable: Variable): string[] {
  const name = variable.name.toLowerCase()

  if (variable.type === "binary") {
    if (name.includes("activo") || name.includes("active")) {
      return ["Activo", "Inactivo"]
    }
    if (name.includes("estado") || name.includes("status")) {
      return ["Sí", "No"]
    }
    if (name.includes("aprobado") || name.includes("approved")) {
      return ["Aprobado", "Rechazado"]
    }
    if (name.includes("completado") || name.includes("completed")) {
      return ["Completado", "Pendiente"]
    }
    return ["Sí", "No"]
  }

  if (name.includes("categoria") || name.includes("category")) {
    return ["Electrónica", "Ropa", "Alimentos", "Hogar", "Deportes"]
  }
  if (name.includes("region") || name.includes("zona")) {
    return ["Norte", "Sur", "Este", "Oeste", "Centro"]
  }
  if (name.includes("producto") || name.includes("product")) {
    return ["Prod A", "Prod B", "Prod C", "Prod D", "Prod E"]
  }
  if (name.includes("tipo") || name.includes("type")) {
    return ["Tipo Premium", "Tipo Estándar", "Tipo Básico", "Tipo Especial"]
  }
  if (name.includes("canal") || name.includes("channel")) {
    return ["Online", "Tienda", "Móvil", "Tel", "Email"]
  }
  if (name.includes("cliente") || name.includes("customer")) {
    return ["Corp", "PYME", "Indiv", "Gob"]
  }

  return ["Cat A", "Cat B", "Cat C", "Cat D", "Cat E"]
}

export function generateBarData(combination: VariableCombination, random: RandomSource) {
  const categories = getCategoriesFromCombination(combination)
  return categories.map((cat) => ({
    name: cat,
    value: Math.floor(random() * 5000) + 1000,
  }))
}

export function generateLineData(
  combination: VariableCombination,
  random: RandomSource,
  timePoints: string[] = getTimePointsFromCombination(combination),
) {
  return timePoints.map((point) => ({
    name: point,
    value: Math.floor(random() * 5000) + 1000,
  }))
}

export function generatePieData(combination: VariableCombination, random: RandomSource) {
  const categories = getCategoriesFromCombination(combination)
  return categories.map((cat) => ({
    name: cat,
    value: Math.floor(random() * 100) + 20,
  }))
}

export function getCategoriesFromCombination(combination: VariableCombination): string[] {
  // Extract categorical variable from combination
  const categoricalVar = combination.categoricalVariable

  if (categoricalVar) {
    return generateCategoriesForVariable(categoricalVar)
  }

  return ["Cat A", "Cat B", "Cat C", "Cat D", "Cat E"]
}

export function getTimePointsFromCombination(combination: VariableCombination): string[] {
  // Check if any variable name suggests temporal data
  const numericName = combination.numericVariable.name.toLowerCase()
  const categoricalName = combination.categoricalVariable?.name.toLowerCase() || ""

  // Check quarters before months: "trimestre" contains "mes".
  if (
    numericName.includes("trimestre") ||
    numericName.includes("quarter") ||
    categoricalName.includes("trimestre") ||
    categoricalName.includes("quarter")
  ) {
    return ["Q1", "Q2", "Q3", "Q4"]
  }
  if (
    numericName.includes("mes") ||
    numericName.includes("month") ||
    categoricalName.includes("mes") ||
    categoricalName.includes("month")
  ) {
    return ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  }
  if (
    numericName.includes("año") ||
    numericName.includes("year") ||
    categoricalName.includes("año") ||
    categoricalName.includes("year")
  ) {
    return ["2020", "2021", "2022", "2023", "2024"]
  }
  if (
    numericName.includes("dia") ||
    numericName.includes("day") ||
    categoricalName.includes("dia") ||
    categoricalName.includes("day")
  ) {
    return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  }

  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
}

export function generateRadialData(combination: VariableCombination, colors: string[], random: RandomSource) {
  const categories = getCategoriesFromCombination(combination)
  return categories.slice(0, 5).map((cat, index) => ({
    name: cat,
    value: Math.floor(random() * 80) + 20,
    fill: colors[index % colors.length],
  }))
}
