"use client"

import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AXIS_FONT_SIZE, chartDensity, compactNumber, type ChartBox } from "@/components/dashboard-preview/charts/chart-scale"
import { useAxisTextColor } from "@/components/dashboard-preview/use-axis-text-color"
import { generateLineData } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom, timePointsFor } from "@/lib/domain/filters"

export function LineChart({
  color,
  combination,
  size,
  box = { width: 0, height: 0 },
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large"; box?: ChartBox }) {
  const filters = usePreviewFilters()
  const data = generateLineData(combination, chartRandom(combination.id, filters), timePointsFor(combination, filters))
  const density = chartDensity(box)
  const compact = density === "compact"
  const fontSize = AXIS_FONT_SIZE[density]
  const strokeWidth = size === "large" ? 3 : 2
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
      <RechartsLineChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          interval={compact ? "preserveStartEnd" : undefined}
          minTickGap={compact ? 4 : 5}
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={{ fill: color, r: compact ? 2 : size === "small" ? 3 : 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
