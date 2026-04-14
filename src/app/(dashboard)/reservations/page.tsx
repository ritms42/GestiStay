import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Réservations" }

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", className: "bg-green-100 text-green-800" },
  canceled: { label: "Annulée", className: "bg-red-100 text-red-800" },
  completed: { label: "Terminée", className: "bg-gray-100 text-gray-800" },
}

export default async function ReservationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, property:properties(title, city), guest:profiles!bookings_guest_id_fkey(full_name, email)"
    )
    .eq("host_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Réservations</h1>
        <p className="text-muted-foreground">
          Gérez les réservations de vos biens
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Voyageur</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: Record<string, unknown>) => {
                  const property = booking.property as Record<string, unknown>
                  const guest = booking.guest as Record<string, unknown>
                  const status = statusLabels[(booking.status as string)] || statusLabels.pending

                  return (
                    <TableRow key={booking.id as string}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {property?.title as string}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property?.city as string}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {guest?.full_name as string}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {guest?.email as string}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(booking.check_in as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          {" - "}
                          {new Date(booking.check_out as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(booking.total_price as number)}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réservation</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
