"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

export function GeocodeBackfillButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    toast.info("Géolocalisation en cours… (≈1s par bien)")
    try {
      const res = await fetch("/api/properties/backfill-geocode", {
        method: "POST",
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as {
        total: number
        updated: number
        failed: number
      }
      if (data.total === 0) {
        toast.success("Tous vos biens sont déjà géolocalisés")
      } else {
        toast.success(
          `${data.updated}/${data.total} biens géolocalisés` +
            (data.failed ? ` (${data.failed} échec(s))` : "")
        )
        router.refresh()
      }
    } catch {
      toast.error("Erreur lors de la géolocalisation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="mr-2 h-4 w-4" />
      )}
      Géolocaliser mes biens
    </Button>
  )
}
