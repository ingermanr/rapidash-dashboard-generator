"use client"

import { TrendingUp } from "lucide-react"
import { generateMetricValue } from "@/lib/domain/sample-data"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom } from "@/lib/domain/filters"

export function MetricDisplay({ color, name, size, seedKey }: { color: string; name: string; size: "small" | "medium" | "large"; seedKey: string }) {
  const filters = usePreviewFilters()
  const { value, change } = generateMetricValue(chartRandom(seedKey, filters))
  const isPositive = Number.parseFloat(change) > 0
  
  const textSize = size === "large" ? "text-4xl" : size === "medium" ? "text-3xl" : "text-2xl"
  const padding = size === "large" ? "px-4" : size === "medium" ? "px-3" : "px-2"
  const cardPadding = size === "large" ? "p-4" : size === "medium" ? "p-3" : "p-2"
  const gapSize = size === "large" ? "gap-4" : "gap-3"

  return (
    <div className={`flex h-full flex-col justify-center ${gapSize} ${padding}`}>
      <div className={`rounded-lg border border-border bg-secondary/30 ${cardPadding}`}>
        <div className={`${textSize} font-bold text-card-foreground`} style={{ color }}>
          {value.toLocaleString()}
        </div>
        <p className={`mt-1 ${size === "large" ? "text-sm" : "text-xs"} font-medium text-card-foreground opacity-80`}>
          {name}
        </p>
      </div>
      <div className={`flex items-center gap-2 ${size === "large" ? "text-sm" : "text-xs"} font-medium`}>
        <TrendingUp className={`${size === "large" ? "h-4 w-4" : "h-3 w-3"} ${isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`} />
        <span className={`font-semibold ${isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-muted-foreground">vs mes anterior</span>
      </div>
    </div>
  )
}
