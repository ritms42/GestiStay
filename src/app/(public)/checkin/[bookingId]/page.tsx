"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  CheckCircle2,
  User,
  FileText,
  Clock,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

const ID_TYPES = [
  { value: "passport", label: "Passeport" },
  { value: "id_card", label: "Carte d'identité" },
  { value: "driver_license", label: "Permis de conduire" },
]

export default function CheckinPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [checkin, setCheckin] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    nationality: "",
    id_type: "id_card",
    id_number: "",
    id_expiry: "",
    estimated_arrival: "",
    special_requests: "",
    contract_signed: false,
  })

  useEffect(() => {
    async function fetchData() {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, property:properties(title, city, check_in_time, check_out_time, access_instructions, door_code, wifi_name, wifi_password)")
        .eq("id", bookingId)
        .single()

      setBooking(bookingData)

      const { data: checkinData } = await supabase
        .from("checkins")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle()

      if (checkinData) {
        setCheckin(checkinData)
        if (checkinData.status === "submitted" || checkinData.status === "approved") {
          setSubmitted(true)
        }
        setForm({
          first_name: checkinData.first_name || "",
          last_name: checkinData.last_name || "",
          date_of_birth: checkinData.date_of_birth || "",
          nationality: checkinData.nationality || "",
          id_type: checkinData.id_type || "id_card",
          id_number: checkinData.id_number || "",
          id_expiry: checkinData.id_expiry || "",
          estimated_arrival: checkinData.estimated_arrival || "",
          special_requests: checkinData.special_requests || "",
          contract_signed: checkinData.contract_signed || false,
        })
      }
    }
    fetchData()
  }, [bookingId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contract_signed) {
      toast.error("Vous devez accepter les conditions pour continuer")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté")

      const checkinData = {
        booking_id: bookingId,
        property_id: (booking?.property as Record<string, unknown>)?.id || booking?.property_id,
        guest_id: user.id,
        host_id: booking?.host_id,
        ...form,
        status: "submitted" as const,
        submitted_at: new Date().toISOString(),
        contract_signed_at: new Date().toISOString(),
      }

      if (checkin) {
        await supabase
          .from("checkins")
          .update(checkinData)
          .eq("id", (checkin as Record<string, unknown>).id)
      } else {
        await supabase.from("checkins").insert(checkinData)
      }

      // Notify host
      await supabase.from("notifications").insert({
        user_id: booking?.host_id,
        type: "booking_confirmed",
        title: "Check-in soumis",
        message: `${form.first_name} ${form.last_name} a soumis son formulaire de check-in.`,
        link: `/checkins`,
      })

      setSubmitted(true)
      toast.success("Check-in soumis avec succès !")
    } catch (err) {
      toast.error("Erreur lors de la soumission")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    )
  }

  const property = booking.property as Record<string, unknown>

  if (submitted && checkin?.status === "approved") {
    const ci = checkin as Record<string, string>
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800">Check-in approuvé !</CardTitle>
            <CardDescription>
              Voici vos instructions d&apos;accès pour {property?.title as string}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ci.access_instructions && (
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">Instructions d&apos;accès</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ci.access_instructions}
                </p>
              </div>
            )}
            {ci.door_code && (
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">Code d&apos;entrée</h3>
                <p className="text-2xl font-mono font-bold text-center">
                  {ci.door_code}
                </p>
              </div>
            )}
            {ci.wifi_name && (
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">Wi-Fi</h3>
                <p className="text-sm">Réseau : <strong>{ci.wifi_name}</strong></p>
                <p className="text-sm">Mot de passe : <strong>{ci.wifi_password}</strong></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <Card>
          <CardHeader>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Check-in soumis !</CardTitle>
            <CardDescription>
              Votre formulaire a été envoyé au propriétaire. Vous recevrez les
              instructions d&apos;accès après validation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Check-in en ligne</h1>
        <p className="text-muted-foreground mt-2">
          {property?.title as string} — {property?.city as string}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(booking.check_in as string).toLocaleDateString("fr-FR")} →{" "}
          {new Date(booking.check_out as string).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identité du voyageur principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de naissance *</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nationalité *</Label>
                <Input
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="Française"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pièce d&apos;identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de document *</Label>
              <Select
                value={form.id_type}
                onValueChange={(v) => setForm({ ...form, id_type: v || "id_card" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro *</Label>
                <Input
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date d&apos;expiration</Label>
                <Input
                  type="date"
                  value={form.id_expiry}
                  onChange={(e) => setForm({ ...form, id_expiry: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arrival */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Arrivée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Heure d&apos;arrivée estimée</Label>
              <Input
                type="time"
                value={form.estimated_arrival}
                onChange={(e) => setForm({ ...form, estimated_arrival: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Demandes spéciales</Label>
              <Textarea
                value={form.special_requests}
                onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                placeholder="Ex: arrivée tardive, lit bébé, parking..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Switch
                checked={form.contract_signed}
                onCheckedChange={(v) => setForm({ ...form, contract_signed: v })}
              />
              <div className="text-sm">
                <p className="font-medium">J&apos;accepte les conditions de séjour</p>
                <p className="text-muted-foreground mt-1">
                  Je m&apos;engage à respecter les règles du logement et à laisser
                  les lieux en bon état à mon départ. Je confirme que les
                  informations fournies sont exactes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || !form.contract_signed}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Soumettre le check-in
        </Button>
      </form>
    </div>
  )
}
