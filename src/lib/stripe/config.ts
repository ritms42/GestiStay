export const PLANS = {
  starter: {
    name: 'Starter',
    description: 'Pour les propriétaires avec 1 à 3 biens',
    maxProperties: 3,
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: [
      'Jusqu\'à 3 biens',
      'Calendrier de disponibilités',
      'Messagerie intégrée',
      'Paiements sécurisés',
      'Tableau de bord basique',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'Pour les propriétaires avec 4 à 10 biens',
    maxProperties: 10,
    priceMonthly: 24.99,
    priceYearly: 249.99,
    features: [
      'Jusqu\'à 10 biens',
      'Tout le plan Starter',
      'Tarification saisonnière',
      'Statistiques avancées',
      'Export des données',
      'Support prioritaire',
    ],
  },
  business: {
    name: 'Business',
    description: 'Pour les gestionnaires professionnels',
    maxProperties: Infinity,
    priceMonthly: 49.99,
    priceYearly: 499.99,
    features: [
      'Biens illimités',
      'Tout le plan Pro',
      'API d\'accès',
      'Multi-utilisateurs',
      'Channel manager',
      'Support dédié',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
