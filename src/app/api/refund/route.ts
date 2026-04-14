import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id est requis" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Fetch the booking
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      )
    }

    // Verify the user is the guest or host
    if (booking.guest_id !== user.id && booking.host_id !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé à annuler cette réservation" },
        { status: 403 }
      )
    }

    // Check booking is in a refundable state
    if (booking.status === "canceled") {
      return NextResponse.json(
        { error: "Cette réservation est déjà annulée" },
        { status: 400 }
      )
    }

    // Create Stripe refund if there's a payment intent
    if (booking.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
        })
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError)
        return NextResponse.json(
          { error: "Erreur lors du remboursement Stripe" },
          { status: 500 }
        )
      }
    }

    // Update booking status to canceled
    await adminSupabase
      .from("bookings")
      .update({ status: "canceled" })
      .eq("id", booking_id)

    // Unblock dates in availability
    await adminSupabase
      .from("availability")
      .delete()
      .eq("booking_id", booking_id)

    // Create a notification for the other party
    const notifyUserId =
      booking.guest_id === user.id ? booking.host_id : booking.guest_id
    await adminSupabase.from("notifications").insert({
      user_id: notifyUserId,
      type: "booking_canceled",
      title: "Réservation annulée",
      message: `La réservation #${booking_id.slice(0, 8)} a été annulée et remboursée.`,
      link: "/reservations",
      data: { booking_id },
    })

    return NextResponse.json({ success: true, booking_id })
  } catch (error) {
    console.error("Refund error:", error)
    return NextResponse.json(
      { error: "Erreur lors du remboursement" },
      { status: 500 }
    )
  }
}
