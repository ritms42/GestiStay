import { createClient } from "@/lib/supabase/server"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { CityAutocomplete } from "@/components/search/city-autocomplete"
import { SearchResults } from "@/components/search/search-results"
import type { Property, PropertyImage, Pricing } from "@/types"

export const metadata = { title: "Explorer les logements" }

type PropertyWithRelations = Property & {
  images: PropertyImage[]
  pricing: Pricing[]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string
    check_in?: string
    check_out?: string
    guests?: string
    type?: string
    min_price?: string
    max_price?: string
    bedrooms?: string
    bathrooms?: string
    amenities?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("properties")
    .select("*, images:property_images(*), pricing(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (params.city) query = query.ilike("city", `%${params.city}%`)
  if (params.guests) query = query.gte("max_guests", parseInt(params.guests))
  if (params.type) query = query.eq("property_type", params.type)
  if (params.bedrooms) query = query.gte("bedrooms", parseInt(params.bedrooms))
  if (params.bathrooms) query = query.gte("bathrooms", parseInt(params.bathrooms))

  const { data: properties } = await query.limit(50)

  let filtered: PropertyWithRelations[] = (properties as PropertyWithRelations[]) || []

  if (params.min_price || params.max_price) {
    filtered = filtered.filter((p) => {
      if (!p.pricing?.[0]) return false
      const price = p.pricing[0].base_price
      if (params.min_price && price < Number(params.min_price)) return false
      if (params.max_price && price > Number(params.max_price)) return false
      return true
    })
  }

  if (params.amenities) {
    const requiredAmenities = params.amenities.split(",")
    filtered = filtered.filter((p) =>
      requiredAmenities.every((a) => p.amenities?.includes(a))
    )
  }

  const title = params.city
    ? `Logements à ${params.city}`
    : "Tous les logements"

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      {/* Full-height container that fills available space */}
      <div className="flex flex-col" style={{ height: "calc(100vh - 65px)" }}>
        {/* Search bar - compact */}
        <div className="border-b bg-background shrink-0">
          <div className="container mx-auto px-4 py-2">
            <form className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <CityAutocomplete
                  name="city"
                  defaultValue={params.city || ""}
                  placeholder="Ville..."
                />
              </div>
              <Input
                name="check_in"
                type="date"
                defaultValue={params.check_in}
                className="sm:w-36"
              />
              <Input
                name="check_out"
                type="date"
                defaultValue={params.check_out}
                className="sm:w-36"
              />
              <Input
                name="guests"
                type="number"
                min={1}
                defaultValue={params.guests}
                placeholder="Voyageurs"
                className="sm:w-28"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </form>
          </div>
        </div>

        {/* Main content fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <SearchResults
            properties={filtered}
            currentFilters={{
              type: params.type,
              min_price: params.min_price,
              max_price: params.max_price,
              bedrooms: params.bedrooms,
              bathrooms: params.bathrooms,
              amenities: params.amenities,
            }}
            resultsCount={filtered.length}
            title={title}
          />
        </div>
      </div>
    </>
  )
}
