import { BarChart3, Hash, Percent, TrendingUp, Users } from "lucide-react"
import type { VariableCombination } from "@/types/dashboard"

export function getIconForChartType(chartType: VariableCombination["chartType"], color?: string) {
  const iconClass = color ? "h-4 w-4" : "h-5 w-5 text-muted-foreground"
  const iconStyle = color ? { color } : {}

  switch (chartType) {
    case "bar":
      return <BarChart3 className={iconClass} style={iconStyle} />
    case "line":
    case "area":
      return <TrendingUp className={iconClass} style={iconStyle} />
    case "pie":
    case "donut":
      return <Users className={iconClass} style={iconStyle} />
    case "progress":
      return <Percent className={iconClass} style={iconStyle} />
    case "metric":
      return <Hash className={iconClass} style={iconStyle} />
    default:
      return <BarChart3 className={iconClass} style={iconStyle} />
  }
}
