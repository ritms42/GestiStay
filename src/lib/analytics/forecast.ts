/**
 * Revenue forecasting engine.
 * Pure TypeScript, no dependencies. Uses simple linear regression blended
 * with a seasonal factor (same-month previous-year average).
 */

export type HistoryPoint = { month: string; revenue: number }
export type ForecastPoint = {
  month: string
  predicted: number
  low: number
  high: number
}
export type Trend = {
  direction: "up" | "down" | "flat"
  percentChange: number
}

/** Parse a YYYY-MM string into a Date at day 1 (UTC). */
export function parseMonth(month: string): Date {
  const [y, m] = month.split("-").map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, 1))
}

/** Format a Date as YYYY-MM. */
export function formatMonth(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/** Add N months to a YYYY-MM string, return a YYYY-MM string. */
export function addMonths(month: string, n: number): string {
  const d = parseMonth(month)
  d.setUTCMonth(d.getUTCMonth() + n)
  return formatMonth(d)
}

/** Simple linear regression on [index, y] pairs. Returns slope + intercept. */
export function linearRegression(
  ys: number[]
): { slope: number; intercept: number } {
  const n = ys.length
  if (n === 0) return { slope: 0, intercept: 0 }
  if (n === 1) return { slope: 0, intercept: ys[0] }
  const xs = ys.map((_, i) => i)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const meanX = sumX / n
  const meanY = sumY / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

/** Residual standard deviation (used to build the confidence band). */
export function residualStdDev(
  ys: number[],
  slope: number,
  intercept: number
): number {
  if (ys.length < 2) return 0
  let sum = 0
  for (let i = 0; i < ys.length; i++) {
    const pred = intercept + slope * i
    sum += (ys[i] - pred) ** 2
  }
  return Math.sqrt(sum / ys.length)
}

/**
 * Seasonal factor for a given month (1-12) based on available history.
 * Compares average for that month vs overall average. Returns 1 if unknown.
 */
export function seasonalFactor(
  history: HistoryPoint[],
  monthNum: number
): number {
  if (history.length === 0) return 1
  const overall = history.reduce((a, b) => a + b.revenue, 0) / history.length
  if (overall <= 0) return 1
  const sameMonth = history.filter(
    (h) => parseMonth(h.month).getUTCMonth() + 1 === monthNum
  )
  if (sameMonth.length === 0) return 1
  const avg = sameMonth.reduce((a, b) => a + b.revenue, 0) / sameMonth.length
  return avg / overall
}

/**
 * Forecast the next `monthsAhead` months from the given history.
 * History should be sorted ascending by month.
 */
export function forecastRevenue(
  history: HistoryPoint[],
  monthsAhead: number
): ForecastPoint[] {
  if (monthsAhead <= 0) return []
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month))
  const ys = sorted.map((h) => h.revenue)
  const { slope, intercept } = linearRegression(ys)
  const stdDev = residualStdDev(ys, slope, intercept)

  const lastMonth =
    sorted.length > 0
      ? sorted[sorted.length - 1].month
      : formatMonth(new Date())

  const out: ForecastPoint[] = []
  for (let i = 1; i <= monthsAhead; i++) {
    const month = addMonths(lastMonth, i)
    const idx = ys.length - 1 + i
    const base = Math.max(0, intercept + slope * idx)
    const monthNum = parseMonth(month).getUTCMonth() + 1
    const factor = seasonalFactor(sorted, monthNum)
    const predicted = Math.max(0, base * factor)
    // 95% confidence-ish band: ~1.96 * stdDev, scaled by seasonal factor
    const band = 1.96 * stdDev * (factor || 1)
    out.push({
      month,
      predicted: Math.round(predicted),
      low: Math.max(0, Math.round(predicted - band)),
      high: Math.round(predicted + band),
    })
  }
  return out
}

/**
 * Compute trend over history: direction + percent change
 * between first-half average and second-half average.
 */
export function computeTrend(history: HistoryPoint[]): Trend {
  if (history.length < 2) return { direction: "flat", percentChange: 0 }
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month))
  const mid = Math.floor(sorted.length / 2)
  const first = sorted.slice(0, mid)
  const second = sorted.slice(mid)
  const avg = (arr: HistoryPoint[]) =>
    arr.length === 0 ? 0 : arr.reduce((a, b) => a + b.revenue, 0) / arr.length
  const a = avg(first)
  const b = avg(second)
  if (a === 0 && b === 0) return { direction: "flat", percentChange: 0 }
  const pct = a === 0 ? 100 : ((b - a) / a) * 100
  const direction: Trend["direction"] =
    Math.abs(pct) < 2 ? "flat" : pct > 0 ? "up" : "down"
  return { direction, percentChange: Math.round(pct * 10) / 10 }
}

/**
 * Fill missing months with zeros so the chart is continuous.
 * Returns history covering [fromMonth..toMonth] inclusive.
 */
export function fillMonths(
  history: HistoryPoint[],
  fromMonth: string,
  toMonth: string
): HistoryPoint[] {
  const map = new Map(history.map((h) => [h.month, h.revenue]))
  const out: HistoryPoint[] = []
  let cursor = fromMonth
  // safety bound
  for (let i = 0; i < 240; i++) {
    out.push({ month: cursor, revenue: map.get(cursor) ?? 0 })
    if (cursor === toMonth) break
    cursor = addMonths(cursor, 1)
  }
  return out
}
