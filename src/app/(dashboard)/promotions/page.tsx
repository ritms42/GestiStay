"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Tag, Trash2, Loader2, Percent } from "lucide-react"
import { toast } from "sonner"
import type { Promotion, Property } from "@/types"

const PROMO_TYPES = [
  { value: "percentage", label: "Pourcentage (%)" },
  { value: "fixed", label: "Montant fixe (€)" },
  { value: "early_bird", label: "Réservation anticipée" },
  { value: "last_minute", label: "Dernière minute" },
  { value: "weekly", label: "Réduction semaine" },
  { value: "monthly", label: "Réduction mois" },
]

export default function PromotionsPage() {
  const supabase = createClient()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    property_id: "",
    name: "",
    type: "percentage" as Promotion["type"],
    discount_value: 10,
    min_nights: 1,
    start_date: "",
    end_date: "",
    promo_code: "",
  })

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: promos }, { data: props }] = await Promise.all([
      supabase
        .from("promotions")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("id, title")
        .eq("host_id", user.id),
    ])

    setPromotions((promos as Promotion[]) || [])
    setProperties((props as Property[]) || [])
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function createPromotion() {
    if (!form.property_id || !form.name) {
      toast.error("Remplissez les champs obligatoires")
      return
    }
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("promotions").insert({
        ...form,
        host_id: user.id,
        promo_code: form.promo_code || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })

      if (error) throw error

      toast.success("Promotion créée !")
      setDialogOpen(false)
      setForm({
        property_id: "",
        name: "",
        type: "percentage",
        discount_value: 10,
        min_nights: 1,
        start_date: "",
        end_date: "",
        promo_code: "",
      })
      fetchData()
    } catch (err) {
      toast.error("Erreur lors de la création")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function togglePromotion(id: string, isActive: boolean) {
    await supabase
      .from("promotions")
      .update({ is_active: isActive })
      .eq("id", id)
    fetchData()
  }

  async function deletePromotion(id: string) {
    await supabase.from("promotions").delete().eq("id", id)
    toast.success("Promotion supprimée")
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">
            Gérez vos offres et réductions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle promotion
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Bien *</Label>
                <Select
                  value={form.property_id}
                  onValueChange={(v) =>
                    setForm({ ...form, property_id: v || "" })
                  }
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
                <Label>Nom de la promotion *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Ex: -20% réservation anticipée"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        type: v as Promotion["type"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMO_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Réduction{" "}
                    {form.type === "percentage" ? "(%)" : "(€)"}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_value: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nuits minimum</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.min_nights}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      min_nights: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Code promo (optionnel)</Label>
                <Input
                  value={form.promo_code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      promo_code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="EX: SUMMER2026"
                />
              </div>

              <Button
                onClick={createPromotion}
                disabled={loading}
                className="w-full"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Créer la promotion
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {promotions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{promo.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {properties.find((p) => p.id === promo.property_id)
                      ?.title || "Bien supprimé"}
                  </p>
                </div>
                <Switch
                  checked={promo.is_active}
                  onCheckedChange={(v) => togglePromotion(promo.id, v)}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={promo.is_active ? "default" : "secondary"}
                  >
                    {promo.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    <Percent className="h-3 w-3 mr-1" />
                    {promo.type === "percentage"
                      ? `${promo.discount_value}%`
                      : `${promo.discount_value}€`}
                  </Badge>
                  {promo.min_nights > 1 && (
                    <Badge variant="outline">
                      Min {promo.min_nights} nuits
                    </Badge>
                  )}
                </div>

                {promo.promo_code && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      {promo.promo_code}
                    </code>
                  </div>
                )}

                {(promo.start_date || promo.end_date) && (
                  <p className="text-xs text-muted-foreground">
                    {promo.start_date && `Du ${promo.start_date}`}
                    {promo.end_date && ` au ${promo.end_date}`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Utilisée {promo.usage_count} fois
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deletePromotion(promo.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/30">
          <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Aucune promotion</h2>
          <p className="text-muted-foreground mb-6">
            Créez des promotions pour attirer plus de voyageurs
          </p>
        </div>
      )}
    </div>
  )
}
