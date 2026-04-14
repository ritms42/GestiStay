"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const [loading, setLoading] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState("")
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error("Email ou mot de passe incorrect")
      setLoading(false)
      return
    }

    // Check if MFA is required
    if (
      signInData.session === null &&
      signInData.user === null
    ) {
      // MFA challenge needed - get the factors
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totpFactor = factorsData?.totp?.[0]

      if (totpFactor) {
        setMfaFactorId(totpFactor.id)
        setMfaRequired(true)
        setLoading(false)
        return
      }
    }

    toast.success("Connexion réussie")
    router.push(redirect)
    router.refresh()
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault()

    if (!mfaFactorId || mfaCode.length !== 6) {
      toast.error("Veuillez entrer un code à 6 chiffres")
      return
    }

    setLoading(true)
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: mfaFactorId })

    if (challengeError) {
      toast.error("Erreur lors de la vérification MFA")
      setLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: mfaCode,
    })

    if (verifyError) {
      toast.error("Code invalide")
      setLoading(false)
      return
    }

    toast.success("Connexion réussie")
    router.push(redirect)
    router.refresh()
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) {
      toast.error("Erreur lors de la connexion avec Google")
    }
  }

  if (mfaRequired) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vérification en deux étapes</CardTitle>
          <CardDescription>
            Entrez le code à 6 chiffres de votre application d&apos;authentification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Code de vérification</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vérifier
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <button
            type="button"
            onClick={() => {
              setMfaRequired(false)
              setMfaCode("")
              setMfaFactorId(null)
            }}
            className="text-sm text-muted-foreground hover:underline"
          >
            Retour à la connexion
          </button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte GestiStay
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          type="button"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuer avec Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
