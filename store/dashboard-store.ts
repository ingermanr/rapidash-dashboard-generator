import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Variable, LayoutVariant, ExcludedCombination } from '@/types/dashboard'
import { regeneratePalette } from '@/lib/domain/palettes'
import {
  PERSISTED_STATE_VERSION,
  deleteSavedDashboard,
  migratePersistedState,
  renameSavedDashboard,
  upsertSavedDashboard,
  type DashboardWorkspace,
  type SavedDashboard,
} from '@/lib/domain/saved-dashboards'

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

  // Dashboards guardados (el workspace de arriba se autoguarda en el activo)
  savedDashboards: SavedDashboard[]
  activeDashboardId: string | null
  
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
  regenerateVariantPalette: (variantId: string) => void
  setSelectedVariant: (variant: LayoutVariant | null) => void
  setIsGenerating: (generating: boolean) => void
  clearHistory: () => void
  
  // Acciones para dashboards guardados
  startNewDashboard: () => void
  openDashboard: (id: string) => void
  renameDashboard: (id: string, title: string) => void
  deleteDashboard: (id: string) => void

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
  savedDashboards: [] as SavedDashboard[],
  activeDashboardId: null as string | null,
}

const emptyWorkspace = {
  dashboardTitle: '',
  dashboardDescription: '',
  variables: [],
  excludedCombinations: [],
  generationHistory: [],
  currentVariant: null,
  selectedVariant: null,
}

const workspaceOf = (state: DashboardState): DashboardWorkspace => ({
  title: state.dashboardTitle,
  description: state.dashboardDescription,
  variables: state.variables,
  excludedCombinations: state.excludedCombinations,
  generationHistory: state.generationHistory,
})

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
      
      regenerateVariantPalette: (variantId) => set((state) => {
        const source =
          state.generationHistory.find(v => v.id === variantId) ??
          (state.currentVariant?.id === variantId ? state.currentVariant : null) ??
          (state.selectedVariant?.id === variantId ? state.selectedVariant : null)
        if (!source) return {}
        // Only the palette changes; layout, combinations and id stay the same
        const updated = regeneratePalette(source, state.generationHistory)
        const replace = (v: LayoutVariant | null) => (v?.id === variantId ? updated : v)
        return {
          generationHistory: state.generationHistory.map(v => (v.id === variantId ? updated : v)),
          currentVariant: replace(state.currentVariant),
          selectedVariant: replace(state.selectedVariant),
        }
      }),

      setSelectedVariant: (variant) => set({ selectedVariant: variant }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      
      clearHistory: () => set({ 
        generationHistory: [], 
        currentVariant: null, 
        selectedVariant: null 
      }),
      
      // Acciones para dashboards guardados
      startNewDashboard: () => set({ ...emptyWorkspace, activeDashboardId: null, showLanding: false }),

      openDashboard: (id) => set((state) => {
        const dashboard = state.savedDashboards.find(d => d.id === id)
        if (!dashboard) return {}
        return {
          activeDashboardId: dashboard.id,
          dashboardTitle: dashboard.title,
          dashboardDescription: dashboard.description,
          variables: dashboard.variables,
          excludedCombinations: dashboard.excludedCombinations,
          generationHistory: dashboard.generationHistory,
          currentVariant: dashboard.generationHistory[dashboard.generationHistory.length - 1] ?? null,
          selectedVariant: null,
          showLanding: false,
        }
      }),

      renameDashboard: (id, title) => set((state) => ({
        savedDashboards: renameSavedDashboard(state.savedDashboards, id, title),
        ...(state.activeDashboardId === id ? { dashboardTitle: title.trim() } : {}),
      })),

      deleteDashboard: (id) => set((state) => ({
        savedDashboards: deleteSavedDashboard(state.savedDashboards, id),
        ...(state.activeDashboardId === id ? { ...emptyWorkspace, activeDashboardId: null } : {}),
      })),

      // Utilidades
      reset: () => set(initialState),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      version: PERSISTED_STATE_VERSION,
      migrate: (persisted, version) => migratePersistedState(persisted, version) as unknown as DashboardState,
      // Solo persistir datos importantes, no estados temporales
      partialize: (state) => ({
        dashboardTitle: state.dashboardTitle,
        dashboardDescription: state.dashboardDescription,
        variables: state.variables,
        excludedCombinations: state.excludedCombinations,
        generationHistory: state.generationHistory,
        selectedVariant: state.selectedVariant,
        savedDashboards: state.savedDashboards,
        activeDashboardId: state.activeDashboardId,
      }),
    }
  )
)

// Autosave: every change to the workspace is copied into the active saved dashboard.
useDashboardStore.subscribe((state, previous) => {
  const changed =
    state.dashboardTitle !== previous.dashboardTitle ||
    state.dashboardDescription !== previous.dashboardDescription ||
    state.variables !== previous.variables ||
    state.excludedCombinations !== previous.excludedCombinations ||
    state.generationHistory !== previous.generationHistory
  if (!changed) return
  const { saved, activeId } = upsertSavedDashboard(state.savedDashboards, state.activeDashboardId, workspaceOf(state))
  if (saved !== state.savedDashboards || activeId !== state.activeDashboardId) {
    useDashboardStore.setState({ savedDashboards: saved, activeDashboardId: activeId })
  }
})

// Another tab saved: adopt its list (it may hold dashboards created there) and keep this tab's open dashboard in it.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'dashboard-storage' || !event.newValue) return
    let incoming: SavedDashboard[]
    try {
      const parsed = JSON.parse(event.newValue)
      if (parsed?.version !== PERSISTED_STATE_VERSION || !Array.isArray(parsed.state?.savedDashboards)) return
      incoming = parsed.state.savedDashboards
    } catch {
      return
    }
    const state = useDashboardStore.getState()
    const { saved, activeId } = upsertSavedDashboard(incoming, state.activeDashboardId, workspaceOf(state))
    useDashboardStore.setState({ savedDashboards: saved, activeDashboardId: activeId })
  })
}
