import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "./star-rating"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Review } from "@/types"

interface ReviewCardProps {
  review: Review
  showReply?: boolean
}

export function ReviewCard({ review, showReply = true }: ReviewCardProps) {
  const guest = review.guest
  const initials =
    guest?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={guest?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{guest?.full_name || "Voyageur"}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), "d MMMM yyyy", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Sub-ratings */}
      {(review.cleanliness || review.communication || review.location || review.value) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {review.cleanliness && (
            <span>Propreté: {review.cleanliness}/5</span>
          )}
          {review.communication && (
            <span>Communication: {review.communication}/5</span>
          )}
          {review.location && (
            <span>Emplacement: {review.location}/5</span>
          )}
          {review.value && (
            <span>Rapport qualité/prix: {review.value}/5</span>
          )}
        </div>
      )}

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Host reply */}
      {showReply && review.host_reply && (
        <div className="ml-6 mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30">
          <p className="text-xs font-medium mb-1">Réponse du propriétaire</p>
          <p className="text-sm text-muted-foreground">
            {review.host_reply}
          </p>
        </div>
      )}
    </div>
  )
}
