"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Wallet,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  BanknoteIcon,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

interface ConnectStatus {
  connected: boolean
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  account_id?: string
}

interface PayoutItem {
  id: string
  amount: number
  currency: string
  status: string
  arrival_date: number
  created: number
}

interface BalanceInfo {
  available: { amount: number; currency: string }[]
  pending: { amount: number; currency: string }[]
}

export default function PayoutsPage() {
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [balance, setBalance] = useState<BalanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const fetchConnectStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/connect")
      const data = await res.json()
      setConnectStatus(data)
      return data
    } catch {
      console.error("Failed to fetch connect status")
      return null
    }
  }, [])

  const fetchPayoutData = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch completed bookings as payout history
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, total_price, cleaning_fee, check_in, check_out, status, created_at, property:properties(title)")
        .eq("host_id", user.id)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false })
        .limit(20)

      if (bookings) {
        setPayouts(
          bookings.map((b) => ({
            id: b.id,
            amount: b.total_price * 100,
            currency: "eur",
            status: b.status === "completed" ? "paid" : "pending",
            arrival_date: new Date(b.check_out).getTime() / 1000,
            created: new Date(b.created_at).getTime() / 1000,
          }))
        )

        const confirmed = bookings
          .filter((b) => b.status === "confirmed")
          .reduce((sum, b) => sum + b.total_price, 0)
        const completed = bookings
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + b.total_price, 0)

        setBalance({
          available: [{ amount: Math.round(completed * 100), currency: "eur" }],
          pending: [{ amount: Math.round(confirmed * 100), currency: "eur" }],
        })
      }
    } catch {
      console.error("Failed to fetch payout data")
    }
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      const status = await fetchConnectStatus()
      if (status?.connected && status?.payouts_enabled) {
        await fetchPayoutData()
      }
      setLoading(false)
    }
    init()
  }, [fetchConnectStatus, fetchPayoutData])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Erreur lors de la connexion Stripe")
      }
    } catch {
      toast.error("Erreur lors de la connexion Stripe")
    } finally {
      setConnecting(false)
    }
  }

  async function handleManageDashboard() {
    if (!connectStatus?.account_id) return
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Erreur lors de l'ouverture du dashboard Stripe")
    }
  }

  const formatPrice = (amount: number, currency: string = "eur") =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos paiements et virements
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Not connected state
  if (!connectStatus?.connected || !connectStatus?.details_submitted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos paiements et virements
          </p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Connectez votre compte Stripe</CardTitle>
                <CardDescription>
                  Pour recevoir des paiements, vous devez connecter un compte
                  Stripe.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Recevez les paiements de vos locataires directement</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Virements automatiques sur votre compte bancaire</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Tableau de bord complet des transactions</span>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {connectStatus?.connected
                ? "Compléter la vérification"
                : "Connecter Stripe"}
            </Button>

            {connectStatus?.connected && !connectStatus?.details_submitted && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Vérification Stripe en cours. Veuillez compléter le processus.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connected state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos paiements et virements
          </p>
        </div>
        <Button variant="outline" onClick={handleManageDashboard}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Dashboard Stripe
        </Button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-2 text-sm">
        <Badge
          variant={connectStatus.payouts_enabled ? "default" : "secondary"}
          className="gap-1"
        >
          {connectStatus.payouts_enabled ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {connectStatus.payouts_enabled
            ? "Stripe connecté"
            : "En attente de vérification"}
        </Badge>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde disponible
            </CardTitle>
            <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance?.available?.[0]
                ? formatPrice(
                    balance.available[0].amount,
                    balance.available[0].currency
                  )
                : "0,00 EUR"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance?.pending?.[0]
                ? formatPrice(
                    balance.pending[0].amount,
                    balance.pending[0].currency
                  )
                : "0,00 EUR"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des virements
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {payouts.length > 0
                ? formatPrice(
                    payouts.reduce((sum, p) => sum + p.amount, 0),
                    "eur"
                  )
                : "0,00 EUR"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Liste de vos paiements reçus et en attente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun paiement pour le moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d&apos;arrivée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{formatDate(payout.created)}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payout.amount, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payout.status === "paid" ? "default" : "secondary"
                        }
                      >
                        {payout.status === "paid"
                          ? "Versé"
                          : payout.status === "pending"
                            ? "En attente"
                            : payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(payout.arrival_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
