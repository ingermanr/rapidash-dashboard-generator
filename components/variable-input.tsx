"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, BarChart3, Calendar, Tag, Hash, Type, TrendingUp, ToggleLeft, AlertCircle, EyeOff, Eye, type LucideIcon } from "lucide-react"
import type { Variable, VariableType, VariablePriority } from "@/types/dashboard"
import { useVariables } from "@/store"

const MIN_VARIABLE_NAME_LENGTH = 2
const MAX_VARIABLE_NAME_LENGTH = 50

const variableTypes: { value: VariableType; label: string; icon: LucideIcon }[] = [
  { value: "numeric", label: "Numérico", icon: Hash },
  { value: "categorical", label: "Categórico", icon: Tag },
  { value: "temporal", label: "Temporal", icon: Calendar },
  { value: "percentage-progress", label: "Porcentaje (Progreso)", icon: BarChart3 },
  { value: "percentage-ratio", label: "Porcentaje (Ratio)", icon: TrendingUp },
  { value: "binary", label: "Binario", icon: ToggleLeft },
  { value: "text", label: "Texto", icon: Type },
]

const priorityOptions: { value: VariablePriority; label: string; color: string }[] = [
  { value: "alta", label: "Alta Importancia", color: "text-red-600" },
  { value: "media", label: "Media Importancia", color: "text-orange-500" },
  { value: "baja", label: "Baja Importancia", color: "text-green-600" },
]

export function VariableInput() {
  // Usar el hook del store en lugar de props
  const { 
    variables, 
    addVariable: addVariableToStore, 
    removeVariable: removeVariableFromStore, 
    variableExists,
    getPriorityStats,
    addExcludedCombination,
    removeExcludedCombination,
    isCombinationExcluded
  } = useVariables()
  const [name, setName] = useState("")
  const [type, setType] = useState<VariableType>("numeric")
  const [priority, setPriority] = useState<VariablePriority>("media")
  const [error, setError] = useState<string>("")

  const validateVariableName = (name: string): string | null => {
    const trimmedName = name.trim()

    if (trimmedName.length < MIN_VARIABLE_NAME_LENGTH) {
      return `El nombre debe tener al menos ${MIN_VARIABLE_NAME_LENGTH} caracteres`
    }

    if (trimmedName.length > MAX_VARIABLE_NAME_LENGTH) {
      return `El nombre no puede exceder ${MAX_VARIABLE_NAME_LENGTH} caracteres`
    }

    if (variableExists(trimmedName)) {
      return "Ya existe una variable con este nombre"
    }

    return null
  }

  const handleAddVariable = () => {
    const trimmedName = name.trim()
    const validationError = validateVariableName(trimmedName)

    if (validationError) {
      setError(validationError)
      return
    }

    addVariableToStore({
      id: `var-${Date.now()}`,
      name: trimmedName,
      type,
      priority,
    })
    setName("")
    setType("numeric")
    setPriority("media")
    setError("")
  }

  const handleRemoveVariable = (id: string) => {
    removeVariableFromStore(id)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddVariable()
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (error) setError("")
  }

  const handleExcludeCombination = (combo: { text: string; variables: Variable[] }) => {
    const combinationId = `combo-${combo.variables.map(v => v.id).sort().join('-')}`
    const variableIds = combo.variables.map(v => v.id)
    
    addExcludedCombination({
      id: combinationId,
      description: combo.text,
      variableIds: variableIds
    })
  }

  const handleIncludeCombination = (combo: { text: string; variables: Variable[] }) => {
    const combinationId = `combo-${combo.variables.map(v => v.id).sort().join('-')}`
    removeExcludedCombination(combinationId)
  }

  const isCombinationCurrentlyExcluded = (combo: { variables: Variable[] }) => {
    return isCombinationExcluded(combo.variables.map(v => v.id))
  }

  const numericVars = variables.filter(
    (v) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio",
  )
  const categoricalVars = variables.filter((v) => v.type === "categorical")
  const binaryVars = variables.filter((v) => v.type === "binary")
  const temporalVars = variables.filter((v) => v.type === "temporal")

  // Crear combinaciones con información de prioridad
  const suggestedCombinations: { text: string; maxPriority: number; variables: Variable[] }[] = []
  const priorityValue = { 'alta': 1, 'media': 2, 'baja': 3 }

  for (const numeric of numericVars) {
    for (const categorical of categoricalVars) {
      const maxPriority = Math.min(priorityValue[numeric.priority], priorityValue[categorical.priority])
      suggestedCombinations.push({
        text: `${numeric.name} por ${categorical.name}`,
        maxPriority,
        variables: [numeric, categorical]
      })
    }
  }

  for (const numeric of numericVars) {
    for (const binary of binaryVars) {
      const maxPriority = Math.min(priorityValue[numeric.priority], priorityValue[binary.priority])
      suggestedCombinations.push({
        text: `${numeric.name} por ${binary.name}`,
        maxPriority,
        variables: [numeric, binary]
      })
    }
  }

  for (const numeric of numericVars) {
    for (const temporal of temporalVars) {
      const maxPriority = Math.min(priorityValue[numeric.priority], priorityValue[temporal.priority])
      suggestedCombinations.push({
        text: `${numeric.name} en ${temporal.name}`,
        maxPriority,
        variables: [numeric, temporal]
      })
    }
  }

  for (const numeric of numericVars) {
    if (categoricalVars.length === 0 && binaryVars.length === 0 && temporalVars.length === 0) {
      suggestedCombinations.push({
        text: `${numeric.name}`,
        maxPriority: priorityValue[numeric.priority],
        variables: [numeric]
      })
    }
  }

  // Ordenar por prioridad (menor valor = mayor prioridad)
  suggestedCombinations.sort((a, b) => a.maxPriority - b.maxPriority)

  // Filtrar las combinaciones no excluidas para el conteo total - calculado dinámicamente
  const activeCombinations = suggestedCombinations.filter(combo => !isCombinationCurrentlyExcluded(combo))
  const totalCombinations = activeCombinations.length || variables.length

  return (
    <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card/95 to-muted/20 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/10 p-3 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-primary/20">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Define Variables</h2>
          <p className="text-muted-foreground">Especifica los datos que deseas visualizar en tu dashboard</p>
        </div>
      </div>

      <div className="relative mb-8 space-y-6">
        <div className="rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/90 to-background/60 p-4 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/60 focus-within:shadow-primary/10">
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground mb-1">Nueva Variable</h3>
            <p className="text-xs text-muted-foreground">Define el nombre, tipo e importancia</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            {/* Campo de Nombre - Más ancho en desktop */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-foreground">Nombre de la Variable</label>
              <Input
                placeholder="Ej: Ventas, Usuarios, Ingresos..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`h-9 border bg-background/80 text-sm transition-all focus:border-primary/60 focus:bg-background ${error ? "border-destructive focus:border-destructive" : "border-border/60"}`}
                aria-label="Nombre de la variable"
                aria-invalid={!!error}
                aria-describedby={error ? "variable-error" : undefined}
              />
            </div>
            
            {/* Campo de Tipo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tipo</label>
              <Select value={type} onValueChange={(v) => setType(v as VariableType)}>
                <SelectTrigger className="h-9 border border-border/60 bg-background/80 text-sm transition-all focus:border-primary/60" aria-label="Tipo de variable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variableTypes.map((vt) => {
                    const Icon = vt.icon
                    return (
                      <SelectItem key={vt.value} value={vt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs">{vt.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Campo de Importancia */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Importancia</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as VariablePriority)}>
                <SelectTrigger className="h-9 border border-border/60 bg-background/80 text-sm transition-all focus:border-primary/60" aria-label="Prioridad de la variable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((po) => (
                    <SelectItem key={po.value} value={po.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          po.value === "alta" ? "bg-red-500" : 
                          po.value === "media" ? "bg-orange-500" : 
                          "bg-green-500"
                        }`} />
                        <span className="text-xs">{po.value.charAt(0).toUpperCase() + po.value.slice(1)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón de Agregar */}
            <div className="flex items-end">
              <Button 
                onClick={handleAddVariable} 
                className="group h-9 w-full gap-2 text-xs font-semibold shadow-md transition-all hover:shadow-lg bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90" 
                aria-label="Agregar variable"
              >
                <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                Agregar
              </Button>
            </div>
          </div>
          
          {/* Texto informativo compacto */}
          <div className="mt-3 border-t border-border/30 pt-2">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium text-red-600">Alta prioridad</span> = espacios más grandes en el dashboard
            </p>
          </div>
        </div>

        {error && (
          <div id="variable-error" className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Enhanced Variables List */}
      {variables.length > 0 && (
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-3/10 shadow-sm">
              <Hash className="h-4 w-4 text-chart-2" />
            </div>
            <h3 className="text-lg font-bold text-card-foreground">
              Variables Definidas ({variables.length})
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {variables.map((variable) => {
              const typeInfo = variableTypes.find((vt) => vt.value === variable.type)
              const Icon = typeInfo?.icon || Hash
              return (
                <div
                  key={variable.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background via-background/90 to-muted/20 p-4 shadow-lg backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-primary/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-1/10 p-2 shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-card-foreground">{variable.name}</span>
                          <div className={`h-2 w-2 rounded-full ${
                            variable.priority === "alta" ? "bg-red-500" : 
                            variable.priority === "media" ? "bg-orange-500" : 
                            "bg-green-500"
                          }`} title={`Importancia ${variable.priority}`} />
                        </div>
                        <div className="mt-1 flex gap-2">
                          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {typeInfo?.label}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            variable.priority === "alta" 
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" 
                              : variable.priority === "media"
                              ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                              : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                          }`}>
                            {variable.priority === "alta" ? "Alta" : variable.priority === "media" ? "Media" : "Baja"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariable(variable.id)}
                      aria-label={`Eliminar variable ${variable.name}`}
                      className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {suggestedCombinations.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-chart-2/10 p-6 shadow-xl backdrop-blur-md">
              <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 shadow-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-card-foreground">
                      Combinaciones Sugeridas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {totalCombinations} visualizaciones serán generadas
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  El dashboard generará <span className="font-semibold text-primary">{totalCombinations} espacios de visualización</span> basados en estas combinaciones inteligentes. <span className="font-semibold text-chart-2">Las variables de alta prioridad aparecerán en posiciones más prominentes</span> del layout. <span className="font-semibold text-destructive">Puedes excluir combinaciones específicas</span> que no desees visualizar:
                </p>
                
                {(() => {
                  const priorityStats = getPriorityStats()
                  const hasVariedPriorities = priorityStats.alta > 0 || priorityStats.baja > 0
                  
                  if (hasVariedPriorities) {
                    return (
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        {priorityStats.alta > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            {priorityStats.alta} Alta prioridad
                          </span>
                        )}
                        {priorityStats.media > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            {priorityStats.media} Media prioridad
                          </span>
                        )}
                        {priorityStats.baja > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            {priorityStats.baja} Baja prioridad
                          </span>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Click en el ícono para excluir/incluir combinaciones
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {activeCombinations.length} de {suggestedCombinations.length} activas
                    </div>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {suggestedCombinations.map((combo, idx) => {
                      const isExcluded = isCombinationCurrentlyExcluded(combo)
                      // Calcular el índice de posición para las combinaciones activas
                      const precedingActiveCombos = suggestedCombinations.slice(0, idx).filter(c => !isCombinationCurrentlyExcluded(c))
                      const activeIndex = isExcluded ? -1 : precedingActiveCombos.length
                      
                      const priorityColors = isExcluded ? {
                        1: "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                        2: "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400", 
                        3: "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      } : {
                        1: "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300",
                        2: "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300", 
                        3: "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }
                      
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${priorityColors[combo.maxPriority as keyof typeof priorityColors] || priorityColors[2]} ${isExcluded ? 'opacity-60' : ''}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => isExcluded ? handleIncludeCombination(combo) : handleExcludeCombination(combo)}
                            className="h-5 w-5 p-0 hover:bg-transparent shrink-0"
                            title={isExcluded ? 'Incluir en dashboard' : 'Excluir del dashboard'}
                          >
                            {isExcluded ? (
                              <EyeOff className="h-3 w-3 text-gray-400" />
                            ) : (
                              <Eye className="h-3 w-3 text-current" />
                            )}
                          </Button>
                          
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {!isExcluded && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 text-xs font-bold text-current shrink-0">
                                {activeIndex + 1}
                              </span>
                            )}
                            <span className={`font-medium text-sm truncate ${isExcluded ? 'line-through' : ''}`} title={combo.text}>
                              {combo.text}
                            </span>
                          </div>
                          
                          <span className="text-xs opacity-70 shrink-0">
                            {combo.maxPriority === 1 ? 'A' : combo.maxPriority === 2 ? 'M' : 'B'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {variables.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-br from-muted/30 to-muted/10 p-12 text-center backdrop-blur-sm">
          <div className="absolute left-6 top-6 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute right-6 bottom-6 h-20 w-20 rounded-full bg-chart-2/10 blur-2xl" />
          <div className="relative mx-auto max-w-sm space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/60 to-muted/30 shadow-lg">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h4 className="mb-2 text-lg font-bold text-card-foreground">Define tus Primeras Variables</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Agrega variables como <span className="font-semibold text-primary">ventas</span>,{" "}
                <span className="font-semibold text-primary">usuarios</span>, o{" "}
                <span className="font-semibold text-primary">categorías</span> para generar dashboards profesionales
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
