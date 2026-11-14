"use client"

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAxisTextColor } from "@/components/dashboard-preview/use-axis-text-color"
import { generateLineData, randomFor } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"

export function AreaChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateLineData(combination, randomFor(combination.id))
  const fontSize = size === "large" ? 13 : size === "medium" ? 11 : 9
  const strokeWidth = size === "large" ? 3 : 2
  const margin =
    size === "large"
      ? { top: 10, right: 15, left: 15, bottom: 20 }
      : size === "medium"
        ? { top: 8, right: 12, left: 12, bottom: 15 }
        : { top: 5, right: 8, left: 8, bottom: 12 }

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={margin}>
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
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={strokeWidth} fill={color} fillOpacity={0.2} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
