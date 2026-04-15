import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BadgeEuro,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  Wallet,
} from "lucide-react"
import {
  forecastRevenue,
  computeTrend,
  fillMonths,
  formatMonth,
  addMonths,
} from "@/lib/analytics/forecast"
import {
  RevenueForecastChart,
  OccupancyChart,
  type RevenueChartRow,
} from "./analytics-charts"

export const metadata = { title: "Analytics" }

type MonthlyRow = {
  host_id: string
  month: string
  revenue: number | string
  bookings_count: number
  nights_booked: number
}
type KpiRow = {
  host_id: string
  total_revenue_12m: number | string
  total_bookings_12m: number
  avg_booking_value: number | string
  avg_stay_length: number | string
  active_properties: number
}
type OccupancyRowDb = {
  property_id: string
  host_id: string
  month: string
  nights_booked: number
  nights_available: number
  occupancy_rate: number | string
}

function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-muted-foreground">Veuillez vous connecter.</div>
    )
  }

  // Load past 12 months of revenue
  const today = new Date()
  const currentMonth = formatMonth(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  )
  const fromMonth = addMonths(currentMonth, -11)

  const [{ data: monthly }, { data: kpis }, { data: occupancy }, { data: properties }] =
    await Promise.all([
      supabase
        .from("host_monthly_revenue")
        .select("*")
        .eq("host_id", user.id)
        .gte("month", fromMonth)
        .order("month", { ascending: true }),
      supabase.from("host_kpis").select("*").eq("host_id", user.id).maybeSingle(),
      supabase
        .from("property_occupancy")
        .select("*")
        .eq("host_id", user.id)
        .gte("month", fromMonth)
        .lte("month", currentMonth),
      supabase
        .from("properties")
        .select("id, title")
        .eq("host_id", user.id),
    ])

  const monthlyRows: MonthlyRow[] = (monthly as MonthlyRow[] | null) ?? []
  const kpiRow: KpiRow | null = (kpis as KpiRow | null) ?? null
  const occRows: OccupancyRowDb[] = (occupancy as OccupancyRowDb[] | null) ?? []
  const propertyList = (properties as { id: string; title: string }[] | null) ?? []
  const titleById = new Map(propertyList.map((p) => [p.id, p.title]))

  // Fill months for the chart
  const history = fillMonths(
    monthlyRows.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
    fromMonth,
    currentMonth
  )

  const forecast = forecastRevenue(history, 6)
  const trend = computeTrend(history)

  const chartData: RevenueChartRow[] = [
    ...history.map((h) => ({
      month: h.month,
      actual: h.revenue,
      predicted: null,
      low: null,
      high: null,
    })),
    ...forecast.map((f) => ({
      month: f.month,
      actual: null,
      predicted: f.predicted,
      low: f.low,
      high: f.high - f.low, // stacked area: "high" layer sits on top of "low"
    })),
  ]

  // Stitch: last actual point should also appear as first "predicted" point
  // so the dashed line visually connects.
  if (history.length > 0 && forecast.length > 0) {
    const lastActualIdx = history.length - 1
    chartData[lastActualIdx] = {
      ...chartData[lastActualIdx],
      predicted: history[lastActualIdx].revenue,
    }
  }

  // Avg occupancy over last 12 months per property
  const occByProp = new Map<
    string,
    { nightsBooked: number; nightsAvailable: number }
  >()
  for (const r of occRows) {
    const cur = occByProp.get(r.property_id) ?? {
      nightsBooked: 0,
      nightsAvailable: 0,
    }
    cur.nightsBooked += r.nights_booked
    cur.nightsAvailable += r.nights_available
    occByProp.set(r.property_id, cur)
  }
  const occupancyBars = propertyList
    .map((p) => {
      const v = occByProp.get(p.id)
      const rate =
        v && v.nightsAvailable > 0
          ? Math.round((v.nightsBooked / v.nightsAvailable) * 1000) / 10
          : 0
      return { property: p.title, occupancy: rate }
    })
    .sort((a, b) => b.occupancy - a.occupancy)

  const avgOccupancy =
    occupancyBars.length > 0
      ? Math.round(
          (occupancyBars.reduce((a, b) => a + b.occupancy, 0) /
            occupancyBars.length) *
            10
        ) / 10
      : 0

  // Top properties by revenue (last 12m): approximate from bookings
  const { data: topRaw } = await supabase
    .from("bookings")
    .select("property_id, total_price, check_in, check_out, status")
    .eq("host_id", user.id)
    .in("status", ["confirmed", "completed"])
    .gte("check_in", `${fromMonth}-01`)

  const topAgg = new Map<
    string,
    { revenue: number; bookings: number; nights: number }
  >()
  for (const b of (topRaw as
    | {
        property_id: string
        total_price: number | string
        check_in: string
        check_out: string
      }[]
    | null) ?? []) {
    const cur = topAgg.get(b.property_id) ?? {
      revenue: 0,
      bookings: 0,
      nights: 0,
    }
    cur.revenue += Number(b.total_price)
    cur.bookings += 1
    const nights = Math.max(
      0,
      Math.round(
        (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) /
          86400000
      )
    )
    cur.nights += nights
    topAgg.set(b.property_id, cur)
  }
  const topProperties = Array.from(topAgg.entries())
    .map(([id, v]) => ({
      id,
      title: titleById.get(id) ?? id,
      revenue: v.revenue,
      bookings: v.bookings,
      nights: v.nights,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const totalRevenue = kpiRow ? Number(kpiRow.total_revenue_12m) : 0
  const totalBookings = kpiRow ? kpiRow.total_bookings_12m : 0
  const avgBookingValue = kpiRow ? Number(kpiRow.avg_booking_value) : 0

  const TrendIcon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
      ? TrendingDown
      : Minus
  const trendColor =
    trend.direction === "up"
      ? "text-green-600"
      : trend.direction === "down"
      ? "text-red-600"
      : "text-muted-foreground"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Prévisions de revenus et performance de vos biens
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus (12 mois)
            </CardTitle>
            <BadgeEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEUR(totalRevenue)}</p>
            <p className={`text-xs flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {trend.percentChange > 0 ? "+" : ""}
              {trend.percentChange}% tendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBookings}</p>
            <p className="text-xs text-muted-foreground">sur 12 mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEUR(avgBookingValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Taux d&apos;occupation
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgOccupancy}%</p>
            <p className="text-xs text-muted-foreground">
              {occupancyBars.length} bien(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prévisions de revenus</CardTitle>
          <CardDescription>
            12 derniers mois réels + 6 mois prévus (bande de confiance)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueForecastChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Occupation par bien</CardTitle>
            <CardDescription>Moyenne sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            {occupancyBars.length > 0 ? (
              <OccupancyChart data={occupancyBars} />
            ) : (
              <p className="text-center py-10 text-muted-foreground">
                Aucune donnée d&apos;occupation
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top biens performants</CardTitle>
            <CardDescription>Par revenus sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            {topProperties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bien</TableHead>
                    <TableHead className="text-right">Revenus</TableHead>
                    <TableHead className="text-right">Rés.</TableHead>
                    <TableHead className="text-right">Nuits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProperties.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">
                        {formatEUR(p.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{p.bookings}</TableCell>
                      <TableCell className="text-right">{p.nights}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-10 text-muted-foreground">
                Aucune réservation récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
