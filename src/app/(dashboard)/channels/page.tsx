"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Loader2,
  Plus,
  Copy,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import type { Property, Channel, ChannelType } from "@/types"

interface PropertyWithChannels extends Property {
  channels: Channel[]
}

export default function ChannelsPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<PropertyWithChannels[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  // Add channel form state
  const [newPropertyId, setNewPropertyId] = useState("")
  const [newType, setNewType] = useState<ChannelType>("airbnb")
  const [newName, setNewName] = useState("")
  const [newImportUrl, setNewImportUrl] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: props } = await supabase
        .from("properties")
        .select("id, title, host_id")
        .eq("host_id", user.id)

      const propertyIds = (props || []).map((p) => p.id)

      let channels: Channel[] = []
      if (propertyIds.length > 0) {
        const { data: ch } = await supabase
          .from("channels")
          .select("*")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
        channels = (ch as Channel[]) || []
      }

      const merged: PropertyWithChannels[] = (props || []).map((p) => ({
        ...(p as Property),
        channels: channels.filter((c) => c.property_id === p.id),
      }))
      setProperties(merged)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleCreate() {
    if (!newPropertyId || !newName.trim()) {
      toast.error("Sélectionnez un bien et saisissez un nom")
      return
    }
    setCreating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("channels").insert({
        property_id: newPropertyId,
        host_id: user.id,
        type: newType,
        name: newName.trim(),
        ical_import_url: newImportUrl.trim() || null,
      })
      if (error) throw error
      toast.success("Canal ajouté !")
      setAddOpen(false)
      setNewPropertyId("")
      setNewType("airbnb")
      setNewName("")
      setNewImportUrl("")
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la création")
    } finally {
      setCreating(false)
    }
  }

  async function handleSync(channelId: string) {
    setSyncingId(channelId)
    try {
      const res = await fetch(`/api/channels/${channelId}/sync`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Échec de la synchronisation")
      toast.success(`Synchronisé : ${json.events_count} événement(s)`)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur"
      toast.error(msg)
    } finally {
      setSyncingId(null)
    }
  }

  async function handleToggleAutoSync(channel: Channel) {
    const { error } = await supabase
      .from("channels")
      .update({ auto_sync_enabled: !channel.auto_sync_enabled })
      .eq("id", channel.id)
    if (error) {
      toast.error("Erreur")
      return
    }
    fetchData()
  }

  async function handleDelete(channelId: string) {
    if (!confirm("Supprimer ce canal ? Cette action est irréversible.")) return
    const { error } = await supabase.from("channels").delete().eq("id", channelId)
    if (error) {
      toast.error("Erreur lors de la suppression")
      return
    }
    toast.success("Canal supprimé")
    fetchData()
  }

  function exportUrl(channel: Channel): string {
    const origin =
      typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/api/channels/${channel.id}/export?token=${channel.ical_export_token}`
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("URL copiée !")
    } catch {
      toast.error("Impossible de copier")
    }
  }

  function typeLabel(t: ChannelType): string {
    if (t === "airbnb") return "Airbnb"
    if (t === "booking") return "Booking.com"
    if (t === "vrbo") return "VRBO"
    return "Autre"
  }

  function statusBadge(channel: Channel) {
    if (!channel.ical_import_url) {
      return <Badge variant="outline">Export uniquement</Badge>
    }
    if (channel.last_import_status === "success") {
      return (
        <Badge variant="default">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Synchronisé
        </Badge>
      )
    }
    if (channel.last_import_status === "error") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Erreur
        </Badge>
      )
    }
    if (channel.last_import_status === "syncing") {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          En cours
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    )
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return "Jamais"
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-7 w-7 text-primary" />
            Channel Manager
          </h1>
          <p className="text-muted-foreground">
            Synchronisez vos disponibilités avec Airbnb, Booking et autres
            plateformes
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un canal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau canal</DialogTitle>
              <DialogDescription>
                Connectez un bien à une plateforme externe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bien</Label>
                <Select
                  value={newPropertyId}
                  onValueChange={(v) => setNewPropertyId(v || "")}
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
                <Label>Plateforme</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as ChannelType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="booking">Booking.com</SelectItem>
                    <SelectItem value="vrbo">VRBO</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Mon appart sur Airbnb"
                />
              </div>
              <div className="space-y-2">
                <Label>URL d&apos;import iCal (optionnel)</Label>
                <Input
                  value={newImportUrl}
                  onChange={(e) => setNewImportUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide si vous voulez uniquement exporter votre
                  calendrier vers cette plateforme.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aucun bien trouvé. Créez d&apos;abord un bien pour le connecter à
            un canal.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
                <CardDescription>
                  {p.channels.length} canal
                  {p.channels.length !== 1 ? "aux" : ""} connecté
                  {p.channels.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.channels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun canal connecté pour ce bien.
                  </p>
                ) : (
                  p.channels.map((c) => {
                    const url = exportUrl(c)
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{c.name}</span>
                              <Badge variant="outline">
                                {typeLabel(c.type)}
                              </Badge>
                              {statusBadge(c)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Dernière sync : {fmtDate(c.last_import_at)}
                              {c.last_import_events_count > 0 &&
                                ` · ${c.last_import_events_count} événement(s)`}
                            </p>
                            {c.last_import_error && (
                              <p className="text-xs text-destructive mt-1">
                                {c.last_import_error}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Auto-sync</Label>
                            <Switch
                              checked={c.auto_sync_enabled}
                              onCheckedChange={() => handleToggleAutoSync(c)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">URL d&apos;export</Label>
                          <div className="flex gap-2">
                            <Input readOnly value={url} className="text-xs" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyUrl(url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {c.ical_import_url && (
                            <Button
                              size="sm"
                              onClick={() => handleSync(c.id)}
                              disabled={syncingId === c.id}
                            >
                              {syncingId === c.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Synchroniser maintenant
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          ))}
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
            <strong className="text-foreground">
              Pour synchroniser avec Airbnb :
            </strong>{" "}
            copiez votre URL d&apos;export GestiStay et collez-la dans Airbnb
            &gt; Disponibilités &gt; Synchroniser les calendriers.
          </p>
          <p>
            <strong className="text-foreground">
              Pour importer d&apos;Airbnb :
            </strong>{" "}
            copiez l&apos;URL iCal depuis Airbnb et collez-la dans &laquo; URL
            d&apos;import iCal &raquo; ci-dessous.
          </p>
          <p>
            <strong className="text-foreground">Booking.com :</strong> même
            principe via Extranet &gt; Calendrier &gt; Synchroniser.
          </p>
          <p>
            La synchronisation iCal n&apos;est pas instantanée : les
            plateformes rafraîchissent typiquement toutes les 2 à 4 heures.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
