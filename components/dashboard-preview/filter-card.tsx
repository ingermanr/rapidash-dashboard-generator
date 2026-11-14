"use client"

import { getIconForVariableType } from "@/components/dashboard-preview/variable-icon"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateCategoriesForVariable } from "@/lib/domain/sample-data"
import type { Variable } from "@/types/dashboard"

export function FilterCard({
  variable,
  value,
  onChange,
}: {
  variable: Variable
  value: string
  onChange: (value: string) => void
}) {
  const Icon = getIconForVariableType(variable.type)

  if (variable.type === "categorical" || variable.type === "binary") {
    const categories = generateCategoriesForVariable(variable)

    return (
      <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">{variable.name}</span>
          </div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-8 rounded-md border-border/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70 hover:border-primary/30 transition-all duration-200 text-xs">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    )
  }

  if (variable.type === "temporal") {
    return (
      <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">{variable.name}</span>
          </div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-8 rounded-md border-border/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70 hover:border-primary/30 transition-all duration-200 text-xs">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Todos los períodos</SelectItem>
              <SelectItem value="last-7-days">Últimos 7 días</SelectItem>
              <SelectItem value="last-30-days">Últimos 30 días</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="last-year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    )
  }

  return null
}
