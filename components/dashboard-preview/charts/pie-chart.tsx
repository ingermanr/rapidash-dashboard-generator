"use client"

import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"
import { chartDensity, type ChartBox } from "@/components/dashboard-preview/charts/chart-scale"
import { generatePieData } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom, filterChartData } from "@/lib/domain/filters"

export function PieChart({
  colors,
  combination,
  size,
  box = { width: 0, height: 0 },
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large"; box?: ChartBox }) {
  const filters = usePreviewFilters()
  const data = filterChartData(generatePieData(combination, chartRandom(combination.id, filters)), combination, filters)
  // Radius adaptativo basado en porcentaje del contenedor disponible
  const outerRadius = size === "large" ? "80%" : size === "medium" ? "70%" : "60%"
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10
  // A legend needs room: in a compact chart the tooltip names each part instead.
  const showLegend = chartDensity(box) !== "compact"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          dataKey="value"
          label={size === "large"}
          labelLine={size === "large"}
        >
          {data.map((entry, index) => {
            const fillColor = colors[index % colors.length]
            return <Cell key={`cell-${index}`} fill={fillColor} stroke="hsl(var(--border))" strokeWidth={1} />
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        {showLegend && size !== "small" && (
          <Legend
            wrapperStyle={{
              fontSize: `${fontSize}px`,
              color: "hsl(var(--card-foreground))",
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
