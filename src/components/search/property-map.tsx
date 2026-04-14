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
    maximumFractionDigits: 0,
  }).format(price)
}

function formatPriceShort(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(price)
}

function createPriceIcon(price: number, currency: string) {
  const label = formatPriceShort(price, currency)
  return L.divIcon({
    className: "price-marker",
    html: `<div class="price-marker-label">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16],
  })
}

// Inject CSS for price markers once
const PRICE_MARKER_CSS = `
.price-marker {
  background: transparent !important;
  border: none !important;
}
.price-marker-label {
  background: white;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  border: 1.5px solid #e0e0e0;
  transform: translate(-50%, -50%);
  transition: all 0.15s ease;
  cursor: pointer;
  line-height: 1.2;
}
.price-marker-label:hover {
  background: #1a1a1a;
  color: white;
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  border-color: #1a1a1a;
  z-index: 1000 !important;
}
`

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
    // Inject price marker styles
    if (typeof document !== "undefined") {
      const id = "price-marker-styles"
      if (!document.getElementById(id)) {
        const style = document.createElement("style")
        style.id = id
        style.textContent = PRICE_MARKER_CSS
        document.head.appendChild(style)
      }
    }
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
      {geoProperties.map((property) => {
        const pricing = property.pricing?.[0]
        const icon = pricing
          ? createPriceIcon(pricing.base_price, pricing.currency)
          : defaultIcon

        return (
          <Marker
            key={property.id}
            position={[property.latitude!, property.longitude!]}
            icon={icon}
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
                {pricing && (
                  <p className="text-sm font-semibold mb-2">
                    {formatPrice(pricing.base_price, pricing.currency)}
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
        )
      })}
    </MapContainer>
  )
}
