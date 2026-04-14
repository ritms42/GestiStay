"use client"

import { useState } from "react"
import Link from "next/link"
import { PropertyCard } from "@/components/properties/property-card"
import { DynamicMap } from "@/components/search/dynamic-map"
import { SearchFilters } from "@/components/search/search-filters"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { List, Map as MapIcon } from "lucide-react"
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
  return (
    <>
      {/* Desktop layout: split view */}
      <div className="hidden lg:flex gap-0 flex-1 min-h-0">
        {/* Left sidebar: filters + list */}
        <div className="w-[55%] xl:w-[60%] flex flex-col border-r">
          {/* Filters bar */}
          <div className="p-4 border-b">
            <SearchFilters currentFilters={currentFilters} />
          </div>

          {/* Results header */}
          <div className="px-4 py-3 border-b bg-muted/30">
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {resultsCount} logement{resultsCount !== 1 ? "s" : ""} trouv
              {resultsCount !== 1 ? "es" : "e"}
            </p>
          </div>

          {/* Scrollable property list */}
          <div className="flex-1 overflow-y-auto p-4">
            {properties.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/listing/${property.id}`}
                  >
                    <PropertyCard
                      property={property as never}
                      variant="public"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Right side: map */}
        <div className="flex-1 sticky top-0 h-[calc(100vh-64px)]">
          <DynamicMap properties={properties} />
        </div>
      </div>

      {/* Mobile/Tablet layout: tabs */}
      <div className="lg:hidden flex flex-col flex-1">
        {/* Filters row */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {resultsCount} logement{resultsCount !== 1 ? "s" : ""} trouv
              {resultsCount !== 1 ? "es" : "e"}
            </p>
          </div>
          <SearchFilters currentFilters={currentFilters} />
        </div>

        <Tabs defaultValue="list" className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="list" className="flex-1">
                <List className="h-4 w-4 mr-1.5" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1">
                <MapIcon className="h-4 w-4 mr-1.5" />
                Carte
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 overflow-y-auto p-4">
            {properties.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/listing/${property.id}`}
                  >
                    <PropertyCard
                      property={property as never}
                      variant="public"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="map" className="flex-1 min-h-[60vh]">
            <DynamicMap properties={properties} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50 flex items-center justify-center">
        <List className="h-12 w-12" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Aucun resultat</h2>
      <p className="text-muted-foreground">
        Essayez d&apos;elargir votre recherche ou de modifier vos criteres
      </p>
    </div>
  )
}
