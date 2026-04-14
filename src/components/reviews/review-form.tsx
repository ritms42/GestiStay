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

interface ReviewFormProps {
  bookingId: string
  propertyId: string
  hostId: string
  onReviewSubmitted?: () => void
}

export function ReviewForm({
  bookingId,
  propertyId,
  hostId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [cleanliness, setCleanliness] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [location, setLocation] = useState(0)
  const [value, setValue] = useState(0)
  const [comment, setComment] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Veuillez donner une note globale")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté")

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        property_id: propertyId,
        guest_id: user.id,
        host_id: hostId,
        reviewer_type: "guest",
        rating,
        cleanliness: cleanliness || null,
        communication: communication || null,
        location: location || null,
        value: value || null,
        comment: comment.trim() || null,
      })

      if (error) throw error

      // Mark booking as reviewed
      await supabase
        .from("bookings")
        .update({ reviewed: true })
        .eq("id", bookingId)

      // Create notification for host
      await supabase.from("notifications").insert({
        user_id: hostId,
        type: "review_new",
        title: "Nouvel avis",
        message: `Un voyageur a laissé un avis ${rating}/5 sur votre bien.`,
        link: `/properties/${propertyId}/reviews`,
      })

      toast.success("Avis publié avec succès !")
      onReviewSubmitted?.()
    } catch (err) {
      toast.error("Erreur lors de la publication de l'avis")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const ratingCategories = [
    { label: "Propreté", value: cleanliness, setter: setCleanliness },
    { label: "Communication", value: communication, setter: setCommunication },
    { label: "Emplacement", value: location, setter: setLocation },
    { label: "Rapport qualité/prix", value: value, setter: setValue },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laisser un avis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall rating */}
          <div className="space-y-2">
            <Label>Note globale *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRate={setRating}
            />
          </div>

          {/* Sub-ratings */}
          <div className="grid grid-cols-2 gap-4">
            {ratingCategories.map((cat) => (
              <div key={cat.label} className="space-y-1">
                <Label className="text-sm">{cat.label}</Label>
                <StarRating
                  rating={cat.value}
                  size="sm"
                  interactive
                  onRate={cat.setter}
                />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Commentaire</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec les futurs voyageurs..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading || rating === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publier l&apos;avis
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
