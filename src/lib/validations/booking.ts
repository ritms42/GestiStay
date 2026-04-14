import { z } from 'zod'

export const bookingSchema = z.object({
  property_id: z.string().uuid(),
  check_in: z.string(),
  check_out: z.string(),
  guests_count: z.number().min(1),
}).refine((data) => new Date(data.check_out) > new Date(data.check_in), {
  message: 'La date de départ doit être après la date d\'arrivée',
  path: ['check_out'],
})

export type BookingInput = z.infer<typeof bookingSchema>
