import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CalendarDays,
  BadgeEuro,
  Pencil,
  Eye,
  MapPin,
  Users,
  BedDouble,
  Bath,
} from "lucide-react"
import Image from "next/image"

export const metadata = { title: "Détail du bien" }

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: property } = await supabase
    .from("properties")
    .select("*, images:property_images(*), pricing(*)")
    .eq("id", id)
    .eq("host_id", user!.id)
    .single()

  if (!property) notFound()

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: "Brouillon", color: "bg-yellow-100 text-yellow-800" },
    published: { label: "Publié", color: "bg-green-100 text-green-800" },
    paused: { label: "En pause", color: "bg-gray-100 text-gray-800" },
    archived: { label: "Archivé", color: "bg-red-100 text-red-800" },
  }

  const status = statusMap[property.status] || statusMap.draft

  async function updateStatus(newStatus: string) {
    "use server"
    const supabase = await createClient()
    await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", id)
    redirect(`/properties/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          {property.city && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.city}, {property.country}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/properties/${id}/calendar`}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendrier
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/properties/${id}/pricing`}>
              <BadgeEuro className="mr-2 h-4 w-4" />
              Tarifs
            </Link>
          </Button>
          {property.status === "published" && (
            <Button variant="outline" asChild>
              <Link href={`/listing/${id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Photos */}
      {property.images && property.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {property.images
            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
            .map((img: { id: string; url: string; is_cover: boolean }, i: number) => (
            <div
              key={img.id}
              className={`relative rounded-lg overflow-hidden ${
                i === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={img.url}
                alt={`${property.title} - Photo ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 mb-4">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {property.max_guests} voyageurs
                </span>
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  {property.bedrooms} chambres
                </span>
                <span className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  {property.bathrooms} SdB
                </span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {property.description || "Aucune description"}
              </p>
            </CardContent>
          </Card>

          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Équipements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a: string) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {property.house_rules && (
            <Card>
              <CardHeader>
                <CardTitle>Règles du logement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {property.house_rules}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardContent>
              {property.pricing?.[0] ? (
                <div>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: property.pricing[0].currency || "EUR",
                    }).format(property.pricing[0].base_price)}
                    <span className="text-sm text-muted-foreground font-normal">
                      {" "}/nuit
                    </span>
                  </p>
                  {property.pricing[0].cleaning_fee > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      + {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: property.pricing[0].currency || "EUR",
                      }).format(property.pricing[0].cleaning_fee)} ménage
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Non définie</p>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/properties/${id}/pricing`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier les tarifs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {property.status === "draft" && (
                <form action={updateStatus.bind(null, "published")}>
                  <Button className="w-full" type="submit">
                    Publier l&apos;annonce
                  </Button>
                </form>
              )}
              {property.status === "published" && (
                <form action={updateStatus.bind(null, "paused")}>
                  <Button variant="outline" className="w-full" type="submit">
                    Mettre en pause
                  </Button>
                </form>
              )}
              {property.status === "paused" && (
                <form action={updateStatus.bind(null, "published")}>
                  <Button className="w-full" type="submit">
                    Republier
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
