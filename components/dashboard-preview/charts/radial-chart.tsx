"use client"

import { Legend, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from "recharts"
import { chartDensity, type ChartBox } from "@/components/dashboard-preview/charts/chart-scale"
import { generateRadialData } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom, filterChartData } from "@/lib/domain/filters"

export function RadialChart({
  colors,
  combination,
  size,
  box = { width: 0, height: 0 },
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large"; box?: ChartBox }) {
  const filters = usePreviewFilters()
  const data = filterChartData(generateRadialData(combination, colors, chartRandom(combination.id, filters)), combination, filters)
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10
  // A legend needs room: in a compact chart the tooltip names each part instead.
  const showLegend = chartDensity(box) !== "compact"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius={size === "large" ? "20%" : "25%"}
        outerRadius={size === "large" ? "90%" : "85%"}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          background={{ fill: "hsl(var(--muted))" }}
          dataKey="value"
          cornerRadius={10}
        />
        {showLegend && (
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{
            fontSize: `${fontSize}px`,
            color: "hsl(var(--card-foreground))",
          }}
        />
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}
