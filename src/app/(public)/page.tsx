import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Shield,
  BadgeEuro,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
} from "lucide-react"

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Vos locations,{" "}
            <span className="text-primary">vos revenus</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            La plateforme de location courte durée sans commission. Prix
            transparents pour les voyageurs, revenus intégraux pour les
            propriétaires.
          </p>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form
              action="/search"
              className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl shadow-lg border"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="city"
                  placeholder="Où allez-vous ?"
                  className="pl-10 border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Input
                name="check_in"
                type="date"
                placeholder="Arrivée"
                className="sm:w-36 border-0 shadow-none focus-visible:ring-0"
              />
              <Input
                name="check_out"
                type="date"
                placeholder="Départ"
                className="sm:w-36 border-0 shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="lg">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Paiement sécurisé
            </div>
            <div className="flex items-center gap-2">
              <BadgeEuro className="h-4 w-4 text-green-600" />
              0% commission
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-green-600" />
              Prix transparents
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pourquoi choisir GestiStay ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme pensée pour les propriétaires et les voyageurs,
              pas pour les intermédiaires.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                <BadgeEuro className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zéro commission</h3>
              <p className="text-muted-foreground">
                Gardez 100% de vos revenus locatifs. Pas de pourcentage
                prélevé sur chaque réservation, juste un abonnement fixe et
                prévisible.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Prix plus bas</h3>
              <p className="text-muted-foreground">
                Sans commission cachée, les prix affichés sont les vrais
                prix. Les voyageurs économisent jusqu&apos;à 20% par rapport
                aux plateformes traditionnelles.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Relation directe
              </h3>
              <p className="text-muted-foreground">
                Communiquez directement avec les propriétaires. Pas
                d&apos;algorithme qui décide pour vous, pas
                d&apos;intermédiaire qui complique les choses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              La différence est claire
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center font-semibold">
              <div />
              <div className="p-3 rounded-lg bg-muted">Plateformes classiques</div>
              <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                GestiStay
              </div>
            </div>

            {[
              {
                label: "Commission propriétaire",
                old: "3-15%",
                new: "0%",
              },
              {
                label: "Frais voyageur",
                old: "jusqu'à 14%",
                new: "0%",
              },
              {
                label: "Transparence des prix",
                old: "Prix gonflés",
                new: "Prix réels",
              },
              {
                label: "Revenus du propriétaire",
                old: "Amputés",
                new: "100%",
              },
              {
                label: "Modèle économique",
                old: "Commission variable",
                new: "Abonnement fixe",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 gap-4 py-4 border-b items-center"
              >
                <div className="font-medium text-sm">{row.label}</div>
                <div className="text-center text-sm text-muted-foreground">
                  {row.old}
                </div>
                <div className="text-center text-sm font-semibold text-primary">
                  {row.new}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Prêt à garder 100% de vos revenus ?
          </h2>
          <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
            Rejoignez des milliers de propriétaires qui ont choisi la
            transparence et la liberté.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/search">Explorer les logements</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
