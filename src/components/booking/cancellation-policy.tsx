"use client"

import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Shield, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CancellationPolicy as CancellationPolicyType } from "@/types"

interface CancellationPolicyProps {
  policy: CancellationPolicyType
  checkIn?: string
  totalPrice?: number
}

const POLICY_DETAILS: Record<
  CancellationPolicyType,
  {
    label: string
    color: string
    description: string
    rules: string[]
  }
> = {
  flexible: {
    label: "Flexible",
    color: "text-green-600",
    description: "Remboursement intégral jusqu'à 24h avant l'arrivée",
    rules: [
      "Annulation gratuite jusqu'à 24 heures avant l'arrivée",
      "Remboursement intégral si annulé dans les délais",
      "Après ce délai, aucun remboursement",
    ],
  },
  moderate: {
    label: "Modérée",
    color: "text-yellow-600",
    description:
      "Remboursement intégral jusqu'à 5 jours avant. 50% après.",
    rules: [
      "Annulation gratuite jusqu'à 5 jours avant l'arrivée",
      "50% de remboursement entre 5 jours et 24 heures avant",
      "Aucun remboursement après ce délai",
    ],
  },
  strict: {
    label: "Stricte",
    color: "text-red-600",
    description:
      "50% de remboursement jusqu'à 7 jours avant. Non remboursable après.",
    rules: [
      "50% de remboursement jusqu'à 7 jours avant l'arrivée",
      "Aucun remboursement après ce délai",
      "Les frais de ménage sont toujours remboursés si annulé avant l'arrivée",
    ],
  },
}

export function calculateRefund(
  policy: CancellationPolicyType,
  checkInDate: Date,
  totalPrice: number,
  cancellationDate: Date = new Date()
): number {
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  switch (policy) {
    case "flexible":
      return daysUntilCheckIn >= 1 ? totalPrice : 0
    case "moderate":
      if (daysUntilCheckIn >= 5) return totalPrice
      if (daysUntilCheckIn >= 1) return totalPrice * 0.5
      return 0
    case "strict":
      return daysUntilCheckIn >= 7 ? totalPrice * 0.5 : 0
    default:
      return 0
  }
}

export function CancellationPolicyDisplay({
  policy,
  checkIn,
  totalPrice,
}: CancellationPolicyProps) {
  const details = POLICY_DETAILS[policy]

  const deadlines = useMemo(() => {
    if (!checkIn) return null
    const checkInDate = new Date(checkIn)

    switch (policy) {
      case "flexible":
        return {
          fullRefundBefore: subDays(checkInDate, 1),
          partialRefundBefore: null,
        }
      case "moderate":
        return {
          fullRefundBefore: subDays(checkInDate, 5),
          partialRefundBefore: subDays(checkInDate, 1),
        }
      case "strict":
        return {
          fullRefundBefore: null,
          partialRefundBefore: subDays(checkInDate, 7),
        }
      default:
        return null
    }
  }, [checkIn, policy])

  const refundAmount = useMemo(() => {
    if (!checkIn || !totalPrice) return null
    return calculateRefund(policy, new Date(checkIn), totalPrice)
  }, [checkIn, totalPrice, policy])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Politique d&apos;annulation
          <Badge variant="outline" className={details.color}>
            {details.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{details.description}</p>

        <ul className="space-y-1.5">
          {details.rules.map((rule, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        {deadlines && checkIn && (
          <div className="pt-2 border-t space-y-1">
            {deadlines.fullRefundBefore && (
              <p className="text-sm">
                <span className="font-medium text-green-600">
                  Remboursement intégral
                </span>{" "}
                avant le{" "}
                {format(deadlines.fullRefundBefore, "d MMMM yyyy", {
                  locale: fr,
                })}
              </p>
            )}
            {deadlines.partialRefundBefore && (
              <p className="text-sm">
                <span className="font-medium text-yellow-600">
                  {policy === "strict" ? "50% remboursé" : "50% remboursé"}
                </span>{" "}
                avant le{" "}
                {format(deadlines.partialRefundBefore, "d MMMM yyyy", {
                  locale: fr,
                })}
              </p>
            )}
          </div>
        )}

        {refundAmount !== null && totalPrice && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium">
              Remboursement estimé si annulé maintenant :{" "}
              <span className={refundAmount > 0 ? "text-green-600" : "text-red-600"}>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(refundAmount)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
