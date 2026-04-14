"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import Link from "next/link"
import type { Property, PropertyImage, Pricing } from "@/types"

// Fix default marker icon issue with Leaflet + bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

type PropertyWithRelations = Property & {
  images: PropertyImage[]
  pricing: Pricing[]
}

interface PropertyMapProps {
  properties: PropertyWithRelations[]
  className?: string
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(price)
}

export function PropertyMap({ properties, className }: PropertyMapProps) {
  const geoProperties = properties.filter(
    (p) => p.latitude != null && p.longitude != null
  )

  // Calculate center from properties, default to France center
  const center: [number, number] =
    geoProperties.length > 0
      ? [
          geoProperties.reduce((sum, p) => sum + p.latitude!, 0) /
            geoProperties.length,
          geoProperties.reduce((sum, p) => sum + p.longitude!, 0) /
            geoProperties.length,
        ]
      : [46.603354, 1.888334]

  const zoom = geoProperties.length > 0 ? 6 : 5

  useEffect(() => {
    // Leaflet CSS is loaded via link tag in the page head
  }, [])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className={className}
      style={{ height: "100%", width: "100%", minHeight: "400px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude!, property.longitude!]}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h3 className="font-semibold text-sm mb-1 leading-tight">
                {property.title}
              </h3>
              {property.city && (
                <p className="text-xs text-gray-500 mb-1">
                  {property.city}
                  {property.country ? `, ${property.country}` : ""}
                </p>
              )}
              {property.pricing?.[0] && (
                <p className="text-sm font-semibold mb-2">
                  {formatPrice(
                    property.pricing[0].base_price,
                    property.pricing[0].currency
                  )}
                  <span className="text-xs font-normal text-gray-500">
                    {" "}
                    /nuit
                  </span>
                </p>
              )}
              <Link
                href={`/listing/${property.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                Voir le logement
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
