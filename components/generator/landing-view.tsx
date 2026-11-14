"use client"

import { PALETTES } from "@/lib/domain/palettes"
import { ArrowRight, BarChart3, Layout, Palette, Sparkles, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface LandingViewProps {
  onStart: () => void
}

/** Marketing landing shown before the user starts building a dashboard. */
export function LandingView({ onStart }: LandingViewProps) {
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
              Generación Automática
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
              en minutos. Define variables, genera layouts optimizados y obtén esquemas de color 
              diseñados automáticamente.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={onStart}
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
          <h2 className="sr-only">Características</h2>
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
              <h3 className="mb-4 text-xl font-bold text-card-foreground">{PALETTES.length} Paletas de Colores</h3>
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-chart-2 to-chart-2/80 text-3xl font-bold text-primary-foreground shadow-2xl shadow-chart-2/30 transition-all group-hover:scale-110 group-hover:shadow-chart-2/40">
                    2
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-foreground">Genera Layouts</h3>
                <p className="leading-relaxed text-muted-foreground">
                  El generador analiza el tipo y la prioridad de tus variables y crea <span className="font-semibold text-chart-2">layouts optimizados</span> con 
                  combinaciones inteligentes de gráficos y paletas de colores profesionales adaptadas a tus datos.
                </p>
              </div>

              <div className="relative group text-center lg:text-left">
                <div className="mb-8 flex justify-center lg:justify-start">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-chart-3 to-chart-3/80 text-3xl font-bold text-primary-foreground shadow-2xl shadow-chart-3/30 transition-all group-hover:scale-110 group-hover:shadow-chart-3/40">
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
                onClick={onStart}
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
