"use client"

import { generateProgressValue, randomFor } from "@/lib/domain/sample-data"

export function ProgressBar({ color, size, seedKey }: { color: string; size: "small" | "medium" | "large"; seedKey: string }) {
  const value = generateProgressValue(randomFor(seedKey))
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
          Progreso Actual
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
