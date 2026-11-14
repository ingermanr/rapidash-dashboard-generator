"use client"

import { useColorMode } from "@/components/dashboard-preview/use-color-mode"

/** Axis text colour that follows the current theme. */
export function useAxisTextColor(): string {
  return useColorMode() === "dark" ? "#ffffff" : "#000000"
}
