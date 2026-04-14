"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  MoreVertical,
  Pencil,
  Eye,
  Pause,
  Trash2,
  Play,
} from "lucide-react"
import type { Property, PropertyImage, Pricing } from "@/types"

interface PropertyCardProps {
  property: Property & {
    images: PropertyImage[]
    pricing: Pricing[]
  }
  variant?: "host" | "public"
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  published: { label: "Publié", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
  archived: { label: "Archivé", variant: "destructive" },
}

const propertyTypeLabels: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  studio: "Studio",
  room: "Chambre",
  other: "Autre",
}

export function PropertyCard({ property, variant = "host" }: PropertyCardProps) {
  const coverImage = property.images?.find((img) => img.is_cover) || property.images?.[0]
  const status = statusLabels[property.status]

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <BedDouble className="h-12 w-12 opacity-30" />
          </div>
        )}
        {variant === "host" && status && (
          <Badge className="absolute top-3 left-3" variant={status.variant}>
            {status.label}
          </Badge>
        )}
        {variant === "public" && property.pricing?.[0] && (
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg font-semibold text-sm">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: property.pricing[0].currency || "EUR",
            }).format(property.pricing[0].base_price)}
            <span className="text-xs text-muted-foreground font-normal">
              /nuit
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{property.title}</h3>
            {property.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {property.city}, {property.country}
              </p>
            )}
          </div>
          {variant === "host" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => window.location.href = `/properties/${property.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/listing/${property.id}`, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir l&apos;annonce
                </DropdownMenuItem>
                {property.status === "published" ? (
                  <DropdownMenuItem>
                    <Pause className="mr-2 h-4 w-4" />
                    Mettre en pause
                  </DropdownMenuItem>
                ) : property.status === "paused" ? (
                  <DropdownMenuItem>
                    <Play className="mr-2 h-4 w-4" />
                    Republier
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Property specs */}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {property.max_guests}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms}
          </span>
          <Badge variant="outline" className="text-xs">
            {propertyTypeLabels[property.property_type] || property.property_type}
          </Badge>
        </div>

        {/* Price for host view */}
        {variant === "host" && property.pricing?.[0] && (
          <p className="mt-3 font-semibold">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: property.pricing[0].currency || "EUR",
            }).format(property.pricing[0].base_price)}
            <span className="text-sm text-muted-foreground font-normal">
              {" "}
              /nuit
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
