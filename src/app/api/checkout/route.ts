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
    const { property_id, check_in, check_out, guests, total, cleaning_fee } =
      body

    if (!property_id || !check_in || !check_out || !guests || !total) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Fetch property details and host info
    const { data: property, error: propertyError } = await adminSupabase
      .from("properties")
      .select("*, pricing(*), host:profiles!properties_host_id_fkey(id, full_name, stripe_account_id)")
      .eq("id", property_id)
      .eq("status", "published")
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404 }
      )
    }

    const host = property.host as Record<string, unknown> | null

    // Create a pending booking in Supabase
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .insert({
        property_id,
        guest_id: user.id,
        host_id: property.host_id,
        check_in,
        check_out,
        guests_count: guests,
        total_price: total,
        cleaning_fee: cleaning_fee || 0,
        status: "pending",
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Erreur lors de la création de la réservation" },
        { status: 500 }
      )
    }

    // Build Stripe Checkout session params
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const nights = Math.ceil(
      (new Date(check_out).getTime() - new Date(check_in).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    const lineItems: {
      price_data: {
        currency: string
        product_data: { name: string; description?: string }
        unit_amount: number
      }
      quantity: number
    }[] = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: property.title as string,
            description: `${nights} nuit${nights > 1 ? "s" : ""} - du ${check_in} au ${check_out}`,
          },
          unit_amount: Math.round(
            ((total - (cleaning_fee || 0)) / nights) * 100
          ),
        },
        quantity: nights,
      },
    ]

    if (cleaning_fee && cleaning_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de ménage" },
          unit_amount: Math.round(cleaning_fee * 100),
        },
        quantity: 1,
      })
    }

    const sessionParams: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        booking_id: booking.id,
        property_id,
        guest_id: user.id,
        host_id: property.host_id,
      },
      success_url: `${baseUrl}/trips?booking=${booking.id}&status=success`,
      cancel_url: `${baseUrl}/book/${property_id}?check_in=${check_in}&check_out=${check_out}&guests=${guests}&status=canceled`,
    }

    // If host has Stripe Connect, use destination charge
    const hostStripeAccountId = host?.stripe_account_id as string | null
    if (hostStripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: hostStripeAccountId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    return NextResponse.json({ url: session.url, booking_id: booking.id })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    )
  }
}
