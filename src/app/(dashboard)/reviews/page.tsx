"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/reviews/star-rating"
import { HostReviewForm } from "@/components/reviews/host-review-form"
import { GuestRatingBadge } from "@/components/reviews/guest-rating-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Loader2,
  MessageSquare,
  Star,
  Send,
  UserCheck,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import type { Review, Property, Booking } from "@/types"

interface ReviewWithRelations extends Omit<Review, 'guest' | 'property' | 'booking'> {
  guest?: { full_name: string | null; avatar_url: string | null }
  property?: { title: string; city: string | null }
  booking?: { check_in: string; check_out: string; status: string }
}

interface CompletedBooking extends Omit<Booking, 'property' | 'guest'> {
  guest?: { id: string; full_name: string | null; avatar_url: string | null }
  property?: { title: string }
  has_host_review?: boolean
}

export default function ReviewsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([])
  const [filterProperty, setFilterProperty] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replySending, setReplySending] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch host's properties
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, city")
        .eq("host_id", user.id)

      setProperties((props as unknown as Property[]) || [])

      // Fetch guest reviews on host's properties
      const { data: reviewData } = await supabase
        .from("reviews")
        .select(
          "*, guest:profiles!reviews_guest_id_fkey(full_name, avatar_url), property:properties!reviews_property_id_fkey(title, city), booking:bookings!reviews_booking_id_fkey(check_in, check_out, status)"
        )
        .eq("host_id", user.id)
        .eq("reviewer_type", "guest")
        .order("created_at", { ascending: false })

      setReviews((reviewData as unknown as ReviewWithRelations[]) || [])

      // Fetch completed bookings for host review
      const { data: bookings } = await supabase
        .from("bookings")
        .select(
          "*, guest:profiles!bookings_guest_id_fkey(id, full_name, avatar_url), property:properties!bookings_property_id_fkey(title)"
        )
        .eq("host_id", user.id)
        .eq("status", "completed")
        .order("check_out", { ascending: false })
        .limit(20)

      if (bookings) {
        // Check which bookings already have a host review
        const bookingIds = bookings.map((b) => b.id)
        const { data: hostReviews } = await supabase
          .from("reviews")
          .select("booking_id")
          .eq("reviewer_type", "host")
          .in("booking_id", bookingIds)

        const reviewedBookingIds = new Set(
          (hostReviews || []).map((r) => r.booking_id)
        )

        const enriched = bookings.map((b) => ({
          ...b,
          has_host_review: reviewedBookingIds.has(b.id),
        }))

        setCompletedBookings(enriched as unknown as CompletedBooking[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredReviews = reviews.filter((review) => {
    if (filterProperty !== "all" && review.property_id !== filterProperty)
      return false
    if (filterRating !== "all" && review.rating !== Number(filterRating))
      return false
    return true
  })

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    setReplySending(true)
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          host_reply: replyText.trim(),
          host_reply_at: new Date().toISOString(),
        })
        .eq("id", reviewId)

      if (error) throw error

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                host_reply: replyText.trim(),
                host_reply_at: new Date().toISOString(),
              }
            : r
        )
      )
      setReplyingTo(null)
      setReplyText("")
      toast.success("R\u00e9ponse publi\u00e9e")
    } catch {
      toast.error("Erreur lors de l\u2019envoi de la r\u00e9ponse")
    } finally {
      setReplySending(false)
    }
  }

  const unreviewedBookings = completedBookings.filter(
    (b) => !b.has_host_review
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avis</h1>
        <p className="text-muted-foreground">
          G\u00e9rez les avis de vos voyageurs et \u00e9valuez vos h\u00f4tes
        </p>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            <MessageSquare className="h-4 w-4 mr-2" />
            Avis re\u00e7us ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="give">
            <UserCheck className="h-4 w-4 mr-2" />
            \u00c9valuer les voyageurs ({unreviewedBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Received reviews tab */}
        <TabsContent value="received" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select
              value={filterProperty}
              onValueChange={(v) => setFilterProperty(v || "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les biens</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterRating}
              onValueChange={(v) => setFilterRating(v || "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} \u00e9toile{r > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun avis pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const initials =
                  review.guest?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"

                return (
                  <Card key={review.id}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={review.guest?.avatar_url || undefined}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {review.guest?.full_name || "Voyageur"}
                              </p>
                              <GuestRatingBadge guestId={review.guest_id} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {review.property?.title} &middot;{" "}
                              {format(
                                new Date(review.created_at),
                                "d MMMM yyyy",
                                { locale: fr }
                              )}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>

                      {/* Sub-ratings */}
                      {(review.cleanliness ||
                        review.communication ||
                        review.location ||
                        review.value) && (
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {review.cleanliness && (
                            <span>Propreté: {review.cleanliness}/5</span>
                          )}
                          {review.communication && (
                            <span>
                              Communication: {review.communication}/5
                            </span>
                          )}
                          {review.location && (
                            <span>Emplacement: {review.location}/5</span>
                          )}
                          {review.value && (
                            <span>
                              Rapport qualité/prix: {review.value}/5
                            </span>
                          )}
                        </div>
                      )}

                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {/* Host reply */}
                      {review.host_reply ? (
                        <div className="ml-6 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30">
                          <p className="text-xs font-medium mb-1">
                            Votre r\u00e9ponse
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {review.host_reply}
                          </p>
                        </div>
                      ) : replyingTo === review.id ? (
                        <div className="ml-6 space-y-2">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="R\u00e9pondez \u00e0 cet avis..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(review.id)}
                              disabled={replySending || !replyText.trim()}
                            >
                              {replySending ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-3 w-3" />
                              )}
                              Envoyer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText("")
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(review.id)}
                        >
                          <MessageSquare className="mr-2 h-3 w-3" />
                          R\u00e9pondre
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Give reviews tab */}
        <TabsContent value="give" className="space-y-4">
          {unreviewedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun voyageur \u00e0 \u00e9valuer</p>
                <p className="text-sm mt-1">
                  Les voyageurs apparaissent ici apr\u00e8s leur d\u00e9part
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {unreviewedBookings.map((booking) => (
                <HostReviewForm
                  key={booking.id}
                  bookingId={booking.id}
                  propertyId={booking.property_id}
                  guestId={booking.guest_id}
                  guestName={
                    booking.guest?.full_name || undefined
                  }
                  onReviewSubmitted={fetchData}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
