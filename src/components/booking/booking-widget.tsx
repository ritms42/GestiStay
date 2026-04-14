"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { differenceInDays } from "date-fns"
import { Zap, AlertCircle } from "lucide-react"
import { CancellationPolicyDisplay } from "@/components/booking/cancellation-policy"
import type { CancellationPolicy } from "@/types"

interface BookingWidgetProps {
  propertyId: string
  basePrice: number
  cleaningFee: number
  currency: string
  maxGuests: number
  cancellationPolicy?: CancellationPolicy
  instantBook?: boolean
  minNights?: number
  maxNights?: number
}

export function BookingWidget({
  propertyId,
  basePrice,
  cleaningFee,
  currency,
  maxGuests,
  cancellationPolicy = "moderate",
  instantBook = false,
  minNights = 1,
  maxNights = 365,
}: BookingWidgetProps) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    return Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)))
  }, [checkIn, checkOut])

  const nightsError = useMemo(() => {
    if (nights <= 0) return null
    if (nights < minNights) {
      return `Le séjour minimum est de ${minNights} nuit${minNights > 1 ? "s" : ""}`
    }
    if (nights > maxNights) {
      return `Le séjour maximum est de ${maxNights} nuit${maxNights > 1 ? "s" : ""}`
    }
    return null
  }, [nights, minNights, maxNights])

  const subtotal = nights * basePrice
  const total = subtotal + cleaningFee

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount)

  function handleBook() {
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests: guests.toString(),
    })
    router.push(`/book/${propertyId}?${params}`)
  }

  const canBook = checkIn && checkOut && nights > 0 && !nightsError

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-baseline gap-1">
            <span className="text-2xl">{formatPrice(basePrice)}</span>
            <span className="text-sm text-muted-foreground font-normal">
              /nuit
            </span>
            {instantBook && (
              <Badge
                variant="secondary"
                className="ml-auto text-xs gap-1"
              >
                <Zap className="h-3 w-3" />
                Réservation instantanée
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Arrivée</Label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Départ</Label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Voyageurs</Label>
            <Input
              type="number"
              min={1}
              max={maxGuests}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {maxGuests} voyageurs maximum
            </p>
          </div>

          {nightsError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{nightsError}</span>
            </div>
          )}

          {minNights > 1 && !nightsError && (
            <p className="text-xs text-muted-foreground">
              Séjour minimum : {minNights} nuit{minNights > 1 ? "s" : ""}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!canBook}
            onClick={handleBook}
          >
            {instantBook ? "Réservation instantanée" : "Réserver"}
          </Button>

          {nights > 0 && !nightsError && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    {formatPrice(basePrice)} x {nights} nuit
                    {nights > 1 ? "s" : ""}
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between">
                    <span>Frais de ménage</span>
                    <span>{formatPrice(cleaningFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Commission GestiStay</span>
                  <span>0,00 EUR</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CancellationPolicyDisplay
        policy={cancellationPolicy}
        checkIn={checkIn || undefined}
        totalPrice={nights > 0 && !nightsError ? total : undefined}
      />
    </div>
  )
}
