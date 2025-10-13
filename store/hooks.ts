import { useDashboardStore } from './dashboard-store'
import { useUIStore } from './ui-store'

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

  // Funciones de conveniencia
  const getVariableById = (id: string) => variables.find(v => v.id === id)
  
  const getVariablesByType = (type: string) => variables.filter(v => v.type === type)
  
  const variableExists = (name: string) => 
    variables.some(v => v.name.toLowerCase() === name.toLowerCase())
  
  const getVariableCount = () => variables.length
  
  const getNumericVariables = () => variables.filter(v => v.type === 'numeric')
  
  const getCategoricalVariables = () => variables.filter(v => v.type === 'categorical')
  
  const getVariablesByPriority = () => {
    const priorityOrder = { 'alta': 1, 'media': 2, 'baja': 3 }
    return [...variables].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }
  
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
    // Funciones de conveniencia
    getVariableById,
    getVariablesByType,
    variableExists,
    getVariableCount,
    getNumericVariables,
    getCategoricalVariables,
    getVariablesByPriority,
    getPriorityStats,
  }
}

// Hook para layouts con funciones de conveniencia
export const useLayouts = () => {
  const currentVariant = useDashboardStore((state) => state.currentVariant)
  const generationHistory = useDashboardStore((state) => state.generationHistory)
  const selectedVariant = useDashboardStore((state) => state.selectedVariant)
  const isGenerating = useDashboardStore((state) => state.isGenerating)
  
  const setCurrentVariant = useDashboardStore((state) => state.setCurrentVariant)
  const addToHistory = useDashboardStore((state) => state.addToHistory)
  const removeFromHistory = useDashboardStore((state) => state.removeFromHistory)
  const setSelectedVariant = useDashboardStore((state) => state.setSelectedVariant)
  const setIsGenerating = useDashboardStore((state) => state.setIsGenerating)
  const clearHistory = useDashboardStore((state) => state.clearHistory)

  // Funciones de conveniencia
  const getHistoryCount = () => generationHistory.length
  
  const getVariantById = (id: string) => generationHistory.find(v => v.id === id)
  
  const hasHistory = () => generationHistory.length > 0
  
  const getLatestVariant = () => 
    generationHistory.length > 0 ? generationHistory[generationHistory.length - 1] : null

  return {
    currentVariant,
    generationHistory,
    selectedVariant,
    isGenerating,
    setCurrentVariant,
    addToHistory,
    removeFromHistory,
    setSelectedVariant,
    setIsGenerating,
    clearHistory,
    // Funciones de conveniencia
    getHistoryCount,
    getVariantById,
    hasHistory,
    getLatestVariant,
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

  // Funciones de conveniencia
  const hasTitle = () => dashboardTitle.trim().length > 0
  const hasDescription = () => dashboardDescription.trim().length > 0
  const isComplete = () => hasTitle() && hasDescription()

  return {
    dashboardTitle,
    dashboardDescription,
    showLanding,
    setDashboardTitle,
    setDashboardDescription,
    setShowLanding,
    reset,
    // Funciones de conveniencia
    hasTitle,
    hasDescription,
    isComplete,
  }
}

// Hook para configuración de UI
export const useUIConfig = () => {
  const theme = useUIStore((state) => state.theme)
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const autoGenerate = useUIStore((state) => state.autoGenerate)
  const showAdvancedOptions = useUIStore((state) => state.showAdvancedOptions)
  const previewMode = useUIStore((state) => state.previewMode)
  const showTooltips = useUIStore((state) => state.showTooltips)
  const animationsEnabled = useUIStore((state) => state.animationsEnabled)
  
  const setTheme = useUIStore((state) => state.setTheme)
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setAutoGenerate = useUIStore((state) => state.setAutoGenerate)
  const setShowAdvancedOptions = useUIStore((state) => state.setShowAdvancedOptions)
  const setPreviewMode = useUIStore((state) => state.setPreviewMode)
  const setShowTooltips = useUIStore((state) => state.setShowTooltips)
  const setAnimationsEnabled = useUIStore((state) => state.setAnimationsEnabled)
  const resetUI = useUIStore((state) => state.reset)

  return {
    theme,
    sidebarCollapsed,
    autoGenerate,
    showAdvancedOptions,
    previewMode,
    showTooltips,
    animationsEnabled,
    setTheme,
    setSidebarCollapsed,
    toggleSidebar,
    setAutoGenerate,
    setShowAdvancedOptions,
    setPreviewMode,
    setShowTooltips,
    setAnimationsEnabled,
    resetUI,
  }
}