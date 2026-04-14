import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateIcal } from "@/lib/channels/ical"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: channel, error: chErr } = await supabase
    .from("channels")
    .select("id, property_id, name, ical_export_token")
    .eq("id", id)
    .eq("ical_export_token", token)
    .maybeSingle()

  if (chErr || !channel) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  // Fetch confirmed bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, check_in, check_out, status")
    .eq("property_id", channel.property_id)
    .in("status", ["confirmed", "completed", "pending"])

  // Fetch blocked availability rows
  const { data: blockedRows } = await supabase
    .from("availability")
    .select("date, status, external_booking_id")
    .eq("property_id", channel.property_id)
    .eq("status", "blocked")

  const events: Array<{
    uid: string
    summary: string
    start: Date
    end: Date
  }> = []

  for (const b of bookings || []) {
    events.push({
      uid: `booking-${b.id}@gestistay`,
      summary: "GestiStay Booking",
      start: new Date(b.check_in + "T00:00:00Z"),
      end: new Date(b.check_out + "T00:00:00Z"),
    })
  }

  // Collapse consecutive blocked dates into ranges
  const blockedDates = (blockedRows || [])
    .filter((r) => !r.external_booking_id)
    .map((r) => r.date as string)
    .sort()

  let i = 0
  while (i < blockedDates.length) {
    const start = blockedDates[i]
    let j = i
    while (j + 1 < blockedDates.length) {
      const cur = new Date(blockedDates[j] + "T00:00:00Z")
      const nxt = new Date(blockedDates[j + 1] + "T00:00:00Z")
      const diff = (nxt.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24)
      if (diff === 1) j++
      else break
    }
    // End (exclusive) is day after blockedDates[j]
    const endDate = new Date(blockedDates[j] + "T00:00:00Z")
    endDate.setUTCDate(endDate.getUTCDate() + 1)
    events.push({
      uid: `blocked-${start}-${channel.id}@gestistay`,
      summary: "Blocked",
      start: new Date(start + "T00:00:00Z"),
      end: endDate,
    })
    i = j + 1
  }

  const ics = generateIcal(events, `GestiStay - ${channel.name}`)

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="gestistay-${channel.id}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  })
}
