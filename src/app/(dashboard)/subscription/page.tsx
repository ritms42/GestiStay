import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PLANS, type PlanKey } from "@/lib/stripe/config"

export const metadata = { title: "Abonnement" }

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan")
    .eq("id", user!.id)
    .single()

  const currentPlan = profile?.subscription_plan as PlanKey | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Choisissez le plan adapté à vos besoins. Zéro commission sur vos
          réservations.
        </p>
      </div>

      {profile?.subscription_status === "active" && currentPlan && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-semibold">
                Plan actuel : {PLANS[currentPlan]?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Statut : Actif
              </p>
            </div>
            <Badge variant="default">Actif</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
          ([key, plan]) => {
            const isCurrentPlan = currentPlan === key
            return (
              <Card
                key={key}
                className={`relative ${
                  key === "pro" ? "border-primary shadow-lg" : ""
                }`}
              >
                {key === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Populaire</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {plan.priceMonthly}€
                    </span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ou {plan.priceYearly}€/an (
                    {Math.round(
                      (1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100
                    )}
                    % d&apos;économie)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={key === "pro" ? "default" : "outline"}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Plan actuel" : "Choisir ce plan"}
                  </Button>
                </CardContent>
              </Card>
            )
          }
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Tous les plans incluent : 0% de commission sur vos réservations,
          paiements sécurisés, messagerie intégrée.
        </p>
      </div>
    </div>
  )
}
