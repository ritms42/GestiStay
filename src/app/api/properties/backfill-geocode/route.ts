import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { geocodeAddress } from "@/lib/geocode"

export const runtime = "nodejs"
export const maxDuration = 60

// Geocodes all of the current host's properties that lack coordinates.
// Respects Nominatim's 1 req/sec limit by spacing calls.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, address, city, postal_code, country, latitude, longitude")
    .eq("host_id", user.id)
    .or("latitude.is.null,longitude.is.null")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0
  let failed = 0

  for (const p of properties ?? []) {
    const result = await geocodeAddress({
      address: p.address,
      city: p.city,
      postal_code: p.postal_code,
      country: p.country,
    })

    if (result) {
      const { error: upErr } = await supabase
        .from("properties")
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq("id", p.id)
        .eq("host_id", user.id)
      if (upErr) failed++
      else updated++
    } else {
      failed++
    }

    // Nominatim policy: <=1 req/sec
    await new Promise((r) => setTimeout(r, 1100))
  }

  return NextResponse.json({
    total: properties?.length ?? 0,
    updated,
    failed,
  })
}
