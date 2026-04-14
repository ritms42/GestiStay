import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "@/components/properties/property-card"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"

export const metadata = { title: "Mes biens" }

export default async function PropertiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: properties } = await supabase
    .from("properties")
    .select("*, images:property_images(*), pricing(*)")
    .eq("host_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes biens</h1>
          <p className="text-muted-foreground">
            Gérez vos propriétés et annonces
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un bien
          </Link>
        </Button>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: Record<string, unknown>) => (
            <Link key={property.id as string} href={`/properties/${property.id}`}>
              <PropertyCard property={property as never} variant="host" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/30">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Aucun bien</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez votre premier bien pour commencer à recevoir des
            réservations
          </p>
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter mon premier bien
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
