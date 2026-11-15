import { useDashboardStore } from './dashboard-store'

// Hook para variables con funciones de conveniencia
export const useVariables = () => {
  const variables = useDashboardStore((state) => state.variables)
  const addVariable = useDashboardStore((state) => state.addVariable)
  const removeVariable = useDashboardStore((state) => state.removeVariable)
  const updateVariable = useDashboardStore((state) => state.updateVariable)
  const setVariables = useDashboardStore((state) => state.setVariables)
  const clearVariables = useDashboardStore((state) => state.clearVariables)
  
  // Funciones para combinaciones excluidas
  const excludedCombinations = useDashboardStore((state) => state.excludedCombinations)
  const addExcludedCombination = useDashboardStore((state) => state.addExcludedCombination)
  const removeExcludedCombination = useDashboardStore((state) => state.removeExcludedCombination)
  const clearExcludedCombinations = useDashboardStore((state) => state.clearExcludedCombinations)
  const isCombinationExcluded = useDashboardStore((state) => state.isCombinationExcluded)

  const variableExists = (name: string) => 
    variables.some(v => v.name.toLowerCase() === name.toLowerCase())
  
  const getPriorityStats = () => {
    const alta = variables.filter(v => v.priority === 'alta').length
    const media = variables.filter(v => v.priority === 'media').length  
    const baja = variables.filter(v => v.priority === 'baja').length
    return { alta, media, baja }
  }

  return {
    variables,
    addVariable,
    removeVariable,
    updateVariable,
    setVariables,
    clearVariables,
    // Combinaciones excluidas
    excludedCombinations,
    addExcludedCombination,
    removeExcludedCombination,
    clearExcludedCombinations,
    isCombinationExcluded,
    variableExists,
    getPriorityStats,
  }
}

// Hook para layouts
export const useLayouts = () => {
  const currentVariant = useDashboardStore((state) => state.currentVariant)
  const generationHistory = useDashboardStore((state) => state.generationHistory)
  const selectedVariant = useDashboardStore((state) => state.selectedVariant)
  const isGenerating = useDashboardStore((state) => state.isGenerating)
  
  const setCurrentVariant = useDashboardStore((state) => state.setCurrentVariant)
  const addToHistory = useDashboardStore((state) => state.addToHistory)
  const removeFromHistory = useDashboardStore((state) => state.removeFromHistory)
  const regenerateVariantPalette = useDashboardStore((state) => state.regenerateVariantPalette)
  const setSelectedVariant = useDashboardStore((state) => state.setSelectedVariant)
  const setIsGenerating = useDashboardStore((state) => state.setIsGenerating)
  const clearHistory = useDashboardStore((state) => state.clearHistory)


  return {
    currentVariant,
    generationHistory,
    selectedVariant,
    isGenerating,
    setCurrentVariant,
    addToHistory,
    removeFromHistory,
    regenerateVariantPalette,
    setSelectedVariant,
    setIsGenerating,
    clearHistory,
  }
}

// Hook para información del dashboard
export const useDashboardInfo = () => {
  const dashboardTitle = useDashboardStore((state) => state.dashboardTitle)
  const dashboardDescription = useDashboardStore((state) => state.dashboardDescription)
  const showLanding = useDashboardStore((state) => state.showLanding)
  
  const setDashboardTitle = useDashboardStore((state) => state.setDashboardTitle)
  const setDashboardDescription = useDashboardStore((state) => state.setDashboardDescription)
  const setShowLanding = useDashboardStore((state) => state.setShowLanding)
  const reset = useDashboardStore((state) => state.reset)

  return {
    dashboardTitle,
    dashboardDescription,
    showLanding,
    setDashboardTitle,
    setDashboardDescription,
    setShowLanding,
    reset,
  }
}
