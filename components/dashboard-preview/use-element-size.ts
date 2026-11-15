"use client"

import { useEffect, useRef, useState } from "react"
import type { ChartBox } from "@/components/dashboard-preview/charts/chart-scale"

/** Size assumed when the element cannot be measured: a regular chart. */
const FALLBACK = { width: 320, height: 200 }

/** Tracks an element's rendered size (border box); {0, 0} until measured (and where ResizeObserver is unavailable). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [box, setBox] = useState<ChartBox>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    // Measure right away: observers report on the next rendered frame, which may come late (background tabs)
    // and content that waits for a size should not wait for it.
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) setBox({ width: Math.round(rect.width), height: Math.round(rect.height) })
    else if (typeof ResizeObserver === "undefined") setBox(FALLBACK)
    if (typeof ResizeObserver === "undefined") return
    // Border box on both paths, so the first measurement and later ones agree and the chart does not redraw.
    const observer = new ResizeObserver(([entry]) => {
      const size = entry.borderBoxSize?.[0]
      const width = Math.round(size ? size.inlineSize : entry.contentRect.width)
      const height = Math.round(size ? size.blockSize : entry.contentRect.height)
      setBox((current) => (current.width === width && current.height === height ? current : { width, height }))
    })
    observer.observe(element, { box: "border-box" })
    return () => observer.disconnect()
  }, [])

  return [ref, box] as const
}
