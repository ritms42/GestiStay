import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Building2,
  CalendarDays,
  BadgeEuro,
  TrendingUp,
  Plus,
} from "lucide-react"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch stats
  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user!.id)

  const { count: activeBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .in("status", ["pending", "confirmed"])

  const { data: revenueData } = await supabase
    .from("bookings")
    .select("total_price")
    .eq("host_id", user!.id)
    .eq("status", "confirmed")

  const totalRevenue =
    revenueData?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0

  // Recent bookings
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("*, property:properties(title), guest:profiles!bookings_guest_id_fkey(full_name, email)")
    .eq("host_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes biens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Réservations actives
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus totaux
            </CardTitle>
            <BadgeEuro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0%</div>
            <p className="text-xs text-muted-foreground">
              Vous gardez tout !
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières réservations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking: Record<string, unknown>) => (
                <div
                  key={booking.id as string}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {(booking.property as Record<string, unknown>)?.title as string}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(booking.guest as Record<string, unknown>)?.full_name as string} &middot;{" "}
                      {new Date(booking.check_in as string).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(booking.check_out as string).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(booking.total_price as number)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {booking.status === "confirmed"
                        ? "Confirmée"
                        : booking.status === "pending"
                          ? "En attente"
                          : booking.status === "canceled"
                            ? "Annulée"
                            : "Terminée"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réservation pour le moment</p>
              <p className="text-sm mt-1">
                Ajoutez votre premier bien pour commencer à recevoir des
                réservations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
