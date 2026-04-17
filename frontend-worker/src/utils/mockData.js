// Mock data for demo mode when backend is unavailable

export const MOCK_WORKER = {
  id: 'wkr_demo_001',
  name: 'Arjun Sharma',
  phone: '+91 98765 43210',
  platform: 'Zomato',
  city: 'Chennai',
  zone: 'Zone A – Mylapore',
  plan: 'standard',
  coverageStatus: 'active',
  premiumPaid: true,
  joinedAt: '2024-01-15T10:00:00Z',
  nextPremiumDue: '2026-04-15T00:00:00Z',
  whatsappEnabled: true,
}

export const MOCK_CLAIMS = [
  {
    id: 'clm_001',
    type: 'rain',
    date: '2026-03-28',
    zone: 'Zone A – Mylapore',
    triggerValue: '42mm rainfall',
    threshold: '30mm',
    amount: 250,
    status: 'paid',
    paidAt: '2026-03-29T08:30:00Z',
    upiRef: 'UPI20260329083012',
  },
  {
    id: 'clm_002',
    type: 'aqi',
    date: '2026-03-15',
    zone: 'Zone A – Mylapore',
    triggerValue: 'AQI 312',
    threshold: 'AQI 300',
    amount: 150,
    status: 'paid',
    paidAt: '2026-03-16T09:00:00Z',
    upiRef: 'UPI20260316090045',
  },
  {
    id: 'clm_003',
    type: 'rain',
    date: '2026-04-02',
    zone: 'Zone A – Mylapore',
    triggerValue: '35mm rainfall',
    threshold: '30mm',
    amount: 250,
    status: 'processing',
    paidAt: null,
    upiRef: null,
  },
]

export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Rain coverage only',
    price: 99,
    period: 'month',
    color: 'white',
    features: [
      '₹200 payout per rain disruption day',
      'Rainfall > 30mm trigger',
      'WhatsApp notifications',
      'Covers 1 platform',
    ],
    maxPayout: 200,
    triggers: ['Rain > 30mm'],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Rain + AQI coverage',
    price: 199,
    period: 'month',
    color: 'brand',
    popular: true,
    features: [
      '₹250 payout per disruption day',
      'Rain > 30mm + AQI > 300 triggers',
      'WhatsApp + SMS notifications',
      'Covers up to 2 platforms',
      'Disruption calendar preview',
    ],
    maxPayout: 250,
    triggers: ['Rain > 30mm', 'AQI > 300'],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Full disruption coverage',
    price: 349,
    period: 'month',
    color: 'yellow',
    features: [
      '₹350 payout per disruption day',
      'Rain + AQI + Platform disruption',
      'Priority claim processing',
      'Covers all platforms',
      'High-risk week preview',
      'Dedicated support line',
    ],
    maxPayout: 350,
    triggers: ['Rain > 30mm', 'AQI > 300', 'Platform disruption'],
  },
]

// ── Seeded PRNG ───────────────────────────────────────────────
// Produces a deterministic pseudo-random number from a seed so the
// disruption calendar is stable for a given year+month combination.
// This prevents the "different risk levels on every render" bug.
function seededRandom(seed) {
  // Mulberry32 — fast, decent distribution, pure JS
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Generate mock disruption calendar that is stable per (year, month, day)
export function generateMockCalendar(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const calendar = []
  const riskLevels = ['low', 'medium', 'high', 'normal']
  const weights   = [0.15, 0.20, 0.10, 0.55]

  for (let d = 1; d <= daysInMonth; d++) {
    // Seed based on year + month + day so output is reproducible
    const seed = year * 10000 + month * 100 + d
    const rand = seededRandom(seed)

    let cumulative = 0
    let risk = 'normal'
    for (let i = 0; i < riskLevels.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) { risk = riskLevels[i]; break }
    }
    calendar.push({ day: d, risk })
  }
  return calendar
}

export const MOCK_COVERAGE_STATUS = {
  isActive: true,
  plan: 'standard',
  daysActive: 78,
  totalClaims: 3,
  totalPaid: 650,
  currentMonthEarnings: 250,
  zoneRisk: 'medium',
  todayCondition: {
    rain: '12mm',
    aqi: 145,
    triggered: false,
  },
}
