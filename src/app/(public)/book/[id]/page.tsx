"use client"

import { useState, useMemo, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Shield, BadgeEuro, ArrowLeft } from "lucide-react"
import { differenceInDays } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

function BookForm() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [property, setProperty] = useState<Record<string, unknown> | null>(null)

  const checkIn = searchParams.get("check_in") || ""
  const checkOut = searchParams.get("check_out") || ""
  const guests = parseInt(searchParams.get("guests") || "1")

  // Fetch property data
  useState(() => {
    async function fetch() {
      const { data } = await supabase
        .from("properties")
        .select("*, pricing(*), host:profiles!properties_host_id_fkey(full_name)")
        .eq("id", id)
        .eq("status", "published")
        .single()
      setProperty(data)
    }
    fetch()
  })

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    return Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)))
  }, [checkIn, checkOut])

  const pricing = (property?.pricing as Record<string, unknown>[])?.[0]
  const basePrice = Number(pricing?.base_price || 0)
  const cleaningFee = Number(pricing?.cleaning_fee || 0)
  const subtotal = nights * basePrice
  const total = subtotal + cleaningFee
  const currency = (pricing?.currency as string) || "EUR"

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)

  async function handlePayment() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=/book/${id}?${searchParams.toString()}`)
        return
      }

      // Create booking
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          property_id: id,
          guest_id: user.id,
          host_id: property?.host_id,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guests,
          total_price: total,
          cleaning_fee: cleaningFee,
          status: "confirmed", // In production: use Stripe payment intent
        })
        .select()
        .single()

      if (error) throw error

      // Block dates in availability
      const dates = []
      const current = new Date(checkIn)
      const end = new Date(checkOut)
      while (current < end) {
        dates.push({
          property_id: id,
          date: current.toISOString().split("T")[0],
          status: "booked" as const,
          booking_id: booking.id,
        })
        current.setDate(current.getDate() + 1)
      }

      await supabase
        .from("availability")
        .upsert(dates, { onConflict: "property_id,date" })

      // Create conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .insert({
          booking_id: booking.id,
          property_id: id,
        })
        .select()
        .single()

      if (conversation) {
        await supabase.from("conversation_participants").insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: property?.host_id },
        ])

        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: `Réservation confirmée du ${new Date(checkIn).toLocaleDateString("fr-FR")} au ${new Date(checkOut).toLocaleDateString("fr-FR")} pour ${guests} voyageur(s).`,
        })
      }

      toast.success("Réservation confirmée !")
      router.push("/trips")
    } catch (err) {
      toast.error("Erreur lors de la réservation")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/listing/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;annonce
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Confirmer la réservation</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Booking details */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Votre séjour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Arrivée</p>
                  <p className="font-medium">
                    {new Date(checkIn).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Départ</p>
                  <p className="font-medium">
                    {new Date(checkOut).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voyageurs</p>
                <p className="font-medium">{guests}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <BadgeEuro className="h-5 w-5 text-green-600" />
              <span>Aucune commission - prix transparent</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer et payer {formatPrice(total)}
          </Button>
        </div>

        {/* Price summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {property.title as string}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Hébergé par{" "}
                {(property.host as Record<string, unknown>)?.full_name as string}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>
                  {formatPrice(basePrice)} x {nights} nuit
                  {nights > 1 ? "s" : ""}
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {cleaningFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Frais de ménage</span>
                  <span>{formatPrice(cleaningFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-green-600">
                <span>Commission</span>
                <span>0,00 EUR</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense>
      <BookForm />
    </Suspense>
  )
}
