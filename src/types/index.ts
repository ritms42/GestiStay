export type UserRole = 'guest' | 'host' | 'admin'
export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'past_due' | 'canceled'
export type PropertyType = 'apartment' | 'house' | 'villa' | 'studio' | 'room' | 'other'
export type PropertyStatus = 'draft' | 'published' | 'paused' | 'archived'
export type BookingStatus = 'pending' | 'confirmed' | 'canceled' | 'completed'
export type AvailabilityStatus = 'available' | 'blocked' | 'booked'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  stripe_customer_id: string | null
  stripe_account_id: string | null
  subscription_status: SubscriptionStatus
  subscription_plan: string | null
  kyc_status: KycStatus
  kyc_document_url: string | null
  kyc_verified_at: string | null
  kyc_rejection_reason: string | null
  bio: string | null
  languages: string[]
  response_rate: number | null
  response_time: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  host_id: string
  title: string
  description: string | null
  property_type: PropertyType
  address: string | null
  city: string | null
  country: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]
  house_rules: string | null
  check_in_time: string | null
  check_out_time: string | null
  status: PropertyStatus
  cancellation_policy: CancellationPolicy
  instant_book: boolean
  min_nights: number
  max_nights: number
  preparation_days: number
  created_at: string
  updated_at: string
  // Relations
  images?: PropertyImage[]
  pricing?: Pricing[]
  host?: Profile
}

export interface PropertyImage {
  id: string
  property_id: string
  url: string
  position: number
  is_cover: boolean
}

export interface Pricing {
  id: string
  property_id: string
  base_price: number
  cleaning_fee: number
  currency: string
}

export interface SeasonalPricing {
  id: string
  property_id: string
  start_date: string
  end_date: string
  price_per_night: number
}

export interface Availability {
  id: string
  property_id: string
  date: string
  status: AvailabilityStatus
  booking_id: string | null
}

export interface Booking {
  id: string
  property_id: string
  guest_id: string
  host_id: string
  check_in: string
  check_out: string
  guests_count: number
  total_price: number
  cleaning_fee: number
  status: BookingStatus
  stripe_payment_intent_id: string | null
  original_check_in: string | null
  original_check_out: string | null
  modified_at: string | null
  cancellation_reason: string | null
  canceled_at: string | null
  refund_amount: number | null
  created_at: string
  updated_at: string
  // Relations
  property?: Property
  guest?: Profile
  host?: Profile
}

export interface Favorite {
  id: string
  user_id: string
  property_id: string
  created_at: string
  // Relations
  property?: Property
}

export interface Conversation {
  id: string
  booking_id: string | null
  property_id: string
  created_at: string
  // Relations
  participants?: Profile[]
  messages?: Message[]
  property?: Property
  booking?: Booking
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  // Relations
  sender?: Profile
}

// Phase 2
export type ReviewerType = 'guest' | 'host'
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected'
export type PromotionType = 'percentage' | 'fixed' | 'early_bird' | 'last_minute' | 'weekly' | 'monthly'
export type NotificationType = 'booking_new' | 'booking_confirmed' | 'booking_canceled' | 'review_new' | 'review_reply' | 'message_new' | 'payment_received' | 'promotion_expiring'

export interface Review {
  id: string
  booking_id: string
  property_id: string
  guest_id: string
  host_id: string
  reviewer_type: ReviewerType
  rating: number
  cleanliness: number | null
  communication: number | null
  location: number | null
  value: number | null
  comment: string | null
  host_reply: string | null
  host_reply_at: string | null
  created_at: string
  updated_at: string
  // Relations
  guest?: Profile
  host?: Profile
  property?: Property
  booking?: Booking
}

export interface GuestRating {
  guest_id: string
  review_count: number
  avg_rating: number
}

export interface PropertyRating {
  property_id: string
  review_count: number
  avg_rating: number
  avg_cleanliness: number
  avg_communication: number
  avg_location: number
  avg_value: number
}

export interface Promotion {
  id: string
  property_id: string
  host_id: string
  name: string
  description: string | null
  type: PromotionType
  discount_value: number
  min_nights: number
  max_nights: number | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  usage_count: number
  max_usage: number | null
  promo_code: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  email_sent: boolean
  data: Record<string, unknown>
  created_at: string
}

export type ChannelType = 'airbnb' | 'booking' | 'vrbo' | 'other'
export type SyncStatus = 'pending' | 'syncing' | 'success' | 'error'

export interface Channel {
  id: string
  property_id: string
  host_id: string
  type: ChannelType
  name: string
  ical_import_url: string | null
  ical_export_token: string
  last_import_at: string | null
  last_import_status: SyncStatus
  last_import_error: string | null
  last_import_events_count: number
  auto_sync_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ExternalBooking {
  id: string
  channel_id: string
  property_id: string
  external_uid: string
  summary: string | null
  check_in: string
  check_out: string
  synced_at: string
}

export interface PricingRule {
  id: string
  property_id: string
  host_id: string
  enabled: boolean
  min_price: number
  max_price: number
  weekend_uplift_percent: number
  last_minute_days: number
  last_minute_discount_percent: number
  early_bird_days: number
  early_bird_discount_percent: number
  weekly_discount_percent: number
  monthly_discount_percent: number
  high_demand_threshold_percent: number
  high_demand_uplift_percent: number
  gap_night_discount_percent: number
  created_at: string
  updated_at: string
}
