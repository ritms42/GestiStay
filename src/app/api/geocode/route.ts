import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { geocodeAddress } from "@/lib/geocode"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    address?: string | null
    city?: string | null
    postal_code?: string | null
    country?: string | null
  } | null

  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 })

  const result = await geocodeAddress(body)
  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 })

  return NextResponse.json(result)
}
