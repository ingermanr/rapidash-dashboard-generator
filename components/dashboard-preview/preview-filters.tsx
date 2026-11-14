"use client"

import { createContext, useContext } from "react"
import { NO_FILTERS, type ActiveFilters } from "@/lib/domain/filters"

const PreviewFiltersContext = createContext<ActiveFilters>(NO_FILTERS)

/** Provides the active preview filters to every chart below it. */
export const PreviewFiltersProvider = PreviewFiltersContext.Provider

/** Active filters of the surrounding dashboard preview (none outside a provider). */
export function usePreviewFilters(): ActiveFilters {
  return useContext(PreviewFiltersContext)
}
