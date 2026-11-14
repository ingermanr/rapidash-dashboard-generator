"use client"

import { Legend, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from "recharts"
import { generateRadialData, randomFor } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"

export function RadialChart({
  colors,
  combination,
  size,
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateRadialData(combination, colors, randomFor(combination.id))
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10

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
