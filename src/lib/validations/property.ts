import { z } from 'zod'

export const propertySchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(100),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères').max(5000).optional(),
  property_type: z.enum(['apartment', 'house', 'villa', 'studio', 'room', 'other']),
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().min(1, 'Le pays est requis'),
  postal_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  max_guests: z.number().min(1, 'Au moins 1 voyageur').max(50),
  bedrooms: z.number().min(0).max(50),
  beds: z.number().min(1, 'Au moins 1 lit').max(100),
  bathrooms: z.number().min(0).max(50),
  amenities: z.array(z.string()).default([]),
  house_rules: z.string().max(2000).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
})

export const pricingSchema = z.object({
  base_price: z.number().min(1, 'Le prix minimum est 1€'),
  cleaning_fee: z.number().min(0).default(0),
  currency: z.string().default('EUR'),
})

export const seasonalPricingSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  price_per_night: z.number().min(1),
})

export type PropertyInput = z.infer<typeof propertySchema>
export type PricingInput = z.infer<typeof pricingSchema>
export type SeasonalPricingInput = z.infer<typeof seasonalPricingSchema>

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'Wifi' },
  { id: 'parking', label: 'Parking', icon: 'Car' },
  { id: 'pool', label: 'Piscine', icon: 'Waves' },
  { id: 'ac', label: 'Climatisation', icon: 'Snowflake' },
  { id: 'heating', label: 'Chauffage', icon: 'Flame' },
  { id: 'kitchen', label: 'Cuisine', icon: 'CookingPot' },
  { id: 'washer', label: 'Lave-linge', icon: 'WashingMachine' },
  { id: 'dryer', label: 'Sèche-linge', icon: 'Wind' },
  { id: 'tv', label: 'Télévision', icon: 'Tv' },
  { id: 'elevator', label: 'Ascenseur', icon: 'ArrowUpDown' },
  { id: 'balcony', label: 'Balcon/Terrasse', icon: 'Sun' },
  { id: 'garden', label: 'Jardin', icon: 'Trees' },
  { id: 'bbq', label: 'Barbecue', icon: 'Flame' },
  { id: 'gym', label: 'Salle de sport', icon: 'Dumbbell' },
  { id: 'pets', label: 'Animaux acceptés', icon: 'PawPrint' },
  { id: 'smoking', label: 'Fumeurs acceptés', icon: 'Cigarette' },
  { id: 'accessibility', label: 'Accessible PMR', icon: 'Accessibility' },
  { id: 'baby', label: 'Lit bébé', icon: 'Baby' },
  { id: 'workspace', label: 'Espace de travail', icon: 'Monitor' },
  { id: 'safe', label: 'Coffre-fort', icon: 'Lock' },
] as const
