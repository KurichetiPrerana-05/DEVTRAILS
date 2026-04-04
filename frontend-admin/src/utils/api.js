// api.js — Centralised API client for admin dashboard
// All calls go to Member 2's backend (Node.js + Express)
// Base URL is configurable via env var

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Admin token — must match ADMIN_SECRET env var on the backend
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "gigshield_admin_secret_dev";

// Generic fetch wrapper with error handling
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN,        // required by adminAuth middleware
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Claims ──────────────────────────────────────────────────────────────────

/**
 * Fetch all recent claims (live feed).
 * Backend: GET /api/admin/claims
 * Returns: Claim[]
 */
export function fetchClaims() {
  return apiFetch("/api/admin/claims");
}

/**
 * Fetch claims pending manual review (fraud score 0.7–0.9).
 * Backend: GET /api/admin/claims/review-queue
 * Returns: Claim[]
 */
export function fetchReviewQueue() {
  return apiFetch("/api/admin/claims/review-queue");
}

/**
 * Submit approve/reject decision for a claim.
 * Backend: POST /api/admin/claims/:id/review
 * Body: { action: "approve" | "reject", note?: string }
 */
export function reviewClaim(claimId, action, note = "") {
  return apiFetch(`/api/admin/claims/${claimId}/review`, {
    method: "POST",
    body: JSON.stringify({ action, note }),
  });
}

// ─── Zone Heatmap ─────────────────────────────────────────────────────────────

/**
 * Fetch disruption frequency data per pincode.
 * Backend: GET /api/admin/zones/heatmap
 * Returns: ZoneStats[]
 */
export function fetchZoneHeatmap() {
  return apiFetch("/api/admin/zones/heatmap");
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Fetch aggregated analytics (loss ratios, premium pool, plan distribution).
 * Backend: GET /api/admin/analytics
 * Returns: AnalyticsSummary
 */
export function fetchAnalytics() {
  return apiFetch("/api/admin/analytics");
}

// ─── Expected Response Shapes (for reference / contract with Member 2) ────────

/*
Claim {
  claim_id:        string     // UUID
  worker_name:     string
  zone_pincode:    string
  plan_type:       "Basic" | "Standard" | "Premium"
  payout_amount:   number     // ₹
  fraud_score:     number     // 0–1
  trigger_type:    "rain" | "aqi" | "heat" | "curfew" | "platform_down"
  status:          "pending" | "approved" | "rejected" | "review"
  created_at:      ISO string
  fraud_signals:   string[]   // e.g. ["location_jump_velocity"]
}

ZoneStats {
  pincode:              string
  area_name:            string
  disruption_count:     number  // last 90 days
  active_policies:      number
  dominant_trigger:     string
  premium_multiplier:   number
}

AnalyticsSummary {
  summary: {
    premium_pool:       number
    total_payouts:      number
    loss_ratio:         number  // %
    active_policies:    number
    claims_this_week:   number
  }
  weekly_loss_ratio:    { week: string, loss_ratio: number, target_ratio: number }[]
  weekly_pool:          { week: string, premium_pool: number, payouts: number }[]
  trigger_breakdown:    { trigger: string, count: number }[]
  plan_distribution:    { plan: string, count: number }[]
}
*/
