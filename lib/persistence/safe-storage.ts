import type { StateStorage } from "zustand/middleware"

export type WriteResult = "ok" | "quota" | "unavailable"

const QUOTA_ERROR_NAMES = new Set(["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"])

function classify(error: unknown): WriteResult {
  return error instanceof DOMException && QUOTA_ERROR_NAMES.has(error.name) ? "quota" : "unavailable"
}

/**
 * Storage that never throws into the caller. Persist writes run inside user actions, so a full or blocked
 * localStorage must not break the action; every write outcome is reported instead.
 */
export function createSafeStorage(getStorage: () => Storage, onWrite: (result: WriteResult) => void): StateStorage {
  const access = (): Storage | null => {
    try {
      return getStorage()
    } catch {
      return null
    }
  }

  return {
    getItem: (name) => {
      try {
        return access()?.getItem(name) ?? null
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      const storage = access()
      if (!storage) {
        onWrite("unavailable")
        return
      }
      try {
        storage.setItem(name, value)
        onWrite("ok")
      } catch (error) {
        onWrite(classify(error))
      }
    },
    removeItem: (name) => {
      try {
        access()?.removeItem(name)
      } catch {
        // nothing to report: removing only frees space
      }
    },
  }
}
