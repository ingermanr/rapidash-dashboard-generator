import { create } from "zustand"
import type { WriteResult } from "@/lib/persistence/safe-storage"

/**
 * Outcome of the last persisted write. Kept outside the persisted store on purpose: updating it there would
 * trigger another write.
 */
export const usePersistenceStatus = create<{ lastWrite: WriteResult }>()(() => ({ lastWrite: "ok" }))

export function reportWrite(result: WriteResult) {
  if (usePersistenceStatus.getState().lastWrite !== result) usePersistenceStatus.setState({ lastWrite: result })
}
