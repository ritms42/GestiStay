import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeEuro, TrendingUp, CalendarDays, Building2 } from "lucide-react"

export const metadata = { title: "Revenus" }

export default async function RevenuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // All confirmed bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("total_price, cleaning_fee, check_in, check_out, property_id, created_at, property:properties(title)")
    .eq("host_id", user!.id)
    .eq("status", "confirmed")
    .order("check_in", { ascending: false })

  const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0
  const totalBookings = bookings?.length || 0

  // This month revenue
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const monthlyBookings = bookings?.filter((b) => b.created_at >= firstOfMonth) || []
  const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + Number(b.total_price), 0)

  // Average per booking
  const avgPerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenus</h1>
        <p className="text-muted-foreground">
          Suivez vos revenus - 100% vous appartiennent
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <BadgeEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            <p className="text-xs text-green-600">0% de commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ce mois-ci</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              {monthlyBookings.length} réservation(s)
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(avgPerBooking)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue list */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {(booking.property as unknown as Record<string, unknown>)?.title as string}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.check_in).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(booking.check_out).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    +{formatPrice(Number(booking.total_price))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">
              Aucun revenu pour le moment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
