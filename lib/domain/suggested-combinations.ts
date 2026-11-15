import type { ExcludedCombination, Variable } from "@/types/dashboard"

/** A pairing shown in the builder so the user can include or exclude it before generating. */
export interface SuggestedCombination {
  /** Stable id, also used as the id of the exclusion that hides it. */
  id: string
  text: string
  /** 1 = alta, 2 = media, 3 = baja: the highest priority among its variables. */
  maxPriority: number
  variableIds: string[]
}

export interface MarkedCombination extends SuggestedCombination {
  excluded: boolean
  /** Position among the active suggestions (1-based), or null when excluded. */
  activeNumber: number | null
}

const PRIORITY_VALUE = { alta: 1, media: 2, baja: 3 } as const

const isMeasure = (v: Variable) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio"

/** Key of a set of variable ids, independent of their order. */
export const combinationKey = (variableIds: string[]) => [...variableIds].sort().join("-")

/** Measures paired with categories, binaries and dates, highest priority first. */
export function suggestCombinations(variables: Variable[]): SuggestedCombination[] {
  const measures = variables.filter(isMeasure)
  const partners: [Variable[], string][] = [
    [variables.filter((v) => v.type === "categorical"), "por"],
    [variables.filter((v) => v.type === "binary"), "por"],
    [variables.filter((v) => v.type === "temporal"), "en"],
  ]
  const suggestions: SuggestedCombination[] = []
  const add = (members: Variable[], text: string) => {
    const variableIds = members.map((m) => m.id)
    suggestions.push({
      id: `combo-${combinationKey(variableIds)}`,
      text,
      maxPriority: Math.min(...members.map((m) => PRIORITY_VALUE[m.priority])),
      variableIds,
    })
  }
  for (const [group, joiner] of partners)
    for (const measure of measures) for (const partner of group) add([measure, partner], `${measure.name} ${joiner} ${partner.name}`)
  if (partners.every(([group]) => group.length === 0)) for (const measure of measures) add([measure], measure.name)

  // Array.prototype.sort is stable, so equal priorities keep the pairing order above.
  return suggestions.sort((a, b) => a.maxPriority - b.maxPriority)
}

/** Marks which suggestions are excluded and numbers the active ones, in one pass. */
export function withExclusions(suggestions: SuggestedCombination[], excluded: ExcludedCombination[]): MarkedCombination[] {
  const excludedKeys = new Set(excluded.map((e) => combinationKey(e.variableIds)))
  let active = 0
  return suggestions.map((suggestion) => {
    const isExcluded = excludedKeys.has(combinationKey(suggestion.variableIds))
    return { ...suggestion, excluded: isExcluded, activeNumber: isExcluded ? null : ++active }
  })
}
