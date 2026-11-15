"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AXIS_FONT_SIZE, chartDensity, compactNumber, type ChartBox } from "@/components/dashboard-preview/charts/chart-scale"
import { useAxisTextColor } from "@/components/dashboard-preview/use-axis-text-color"
import { generateBarData } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom, filterChartData } from "@/lib/domain/filters"

export function BarChart({
  color,
  combination,
  size,
  box = { width: 0, height: 0 },
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large"; box?: ChartBox }) {
  const filters = usePreviewFilters()
  const data = filterChartData(generateBarData(combination, chartRandom(combination.id, filters)), combination, filters)
  const density = chartDensity(box)
  const compact = density === "compact"
  const fontSize = AXIS_FONT_SIZE[density]
  const barSize = size === "large" ? undefined : size === "medium" ? 25 : 18
  const margin = compact
    ? { top: 6, right: 8, left: 4, bottom: 0 }
    : size === "large"
      ? { top: 10, right: 15, left: 15, bottom: 20 }
      : size === "medium"
        ? { top: 8, right: 12, left: 12, bottom: 15 }
        : { top: 5, right: 8, left: 8, bottom: 12 }

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          interval={0}
          tickFormatter={(label: string) => (compact && label.length > 6 ? `${label.slice(0, 5)}…` : label)}
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
          width={density === "roomy" ? 40 : 32}
          tickFormatter={compactNumber}
          hide={compact}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={barSize} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
