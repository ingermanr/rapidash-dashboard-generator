"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAxisTextColor } from "@/components/dashboard-preview/use-axis-text-color"
import { generateBarData, randomFor } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"

export function HorizontalBarChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateBarData(combination, randomFor(combination.id))
  const fontSize = size === "large" ? 13 : size === "medium" ? 12 : 10
  const barSize = size === "large" ? undefined : size === "medium" ? 25 : 18
  const margin =
    size === "large"
      ? { top: 10, right: 30, left: 10, bottom: 10 }
      : size === "medium"
        ? { top: 5, right: 25, left: 5, bottom: 5 }
        : { top: 5, right: 20, left: 0, bottom: 5 }
  const yAxisWidth = size === "large" ? 90 : size === "medium" ? 80 : 70

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} layout="vertical" margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          type="number"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          width={yAxisWidth}
          tickMargin={5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={barSize} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
