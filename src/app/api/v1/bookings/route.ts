import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit } from "@/lib/rate-limit"
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
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)
  return data
}

// GET /api/v1/bookings - List bookings
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous"
  const { success, retryAfter } = rateLimit(`bookings-get:${ip}`, 60, 60_000)
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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const propertyId = searchParams.get("property_id")
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const supabase = createAdminClient()
  let query = supabase
    .from("bookings")
    .select("*, property:properties(id, title, city), guest:profiles!bookings_guest_id_fkey(full_name, email)", { count: "exact" })
    .eq("host_id", apiKeyData.user_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq("status", status)
  if (propertyId) query = query.eq("property_id", propertyId)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: { total: count, limit, offset, has_more: (count || 0) > offset + limit },
  })
}
