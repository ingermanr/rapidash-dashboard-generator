"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAxisTextColor } from "@/components/dashboard-preview/use-axis-text-color"
import { generateBarData, randomFor } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"

export function BarChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateBarData(combination, randomFor(combination.id))
  const fontSize = size === "large" ? 13 : size === "medium" ? 11 : 9
  const barSize = size === "large" ? undefined : size === "medium" ? 25 : 18
  const margin =
    size === "large"
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
          width={size === "small" ? 35 : 45}
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
