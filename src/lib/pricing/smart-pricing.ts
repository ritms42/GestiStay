export interface PricingContext {
  date: Date // the night being priced
  checkIn?: Date // when guest books (for lead time)
  bookingLeadDays?: number // days between booking and check-in
  nights?: number // total stay length
  occupancyRate?: number // 0-100, recent occupancy for the property
  isGapNight?: boolean // isolated empty night between bookings
}

export interface PricingRule {
  enabled: boolean
  min_price: number
  max_price: number
  weekend_uplift_percent: number
  last_minute_days: number
  last_minute_discount_percent: number
  early_bird_days: number
  early_bird_discount_percent: number
  weekly_discount_percent: number
  monthly_discount_percent: number
  high_demand_threshold_percent: number
  high_demand_uplift_percent: number
  gap_night_discount_percent: number
}

export interface PricingFactor {
  name: string
  adjustment: number
  description: string
}

export interface PricingResult {
  basePrice: number
  finalPrice: number
  factors: PricingFactor[]
}

function isWeekend(date: Date): boolean {
  const day = date.getDay() // 0=Sun, 5=Fri, 6=Sat
  return day === 5 || day === 6
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Compute the dynamic price for a given night given a rule and context.
 */
export function computeSmartPrice(
  basePrice: number,
  rule: PricingRule | null,
  ctx: PricingContext
): PricingResult {
  if (!rule || !rule.enabled) {
    return { basePrice, finalPrice: round2(basePrice), factors: [] }
  }

  let price = basePrice
  const factors: PricingFactor[] = []

  // Weekend uplift
  if (rule.weekend_uplift_percent && isWeekend(ctx.date)) {
    const before = price
    price = price * (1 + rule.weekend_uplift_percent / 100)
    factors.push({
      name: "weekend",
      adjustment: round2(price - before),
      description: `Week-end (+${rule.weekend_uplift_percent}%)`,
    })
  }

  // Last minute discount
  if (
    rule.last_minute_discount_percent > 0 &&
    typeof ctx.bookingLeadDays === "number" &&
    ctx.bookingLeadDays < rule.last_minute_days
  ) {
    const before = price
    price = price * (1 - rule.last_minute_discount_percent / 100)
    factors.push({
      name: "last_minute",
      adjustment: round2(price - before),
      description: `Dernière minute (-${rule.last_minute_discount_percent}%)`,
    })
  }

  // Early bird discount
  if (
    rule.early_bird_discount_percent > 0 &&
    typeof ctx.bookingLeadDays === "number" &&
    ctx.bookingLeadDays > rule.early_bird_days
  ) {
    const before = price
    price = price * (1 - rule.early_bird_discount_percent / 100)
    factors.push({
      name: "early_bird",
      adjustment: round2(price - before),
      description: `Réservation anticipée (-${rule.early_bird_discount_percent}%)`,
    })
  }

  // Weekly discount (7-27 nights)
  if (
    rule.weekly_discount_percent > 0 &&
    typeof ctx.nights === "number" &&
    ctx.nights >= 7 &&
    ctx.nights < 28
  ) {
    const before = price
    price = price * (1 - rule.weekly_discount_percent / 100)
    factors.push({
      name: "weekly",
      adjustment: round2(price - before),
      description: `Séjour semaine (-${rule.weekly_discount_percent}%)`,
    })
  }

  // Monthly discount (28+ nights)
  if (
    rule.monthly_discount_percent > 0 &&
    typeof ctx.nights === "number" &&
    ctx.nights >= 28
  ) {
    const before = price
    price = price * (1 - rule.monthly_discount_percent / 100)
    factors.push({
      name: "monthly",
      adjustment: round2(price - before),
      description: `Séjour mensuel (-${rule.monthly_discount_percent}%)`,
    })
  }

  // High demand surge
  if (
    rule.high_demand_uplift_percent > 0 &&
    typeof ctx.occupancyRate === "number" &&
    ctx.occupancyRate >= rule.high_demand_threshold_percent
  ) {
    const before = price
    price = price * (1 + rule.high_demand_uplift_percent / 100)
    factors.push({
      name: "high_demand",
      adjustment: round2(price - before),
      description: `Forte demande (+${rule.high_demand_uplift_percent}%)`,
    })
  }

  // Gap night discount
  if (rule.gap_night_discount_percent > 0 && ctx.isGapNight) {
    const before = price
    price = price * (1 - rule.gap_night_discount_percent / 100)
    factors.push({
      name: "gap_night",
      adjustment: round2(price - before),
      description: `Nuit isolée (-${rule.gap_night_discount_percent}%)`,
    })
  }

  // Clamp between min and max
  if (price < rule.min_price) {
    factors.push({
      name: "min_price_floor",
      adjustment: round2(rule.min_price - price),
      description: `Prix plancher (${rule.min_price}€)`,
    })
    price = rule.min_price
  } else if (price > rule.max_price) {
    factors.push({
      name: "max_price_ceiling",
      adjustment: round2(rule.max_price - price),
      description: `Prix plafond (${rule.max_price}€)`,
    })
    price = rule.max_price
  }

  return {
    basePrice: round2(basePrice),
    finalPrice: round2(price),
    factors,
  }
}

/**
 * Compute the total price of a stay by iterating every night.
 */
export function computeStayTotal(
  basePrice: number,
  rule: PricingRule | null,
  checkIn: Date,
  checkOut: Date
): {
  nights: number
  total: number
  nightlyBreakdown: Array<{ date: string; price: number }>
} {
  const msPerDay = 1000 * 60 * 60 * 24
  const nights = Math.max(
    0,
    Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay)
  )

  const now = new Date()
  const bookingLeadDays = Math.max(
    0,
    Math.round((checkIn.getTime() - now.getTime()) / msPerDay)
  )

  const nightlyBreakdown: Array<{ date: string; price: number }> = []
  let total = 0

  for (let i = 0; i < nights; i++) {
    const date = new Date(checkIn)
    date.setDate(date.getDate() + i)
    const result = computeSmartPrice(basePrice, rule, {
      date,
      checkIn,
      bookingLeadDays,
      nights,
    })
    nightlyBreakdown.push({
      date: date.toISOString().slice(0, 10),
      price: result.finalPrice,
    })
    total += result.finalPrice
  }

  return { nights, total: round2(total), nightlyBreakdown }
}
