import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST: Create a Stripe Connect account for the host and return onboarding URL
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    let accountId = profile.stripe_account_id as string | null

    // Create a new Connect account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          user_id: user.id,
        },
      })

      accountId = account.id

      await adminSupabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id)
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/payouts?refresh=true`,
      return_url: `${baseUrl}/payouts?connected=true`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error("Stripe Connect error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la configuration Stripe Connect" },
      { status: 500 }
    )
  }
}

// GET: Check if the host has completed Stripe Connect onboarding
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
      })
    }

    const account = await stripe.accounts.retrieve(
      profile.stripe_account_id as string
    )

    return NextResponse.json({
      connected: true,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      account_id: account.id,
    })
  } catch (error) {
    console.error("Stripe Connect status error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut Stripe" },
      { status: 500 }
    )
  }
}
