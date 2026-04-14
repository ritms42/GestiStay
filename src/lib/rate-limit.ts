interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }, 60_000)
  // Allow the process to exit without waiting for this interval
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref()
  }
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; retryAfter: number } {
  ensureCleanup()

  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { success: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, retryAfter: 0 }
}
