import { createClient } from "@/lib/supabase/server"
import { PropertyCard } from "@/components/properties/property-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search, MapPin, SlidersHorizontal } from "lucide-react"

export const metadata = { title: "Explorer les logements" }

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
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("properties")
    .select("*, images:property_images(*), pricing(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (params.city) {
    query = query.ilike("city", `%${params.city}%`)
  }

  if (params.guests) {
    query = query.gte("max_guests", parseInt(params.guests))
  }

  if (params.type) {
    query = query.eq("property_type", params.type)
  }

  const { data: properties } = await query.limit(50)

  // Filter by price client-side since pricing is a separate table
  let filtered = properties || []
  if (params.min_price || params.max_price) {
    filtered = filtered.filter((p: Record<string, unknown>) => {
      const pricing = (p.pricing as Record<string, unknown>[])
      if (!pricing?.[0]) return false
      const price = (pricing[0] as Record<string, unknown>).base_price as number
      if (params.min_price && price < Number(params.min_price)) return false
      if (params.max_price && price > Number(params.max_price)) return false
      return true
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="mb-8">
        <form className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl shadow border">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="city"
              defaultValue={params.city}
              placeholder="Ville..."
              className="pl-10"
            />
          </div>
          <Input
            name="check_in"
            type="date"
            defaultValue={params.check_in}
            className="md:w-40"
          />
          <Input
            name="check_out"
            type="date"
            defaultValue={params.check_out}
            className="md:w-40"
          />
          <Input
            name="guests"
            type="number"
            min={1}
            defaultValue={params.guests}
            placeholder="Voyageurs"
            className="md:w-28"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
        </form>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {params.city
              ? `Logements à ${params.city}`
              : "Tous les logements"}
          </h1>
          <p className="text-muted-foreground">
            {filtered.length} logement{filtered.length !== 1 ? "s" : ""} trouvé
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Results grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((property: Record<string, unknown>) => (
            <Link key={property.id as string} href={`/listing/${property.id}`}>
              <PropertyCard property={property as never} variant="public" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
          <p className="text-muted-foreground">
            Essayez d&apos;élargir votre recherche ou de modifier vos critères
          </p>
        </div>
      )}
    </div>
  )
}
