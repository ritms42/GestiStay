"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const STORAGE_KEY = "gestistay-cookie-consent"

type ConsentValue = "accepted" | "refused"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setVisible(true)
    }
  }, [])

  function handleConsent(value: ConsentValue) {
    localStorage.setItem(STORAGE_KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
            Nous utilisons des cookies essentiels pour le fonctionnement du
            site et des cookies analytiques pour am&eacute;liorer votre
            exp&eacute;rience.{" "}
            <Link
              href="/privacy#cookies"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              En savoir plus
            </Link>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mr-2"
            >
              Personnaliser
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConsent("refused")}
            >
              Refuser
            </Button>
            <Button
              size="sm"
              onClick={() => handleConsent("accepted")}
            >
              Accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
