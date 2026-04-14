"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Chambre" },
] as const

const AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "parking", label: "Parking" },
  { value: "pool", label: "Piscine" },
  { value: "kitchen", label: "Cuisine" },
  { value: "air_conditioning", label: "Climatisation" },
  { value: "heating", label: "Chauffage" },
  { value: "washer", label: "Lave-linge" },
  { value: "dryer", label: "Sèche-linge" },
  { value: "tv", label: "TV" },
  { value: "elevator", label: "Ascenseur" },
  { value: "gym", label: "Salle de sport" },
  { value: "balcony", label: "Balcon" },
  { value: "garden", label: "Jardin" },
  { value: "terrace", label: "Terrasse" },
  { value: "pets_allowed", label: "Animaux acceptés" },
] as const

interface SearchFiltersProps {
  currentFilters: {
    type?: string
    min_price?: string
    max_price?: string
    bedrooms?: string
    bathrooms?: string
    amenities?: string
  }
}

function FilterContent({
  currentFilters,
  onApply,
}: SearchFiltersProps & { onApply: () => void }) {
  const [expanded, setExpanded] = useState(true)
  const [minPrice, setMinPrice] = useState(currentFilters.min_price || "")
  const [maxPrice, setMaxPrice] = useState(currentFilters.max_price || "")
  const [propertyType, setPropertyType] = useState(
    currentFilters.type || ""
  )
  const [bedrooms, setBedrooms] = useState(currentFilters.bedrooms || "")
  const [bathrooms, setBathrooms] = useState(currentFilters.bathrooms || "")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    currentFilters.amenities ? currentFilters.amenities.split(",") : []
  )

  const router = useRouter()
  const searchParams = useSearchParams()

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }, [])

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    // Keep existing search params (city, dates, guests)
    if (propertyType) params.set("type", propertyType)
    else params.delete("type")

    if (minPrice) params.set("min_price", minPrice)
    else params.delete("min_price")

    if (maxPrice) params.set("max_price", maxPrice)
    else params.delete("max_price")

    if (bedrooms) params.set("bedrooms", bedrooms)
    else params.delete("bedrooms")

    if (bathrooms) params.set("bathrooms", bathrooms)
    else params.delete("bathrooms")

    if (selectedAmenities.length > 0)
      params.set("amenities", selectedAmenities.join(","))
    else params.delete("amenities")

    router.push(`/search?${params.toString()}`)
    onApply()
  }, [
    searchParams,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    selectedAmenities,
    router,
    onApply,
  ])

  const clearFilters = useCallback(() => {
    setMinPrice("")
    setMaxPrice("")
    setPropertyType("")
    setBedrooms("")
    setBathrooms("")
    setSelectedAmenities([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete("type")
    params.delete("min_price")
    params.delete("max_price")
    params.delete("bedrooms")
    params.delete("bathrooms")
    params.delete("amenities")
    router.push(`/search?${params.toString()}`)
    onApply()
  }, [searchParams, router, onApply])

  const activeFilterCount = [
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    selectedAmenities.length > 0 ? "yes" : "",
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          Filtres
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="space-y-5">
          {/* Price range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Fourchette de prix (par nuit)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Property type */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type de logement
            </label>
            <Select
              value={propertyType}
              onValueChange={(v) => setPropertyType(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Chambres (min.)
            </label>
            <div className="flex gap-1.5">
              {["1", "2", "3", "4", "5"].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={bedrooms === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                  className="flex-1"
                >
                  {n}{n === "5" ? "+" : ""}
                </Button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Salles de bain (min.)
            </label>
            <div className="flex gap-1.5">
              {["1", "2", "3", "4"].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={bathrooms === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                  className="flex-1"
                >
                  {n}{n === "4" ? "+" : ""}
                </Button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Equipements
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity.value}
                  type="button"
                  onClick={() => toggleAmenity(amenity.value)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedAmenities.includes(amenity.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {amenity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
            <Button type="button" onClick={applyFilters} className="flex-1">
              Appliquer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SearchFilters({ currentFilters }: SearchFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeFilterCount = [
    currentFilters.type,
    currentFilters.min_price,
    currentFilters.max_price,
    currentFilters.bedrooms,
    currentFilters.bathrooms,
    currentFilters.amenities,
  ].filter(Boolean).length

  return (
    <>
      {/* Desktop: inline filter panel */}
      <div className="hidden lg:block">
        <FilterContent
          currentFilters={currentFilters}
          onApply={() => {}}
        />
      </div>

      {/* Mobile/Tablet: sheet trigger */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
              <SheetDescription>
                Affinez votre recherche
              </SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <FilterContent
                currentFilters={currentFilters}
                onApply={() => setSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
