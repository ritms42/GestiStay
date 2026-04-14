import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, CalendarDays } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = { title: "Mes voyages" }

export default async function TripsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/trips")

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, property:properties(id, title, city, country, images:property_images(url, is_cover, position))"
    )
    .eq("guest_id", user.id)
    .order("check_in", { ascending: false })

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending: { label: "En attente", variant: "secondary" },
    confirmed: { label: "Confirmée", variant: "default" },
    canceled: { label: "Annulée", variant: "destructive" },
    completed: { label: "Terminée", variant: "outline" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes voyages</h1>
        <p className="text-muted-foreground">
          Historique de vos réservations
        </p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking: Record<string, unknown>) => {
            const property = booking.property as Record<string, unknown>
            const images = (property?.images as Record<string, unknown>[]) || []
            const cover = images.find((i) => i.is_cover) || images[0]
            const status = statusLabels[(booking.status as string)] || statusLabels.pending

            return (
              <Card key={booking.id as string} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-48 h-40 bg-muted shrink-0">
                    {cover ? (
                      <Image
                        src={cover.url as string}
                        alt={property?.title as string || ""}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <CardContent className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {property?.title as string}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property?.city as string}, {property?.country as string}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(booking.check_in as string).toLocaleDateString("fr-FR")} -{" "}
                          {new Date(booking.check_out as string).toLocaleDateString("fr-FR")}
                        </span>
                        <span>
                          {booking.guests_count as number} voyageur
                          {(booking.guests_count as number) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-semibold">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(booking.total_price as number)}
                      </p>
                      <Link
                        href={`/listing/${property?.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Voir l&apos;annonce
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/30">
          <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Aucun voyage</h2>
          <p className="text-muted-foreground">
            Explorez les logements et réservez votre prochain séjour
          </p>
        </div>
      )}
    </div>
  )
}
