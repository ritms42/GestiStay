"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BotMessageSquare,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarClock,
  DoorOpen,
  LogOut,
} from "lucide-react"

interface AutoMessage {
  id: string
  host_id: string
  property_id: string | null
  trigger_type: "pre_arrival" | "check_in_day" | "post_checkout"
  days_offset: number
  message_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PropertyOption {
  id: string
  title: string
}

const TRIGGER_LABELS: Record<string, { label: string; description: string; icon: typeof CalendarClock }> = {
  pre_arrival: {
    label: "Pré-arrivée",
    description: "Envoyé X jours avant le check-in",
    icon: CalendarClock,
  },
  check_in_day: {
    label: "Jour du check-in",
    description: "Envoyé le jour du check-in",
    icon: DoorOpen,
  },
  post_checkout: {
    label: "Après le départ",
    description: "Envoyé le lendemain du check-out",
    icon: LogOut,
  },
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  pre_arrival:
    "Bonjour {{guest_name}},\n\nVotre séjour à {{property_name}} approche ! Voici quelques informations pratiques pour préparer votre arrivée.\n\nAdresse : {{address}}\nCheck-in : {{check_in_time}}\n\nN'hésitez pas à me contacter si vous avez des questions.\n\nCordialement,\n{{host_name}}",
  check_in_day:
    "Bonjour {{guest_name}},\n\nBienvenue ! Votre logement {{property_name}} est prêt pour vous accueillir.\n\nPour le check-in, voici les informations :\n- Heure d'arrivée : {{check_in_time}}\n- Adresse : {{address}}\n\nBon séjour !\n{{host_name}}",
  post_checkout:
    "Bonjour {{guest_name}},\n\nMerci d'avoir séjourné à {{property_name}} ! J'espère que vous avez passé un excellent séjour.\n\nSi vous avez apprécié votre expérience, un avis serait grandement apprécié.\n\nÀ bientôt !\n{{host_name}}",
}

export function AutoMessages() {
  const supabase = createClient()
  const [messages, setMessages] = useState<AutoMessage[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return
    setUserId(user.id)

    const [messagesRes, propertiesRes] = await Promise.all([
      supabase
        .from("auto_messages")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("properties")
        .select("id, title")
        .eq("host_id", user.id)
        .order("title"),
    ])

    setMessages(messagesRes.data || [])
    setProperties(propertiesRes.data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function addTemplate(triggerType: string) {
    if (!userId) return

    const { data, error } = await supabase
      .from("auto_messages")
      .insert({
        host_id: userId,
        trigger_type: triggerType,
        days_offset: triggerType === "pre_arrival" ? 1 : 0,
        message_template: DEFAULT_TEMPLATES[triggerType] || "",
        is_active: true,
      })
      .select()
      .single()

    if (data && !error) {
      setMessages((prev) => [...prev, data])
    }
  }

  async function updateMessage(id: string, updates: Partial<AutoMessage>) {
    setSaving(id)
    await supabase.from("auto_messages").update(updates).eq("id", id)
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
    setSaving(null)
  }

  async function deleteMessage(id: string) {
    await supabase.from("auto_messages").delete().eq("id", id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  function updateLocal(id: string, updates: Partial<AutoMessage>) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with add buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TRIGGER_LABELS).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => addTemplate(key)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <Icon className="h-4 w-4 mr-1" />
              {config.label}
            </Button>
          )
        })}
      </div>

      {/* Message templates list */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BotMessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              Aucun message automatique
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Configurez des messages automatiques pour vos voyageurs : avant
              l&apos;arrivée, le jour du check-in, et après le départ.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const triggerConfig = TRIGGER_LABELS[msg.trigger_type]
            const TriggerIcon = triggerConfig?.icon || CalendarClock

            return (
              <Card key={msg.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TriggerIcon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">
                          {triggerConfig?.label || msg.trigger_type}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {triggerConfig?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${msg.id}`} className="text-xs">
                          Actif
                        </Label>
                        <Switch
                          id={`active-${msg.id}`}
                          checked={msg.is_active}
                          onCheckedChange={(checked) =>
                            updateMessage(msg.id, { is_active: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Property selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Propriété</Label>
                      <Select
                        value={msg.property_id || "all"}
                        onValueChange={(val) =>
                          updateLocal(msg.id, {
                            property_id: val === "all" ? null : val,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les propriétés" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Toutes les propriétés
                          </SelectItem>
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timing */}
                    {msg.trigger_type === "pre_arrival" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Jours avant le check-in
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={msg.days_offset}
                          onChange={(e) =>
                            updateLocal(msg.id, {
                              days_offset: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Message template */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      rows={6}
                      value={msg.message_template}
                      onChange={(e) =>
                        updateLocal(msg.id, {
                          message_template: e.target.value,
                        })
                      }
                      placeholder="Votre message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables disponibles : {"{{guest_name}}"},{" "}
                      {"{{property_name}}"}, {"{{address}}"},{" "}
                      {"{{check_in_time}}"}, {"{{check_out_time}}"},{" "}
                      {"{{host_name}}"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateMessage(msg.id, {
                          message_template: msg.message_template,
                          days_offset: msg.days_offset,
                          property_id: msg.property_id,
                        })
                      }
                      disabled={saving === msg.id}
                    >
                      {saving === msg.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
