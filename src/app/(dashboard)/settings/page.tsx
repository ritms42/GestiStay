"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, ShieldCheck, ShieldAlert, Clock, ShieldX, KeyRound } from "lucide-react"
import { toast } from "sonner"
import type { KycStatus } from "@/types"

const kycConfig: Record<
  KycStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof ShieldCheck }
> = {
  none: { label: "Non vérifié", variant: "outline", icon: ShieldAlert },
  pending: { label: "En cours de vérification", variant: "secondary", icon: Clock },
  verified: { label: "Vérifié", variant: "default", icon: ShieldCheck },
  rejected: { label: "Refusé", variant: "destructive", icon: ShieldX },
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

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnrolling, setMfaEnrolling] = useState(false)
  const [mfaTotpUri, setMfaTotpUri] = useState<string | null>(null)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaVerifyCode, setMfaVerifyCode] = useState("")
  const [mfaChecking, setMfaChecking] = useState(true)

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

    async function checkMfaStatus() {
      setMfaChecking(true)
      const { data } = await supabase.auth.mfa.listFactors()
      const verifiedFactor = data?.totp?.find((f) => f.status === "verified")
      setMfaEnabled(!!verifiedFactor)
      if (verifiedFactor) {
        setMfaFactorId(verifiedFactor.id)
      }
      setMfaChecking(false)
    }

    fetchProfile()
    checkMfaStatus()
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

      toast.success("Profil mis à jour")
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  async function handleKycUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format accepté : JPG, PNG ou PDF")
      return
    }

    setKycUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté")

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

      toast.success("Document envoyé. Vérification en cours.")
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l\u2019envoi du document")
    } finally {
      setKycUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleMfaEnroll() {
    setMfaLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      })

      if (error) {
        toast.error("Erreur lors de l'activation de la 2FA")
        return
      }

      setMfaTotpUri(data.totp.uri)
      setMfaFactorId(data.id)
      setMfaEnrolling(true)
    } catch {
      toast.error("Erreur lors de l'activation de la 2FA")
    } finally {
      setMfaLoading(false)
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault()

    if (!mfaFactorId || mfaVerifyCode.length !== 6) {
      toast.error("Veuillez entrer un code à 6 chiffres")
      return
    }

    setMfaLoading(true)
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: mfaFactorId })

      if (challengeError) {
        toast.error("Erreur lors de la vérification")
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaVerifyCode,
      })

      if (verifyError) {
        toast.error("Code invalide")
        return
      }

      setMfaEnabled(true)
      setMfaEnrolling(false)
      setMfaTotpUri(null)
      setMfaVerifyCode("")
      toast.success("Double authentification activée")
    } catch {
      toast.error("Erreur lors de la vérification")
    } finally {
      setMfaLoading(false)
    }
  }

  async function handleMfaUnenroll() {
    if (!mfaFactorId) return

    setMfaLoading(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactorId,
      })

      if (error) {
        toast.error("Erreur lors de la désactivation de la 2FA")
        return
      }

      setMfaEnabled(false)
      setMfaFactorId(null)
      toast.success("Double authentification désactivée")
    } catch {
      toast.error("Erreur lors de la désactivation de la 2FA")
    } finally {
      setMfaLoading(false)
    }
  }

  const kyc = kycConfig[profile.kyc_status]
  const KycIcon = kyc.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
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
              L&apos;email ne peut pas être modifié
            </p>
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
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

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Activer la double authentification
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte avec une
            application d&apos;authentification (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaChecking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : mfaEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <ShieldCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Double authentification activée
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Votre compte est protégé par la vérification en deux étapes.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleMfaUnenroll}
                disabled={mfaLoading}
              >
                {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Désactiver la 2FA
              </Button>
            </div>
          ) : mfaEnrolling ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  1. Scannez ce code ou copiez l&apos;URI dans votre application
                  d&apos;authentification :
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-xs break-all select-all">
                    {mfaTotpUri}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  2. Entrez le code à 6 chiffres généré par l&apos;application :
                </p>
                <form onSubmit={handleMfaVerify} className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaVerifyCode}
                    onChange={(e) =>
                      setMfaVerifyCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    className="max-w-[160px]"
                  />
                  <Button type="submit" disabled={mfaLoading}>
                    {mfaLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Vérifier
                  </Button>
                </form>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setMfaEnrolling(false)
                  setMfaTotpUri(null)
                  setMfaVerifyCode("")
                }}
              >
                Annuler
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <ShieldAlert className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Double authentification désactivée
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Nous recommandons d&apos;activer la 2FA pour sécuriser votre
                    compte.
                  </p>
                </div>
              </div>
              <Button onClick={handleMfaEnroll} disabled={mfaLoading}>
                {mfaLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Activer la 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vérification d&apos;identité</span>
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
                  Identité vérifiée
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Votre pièce d&apos;identité a été validée.
                  {profile.kyc_verified_at && (
                    <>
                      {" "}
                      Vérifiée le{" "}
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
                  Vérification en cours
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Votre document est en cours d&apos;examen. Cela peut prendre 24 à
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
                        Document refusé
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {profile.kyc_rejection_reason}
                      </p>
                    </div>
                  </div>
                )}

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envoyez une pièce d&apos;identité (carte d&apos;identité, passeport ou
                  permis de conduire) pour vérifier votre profil. Les voyageurs
                  font davantage confiance aux hôtes vérifiés.
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
                  Formats acceptés : JPG, PNG, PDF. Taille max : 10 Mo.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
