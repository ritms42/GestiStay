// NOTE: Requires SMS provider configured in Supabase Dashboard > Auth > Providers > Phone
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Phone } from "lucide-react"
import { toast } from "sonner"

export interface PhoneAuthProps {
  mode: "signin" | "signup" | "link"
  onSuccess?: () => void
  onCancel?: () => void
  fullName?: string
}

export function PhoneAuth({ mode, onSuccess, onCancel, fullName }: PhoneAuthProps) {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  function normalizePhone(input: string) {
    // Keep + and digits only
    const cleaned = input.replace(/[^\d+]/g, "")
    return cleaned
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizePhone(phone)
    if (!normalized.startsWith("+") || normalized.length < 8) {
      toast.error("Numéro invalide. Format attendu : +33612345678")
      return
    }

    setLoading(true)
    try {
      if (mode === "link") {
        // Link a phone identity to an existing user
        const { error } = await supabase.auth.updateUser({ phone: normalized })
        if (error) {
          toast.error(error.message)
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalized,
          options: {
            data: mode === "signup" && fullName ? { full_name: fullName } : undefined,
          },
        })
        if (error) {
          toast.error(error.message)
          return
        }
      }
      toast.success("Code envoyé")
      setStep("code")
    } catch {
      toast.error("Erreur lors de l\u2019envoi du code")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error("Veuillez entrer un code à 6 chiffres")
      return
    }

    const normalized = normalizePhone(phone)
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: code,
        type: mode === "link" ? "phone_change" : "sms",
      })

      if (error) {
        toast.error("Code invalide")
        return
      }

      toast.success("Connexion réussie")
      if (onSuccess) onSuccess()
      if (mode !== "link") {
        router.push("/dashboard")
        router.refresh()
      } else {
        router.refresh()
      }
    } catch {
      toast.error("Code invalide")
    } finally {
      setLoading(false)
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-code">Code de vérification</Label>
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Code envoyé au {phone}
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Vérifier le code
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("phone")
            setCode("")
          }}
          className="text-sm text-muted-foreground hover:underline w-full text-center"
        >
          Modifier le numéro
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-input">Numéro de téléphone</Label>
        <Input
          id="phone-input"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Incluez l&apos;indicatif pays (ex : +33 pour la France)
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Phone className="mr-2 h-4 w-4" />
        )}
        Envoyer le code
      </Button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:underline w-full text-center"
        >
          Revenir à la connexion email
        </button>
      )}
    </form>
  )
}
