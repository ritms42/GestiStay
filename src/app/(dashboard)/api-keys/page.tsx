"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Key, Plus, Trash2, Copy, Loader2, Code, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import crypto from "crypto"

export default function ApiKeysPage() {
  const supabase = createClient()
  const [apiKeys, setApiKeys] = useState<Record<string, unknown>[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyPermissions, setNewKeyPermissions] = useState({
    read: true,
    write: false,
  })
  const [loading, setLoading] = useState(false)
  const [generatedKey, setGeneratedKey] = useState("")

  const fetchKeys = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setApiKeys(data || [])
  }, [supabase])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function createApiKey() {
    if (!newKeyName.trim()) {
      toast.error("Donnez un nom à votre clé API")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Generate API key
      const rawKey = `gs_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`
      const keyPrefix = rawKey.substring(0, 12) + "..."

      // Hash the key for storage
      const encoder = new TextEncoder()
      const data = encoder.encode(rawKey)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const keyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      const permissions = []
      if (newKeyPermissions.read) permissions.push("read")
      if (newKeyPermissions.write) permissions.push("write")

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: newKeyName,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
      })

      if (error) throw error

      setGeneratedKey(rawKey)
      toast.success("Clé API créée")
      fetchKeys()
    } catch (err) {
      toast.error("Erreur lors de la création")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id)
    toast.success("Clé API supprimée")
    fetchKeys()
  }

  async function toggleKey(id: string, isActive: boolean) {
    await supabase.from("api_keys").update({ is_active: isActive }).eq("id", id)
    fetchKeys()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copié dans le presse-papier")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API</h1>
          <p className="text-muted-foreground">
            Gérez vos clés API pour l&apos;intégration
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            setDialogOpen(v)
            if (!v) {
              setGeneratedKey("")
              setNewKeyName("")
            }
          }}
        >
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle clé API
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {generatedKey ? "Clé API créée" : "Créer une clé API"}
              </DialogTitle>
            </DialogHeader>

            {generatedKey ? (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Copiez cette clé maintenant. Elle ne sera plus visible
                    ensuite.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
                      {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setDialogOpen(false)
                    setGeneratedKey("")
                    setNewKeyName("")
                  }}
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nom de la clé *</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ex: Mon site web, Channel manager..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lecture (GET)</span>
                    <Switch
                      checked={newKeyPermissions.read}
                      onCheckedChange={(v) =>
                        setNewKeyPermissions({
                          ...newKeyPermissions,
                          read: v,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Écriture (POST/PUT/DELETE)</span>
                    <Switch
                      checked={newKeyPermissions.write}
                      onCheckedChange={(v) =>
                        setNewKeyPermissions({
                          ...newKeyPermissions,
                          write: v,
                        })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={createApiKey}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Générer la clé API
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Documentation snippet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentation rapide
          </CardTitle>
          <CardDescription>
            Utilisez vos clés API pour accéder aux endpoints REST
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
            <p className="text-muted-foreground"># Lister vos biens</p>
            <p>
              curl -H &quot;x-api-key: gs_votre_cle&quot; \
            </p>
            <p className="pl-4">
              {typeof window !== "undefined"
                ? window.location.origin
                : "https://gestistay.com"}
              /api/v1/properties
            </p>
            <br />
            <p className="text-muted-foreground"># Endpoints disponibles</p>
            <p>GET &nbsp;/api/v1/properties</p>
            <p>POST /api/v1/properties</p>
            <p>GET &nbsp;/api/v1/bookings</p>
            <p>GET &nbsp;/api/v1/availability?property_id=xxx</p>
            <p>PUT &nbsp;/api/v1/availability</p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys list */}
      {apiKeys.length > 0 ? (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.id as string}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{key.name as string}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {key.key_prefix as string}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {(key.permissions as string[])?.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(key.last_used_at as string) && (
                    <span className="text-xs text-muted-foreground">
                      Utilisée{" "}
                      {new Date(key.last_used_at as string).toLocaleDateString(
                        "fr-FR"
                      )}
                    </span>
                  )}
                  <Switch
                    checked={key.is_active as boolean}
                    onCheckedChange={(v) =>
                      toggleKey(key.id as string, v)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteKey(key.id as string)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg bg-muted/30">
          <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Aucune clé API</h2>
          <p className="text-muted-foreground">
            Créez une clé API pour intégrer GestiStay avec vos outils
          </p>
        </div>
      )}
    </div>
  )
}
