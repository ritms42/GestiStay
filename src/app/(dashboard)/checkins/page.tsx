import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClipboardCheck, Eye, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Check-ins" }

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-gray-100 text-gray-800" },
  submitted: { label: "Soumis", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approuvé", className: "bg-green-100 text-green-800" },
  rejected: { label: "Refusé", className: "bg-red-100 text-red-800" },
}

export default async function CheckinsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: checkins } = await supabase
    .from("checkins")
    .select(
      "*, booking:bookings(check_in, check_out), property:properties(title, city), guest:profiles!checkins_guest_id_fkey(full_name, email)"
    )
    .eq("host_id", user!.id)
    .order("created_at", { ascending: false })

  async function approveCheckin(formData: FormData) {
    "use server"
    const checkinId = formData.get("checkin_id") as string
    const supabase = await createClient()

    // Get the property access info
    const { data: checkinData } = await supabase
      .from("checkins")
      .select("property_id, guest_id")
      .eq("id", checkinId)
      .single()

    if (!checkinData) return

    const { data: property } = await supabase
      .from("properties")
      .select("access_instructions, door_code, wifi_name, wifi_password")
      .eq("id", checkinData.property_id)
      .single()

    await supabase
      .from("checkins")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        access_instructions: property?.access_instructions,
        door_code: property?.door_code,
        wifi_name: property?.wifi_name,
        wifi_password: property?.wifi_password,
      })
      .eq("id", checkinId)

    // Notify guest
    await supabase.from("notifications").insert({
      user_id: checkinData.guest_id,
      type: "booking_confirmed",
      title: "Check-in approuvé !",
      message: "Vos instructions d'accès sont maintenant disponibles.",
      link: `/checkin/${checkinId}`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check-ins</h1>
        <p className="text-muted-foreground">
          Gérez les formulaires de check-in de vos voyageurs
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {checkins && checkins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voyageur</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkins.map((checkin: Record<string, unknown>) => {
                  const guest = checkin.guest as Record<string, unknown>
                  const property = checkin.property as Record<string, unknown>
                  const booking = checkin.booking as Record<string, unknown>
                  const status =
                    statusLabels[(checkin.status as string)] || statusLabels.pending

                  return (
                    <TableRow key={checkin.id as string}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {checkin.first_name as string} {checkin.last_name as string}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {guest?.email as string}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{property?.title as string}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(booking?.check_in as string).toLocaleDateString("fr-FR")}
                        {" → "}
                        {new Date(booking?.check_out as string).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {checkin.status === "submitted" && (
                            <form action={approveCheckin}>
                              <input
                                type="hidden"
                                name="checkin_id"
                                value={checkin.id as string}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                            </form>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun check-in</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
