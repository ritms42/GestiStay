import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
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
import { PhotoGallery } from "@/components/properties/photo-gallery"

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestistay.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: property.title,
    description: property.description || "",
    url: `${baseUrl}/listing/${property.id}`,
    image: images.map((img: Record<string, unknown>) => img.url as string),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city || "",
      addressCountry: property.country || "",
      streetAddress: property.address || "",
    },
    ...(property.latitude && property.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    numberOfRooms: property.bedrooms || 0,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: property.max_guests || 1,
    },
    ...(pricing
      ? {
          priceRange: `${pricing.base_price} ${pricing.currency || "EUR"}`,
          offers: {
            "@type": "Offer",
            price: pricing.base_price,
            priceCurrency: pricing.currency || "EUR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    ...(host
      ? {
          provider: {
            "@type": "Person",
            name: host.full_name as string,
          },
        }
      : {}),
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Photo gallery */}
      {images.length > 0 && (
        <PhotoGallery
          images={images.map((img: Record<string, unknown>) => ({
            id: img.id as string,
            url: img.url as string,
          }))}
          title={property.title}
        />
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
