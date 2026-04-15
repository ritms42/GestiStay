"use client"

import {
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

export type RevenueChartRow = {
  month: string
  actual: number | null
  predicted: number | null
  low: number | null
  high: number | null
}

export type OccupancyRow = {
  property: string
  occupancy: number
}

export function RevenueForecastChart({ data }: { data: RevenueChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k€`} />
        <Tooltip
          formatter={(value) => {
            if (value === null || value === undefined) return "-"
            return new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(Number(value))
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="high"
          stroke="none"
          fill="#3b82f6"
          fillOpacity={0.12}
          name="Haut"
          activeDot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="low"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          name="Bas"
          activeDot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Revenus réels"
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
          name="Prévision"
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function OccupancyChart({ data }: { data: OccupancyRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
        <YAxis type="category" dataKey="property" width={140} fontSize={12} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="occupancy" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export { LineChart, Line }
