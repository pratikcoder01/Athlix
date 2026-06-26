export const mockAthletes = [
  { id: '1', name: 'Thiago Valente', role: 'Head Coach', avatar: '/images/avatars/thiago-valente.png', rank: 'BJJ Black Belt', academy: 'Apex Grappling Lab', record: '88-12-0' },
  { id: '2', name: 'Marcus Vance', role: 'Athlete', avatar: '/images/avatars/marcus-vance.png', rank: 'BJJ Brown Belt', academy: 'Vanguard Martial Arts', record: '45-8-1' },
  { id: '3', name: 'Elena Rostova', role: 'Athlete', avatar: '/images/avatars/elena-rostova.png', rank: 'BJJ Purple Belt', academy: 'Horizon Jiu-Jitsu', record: '28-4-0' },
  { id: '4', name: 'Kru Somchai', role: 'Head Coach', avatar: '/images/avatars/somchai.png', rank: 'Muay Thai Kru', academy: 'Redline Striking', record: '120-15-2' },
];

export const mockTestimonials = [
  {
    id: 1,
    quote: "Athlix changed how I manage my academy. The tournament bracket generator alone saves us 10 hours a week.",
    author: "Prof. Thiago Valente",
    role: "Head Coach, Apex Grappling Lab",
    avatar: "/images/avatars/thiago-valente.png"
  },
  {
    id: 2,
    quote: "As an active competitor, having my entire match history, weight cuts, and bookings in one place is an absolute gamechanger.",
    author: "Elena Rostova",
    role: "IBJJF World Champion (Purple)",
    avatar: "/images/avatars/elena-rostova.png"
  },
  {
    id: 3,
    quote: "The cleanest, fastest interface I've ever used. It feels like Stripe built a platform for martial arts.",
    author: "Marcus Vance",
    role: "Pro MMA Fighter",
    avatar: "/images/avatars/marcus-vance.png"
  }
];

export const mockFeatures = [
  {
    title: 'Intelligent Bracket Generation',
    description: 'Instantly generate single-elimination, double-elimination, or round-robin brackets. Handles byes, automatic seedings, and live score reporting automatically.',
    icon: 'Trophy'
  },
  {
    title: 'Performance Analytics',
    description: 'Track submissions, takedowns, guard passes, and win/loss ratios. Visualize your progression with beautiful, interactive charts.',
    icon: 'Activity'
  },
  {
    title: 'Direct Coach Bookings',
    description: 'Sync your Google Calendar, set your hourly rates, and let athletes book private sessions directly through your profile without the back-and-forth.',
    icon: 'Users'
  },
  {
    title: 'Weight Cut Management',
    description: 'Log daily weights, track hydration metrics, and monitor your descent safely before competitions with predictive modeling.',
    icon: 'Zap'
  }
];

export const mockPricing = [
  {
    tier: 'Athlete',
    price: '$0',
    description: 'Everything you need to track your journey.',
    features: ['Profile & Belt Progression', 'Match History Logging', 'Book Private Sessions', 'Community Feed Access'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    tier: 'Pro Competitor',
    price: '$12',
    period: '/mo',
    description: 'Advanced analytics for serious athletes.',
    features: ['Everything in Athlete', 'Advanced Performance Analytics', 'Weight Cut Tracking', 'Priority Support', 'Video Vault (10GB)'],
    cta: 'Start 14-Day Trial',
    popular: true,
  },
  {
    tier: 'Academy Hub',
    price: '$79',
    period: '/mo',
    description: 'The operating system for modern gyms.',
    features: ['Unlimited Athletes', 'Tournament Bracket Generator', 'Staff Management', 'Custom Academy Branding', 'Financial Analytics'],
    cta: 'Contact Sales',
    popular: false,
  }
];
