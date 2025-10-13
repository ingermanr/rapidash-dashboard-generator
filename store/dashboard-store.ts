import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Variable, LayoutVariant, ExcludedCombination } from '@/types/dashboard'

export interface DashboardState {
  // Estado del dashboard
  dashboardTitle: string
  dashboardDescription: string
  showLanding: boolean
  
  // Variables
  variables: Variable[]
  excludedCombinations: ExcludedCombination[]
  
  // Layouts y generación
  currentVariant: LayoutVariant | null
  generationHistory: LayoutVariant[]
  selectedVariant: LayoutVariant | null
  isGenerating: boolean
  
  // Acciones para el dashboard
  setDashboardTitle: (title: string) => void
  setDashboardDescription: (description: string) => void
  setShowLanding: (show: boolean) => void
  
  // Acciones para variables
  addVariable: (variable: Variable) => void
  removeVariable: (variableId: string) => void
  updateVariable: (variableId: string, updates: Partial<Variable>) => void
  setVariables: (variables: Variable[]) => void
  clearVariables: () => void
  
  // Acciones para combinaciones excluidas
  addExcludedCombination: (combination: ExcludedCombination) => void
  removeExcludedCombination: (combinationId: string) => void
  clearExcludedCombinations: () => void
  isCombinationExcluded: (variableIds: string[]) => boolean
  
  // Acciones para layouts
  setCurrentVariant: (variant: LayoutVariant | null) => void
  addToHistory: (variant: LayoutVariant) => void
  removeFromHistory: (variantId: string) => void
  setSelectedVariant: (variant: LayoutVariant | null) => void
  setIsGenerating: (generating: boolean) => void
  clearHistory: () => void
  
  // Utilidades
  reset: () => void
}

const initialState = {
  dashboardTitle: '',
  dashboardDescription: '',
  showLanding: true,
  variables: [],
  excludedCombinations: [],
  currentVariant: null,
  generationHistory: [],
  selectedVariant: null,
  isGenerating: false,
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Acciones para el dashboard
      setDashboardTitle: (title) => set({ dashboardTitle: title }),
      setDashboardDescription: (description) => set({ dashboardDescription: description }),
      setShowLanding: (show) => set({ showLanding: show }),
      
      // Acciones para variables
      addVariable: (variable) => set((state) => ({ 
        variables: [...state.variables, variable] 
      })),
      
      removeVariable: (variableId) => set((state) => ({
        variables: state.variables.filter(v => v.id !== variableId)
      })),
      
      updateVariable: (variableId, updates) => set((state) => ({
        variables: state.variables.map(v => 
          v.id === variableId ? { ...v, ...updates } : v
        )
      })),
      
      setVariables: (variables) => set({ variables }),
      
      clearVariables: () => set({ variables: [] }),
      
      // Acciones para combinaciones excluidas
      addExcludedCombination: (combination) => set((state) => ({
        excludedCombinations: [...state.excludedCombinations, combination]
      })),
      
      removeExcludedCombination: (combinationId) => set((state) => ({
        excludedCombinations: state.excludedCombinations.filter(c => c.id !== combinationId)
      })),
      
      clearExcludedCombinations: () => set({ excludedCombinations: [] }),
      
      isCombinationExcluded: (variableIds) => {
        const state = get()
        return state.excludedCombinations.some(excluded => {
          const sortedExcluded = [...excluded.variableIds].sort()
          const sortedInput = [...variableIds].sort()
          return sortedExcluded.length === sortedInput.length && 
                 sortedExcluded.every((id, index) => id === sortedInput[index])
        })
      },
      
      // Acciones para layouts
      setCurrentVariant: (variant) => set({ currentVariant: variant }),
      
      addToHistory: (variant) => set((state) => {
        // Evitar duplicados en el historial
        const existingIndex = state.generationHistory.findIndex(h => h.id === variant.id)
        if (existingIndex >= 0) {
          // Reemplazar si ya existe
          const newHistory = [...state.generationHistory]
          newHistory[existingIndex] = variant
          return { generationHistory: newHistory }
        }
        return { 
          generationHistory: [...state.generationHistory, variant] 
        }
      }),
      
      removeFromHistory: (variantId) => set((state) => ({
        generationHistory: state.generationHistory.filter(v => v.id !== variantId),
        // Si el variant eliminado era el seleccionado, limpiar selección
        selectedVariant: state.selectedVariant?.id === variantId ? null : state.selectedVariant,
        currentVariant: state.currentVariant?.id === variantId ? null : state.currentVariant,
      })),
      
      setSelectedVariant: (variant) => set({ selectedVariant: variant }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      
      clearHistory: () => set({ 
        generationHistory: [], 
        currentVariant: null, 
        selectedVariant: null 
      }),
      
      // Utilidades
      reset: () => set(initialState),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir datos importantes, no estados temporales
      partialize: (state) => ({
        dashboardTitle: state.dashboardTitle,
        dashboardDescription: state.dashboardDescription,
        variables: state.variables,
        excludedCombinations: state.excludedCombinations,
        generationHistory: state.generationHistory,
        selectedVariant: state.selectedVariant,
      }),
    }
  )
)