// Server-side geocoding via Nominatim (OpenStreetMap).
// No API key required. Respect their usage policy: <=1 req/s, set User-Agent.
// https://operations.osmfoundation.org/policies/nominatim/

export interface GeocodeInput {
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface GeocodeResult {
  latitude: number
  longitude: number
}

export async function geocodeAddress(
  input: GeocodeInput
): Promise<GeocodeResult | null> {
  const parts = [
    input.address,
    input.postal_code,
    input.city,
    input.country,
  ]
    .filter((p) => p && p.trim().length > 0)
    .join(", ")

  if (!parts) return null

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", parts)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("addressdetails", "0")

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "GestiStay/1.0 (https://gestistay.com)",
        "Accept-Language": "fr,en",
      },
      // Cache for 7 days at the edge
      next: { revalidate: 60 * 60 * 24 * 7 },
    })

    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!data.length) return null

    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null

    return { latitude: lat, longitude: lon }
  } catch {
    return null
  }
}
