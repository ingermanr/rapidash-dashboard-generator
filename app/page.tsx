"use client"

import { useCallback } from "react"
import { VariableInput } from "@/components/variable-input"
import { LayoutPreview } from "@/components/layout-preview"
import { DashboardDetailedPreview } from "@/components/dashboard-detailed-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowLeft, FileText, BarChart3, Palette, Layout, Zap, ArrowRight } from "lucide-react"
import { useVariables, useLayouts, useDashboardInfo } from "@/store"
import { generateSingleLayoutVariant } from "@/lib/domain/variant-generator"

export default function DashboardGenerator() {
  // Usar hooks del store en lugar de useState
  const { variables, excludedCombinations } = useVariables()
  const { 
    currentVariant, 
    generationHistory, 
    isGenerating, 
    selectedVariant,
    setCurrentVariant,
    addToHistory,
    setIsGenerating,
    setSelectedVariant,
    removeFromHistory
  } = useLayouts()
  const {
    dashboardTitle,
    dashboardDescription,
    showLanding,
    setDashboardTitle,
    setDashboardDescription,
    setShowLanding
  } = useDashboardInfo()
  const { clearVariables } = useVariables()
  const { clearHistory } = useLayouts()

  const handleStartCreating = useCallback(() => {
    // Limpiar todos los datos anteriores cuando se inicia una nueva sesión
    clearVariables()
    clearHistory()
    setDashboardTitle('')
    setDashboardDescription('')
    setShowLanding(false)
  }, [setShowLanding, clearVariables, clearHistory, setDashboardTitle, setDashboardDescription])

  const generateVariant = useCallback(() => {
    setIsGenerating(true)

    setTimeout(() => {
      const newVariant = generateSingleLayoutVariant(variables, generationHistory, excludedCombinations)
      setCurrentVariant(newVariant)
      addToHistory(newVariant)
      setIsGenerating(false)
    }, 800)
  }, [variables, generationHistory, excludedCombinations, setIsGenerating, setCurrentVariant, addToHistory])

  const deleteVariant = useCallback((variantId: string) => {
    removeFromHistory(variantId)
  }, [removeFromHistory])

  const handleBackToVariants = useCallback(() => {
    setSelectedVariant(null)
  }, [setSelectedVariant])

  if (showLanding) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Dynamic tech grid pattern */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Animated gradient overlays */}
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-primary/20 to-accent/10 blur-3xl animate-soft-pulse" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-primary/15 to-chart-2/10 blur-3xl animate-soft-pulse [animation-delay:2s]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-t from-chart-3/10 to-chart-4/10 blur-2xl animate-float [animation-delay:4s]" />

        {/* Content wrapper */}
        <div className="relative z-10">
          <div className="absolute right-4 top-4 z-20">
            <ThemeToggle />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="mb-20 text-center">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border-2 border-primary/30 bg-gradient-to-r from-primary/15 to-accent/10 px-8 py-3 text-sm font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30 dark:border-primary/20 dark:from-primary/10 dark:to-accent/5 glass-effect animate-scale-in">
                <Sparkles className="h-5 w-5 animate-soft-pulse" />
                Powered by AI
              </div>
              <h1 className="mb-8 text-balance text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                <span className="hero-title-gradient" data-text="Dashboard">
                  Dashboard
                </span>{" "}
                <span className="text-foreground font-black">Generator</span>
              </h1>
              <p className="mx-auto mb-12 max-w-4xl text-pretty text-xl leading-relaxed text-muted-foreground sm:text-2xl">
                Transforma tus datos en{" "}
                <span className="font-semibold text-primary">visualizaciones profesionales</span>{" "}
                con inteligencia artificial. Define variables, genera layouts optimizados y obtén esquemas de color 
                diseñados automáticamente.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={handleStartCreating}
                  size="lg"
                  className="group btn-glow interactive-scale h-16 gap-3 px-12 text-lg font-bold shadow-2xl shadow-glow-primary transition-all hover:shadow-primary/40 bg-gradient-to-r from-primary to-chart-3 hover:from-primary/90 hover:to-chart-3/90 focus-ring"
                >
                  Comenzar a Crear
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✨ Gratis • Sin registro • Código abierto
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mb-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative mb-6 inline-flex rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/10 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-primary/20">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-card-foreground">Múltiples Tipos de Variables</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Soporta variables <span className="font-semibold text-primary">numéricas, categóricas, temporales</span>, binarias y porcentuales para análisis completos.
                </p>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-2/40 hover:shadow-2xl hover:shadow-chart-2/10">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative mb-6 inline-flex rounded-2xl bg-gradient-to-br from-chart-2/20 to-chart-2/10 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-chart-2/20">
                  <Layout className="h-8 w-8 text-chart-2" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-card-foreground">15+ Layouts Inteligentes</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Patrones de layout que se adaptan automáticamente: <span className="font-semibold text-chart-2">Grid, F-Pattern, Z-Pattern</span> y más.
                </p>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-3/40 hover:shadow-2xl hover:shadow-chart-3/10">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative mb-6 inline-flex rounded-2xl bg-gradient-to-br from-chart-3/20 to-chart-3/10 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-chart-3/20">
                  <Palette className="h-8 w-8 text-chart-3" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-card-foreground">50+ Paletas de Colores</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Esquemas profesionales con <span className="font-semibold text-chart-3">alto contraste</span> y armonía visual para cada dashboard.
                </p>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-4/40 hover:shadow-2xl hover:shadow-chart-4/10">
                <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative mb-6 inline-flex rounded-2xl bg-gradient-to-br from-chart-4/20 to-chart-4/10 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-chart-4/20">
                  <Zap className="h-8 w-8 text-chart-4" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-card-foreground">Exportación Profesional</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Descarga informes <span className="font-semibold text-chart-4">completos en PDF</span> con especificaciones técnicas y códigos de color.
                </p>
              </Card>
            </div>

            {/* How it Works */}
            <div className="mb-20">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
                  Cómo Funciona
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Tres pasos simples para crear dashboards profesionales
                </p>
              </div>
              <div className="grid gap-12 lg:grid-cols-3">
                <div className="relative group text-center lg:text-left">
                  <div className="mb-8 flex justify-center lg:justify-start">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-3xl font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all group-hover:scale-110 group-hover:shadow-primary/40">
                      1
                    </div>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-foreground">Define tus Variables</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Ingresa las variables que deseas visualizar: <span className="font-semibold text-primary">ventas, usuarios, fechas, categorías</span>, y más. 
                    El sistema reconoce automáticamente el tipo de dato y sugiere las mejores visualizaciones.
                  </p>
                </div>

                <div className="relative group text-center lg:text-left">
                  <div className="mb-8 flex justify-center lg:justify-start">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-chart-2 to-chart-2/80 text-3xl font-bold text-white shadow-2xl shadow-chart-2/30 transition-all group-hover:scale-110 group-hover:shadow-chart-2/40">
                      2
                    </div>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-foreground">Genera Layouts</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    La IA analiza tus variables y genera <span className="font-semibold text-chart-2">layouts optimizados</span> con 
                    combinaciones inteligentes de gráficos y paletas de colores profesionales adaptadas a tus datos.
                  </p>
                </div>

                <div className="relative group text-center lg:text-left">
                  <div className="mb-8 flex justify-center lg:justify-start">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-chart-3 to-chart-3/80 text-3xl font-bold text-white shadow-2xl shadow-chart-3/30 transition-all group-hover:scale-110 group-hover:shadow-chart-3/40">
                      3
                    </div>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-foreground">Exporta y Utiliza</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Descarga el <span className="font-semibold text-chart-3">informe completo en PDF</span> con todas las especificaciones técnicas, 
                    códigos de color y recomendaciones detalladas para implementar tu dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Section - Redesigned */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card/95 to-chart-2/10 p-12 text-center shadow-2xl backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-primary/20 dark:border-primary/20 dark:from-primary/5 dark:to-chart-2/5">
              {/* Animated background elements */}
              <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl animate-float" />
              <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-chart-3/10 blur-2xl animate-float [animation-delay:2s]" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-2 text-sm font-bold text-primary">
                  <Sparkles className="h-4 w-4 animate-soft-pulse" />
                  ¡Gratis y sin registro!
                </div>
                <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                  ¿Listo para crear tu{" "}
                  <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                    dashboard perfecto
                  </span>
                  ?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Comienza ahora y transforma tus datos en{" "}
                  <span className="font-semibold text-primary">visualizaciones profesionales</span>{" "}
                  en minutos.
                </p>
                <Button
                  onClick={handleStartCreating}
                  size="lg"
                  className="group btn-glow interactive-scale h-16 gap-3 px-12 text-lg font-bold shadow-2xl shadow-glow-primary transition-all hover:shadow-primary/40 bg-gradient-to-r from-primary to-chart-3 hover:from-primary/90 hover:to-chart-3/90 focus-ring"
                >
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Comenzar Ahora
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedVariant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={handleBackToVariants} variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a Variantes
              </Button>
              <Button onClick={handleStartCreating} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Nuevo Dashboard
              </Button>
            </div>
            <ThemeToggle />
          </div>

          <DashboardDetailedPreview
            variant={selectedVariant}
            dashboardTitle={dashboardTitle}
            dashboardDescription={dashboardDescription}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle tech grid pattern */}
      <div
        className="fixed inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated gradient overlays */}
      <div className="fixed left-0 top-0 h-[300px] w-[300px] rounded-full bg-gradient-to-r from-primary/10 to-chart-2/5 blur-3xl animate-soft-pulse" />
      <div className="fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-chart-3/10 to-chart-4/5 blur-3xl animate-soft-pulse [animation-delay:3s]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-12 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card/95 via-card to-card/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-primary/30 bg-gradient-to-r from-primary/15 to-chart-2/10 px-6 py-3 text-sm font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30">
                <Sparkles className="h-5 w-5 animate-soft-pulse" />
                AI-Powered Dashboard Design
              </div>
              <div>
                <h1 className="mb-4 text-balance text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  Dashboard Generator
                </h1>
                <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  Transforma tus datos en{" "}
                  <span className="font-semibold text-primary">visualizaciones profesionales</span>.{" "}
                  Define variables, genera layouts optimizados y obtén esquemas de color diseñados por IA.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleStartCreating} 
                variant="outline" 
                size="sm"
                className="gap-2 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-chart-2/5 shadow-lg transition-all hover:scale-105 hover:shadow-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                Empezar Nuevo
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Info Section */}
        <div className="mb-12">
          <Card className="group relative overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            {/* Header Section with improved spacing */}
            <div className="relative border-b border-border/20 bg-gradient-to-r from-primary/5 via-transparent to-chart-1/5 px-8 py-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-chart-1/15 p-4 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-primary/20">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold tracking-tight text-card-foreground">Información del Dashboard</h2>
                  <p className="mt-1 text-base text-muted-foreground/80">Define el contexto y propósito de tu dashboard para generar visualizaciones más precisas</p>
                </div>
              </div>
            </div>

            {/* Content Section with improved layout */}
            <div className="relative px-8 py-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Title Field */}
                <div className="group/field space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-title" className="text-sm font-semibold text-card-foreground">
                      Título del Dashboard
                    </label>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Requerido
                    </span>
                  </div>
                  <Input
                    id="dashboard-title"
                    placeholder="Ej: Dashboard de Ventas Q4 2024"
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                    className="h-14 border-2 border-border/60 bg-background/80 text-base backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-background focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Un título claro ayuda a generar visualizaciones más enfocadas
                  </p>
                </div>

                {/* Description Field */}
                <div className="group/field space-y-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-description" className="text-sm font-semibold text-card-foreground">
                      Descripción
                    </label>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Opcional
                    </span>
                  </div>
                  <Textarea
                    id="dashboard-description"
                    placeholder="Ej: Análisis completo de ventas por región, categoría de producto y período temporal para identificar tendencias, patrones estacionales y oportunidades de crecimiento en el mercado."
                    value={dashboardDescription}
                    onChange={(e) => setDashboardDescription(e.target.value)}
                    className="min-h-[140px] resize-none border-2 border-border/60 bg-background/80 text-base leading-relaxed backdrop-blur-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-background focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Proporciona contexto para generar combinaciones de variables más inteligentes
                  </p>
                </div>
              </div>

              {/* Info Banner */}
              {(dashboardTitle || dashboardDescription) && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-chart-1/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">
                        Información configurada correctamente
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Esta información se utilizará para generar layouts y combinaciones más precisas
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Variable Input Section */}
        <div className="mb-10">
          <VariableInput />
        </div>

        {/* Enhanced Generate Button Section */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-foreground">
              {variables.length === 0 
                ? "Define variables para comenzar" 
                : `${variables.length} ${variables.length === 1 ? 'variable definida' : 'variables definidas'}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {variables.length === 0 
                ? "Agrega al menos una variable para generar tu dashboard" 
                : "Listo para generar visualizaciones profesionales"}
            </p>
          </div>
          
          <Button
            onClick={generateVariant}
            disabled={variables.length === 0 || isGenerating}
            size="lg"
            className="group btn-glow interactive-scale h-16 gap-4 px-12 text-lg font-bold shadow-2xl shadow-glow-primary transition-all hover:shadow-primary/40 bg-gradient-to-r from-primary to-chart-3 hover:from-primary/90 hover:to-chart-3/90 focus-ring disabled:from-muted disabled:to-muted disabled:shadow-none"
          >
            <Sparkles className={`h-6 w-6 transition-transform ${isGenerating ? "animate-spin" : "group-hover:rotate-12"}`} />
            {isGenerating ? "Generando Layout..." : currentVariant ? "Generar Nuevo Layout" : "Generar Layout"}
            {!isGenerating && (
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            )}
          </Button>
        </div>

        {/* Enhanced Current Variant */}
        {currentVariant && (
          <div className="mb-12">
            <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/10 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">Layout Generado</h2>
                    <p className="text-muted-foreground">Revisa el diseño y explora las opciones de personalización</p>
                  </div>
                </div>
                {generationHistory.length > 1 && (
                  <div className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-gradient-to-r from-primary/15 to-chart-2/10 px-4 py-2 shadow-lg backdrop-blur-md">
                    <div className="h-2 w-2 rounded-full bg-primary animate-soft-pulse" />
                    <span className="text-sm font-bold text-primary">Generación #{generationHistory.length}</span>
                  </div>
                )}
              </div>
            </div>
            <LayoutPreview
              variant={currentVariant}
              index={0}
              onSelect={() => setSelectedVariant(currentVariant)}
              onDelete={deleteVariant}
            />
          </div>
        )}

        {/* Enhanced Generation History */}
        {generationHistory.length > 1 && (
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/30 to-card/10 p-8 backdrop-blur-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-3/10 shadow-lg">
                <Layout className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Historial de Generaciones</h2>
                <p className="text-muted-foreground">
                  {generationHistory.length - 1}{" "}
                  {generationHistory.length - 1 === 1 ? "variante anterior disponible" : "variantes anteriores disponibles"}
                </p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {generationHistory
                .slice(0, -1)
                .reverse()
                .map((variant, index) => (
                  <LayoutPreview
                    key={variant.id}
                    variant={variant}
                    index={index}
                    onSelect={() => setSelectedVariant(variant)}
                    onDelete={deleteVariant}
                  />
                ))}
            </div>
          </div>
        )}

        {!currentVariant && variables.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-card/90 to-chart-3/10 p-16 text-center backdrop-blur-md">
            <div className="absolute left-4 top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl animate-float" />
            <div className="absolute right-4 bottom-4 h-32 w-32 rounded-full bg-chart-3/10 blur-2xl animate-float [animation-delay:2s]" />
            
            <div className="relative mx-auto max-w-lg space-y-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-chart-3/20 p-6 shadow-2xl shadow-primary/20">
                <Sparkles className="h-12 w-12 text-primary animate-soft-pulse" />
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold text-card-foreground">Todo Listo para Generar</h3>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-semibold text-primary">
                  ✓ {variables.length} {variables.length === 1 ? "variable definida" : "variables definidas"}
                </div>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Perfecto! Tienes todas las variables necesarias. Haz clic en{" "}
                <span className="font-semibold text-primary">&ldquo;Generar Layout&rdquo;</span>{" "}
                para crear un dashboard optimizado con visualizaciones profesionales y paletas de colores diseñadas por IA.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
