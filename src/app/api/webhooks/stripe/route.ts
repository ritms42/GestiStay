import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // ─── Checkout Session Completed ─────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.booking_id
      const hostId = session.metadata?.host_id

      if (bookingId) {
        // Update booking to confirmed with the payment intent ID
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", bookingId)

        // Fetch booking details to block dates
        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single()

        if (booking) {
          // Block dates in availability
          const dates: {
            property_id: string
            date: string
            status: "booked"
            booking_id: string
          }[] = []
          const current = new Date(booking.check_in)
          const end = new Date(booking.check_out)
          while (current < end) {
            dates.push({
              property_id: booking.property_id,
              date: current.toISOString().split("T")[0],
              status: "booked",
              booking_id: bookingId,
            })
            current.setDate(current.getDate() + 1)
          }

          if (dates.length > 0) {
            await supabase
              .from("availability")
              .upsert(dates, { onConflict: "property_id,date" })
          }

          // Create conversation between guest and host
          const { data: conversation } = await supabase
            .from("conversations")
            .insert({
              booking_id: bookingId,
              property_id: booking.property_id,
            })
            .select()
            .single()

          if (conversation) {
            await supabase.from("conversation_participants").insert([
              { conversation_id: conversation.id, user_id: booking.guest_id },
              { conversation_id: conversation.id, user_id: booking.host_id },
            ])

            await supabase.from("messages").insert({
              conversation_id: conversation.id,
              sender_id: booking.guest_id,
              content: `Réservation confirmée du ${new Date(booking.check_in).toLocaleDateString("fr-FR")} au ${new Date(booking.check_out).toLocaleDateString("fr-FR")} pour ${booking.guests_count} voyageur(s).`,
            })
          }

          // Notify host about new booking
          if (hostId) {
            await supabase.from("notifications").insert({
              user_id: hostId,
              type: "booking_new",
              title: "Nouvelle réservation",
              message: `Nouvelle réservation du ${new Date(booking.check_in).toLocaleDateString("fr-FR")} au ${new Date(booking.check_out).toLocaleDateString("fr-FR")}.`,
              link: "/reservations",
              data: { booking_id: bookingId },
            })
          }
        }
      }
      break
    }

    // ─── Charge Refunded ────────────────────────────────────────────
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string

      if (paymentIntentId) {
        // Find booking by payment intent and update status
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, guest_id, host_id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single()

        if (booking) {
          await supabase
            .from("bookings")
            .update({ status: "canceled" })
            .eq("id", booking.id)

          // Unblock dates
          await supabase
            .from("availability")
            .delete()
            .eq("booking_id", booking.id)

          // Notify guest about refund
          await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            type: "booking_canceled",
            title: "Remboursement effectué",
            message: "Votre réservation a été remboursée.",
            link: "/trips",
            data: { booking_id: booking.id },
          })
        }
      }
      break
    }

    // ─── Subscription Events (existing) ─────────────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        let status: string = "none"
        if (subscription.status === "active") status = "active"
        else if (subscription.status === "trialing") status = "trial"
        else if (subscription.status === "past_due") status = "past_due"
        else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        )
          status = "canceled"

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_plan: subscription.metadata?.plan || null,
          })
          .eq("id", profile.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_plan: null,
        })
        .eq("stripe_customer_id", customerId)
      break
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingId = paymentIntent.metadata?.booking_id

      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq("id", bookingId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
