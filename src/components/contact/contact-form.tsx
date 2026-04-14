"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
          <Send className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Message envoy&eacute;&nbsp;!</h3>
        <p className="text-sm text-muted-foreground">
          Merci pour votre message. Notre &eacute;quipe vous r&eacute;pondra
          dans les meilleurs d&eacute;lais.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            name="name"
            placeholder="Jean Dupont"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jean@exemple.fr"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Sujet</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Comment pouvons-nous vous aider ?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="D&eacute;crivez votre demande en d&eacute;tail..."
          className="min-h-32"
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Envoi en cours..." : "Envoyer le message"}
      </Button>
    </form>
  )
}
