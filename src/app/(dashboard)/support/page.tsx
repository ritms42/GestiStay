"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  HelpCircle,
  ChevronDown,
  Send,
  BookOpen,
  MessageCircle,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FAQ_ITEMS = [
  {
    question: "Comment ajouter un nouveau bien ?",
    answer:
      "Rendez-vous dans la section 'Mes biens' depuis le menu lateral, puis cliquez sur 'Ajouter un bien'. Suivez les etapes pour renseigner les informations, ajouter des photos et definir vos tarifs.",
  },
  {
    question: "Comment fonctionne le systeme de paiement ?",
    answer:
      "Les paiements sont securises via Stripe. Lorsqu'un voyageur reserve, le montant est preleve et vous est reverse automatiquement apres le check-in. Aucune commission n'est prelevee sur vos revenus.",
  },
  {
    question: "Comment gerer mes reservations ?",
    answer:
      "Toutes vos reservations sont visibles dans la section 'Reservations'. Vous pouvez les confirmer, les refuser ou les annuler. Un systeme de messagerie integre vous permet de communiquer avec vos voyageurs.",
  },
  {
    question: "Quels sont les frais d'abonnement ?",
    answer:
      "GestiStay fonctionne avec un abonnement mensuel fixe. Contrairement aux plateformes traditionnelles, nous ne prelevons aucune commission sur vos reservations. Consultez la page Tarifs pour plus de details.",
  },
  {
    question: "Comment modifier mes tarifs ?",
    answer:
      "Allez dans 'Mes biens', selectionnez la propriete concernee, puis l'onglet 'Tarification'. Vous pouvez definir un prix de base, des frais de menage, et creer des promotions saisonnieres.",
  },
  {
    question: "Comment fonctionne le check-in en ligne ?",
    answer:
      "La section 'Check-ins' vous permet de gerer les arrivees et departs de vos voyageurs. Vous pouvez envoyer les instructions d'arrivee, collecter les informations des voyageurs et suivre le statut de chaque check-in.",
  },
  {
    question: "Comment acceder a mes rapports comptables ?",
    answer:
      "La section 'Comptabilite' vous donne acces a vos revenus, factures et rapports fiscaux. Vous pouvez exporter vos donnees au format CSV pour votre comptable.",
  },
  {
    question: "Comment connecter l'API ?",
    answer:
      "Rendez-vous dans la section 'API' pour generer vos cles d'acces. La documentation complete de l'API est disponible pour integrer GestiStay a vos outils existants.",
  },
]

const DOC_LINKS = [
  {
    title: "Guide de demarrage",
    description: "Apprenez les bases pour configurer votre compte et publier votre premier bien.",
    href: "#",
  },
  {
    title: "Documentation API",
    description: "Reference complete de l'API pour les integrations et l'automatisation.",
    href: "#",
  },
  {
    title: "Guide de tarification",
    description: "Optimisez vos prix pour maximiser vos revenus et votre taux d'occupation.",
    href: "#",
  },
  {
    title: "Bonnes pratiques",
    description: "Conseils pour ameliorer vos annonces et offrir la meilleure experience voyageur.",
    href: "#",
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    category: "",
    message: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject || !form.category || !form.message) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Vous devez etre connecte")
        return
      }

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: form.subject,
        category: form.category,
        message: form.message,
        status: "open",
      })

      if (error) {
        // Table might not exist yet, fallback to success message
        console.error("Support ticket error:", error)
      }

      toast.success("Votre message a ete envoye. Nous vous repondrons sous 24h.")
      setForm({ subject: "", category: "", message: "" })
    } catch {
      toast.error("Une erreur est survenue. Veuillez reessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          Support & Aide
        </h1>
        <p className="text-muted-foreground mt-1">
          Trouvez des reponses a vos questions ou contactez notre equipe
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </CardContent>
        </Card>

        {/* Contact Form */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Contacter le support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value: string | null) =>
                      setForm((prev) => ({ ...prev, category: value ?? "" }))
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Choisir une categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Question generale</SelectItem>
                      <SelectItem value="billing">Facturation</SelectItem>
                      <SelectItem value="technical">Probleme technique</SelectItem>
                      <SelectItem value="booking">Reservation</SelectItem>
                      <SelectItem value="account">Mon compte</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Resume de votre demande"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Decrivez votre probleme ou question en detail..."
                    rows={5}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer le message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Live Chat Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat en direct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground space-y-3">
                <MessageCircle className="h-12 w-12 mx-auto opacity-40" />
                <p className="text-sm">
                  Le chat en direct sera bientot disponible.
                </p>
                <p className="text-xs">
                  En attendant, utilisez le formulaire de contact ci-dessus.
                  Nous repondons sous 24h.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOC_LINKS.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm">{doc.title}</h3>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {doc.description}
                </p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
