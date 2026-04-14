"use client"

import { useState } from "react"
import Link from "next/link"
import { PropertyCard } from "@/components/properties/property-card"
import { DynamicMap } from "@/components/search/dynamic-map"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { SearchFilters } from "@/components/search/search-filters"
import { List, Map as MapIcon, SlidersHorizontal, Search } from "lucide-react"
import type { Property, PropertyImage, Pricing } from "@/types"

type PropertyWithRelations = Property & {
  images: PropertyImage[]
  pricing: Pricing[]
}

interface SearchResultsProps {
  properties: PropertyWithRelations[]
  currentFilters: {
    type?: string
    min_price?: string
    max_price?: string
    bedrooms?: string
    bathrooms?: string
    amenities?: string
  }
  resultsCount: number
  title: string
}

export function SearchResults({
  properties,
  currentFilters,
  resultsCount,
  title,
}: SearchResultsProps) {
  const [mobileView, setMobileView] = useState<"list" | "map">("list")
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="h-full flex flex-col">
      {/* Desktop: split view */}
      <div className="hidden lg:flex h-full">
        {/* Left: filters + list */}
        <div className="w-[55%] flex flex-col border-r overflow-hidden">
          {/* Compact filter toggle + results count */}
          <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-base font-bold">{title}</h1>
              <p className="text-xs text-muted-foreground">
                {resultsCount} logement{resultsCount !== 1 ? "s" : ""} trouvé{resultsCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                    Filtres
                  </Button>
                }
              />
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Affinez votre recherche</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <SearchFilters
                    currentFilters={currentFilters}
                    onApply={() => setFiltersOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Scrollable property list */}
          <div className="flex-1 overflow-y-auto p-4">
            {properties.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                {properties.map((property) => (
                  <Link key={property.id} href={`/listing/${property.id}`}>
                    <PropertyCard property={property as never} variant="public" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Right: map */}
        <div className="flex-1 h-full">
          <DynamicMap properties={properties} />
        </div>
      </div>

      {/* Mobile/Tablet */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Header bar */}
        <div className="px-4 py-2 border-b flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {resultsCount} logement{resultsCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Affinez votre recherche</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <SearchFilters currentFilters={currentFilters} onApply={() => {}} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setMobileView("list")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                  mobileView === "list" ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Liste
              </button>
              <button
                onClick={() => setMobileView("map")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                  mobileView === "map" ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Carte
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mobileView === "list" ? (
            <div className="h-full overflow-y-auto p-4">
              {properties.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {properties.map((property) => (
                    <Link key={property.id} href={`/listing/${property.id}`}>
                      <PropertyCard property={property as never} variant="public" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          ) : (
            <div className="h-full">
              <DynamicMap properties={properties} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
      <p className="text-muted-foreground">
        Essayez d&apos;élargir votre recherche ou de modifier vos critères
      </p>
    </div>
  )
}
