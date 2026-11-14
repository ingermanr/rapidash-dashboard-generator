import { BarChart3, Calendar, Hash, Percent, Tag, ToggleLeft } from "lucide-react"
import type { Variable } from "@/types/dashboard"

/** Icon component that represents a variable type. */
export function getIconForVariableType(type: Variable["type"]) {
  switch (type) {
    case "numeric":
      return Hash
    case "percentage-progress":
    case "percentage-ratio":
      return Percent
    case "categorical":
      return Tag
    case "binary":
      return ToggleLeft
    case "temporal":
      return Calendar
    default:
      return BarChart3
  }
}
