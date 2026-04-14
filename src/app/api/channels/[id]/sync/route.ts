import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseIcal } from "@/lib/channels/ical"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: channel, error: chErr } = await supabase
    .from("channels")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .maybeSingle()

  if (chErr || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  if (!channel.ical_import_url) {
    return NextResponse.json(
      { error: "No import URL configured for this channel" },
      { status: 400 }
    )
  }

  // Mark syncing
  await supabase
    .from("channels")
    .update({ last_import_status: "syncing" })
    .eq("id", channel.id)

  try {
    const res = await fetch(channel.ical_import_url, {
      headers: { "User-Agent": "GestiStay Channel Manager/1.0" },
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Fetch failed: HTTP ${res.status}`)
    }

    const icsText = await res.text()
    const events = parseIcal(icsText)

    let upsertedExternal = 0
    const externalBookingIdByUid = new Map<string, string>()

    for (const ev of events) {
      const checkIn = ev.start.toISOString().slice(0, 10)
      const checkOut = ev.end.toISOString().slice(0, 10)

      const { data: extRow, error: extErr } = await supabase
        .from("external_bookings")
        .upsert(
          {
            channel_id: channel.id,
            property_id: channel.property_id,
            external_uid: ev.uid,
            summary: ev.summary || null,
            check_in: checkIn,
            check_out: checkOut,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "channel_id,external_uid" }
        )
        .select("id")
        .single()

      if (extErr) throw extErr
      if (extRow?.id) {
        externalBookingIdByUid.set(ev.uid, extRow.id)
        upsertedExternal++

        // Mark each date in the range as booked (check_out is exclusive)
        const availabilityRows: Array<{
          property_id: string
          date: string
          status: string
          external_booking_id: string
        }> = []
        const cur = new Date(ev.start)
        const end = new Date(ev.end)
        while (cur < end) {
          availabilityRows.push({
            property_id: channel.property_id,
            date: cur.toISOString().slice(0, 10),
            status: "booked",
            external_booking_id: extRow.id,
          })
          cur.setUTCDate(cur.getUTCDate() + 1)
        }
        if (availabilityRows.length > 0) {
          await supabase
            .from("availability")
            .upsert(availabilityRows, { onConflict: "property_id,date" })
        }
      }
    }

    await supabase
      .from("channels")
      .update({
        last_import_at: new Date().toISOString(),
        last_import_status: "success",
        last_import_error: null,
        last_import_events_count: upsertedExternal,
      })
      .eq("id", channel.id)

    return NextResponse.json({
      success: true,
      events_count: upsertedExternal,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await supabase
      .from("channels")
      .update({
        last_import_at: new Date().toISOString(),
        last_import_status: "error",
        last_import_error: message,
      })
      .eq("id", channel.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
