import { CHART_TYPE_LABELS } from "@/lib/domain/labels"
import { getIconForChartType } from "@/components/dashboard-preview/chart-icon"
import {
  AreaChart,
  BarChart,
  DonutChart,
  HorizontalBarChart,
  LineChart,
  PieChart,
  RadialChart,
} from "@/components/dashboard-preview/charts/lazy-charts"
import { MetricDisplay } from "@/components/dashboard-preview/charts/metric-display"
import { ProgressBar } from "@/components/dashboard-preview/charts/progress-bar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { usePaletteColors } from "@/components/dashboard-preview/use-color-mode"
import { useElementSize } from "@/components/dashboard-preview/use-element-size"
import type { LayoutVariant, VariableCombination } from "@/types/dashboard"

export interface CombinationCardProps {
  combination: VariableCombination
  palette: LayoutVariant["palette"]
  index: number
  size: "small" | "medium" | "large"
}

export function CombinationCard({ combination, palette, index, size }: CombinationCardProps) {
  const colors = usePaletteColors(palette)
  // Charts scale their text and axes to the room they really get, not to the card's grid columns.
  const [chartRef, box] = useElementSize<HTMLDivElement>()
  const color = colors[index % colors.length]

  return (
    <Card className={`h-full min-h-[260px] group relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex h-full flex-col p-4">
        {/* Modern Header */}
        <div className="mb-3 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            {/* Small cards keep their width for the title and the chart: no icon and no chart-type badge. */}
            <div
              className={`${size === "small" ? "hidden" : "flex"} h-9 w-9 shrink-0 items-center justify-center rounded-xl backdrop-blur-sm border transition-all duration-200`}
              style={{ 
                backgroundColor: `${color}15`,
                borderColor: `${color}30`
              }}
            >
              {getIconForChartType(combination.chartType, color)}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-semibold text-foreground text-sm leading-tight" title={combination.name}>
                {combination.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {combination.numericVariable.name}
                {combination.categoricalVariable && ` • ${combination.categoricalVariable.name}`}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`${size === "small" ? "hidden" : ""} shrink-0 text-xs font-medium rounded-lg border-0 text-foreground/80`}
            style={{
              backgroundColor: `${color}1a`,
              boxShadow: `inset 0 0 0 1px ${color}40`,
            }}
          >
            {CHART_TYPE_LABELS[combination.chartType]}
          </Badge>
        </div>

        {/* Chart Container - Optimizado para escalado */}
        <div className="flex-1 min-h-0 w-full rounded-lg bg-gradient-to-br from-background/60 to-background/20 backdrop-blur-sm border border-border/30 overflow-hidden">
          <div
            ref={chartRef}
            role="img"
            aria-label={`Gráfico de ejemplo: ${CHART_TYPE_LABELS[combination.chartType]} de ${combination.name}`}
            className={`w-full h-full ${
              combination.chartType === "progress" || combination.chartType === "metric" ? "p-4" : "p-2"
            }`}
          >
            {/* Plotted charts wait until the box is measured, so they draw once at the right scale instead of
                animating from a default size to the real one. */}
            {box.width > 0 && (
              <>
                {combination.chartType === "bar" && <BarChart color={color} combination={combination} size={size} box={box} />}
                {combination.chartType === "horizontal-bar" && (
                  <HorizontalBarChart color={color} combination={combination} size={size} box={box} />
                )}
                {combination.chartType === "line" && <LineChart color={color} combination={combination} size={size} box={box} />}
                {combination.chartType === "area" && <AreaChart color={color} combination={combination} size={size} box={box} />}
                {combination.chartType === "pie" && (
                  <PieChart colors={colors} combination={combination} size={size} box={box} />
                )}
                {combination.chartType === "donut" && (
                  <DonutChart colors={colors} combination={combination} size={size} box={box} />
                )}
                {combination.chartType === "radial" && (
                  <RadialChart colors={colors} combination={combination} size={size} box={box} />
                )}
              </>
            )}
            {combination.chartType === "progress" && (
              <ProgressBar
                color={color}
                size={size}
                seedKey={combination.id}
                caption={combination.numericVariable.type === "percentage-progress" ? "Progreso actual" : "Del total"}
              />
            )}
            {combination.chartType === "metric" && <MetricDisplay color={color} name={combination.name} size={size} seedKey={combination.id} />}
          </div>
        </div>

        {/* Subtle bottom gradient indicator */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-40"
          style={{ 
            background: `linear-gradient(90deg, transparent 20%, ${color}40 50%, transparent 80%)`
          }}
        />
      </div>
    </Card>
  )
}
