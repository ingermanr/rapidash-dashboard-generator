import type { Variable } from "@/types/dashboard"

/** Numeric-like variables that get a standalone aggregation card. */
export function getIndependentVariables(variables: Variable[]): Variable[] {
  // These will display aggregations (sum, average, median, std dev) even if they're used in combinations
  return variables.filter(
    (v) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio",
  )
}
