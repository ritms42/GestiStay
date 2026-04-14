"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

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
  { value: "ac", label: "Climatisation" },
  { value: "heating", label: "Chauffage" },
  { value: "washer", label: "Lave-linge" },
  { value: "tv", label: "TV" },
  { value: "elevator", label: "Ascenseur" },
  { value: "gym", label: "Salle de sport" },
  { value: "balcony", label: "Balcon" },
  { value: "garden", label: "Jardin" },
  { value: "pets", label: "Animaux acceptés" },
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
  onApply: () => void
}

export function SearchFilters({ currentFilters, onApply }: SearchFiltersProps) {
  const [minPrice, setMinPrice] = useState(currentFilters.min_price || "")
  const [maxPrice, setMaxPrice] = useState(currentFilters.max_price || "")
  const [propertyType, setPropertyType] = useState(currentFilters.type || "")
  const [bedrooms, setBedrooms] = useState(currentFilters.bedrooms || "")
  const [bathrooms, setBathrooms] = useState(currentFilters.bathrooms || "")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    currentFilters.amenities ? currentFilters.amenities.split(",") : []
  )

  const router = useRouter()
  const searchParams = useSearchParams()

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }, [])

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (propertyType) params.set("type", propertyType); else params.delete("type")
    if (minPrice) params.set("min_price", minPrice); else params.delete("min_price")
    if (maxPrice) params.set("max_price", maxPrice); else params.delete("max_price")
    if (bedrooms) params.set("bedrooms", bedrooms); else params.delete("bedrooms")
    if (bathrooms) params.set("bathrooms", bathrooms); else params.delete("bathrooms")
    if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(",")); else params.delete("amenities")
    router.push(`/search?${params.toString()}`)
    onApply()
  }, [searchParams, propertyType, minPrice, maxPrice, bedrooms, bathrooms, selectedAmenities, router, onApply])

  const clearFilters = useCallback(() => {
    setMinPrice(""); setMaxPrice(""); setPropertyType(""); setBedrooms(""); setBathrooms(""); setSelectedAmenities([])
    const params = new URLSearchParams(searchParams.toString())
    ;["type", "min_price", "max_price", "bedrooms", "bathrooms", "amenities"].forEach(k => params.delete(k))
    router.push(`/search?${params.toString()}`)
    onApply()
  }, [searchParams, router, onApply])

  return (
    <div className="space-y-5">
      {/* Price */}
      <div>
        <label className="text-sm font-medium mb-2 block">Prix par nuit (€)</label>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <span className="text-muted-foreground">—</span>
          <Input type="number" min={0} placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-sm font-medium mb-2 block">Type de logement</label>
        <Select value={propertyType} onValueChange={(v) => setPropertyType(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Tous les types" /></SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-sm font-medium mb-2 block">Chambres (min.)</label>
        <div className="flex gap-1.5">
          {["1", "2", "3", "4", "5"].map((n) => (
            <Button key={n} type="button" variant={bedrooms === n ? "default" : "outline"} size="sm"
              onClick={() => setBedrooms(bedrooms === n ? "" : n)} className="flex-1">
              {n}{n === "5" ? "+" : ""}
            </Button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <label className="text-sm font-medium mb-2 block">Salles de bain (min.)</label>
        <div className="flex gap-1.5">
          {["1", "2", "3", "4"].map((n) => (
            <Button key={n} type="button" variant={bathrooms === n ? "default" : "outline"} size="sm"
              onClick={() => setBathrooms(bathrooms === n ? "" : n)} className="flex-1">
              {n}{n === "4" ? "+" : ""}
            </Button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="text-sm font-medium mb-2 block">Équipements</label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button key={a.value} type="button" onClick={() => toggleAmenity(a.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedAmenities.includes(a.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={clearFilters} className="flex-1">
          <X className="h-4 w-4 mr-1" />
          Effacer
        </Button>
        <Button type="button" onClick={applyFilters} className="flex-1">
          Appliquer
        </Button>
      </div>
    </div>
  )
}
