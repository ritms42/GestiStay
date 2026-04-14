import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

async function authenticateApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")
  if (!apiKey) return null

  const supabase = createAdminClient()
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single()

  if (!data) return null
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)
  return data
}

// GET /api/v1/availability?property_id=xxx&from=2026-01-01&to=2026-12-31
export async function GET(request: Request) {
  const apiKeyData = await authenticateApiKey(request)
  if (!apiKeyData) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get("property_id")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!propertyId) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify property belongs to user
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("host_id", apiKeyData.user_id)
    .single()

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }

  let query = supabase
    .from("availability")
    .select("date, status, booking_id")
    .eq("property_id", propertyId)
    .order("date")

  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// PUT /api/v1/availability - Block/unblock dates
export async function PUT(request: Request) {
  const apiKeyData = await authenticateApiKey(request)
  if (!apiKeyData) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  }

  if (!apiKeyData.permissions.includes("write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { property_id, dates, action } = body

  if (!property_id || !dates || !action) {
    return NextResponse.json({ error: "property_id, dates, and action are required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === "block") {
    const rows = dates.map((date: string) => ({
      property_id,
      date,
      status: "blocked",
    }))
    const { error } = await supabase.from("availability").upsert(rows, { onConflict: "property_id,date" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === "unblock") {
    for (const date of dates) {
      await supabase.from("availability").delete().eq("property_id", property_id).eq("date", date).eq("status", "blocked")
    }
  }

  return NextResponse.json({ success: true, dates_affected: dates.length })
}
