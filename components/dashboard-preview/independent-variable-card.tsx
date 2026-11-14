import { getIconForVariableType } from "@/components/dashboard-preview/variable-icon"
import { Card } from "@/components/ui/card"
import { generateMetricForVariable } from "@/lib/domain/sample-data"
import type { Variable } from "@/types/dashboard"
import { usePreviewFilters } from "@/components/dashboard-preview/preview-filters"
import { chartRandom } from "@/lib/domain/filters"

export function IndependentVariableCard({ variable, color }: { variable: Variable; color: string }) {
  const filters = usePreviewFilters()
  const metric = generateMetricForVariable(variable, chartRandom(variable.id, filters))
  const Icon = getIconForVariableType(variable.type)

  return (
    <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-br from-transparent via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground capitalize">{metric.label}</span>
          </div>
        </div>
        
        <div className="space-y-0.5">
          <div 
            className="text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${color}, ${color}80)`
            }}
          >
            {metric.value}
          </div>
          <p className="text-xs font-medium text-foreground">{variable.name}</p>
          {metric.subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">{metric.subtitle}</p>
          )}
        </div>

        {/* Decorative element */}
        <div 
          className="absolute bottom-0 right-0 h-0.5 w-full bg-gradient-to-r from-transparent opacity-30"
          style={{ 
            backgroundImage: `linear-gradient(90deg, transparent, ${color}40, ${color})`
          }}
        />
      </div>
    </Card>
  )
}
