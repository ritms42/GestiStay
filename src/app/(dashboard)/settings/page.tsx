"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, ShieldCheck, ShieldAlert, Clock, ShieldX } from "lucide-react"
import { toast } from "sonner"
import type { KycStatus } from "@/types"

const kycConfig: Record<
  KycStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof ShieldCheck }
> = {
  none: { label: "Non v\u00e9rifi\u00e9", variant: "outline", icon: ShieldAlert },
  pending: { label: "En cours de v\u00e9rification", variant: "secondary", icon: Clock },
  verified: { label: "V\u00e9rifi\u00e9", variant: "default", icon: ShieldCheck },
  rejected: { label: "Refus\u00e9", variant: "destructive", icon: ShieldX },
}

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [kycUploading, setKycUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    kyc_status: "none" as KycStatus,
    kyc_document_url: null as string | null,
    kyc_verified_at: null as string | null,
    kyc_rejection_reason: null as string | null,
  })

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, phone, kyc_status, kyc_document_url, kyc_verified_at, kyc_rejection_reason"
        )
        .eq("id", user.id)
        .single()
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          kyc_status: (data.kyc_status as KycStatus) || "none",
          kyc_document_url: data.kyc_document_url,
          kyc_verified_at: data.kyc_verified_at,
          kyc_rejection_reason: data.kyc_rejection_reason,
        })
      }
    }
    fetchProfile()
  }, [supabase])

  async function handleSave() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", user.id)

      toast.success("Profil mis \u00e0 jour")
    } catch {
      toast.error("Erreur lors de la mise \u00e0 jour")
    } finally {
      setLoading(false)
    }
  }

  async function handleKycUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("Le fichier ne doit pas d\u00e9passer 10 Mo")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format accept\u00e9 : JPG, PNG ou PDF")
      return
    }

    setKycUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connect\u00e9")

      const ext = file.name.split(".").pop()
      const fileName = `kyc/${user.id}/document_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          kyc_status: "pending",
          kyc_document_url: publicUrl,
          kyc_rejection_reason: null,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      setProfile((prev) => ({
        ...prev,
        kyc_status: "pending",
        kyc_document_url: publicUrl,
        kyc_rejection_reason: null,
      }))

      toast.success("Document envoy\u00e9. V\u00e9rification en cours.")
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l\u2019envoi du document")
    } finally {
      setKycUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const kyc = kycConfig[profile.kyc_status]
  const KycIcon = kyc.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Param\u00e8tres</h1>
        <p className="text-muted-foreground">
          G\u00e9rez votre profil et vos pr\u00e9f\u00e9rences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input
              value={profile.full_name}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas \u00eatre modifi\u00e9
            </p>
          </div>
          <div className="space-y-2">
            <Label>T\u00e9l\u00e9phone</Label>
            <Input
              value={profile.phone || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* KYC Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>V\u00e9rification d&apos;identit\u00e9</span>
            <Badge variant={kyc.variant}>
              <KycIcon className="h-3 w-3 mr-1" />
              {kyc.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.kyc_status === "verified" ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Identit\u00e9 v\u00e9rifi\u00e9e
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Votre pi\u00e8ce d&apos;identit\u00e9 a \u00e9t\u00e9 valid\u00e9e.
                  {profile.kyc_verified_at && (
                    <>
                      {" "}
                      V\u00e9rifi\u00e9e le{" "}
                      {new Date(profile.kyc_verified_at).toLocaleDateString(
                        "fr-FR"
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : profile.kyc_status === "pending" ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  V\u00e9rification en cours
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Votre document est en cours d&apos;examen. Cela peut prendre 24 \u00e0
                  48 heures.
                </p>
              </div>
            </div>
          ) : (
            <>
              {profile.kyc_status === "rejected" &&
                profile.kyc_rejection_reason && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <ShieldX className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        Document refus\u00e9
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profile.kyc_rejection_reason}
                      </p>
                    </div>
                  </div>
                )}

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envoyez une pi\u00e8ce d&apos;identit\u00e9 (carte d&apos;identit\u00e9, passeport ou
                  permis de conduire) pour v\u00e9rifier votre profil. Les voyageurs
                  font davantage confiance aux h\u00f4tes v\u00e9rifi\u00e9s.
                </p>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleKycUpload}
                    className="hidden"
                    id="kyc-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={kycUploading}
                  >
                    {kycUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {profile.kyc_status === "rejected"
                      ? "Renvoyer un document"
                      : "Envoyer un document"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats accept\u00e9s : JPG, PNG, PDF. Taille max : 10 Mo.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
