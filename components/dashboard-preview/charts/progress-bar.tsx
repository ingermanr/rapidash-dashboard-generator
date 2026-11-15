"use client"

import { generateProgressValue } from "@/lib/domain/sample-data"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom } from "@/lib/domain/filters"

export function ProgressBar({
  color,
  size,
  seedKey,
  caption = "Progreso actual",
}: {
  color: string
  size: "small" | "medium" | "large"
  seedKey: string
  /** What the percentage means: progress toward a goal, or the share of a whole. */
  caption?: string
}) {
  const filters = usePreviewFilters()
  const value = generateProgressValue(chartRandom(seedKey, filters))
  const textSize = size === "large" ? "text-5xl" : size === "medium" ? "text-4xl" : "text-3xl"
  const gapSize = size === "large" ? "gap-6" : size === "medium" ? "gap-4" : "gap-3"
  const padding = size === "large" ? "px-8" : size === "medium" ? "px-6" : "px-4"

  return (
    <div className={`flex h-full flex-col items-center justify-center ${gapSize} ${padding}`}>
      <div className="text-center">
        <div className={`${textSize} font-bold text-card-foreground`} style={{ color }}>
          {value}%
        </div>
        <p className={`mt-2 ${size === "large" ? "text-sm" : "text-xs"} font-medium text-card-foreground opacity-80`}>
          {caption}
        </p>
      </div>
      <div className={`${size === "large" ? "h-4" : size === "medium" ? "h-3" : "h-2"} w-full overflow-hidden rounded-full bg-secondary`}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className={`flex w-full justify-between ${size === "large" ? "text-xs" : "text-xs"} font-medium text-card-foreground opacity-70`}>
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
