"use client"

import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"
import { generatePieData, randomFor } from "@/lib/domain/sample-data"
import type { VariableCombination } from "@/types/dashboard"

export function DonutChart({
  colors,
  combination,
  size,
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generatePieData(combination, randomFor(combination.id))
  // Radios adaptativos basados en porcentaje del contenedor disponible
  const innerRadius = size === "large" ? "40%" : size === "medium" ? "35%" : "30%"
  const outerRadius = size === "large" ? "80%" : size === "medium" ? "70%" : "60%"
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
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
        {size !== "small" && (
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
