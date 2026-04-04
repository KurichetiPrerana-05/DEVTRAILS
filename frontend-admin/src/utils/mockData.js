// mockData.js — Realistic mock analytics data
// Used as fallback when backend is not available (hackathon demo safety net)

export const MOCK_ANALYTICS = {
  summary: {
    premium_pool:    48200,
    total_payouts:   31500,
    loss_ratio:      65.4,
    active_policies: 2410,
    claims_this_week: 187,
  },
  weekly_loss_ratio: [
    { week: "W1",  loss_ratio: 58,  target_ratio: 70 },
    { week: "W2",  loss_ratio: 62,  target_ratio: 70 },
    { week: "W3",  loss_ratio: 55,  target_ratio: 70 },
    { week: "W4",  loss_ratio: 71,  target_ratio: 70 },
    { week: "W5",  loss_ratio: 88,  target_ratio: 70 }, // monsoon spike
    { week: "W6",  loss_ratio: 92,  target_ratio: 70 }, // pool cap triggered
    { week: "W7",  loss_ratio: 74,  target_ratio: 70 },
    { week: "W8",  loss_ratio: 68,  target_ratio: 70 },
    { week: "W9",  loss_ratio: 63,  target_ratio: 70 },
    { week: "W10", loss_ratio: 60,  target_ratio: 70 },
    { week: "W11", loss_ratio: 65,  target_ratio: 70 },
    { week: "W12", loss_ratio: 65.4,target_ratio: 70 },
  ],
  weekly_pool: [
    { week: "W1",  premium_pool: 38000, payouts: 22000 },
    { week: "W2",  premium_pool: 40500, payouts: 25100 },
    { week: "W3",  premium_pool: 42000, payouts: 23100 },
    { week: "W4",  premium_pool: 43500, payouts: 30885 },
    { week: "W5",  premium_pool: 45000, payouts: 39600 }, // pool cap hit
    { week: "W6",  premium_pool: 44200, payouts: 40664 },
    { week: "W7",  premium_pool: 46000, payouts: 34040 },
    { week: "W8",  premium_pool: 47100, payouts: 32028 },
    { week: "W9",  premium_pool: 47800, payouts: 30114 },
    { week: "W10", premium_pool: 47900, payouts: 28740 },
    { week: "W11", premium_pool: 48000, payouts: 31200 },
    { week: "W12", premium_pool: 48200, payouts: 31502 },
  ],
  trigger_breakdown: [
    { trigger: "Rain",          count: 89 },
    { trigger: "AQI",           count: 56 },
    { trigger: "Heat",          count: 24 },
    { trigger: "Platform Down", count: 18 },
  ],
  plan_distribution: [
    { plan: "Basic",    count: 980 },
    { plan: "Standard", count: 1050 },
    { plan: "Premium",  count: 380 },
  ],
};
