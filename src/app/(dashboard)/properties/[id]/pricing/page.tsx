"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function PricingPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [basePrice, setBasePrice] = useState(50)
  const [cleaningFee, setCleaningFee] = useState(0)
  const [seasonalPricing, setSeasonalPricing] = useState<
    { id?: string; start_date: string; end_date: string; price_per_night: number }[]
  >([])

  useEffect(() => {
    async function fetchPricing() {
      const { data: pricing, error } = await supabase
        .from("pricing")
        .select("*")
        .eq("property_id", id)
        .maybeSingle()

      if (pricing && !error) {
        setBasePrice(pricing.base_price)
        setCleaningFee(pricing.cleaning_fee)
      }

      const { data: seasonal } = await supabase
        .from("seasonal_pricing")
        .select("*")
        .eq("property_id", id)
        .order("start_date")

      if (seasonal) setSeasonalPricing(seasonal)
    }
    fetchPricing()
  }, [id, supabase])

  async function handleSave() {
    setLoading(true)
    try {
      // Upsert base pricing
      const { error: pricingError } = await supabase.from("pricing").upsert(
        {
          property_id: id,
          base_price: basePrice,
          cleaning_fee: cleaningFee,
          currency: "EUR",
        },
        { onConflict: "property_id" }
      )

      if (pricingError) {
        toast.error("Erreur lors de la sauvegarde des tarifs de base")
        return
      }

      // Delete all seasonal and re-insert
      const { error: deleteError } = await supabase
        .from("seasonal_pricing")
        .delete()
        .eq("property_id", id)

      if (deleteError) {
        toast.error("Erreur lors de la mise à jour des tarifs saisonniers")
        return
      }

      if (seasonalPricing.length > 0) {
        const { error: insertError } = await supabase
          .from("seasonal_pricing")
          .insert(
            seasonalPricing.map((sp) => ({
              property_id: id,
              start_date: sp.start_date,
              end_date: sp.end_date,
              price_per_night: sp.price_per_night,
            }))
          )

        if (insertError) {
          toast.error("Erreur lors de l'ajout des tarifs saisonniers")
          return
        }
      }

      toast.success("Tarifs mis à jour")
      router.push(`/properties/${id}`)
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Tarification</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarif de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix par nuit (EUR)</Label>
              <Input
                type="number"
                min={1}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Frais de ménage (EUR)</Label>
              <Input
                type="number"
                min={0}
                value={cleaningFee}
                onChange={(e) => setCleaningFee(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tarifs saisonniers</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSeasonalPricing((prev) => [
                ...prev,
                { start_date: "", end_date: "", price_per_night: basePrice },
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {seasonalPricing.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun tarif saisonnier. Le tarif de base sera appliqué toute
              l&apos;année.
            </p>
          ) : (
            <div className="space-y-4">
              {seasonalPricing.map((sp, i) => (
                <div key={i} className="flex items-end gap-3 p-3 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Label>Du</Label>
                    <Input
                      type="date"
                      value={sp.start_date}
                      onChange={(e) => {
                        const updated = [...seasonalPricing]
                        updated[i].start_date = e.target.value
                        setSeasonalPricing(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Au</Label>
                    <Input
                      type="date"
                      value={sp.end_date}
                      onChange={(e) => {
                        const updated = [...seasonalPricing]
                        updated[i].end_date = e.target.value
                        setSeasonalPricing(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Prix/nuit</Label>
                    <Input
                      type="number"
                      min={1}
                      value={sp.price_per_night}
                      onChange={(e) => {
                        const updated = [...seasonalPricing]
                        updated[i].price_per_night = Number(e.target.value)
                        setSeasonalPricing(updated)
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSeasonalPricing((prev) =>
                        prev.filter((_, j) => j !== i)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les tarifs
        </Button>
      </div>
    </div>
  )
}
