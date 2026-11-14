"use client"

import { useEffect, useState } from "react"
import { paletteColors, type ColorMode } from "@/lib/domain/palettes"
import type { ColorPalette } from "@/types/dashboard"

const readMode = (): ColorMode =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"

/** Current colour mode, kept in sync with the `dark` class the theme toggle sets on <html>. */
export function useColorMode(): ColorMode {
  const [mode, setMode] = useState<ColorMode>("light")

  useEffect(() => {
    setMode(readMode())
    const observer = new MutationObserver(() => setMode(readMode()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return mode
}

/** The palette's colours for the current colour mode. */
export function usePaletteColors(palette: ColorPalette): string[] {
  return paletteColors(palette, useColorMode())
}
