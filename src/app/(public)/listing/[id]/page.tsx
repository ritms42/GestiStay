import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  Clock,
  Shield,
  BadgeEuro,
  Star,
} from "lucide-react"
import { BookingWidget } from "@/components/booking/booking-widget"
import { ReviewList } from "@/components/reviews/review-list"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("properties")
    .select("title, city, description")
    .eq("id", id)
    .single()

  return {
    title: data?.title || "Logement",
    description: data?.description?.slice(0, 160) || "",
  }
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  parking: "Parking",
  pool: "Piscine",
  ac: "Climatisation",
  heating: "Chauffage",
  kitchen: "Cuisine",
  washer: "Lave-linge",
  dryer: "Sèche-linge",
  tv: "Télévision",
  elevator: "Ascenseur",
  balcony: "Balcon/Terrasse",
  garden: "Jardin",
  bbq: "Barbecue",
  gym: "Salle de sport",
  pets: "Animaux acceptés",
  workspace: "Espace de travail",
  safe: "Coffre-fort",
  baby: "Lit bébé",
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from("properties")
    .select(
      "*, images:property_images(*), pricing(*), host:profiles!properties_host_id_fkey(id, full_name, avatar_url, created_at)"
    )
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (!property) notFound()

  const images = (property.images || []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  )
  const pricing = property.pricing?.[0]
  const host = property.host as Record<string, unknown>

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Photo gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden mb-8">
          <div className="md:col-span-2 md:row-span-2 relative aspect-[4/3]">
            <Image
              src={(images[0] as Record<string, unknown>).url as string}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.slice(1, 5).map((img: Record<string, unknown>, i: number) => (
            <div key={img.id as string} className="relative aspect-[4/3] hidden md:block">
              <Image
                src={img.url as string}
                alt={`${property.title} - ${i + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title and location */}
          <div>
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-2">
              <MapPin className="h-4 w-4" />
              {property.city}, {property.country}
            </p>
          </div>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <Users className="h-4 w-4 mr-1" />
              {property.max_guests} voyageurs
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <BedDouble className="h-4 w-4 mr-1" />
              {property.bedrooms} chambres
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <BedDouble className="h-4 w-4 mr-1" />
              {property.beds} lits
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5 px-3">
              <Bath className="h-4 w-4 mr-1" />
              {property.bathrooms} SdB
            </Badge>
          </div>

          <Separator />

          {/* Host */}
          {host && (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={host.avatar_url as string || undefined} />
                  <AvatarFallback>
                    {(host.full_name as string)
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    Hébergé par {host.full_name as string}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Membre depuis{" "}
                    {new Date(host.created_at as string).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              À propos de ce logement
            </h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {property.description}
            </p>
          </div>

          <Separator />

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Ce que propose ce logement
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map((a: string) => (
                  <div
                    key={a}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <span className="text-sm">
                      {AMENITY_LABELS[a] || a}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House rules */}
          {property.house_rules && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Règles du logement
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {property.house_rules}
                </p>
                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  {property.check_in_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Arrivée : {property.check_in_time}
                    </span>
                  )}
                  {property.check_out_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Départ : {property.check_out_time}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Reviews */}
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-6">Avis des voyageurs</h2>
            <ReviewList propertyId={property.id} />
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <BookingWidget
              propertyId={property.id}
              basePrice={pricing?.base_price || 0}
              cleaningFee={pricing?.cleaning_fee || 0}
              currency={pricing?.currency || "EUR"}
              maxGuests={property.max_guests}
            />

            {/* Trust badges */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-green-600 shrink-0" />
                <span>Paiement sécurisé par Stripe</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <BadgeEuro className="h-5 w-5 text-green-600 shrink-0" />
                <span>
                  Aucune commission - le prix affiché est le prix final
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
