import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

// Verify API key
async function authenticateApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")
  if (!apiKey) return null

  const supabase = createAdminClient()
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  const { data: apiKeyData } = await supabase
    .from("api_keys")
    .select("*, user:profiles!api_keys_user_id_fkey(id, email, role)")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single()

  if (!apiKeyData) return null

  // Check expiry
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) return null

  // Update last used
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyData.id)

  return apiKeyData
}

// GET /api/v1/properties - List properties
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous"
  const { success, retryAfter } = rateLimit(`properties-get:${ip}`, 60, 60_000)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests", retry_after: retryAfter },
      { status: 429 }
    )
  }

  const apiKeyData = await authenticateApiKey(request)
  if (!apiKeyData) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  }

  if (!apiKeyData.permissions.includes("read")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")
  const status = searchParams.get("status") || "published"
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const supabase = createAdminClient()
  let query = supabase
    .from("properties")
    .select("*, images:property_images(*), pricing(*)", { count: "exact" })
    .eq("host_id", apiKeyData.user_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== "all") {
    query = query.eq("status", status)
  }
  if (city) {
    query = query.ilike("city", `%${city}%`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      total: count,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    },
  })
}

// POST /api/v1/properties - Create a property
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous"
  const { success, retryAfter } = rateLimit(`properties-post:${ip}`, 20, 60_000)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests", retry_after: retryAfter },
      { status: 429 }
    )
  }

  const apiKeyData = await authenticateApiKey(request)
  if (!apiKeyData) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  }

  if (!apiKeyData.permissions.includes("write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("properties")
    .insert({
      host_id: apiKeyData.user_id,
      title: body.title,
      description: body.description,
      property_type: body.property_type || "apartment",
      address: body.address,
      city: body.city,
      country: body.country,
      postal_code: body.postal_code,
      latitude: body.latitude,
      longitude: body.longitude,
      max_guests: body.max_guests || 1,
      bedrooms: body.bedrooms || 0,
      beds: body.beds || 1,
      bathrooms: body.bathrooms || 1,
      amenities: body.amenities || [],
      house_rules: body.house_rules,
      check_in_time: body.check_in_time,
      check_out_time: body.check_out_time,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create default pricing if provided
  if (body.price_per_night) {
    await supabase.from("pricing").insert({
      property_id: data.id,
      base_price: body.price_per_night,
      cleaning_fee: body.cleaning_fee || 0,
      currency: body.currency || "EUR",
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
