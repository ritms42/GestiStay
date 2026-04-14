import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"
import { ContactForm } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'equipe GestiStay. Nous sommes a votre ecoute pour toute question.",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Contactez-nous
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Une question, une suggestion ou besoin d&apos;aide&nbsp;? Notre
          &eacute;quipe est &agrave; votre &eacute;coute et vous r&eacute;pondra
          dans les meilleurs d&eacute;lais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Company info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Nos coordonn&eacute;es</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">GestiStay SAS</p>
                  <p>10 rue de l&apos;Innovation</p>
                  <p>75001 Paris, France</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a
                  href="mailto:contact@gestistay.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  contact@gestistay.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">
                  +33 1 00 00 00 00
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Suivez-nous</h2>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/gestistay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter / X
              </a>
              <a
                href="https://linkedin.com/company/gestistay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://instagram.com/gestistay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Horaires</h2>
            <p className="text-sm text-muted-foreground">
              Lundi &ndash; Vendredi : 9h &ndash; 18h (CET)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              R&eacute;ponse sous 24&ndash;48h ouvr&eacute;es
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-6">
              Envoyez-nous un message
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
