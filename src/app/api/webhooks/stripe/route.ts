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
