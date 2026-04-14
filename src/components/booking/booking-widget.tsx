"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { differenceInDays } from "date-fns"

interface BookingWidgetProps {
  propertyId: string
  basePrice: number
  cleaningFee: number
  currency: string
  maxGuests: number
}

export function BookingWidget({
  propertyId,
  basePrice,
  cleaningFee,
  currency,
  maxGuests,
}: BookingWidgetProps) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    return Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn)))
  }, [checkIn, checkOut])

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-1">
          <span className="text-2xl">{formatPrice(basePrice)}</span>
          <span className="text-sm text-muted-foreground font-normal">
            /nuit
          </span>
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

        <Button
          className="w-full"
          size="lg"
          disabled={!checkIn || !checkOut || nights <= 0}
          onClick={handleBook}
        >
          Réserver
        </Button>

        {nights > 0 && (
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
  )
}
