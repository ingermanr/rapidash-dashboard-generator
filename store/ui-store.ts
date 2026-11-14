import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UIState {
  // Tema y apariencia
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  
  // Preferencias de generación
  autoGenerate: boolean
  showAdvancedOptions: boolean
  
  // Configuración de visualización
  previewMode: 'grid' | 'list'
  showTooltips: boolean
  animationsEnabled: boolean
  
  // Acciones
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setAutoGenerate: (auto: boolean) => void
  setShowAdvancedOptions: (show: boolean) => void
  setPreviewMode: (mode: 'grid' | 'list') => void
  setShowTooltips: (show: boolean) => void
  setAnimationsEnabled: (enabled: boolean) => void
  reset: () => void
}

const initialState = {
  theme: 'system' as const,
  sidebarCollapsed: false,
  autoGenerate: false,
  showAdvancedOptions: false,
  previewMode: 'grid' as const,
  showTooltips: true,
  animationsEnabled: true,
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setTheme: (theme) => set({ theme }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setAutoGenerate: (auto) => set({ autoGenerate: auto }),
      
      setShowAdvancedOptions: (show) => set({ showAdvancedOptions: show }),
      
      setPreviewMode: (mode) => set({ previewMode: mode }),
      
      setShowTooltips: (show) => set({ showTooltips: show }),
      
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)