"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "./star-rating"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface HostReviewFormProps {
  bookingId: string
  propertyId: string
  guestId: string
  guestName?: string
  onReviewSubmitted?: () => void
}

export function HostReviewForm({
  bookingId,
  propertyId,
  guestId,
  guestName,
  onReviewSubmitted,
}: HostReviewFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Veuillez donner une note")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connect\u00e9")

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        property_id: propertyId,
        guest_id: guestId,
        host_id: user.id,
        reviewer_type: "host",
        rating,
        comment: comment.trim() || null,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("Vous avez d\u00e9j\u00e0 laiss\u00e9 un avis pour ce voyageur")
          return
        }
        throw error
      }

      // Notify the guest
      await supabase.from("notifications").insert({
        user_id: guestId,
        type: "review_new",
        title: "Nouvel avis re\u00e7u",
        message: `Votre h\u00f4te vous a laiss\u00e9 un avis ${rating}/5.`,
        link: "/reviews",
      })

      toast.success("Avis publi\u00e9 avec succ\u00e8s !")
      onReviewSubmitted?.()
    } catch (err) {
      toast.error("Erreur lors de la publication de l\u2019avis")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          \u00c9valuer {guestName || "le voyageur"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Note globale *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRate={setRating}
            />
          </div>

          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment s\u2019est pass\u00e9 le s\u00e9jour de ce voyageur ?"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading || rating === 0} size="sm">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publier l&apos;avis
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
