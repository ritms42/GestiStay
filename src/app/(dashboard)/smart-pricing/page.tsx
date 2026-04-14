"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Info, Save } from "lucide-react"
import { toast } from "sonner"
import type { Property, PricingRule } from "@/types"
import {
  computeSmartPrice,
  type PricingRule as EngineRule,
} from "@/lib/pricing/smart-pricing"

type RuleForm = Omit<
  PricingRule,
  "id" | "property_id" | "host_id" | "created_at" | "updated_at"
>

const DEFAULT_RULE: RuleForm = {
  enabled: true,
  min_price: 50,
  max_price: 500,
  weekend_uplift_percent: 15,
  last_minute_days: 7,
  last_minute_discount_percent: 10,
  early_bird_days: 60,
  early_bird_discount_percent: 5,
  weekly_discount_percent: 10,
  monthly_discount_percent: 25,
  high_demand_threshold_percent: 80,
  high_demand_uplift_percent: 15,
  gap_night_discount_percent: 10,
}

export default function SmartPricingPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [basePrice, setBasePrice] = useState<number>(100)
  const [rule, setRule] = useState<RuleForm>(DEFAULT_RULE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingRuleId, setExistingRuleId] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("properties")
      .select("id, title")
      .eq("host_id", user.id)

    setProperties((data as Property[]) || [])
  }, [supabase])

  const fetchRuleForProperty = useCallback(
    async (propertyId: string) => {
      setLoading(true)
      try {
        const [{ data: pricingRow }, { data: ruleRow }] = await Promise.all([
          supabase
            .from("pricing")
            .select("base_price")
            .eq("property_id", propertyId)
            .maybeSingle(),
          supabase
            .from("pricing_rules")
            .select("*")
            .eq("property_id", propertyId)
            .maybeSingle(),
        ])

        if (pricingRow?.base_price) {
          setBasePrice(Number(pricingRow.base_price))
        } else {
          setBasePrice(100)
        }

        if (ruleRow) {
          const r = ruleRow as PricingRule
          setExistingRuleId(r.id)
          setRule({
            enabled: r.enabled,
            min_price: Number(r.min_price),
            max_price: Number(r.max_price),
            weekend_uplift_percent: Number(r.weekend_uplift_percent),
            last_minute_days: Number(r.last_minute_days),
            last_minute_discount_percent: Number(
              r.last_minute_discount_percent
            ),
            early_bird_days: Number(r.early_bird_days),
            early_bird_discount_percent: Number(r.early_bird_discount_percent),
            weekly_discount_percent: Number(r.weekly_discount_percent),
            monthly_discount_percent: Number(r.monthly_discount_percent),
            high_demand_threshold_percent: Number(
              r.high_demand_threshold_percent
            ),
            high_demand_uplift_percent: Number(r.high_demand_uplift_percent),
            gap_night_discount_percent: Number(r.gap_night_discount_percent),
          })
        } else {
          setExistingRuleId(null)
          setRule(DEFAULT_RULE)
        }
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    if (selectedPropertyId) fetchRuleForProperty(selectedPropertyId)
  }, [selectedPropertyId, fetchRuleForProperty])

  async function saveRule() {
    if (!selectedPropertyId) {
      toast.error("Sélectionnez un bien")
      return
    }
    if (rule.min_price >= rule.max_price) {
      toast.error("Le prix minimum doit être inférieur au prix maximum")
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        property_id: selectedPropertyId,
        host_id: user.id,
        ...rule,
      }

      const { error } = await supabase
        .from("pricing_rules")
        .upsert(payload, { onConflict: "property_id" })
        .select()
        .single()

      if (error) throw error

      toast.success("Règles enregistrées !")
      fetchRuleForProperty(selectedPropertyId)
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // Live preview: next 14 nights
  const preview = useMemo(() => {
    const engineRule: EngineRule = rule
    const now = new Date()
    const rows: Array<{
      date: Date
      result: ReturnType<typeof computeSmartPrice>
    }> = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      const result = computeSmartPrice(basePrice, engineRule, {
        date: d,
        bookingLeadDays: i,
        nights: 1,
      })
      rows.push({ date: d, result })
    }
    return rows
  }, [rule, basePrice])

  function fmtDate(d: Date) {
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Smart Pricing
          </h1>
          <p className="text-muted-foreground">
            Ajustez automatiquement vos tarifs selon la demande
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bien</CardTitle>
          <CardDescription>
            Sélectionnez le bien à configurer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bien</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={(v) => setSelectedPropertyId(v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prix de base (€/nuit)</Label>
              <Input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                disabled={!selectedPropertyId}
              />
              <p className="text-xs text-muted-foreground">
                Modifiable depuis la page Tarifs du bien
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPropertyId && !loading && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Règles tarifaires</CardTitle>
                <CardDescription>
                  Activez ou désactivez chaque ajustement
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled">
                  {rule.enabled ? "Activé" : "Désactivé"}
                </Label>
                <Switch
                  id="enabled"
                  checked={rule.enabled}
                  onCheckedChange={(v) => setRule({ ...rule, enabled: v })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix minimum (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rule.min_price}
                    onChange={(e) =>
                      setRule({ ...rule, min_price: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix maximum (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rule.max_price}
                    onChange={(e) =>
                      setRule({ ...rule, max_price: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Majoration week-end (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.weekend_uplift_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        weekend_uplift_percent: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Appliquée le vendredi et samedi
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Seuil forte demande (% occ.)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.high_demand_threshold_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        high_demand_threshold_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Majoration forte demande (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.high_demand_uplift_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        high_demand_uplift_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remise nuit isolée (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.gap_night_discount_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        gap_night_discount_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dernière minute (jours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rule.last_minute_days}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        last_minute_days: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remise dernière minute (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.last_minute_discount_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        last_minute_discount_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Réservation anticipée (jours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rule.early_bird_days}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        early_bird_days: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remise anticipée (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.early_bird_discount_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        early_bird_discount_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Remise séjour semaine (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.weekly_discount_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        weekly_discount_percent: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    À partir de 7 nuits
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Remise séjour mensuel (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.monthly_discount_percent}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        monthly_discount_percent: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    À partir de 28 nuits
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveRule} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {existingRuleId ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu des 14 prochaines nuits</CardTitle>
              <CardDescription>
                Prix calculés dynamiquement selon vos règles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prix de base</TableHead>
                      <TableHead>Prix final</TableHead>
                      <TableHead>Ajustements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{fmtDate(row.date)}</TableCell>
                        <TableCell>{row.result.basePrice.toFixed(2)} €</TableCell>
                        <TableCell className="font-semibold">
                          {row.result.finalPrice.toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.result.factors.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                Aucun
                              </span>
                            ) : (
                              row.result.factors.map((f, j) => (
                                <Badge
                                  key={j}
                                  variant={
                                    f.adjustment >= 0 ? "default" : "secondary"
                                  }
                                >
                                  {f.description}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Comment ça marche
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Week-end :</strong> majoration
            automatique les vendredis et samedis.
          </p>
          <p>
            <strong className="text-foreground">Dernière minute :</strong>{" "}
            remise pour les réservations faites à quelques jours du check-in.
          </p>
          <p>
            <strong className="text-foreground">Anticipée :</strong> remise
            pour les réservations faites bien à l&apos;avance.
          </p>
          <p>
            <strong className="text-foreground">Séjour semaine / mensuel :</strong>{" "}
            remise automatique pour les longs séjours (7+ et 28+ nuits).
          </p>
          <p>
            <strong className="text-foreground">Forte demande :</strong>{" "}
            majoration si le taux d&apos;occupation dépasse le seuil défini.
          </p>
          <p>
            <strong className="text-foreground">Nuit isolée :</strong> remise
            pour les nuits seules entre deux réservations.
          </p>
          <p>
            <strong className="text-foreground">Plancher / Plafond :</strong>{" "}
            le prix final est toujours borné entre min et max.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
