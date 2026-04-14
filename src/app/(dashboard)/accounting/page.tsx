"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Download,
  BadgeEuro,
  CalendarDays,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

export default function AccountingPage() {
  const supabase = createClient()
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([])
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalNights: 0,
    avgNightlyRate: 0,
  })

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*, property:properties(title, city)")
      .eq("host_id", user.id)
      .eq("status", "confirmed")
      .gte("check_in", startDate)
      .lte("check_in", endDate)
      .order("check_in")

    const bks = bookingData || []
    setBookings(bks)

    const totalRevenue = bks.reduce((s, b) => s + Number(b.total_price), 0)
    const totalNights = bks.reduce((s, b) => {
      const diff = new Date(b.check_out as string).getTime() - new Date(b.check_in as string).getTime()
      return s + Math.ceil(diff / (1000 * 60 * 60 * 24))
    }, 0)

    setStats({
      totalRevenue,
      totalBookings: bks.length,
      totalNights,
      avgNightlyRate: totalNights > 0 ? totalRevenue / totalNights : 0,
    })

    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .gte("issue_date", startDate)
      .lte("issue_date", endDate)
      .order("issue_date", { ascending: false })

    setInvoices(invoiceData || [])
  }, [year, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function exportCSV() {
    setLoading(true)
    try {
      const headers = [
        "Date arrivée",
        "Date départ",
        "Bien",
        "Ville",
        "Nuits",
        "Montant",
        "Ménage",
        "Total",
      ]

      const rows = bookings.map((b) => {
        const nights = Math.ceil(
          (new Date(b.check_out as string).getTime() -
            new Date(b.check_in as string).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        const property = b.property as Record<string, unknown>
        return [
          b.check_in,
          b.check_out,
          property?.title || "",
          property?.city || "",
          nights,
          Number(b.total_price) - Number(b.cleaning_fee || 0),
          b.cleaning_fee || 0,
          b.total_price,
        ].join(";")
      })

      const csv = [headers.join(";"), ...rows].join("\n")
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gestistay-revenus-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export CSV téléchargé")
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setLoading(false)
    }
  }

  async function generateInvoice(booking: Record<string, unknown>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      const property = booking.property as Record<string, unknown>

      const nights = Math.ceil(
        (new Date(booking.check_out as string).getTime() -
          new Date(booking.check_in as string).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      const invoiceNumber = `GS-${year}-${String(Date.now()).slice(-5)}`

      const { error } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        user_id: user.id,
        booking_id: booking.id,
        type: "booking",
        status: "issued",
        subtotal: Number(booking.total_price) - Number(booking.cleaning_fee || 0),
        tax_rate: 0,
        tax_amount: 0,
        total: Number(booking.total_price),
        currency: "EUR",
        issuer_name: profile?.full_name || "Propriétaire",
        client_name: "Voyageur",
        client_email: "",
        description: `Location - ${property?.title}`,
        line_items: JSON.stringify([
          {
            description: `${property?.title} - ${nights} nuit(s)`,
            quantity: nights,
            unit_price: (Number(booking.total_price) - Number(booking.cleaning_fee || 0)) / nights,
            total: Number(booking.total_price) - Number(booking.cleaning_fee || 0),
          },
          ...(Number(booking.cleaning_fee) > 0
            ? [
                {
                  description: "Frais de ménage",
                  quantity: 1,
                  unit_price: Number(booking.cleaning_fee),
                  total: Number(booking.cleaning_fee),
                },
              ]
            : []),
        ]),
        issue_date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error

      toast.success(`Facture ${invoiceNumber} créée`)
      fetchData()
    } catch (err) {
      toast.error("Erreur lors de la création de la facture")
      console.error(err)
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

  const years = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comptabilité</h1>
          <p className="text-muted-foreground">
            Factures, exports et récapitulatif fiscal
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={year} onValueChange={(v) => setYear(v || year)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Revenus {year}</CardTitle>
            <BadgeEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Réservations</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Nuitées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalNights}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Prix moy./nuit</CardTitle>
            <BadgeEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(stats.avgNightlyRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings table with invoice generation */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Nuits</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Facture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const property = b.property as Record<string, unknown>
                  const nights = Math.ceil(
                    (new Date(b.check_out as string).getTime() -
                      new Date(b.check_in as string).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  const hasInvoice = invoices.some(
                    (inv) => inv.booking_id === b.id
                  )

                  return (
                    <TableRow key={b.id as string}>
                      <TableCell>
                        <p className="font-medium">{property?.title as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {property?.city as string}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(b.check_in as string).toLocaleDateString("fr-FR")}
                        {" → "}
                        {new Date(b.check_out as string).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{nights}</TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(b.total_price))}
                      </TableCell>
                      <TableCell>
                        {hasInvoice ? (
                          <Badge variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Facturée
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoice(b)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Facturer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Aucune réservation pour {year}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices list */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Factures émises</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id as string}>
                    <TableCell className="font-mono text-sm">
                      {inv.invoice_number as string}
                    </TableCell>
                    <TableCell>{inv.description as string}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(inv.issue_date as string).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(Number(inv.total))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === "paid"
                            ? "default"
                            : inv.status === "issued"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {inv.status === "issued"
                          ? "Émise"
                          : inv.status === "paid"
                            ? "Payée"
                            : (inv.status as string)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
