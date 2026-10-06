/**
 * Remembers one async result for a short time and collapses overlapping calls
 * into a single request. `clear` / `set` invalidate anything still in flight
 * so a later write cannot be overwritten by the response that preceded it.
 */
export function asyncCache<T>(ttlMs: number) {
  let cached: { at: number; data: T } | null = null
  let inflight: Promise<T> | null = null
  let version = 0

  return {
    get(load: () => Promise<T>): Promise<T> {
      if (cached && Date.now() - cached.at < ttlMs) {
        return Promise.resolve(cached.data)
      }
      if (inflight) return inflight
      const started = version
      inflight = load()
        .then((data) => {
          if (started === version) cached = { at: Date.now(), data }
          return data
        })
        .finally(() => {
          inflight = null
        })
      return inflight
    },
    peek(): T | null {
      if (cached && Date.now() - cached.at < ttlMs) return cached.data
      return null
    },
    set(data: T) {
      version += 1
      cached = { at: Date.now(), data }
    },
    clear() {
      version += 1
      cached = null
    },
  }
}
