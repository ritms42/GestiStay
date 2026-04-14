"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { Property, PropertyImage, Pricing } from "@/types"

type PropertyWithRelations = Property & {
  images: PropertyImage[]
  pricing: Pricing[]
}

const PropertyMap = dynamic(
  () =>
    import("@/components/search/property-map").then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full min-h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    ),
  }
)

interface DynamicMapProps {
  properties: PropertyWithRelations[]
  className?: string
}

export function DynamicMap({ properties, className }: DynamicMapProps) {
  return <PropertyMap properties={properties} className={className} />
}
