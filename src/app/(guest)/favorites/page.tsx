import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Heart } from "lucide-react"
import { PropertyCard } from "@/components/properties/property-card"

export const metadata = {
  title: "Mes favoris - GestiStay",
  description: "Vos logements favoris",
}

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "id, property_id, property:properties(*, images:property_images(*), pricing(*))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const properties = (favorites || [])
    .map((f) => f.property)
    .filter(Boolean) as unknown as Array<{
    id: string
    host_id: string
    title: string
    description: string | null
    property_type: string
    address: string | null
    city: string | null
    country: string | null
    postal_code: string | null
    latitude: number | null
    longitude: number | null
    max_guests: number
    bedrooms: number
    beds: number
    bathrooms: number
    amenities: string[]
    house_rules: string | null
    check_in_time: string | null
    check_out_time: string | null
    status: string
    cancellation_policy: string
    instant_book: boolean
    min_nights: number
    max_nights: number
    preparation_days: number
    created_at: string
    updated_at: string
    images: Array<{
      id: string
      property_id: string
      url: string
      position: number
      is_cover: boolean
    }>
    pricing: Array<{
      id: string
      property_id: string
      base_price: number
      cleaning_fee: number
      currency: string
    }>
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes favoris</h1>
        <p className="text-muted-foreground">
          Les logements que vous avez sauvegardés
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun favori</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Explorez nos logements et cliquez sur le coeur pour sauvegarder vos
            favoris.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Explorer les logements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link key={property.id} href={`/listing/${property.id}`}>
              <PropertyCard
                property={property as never}
                variant="public"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
