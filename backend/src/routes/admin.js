// backend-patch/admin.js
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — adapted from member4_module/devops/backend_admin_routes.js
//
// HOW TO USE:
//   1. Copy this file to:  member2_module/backend/src/routes/admin.js
//   2. In member2_module/backend/src/app.js add ONE line:
//        app.use('/api/admin', require('./routes/admin'));
//   3. Ensure your .env has:  ADMIN_SECRET=<some-secret>
//
// For the Docker Compose prototype, mount this file into the container or
// follow the steps above before building the image.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();

// ── DB: graceful require so the file can be linted without a running backend ──
let db;
try { db = require("../config/db"); } catch (_) {
  try { db = require("../models/db"); } catch (__) { db = null; }
}

// ── Redis: optional — skipped gracefully if not available ──
let redisClient = null;
try { redisClient = require("../services/redis"); } catch (_) { /* Redis not wired yet */ }

// ── Middleware: simple admin token check ──────────────────────────────────────
// TODO (production): replace with proper JWT verification
function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized — missing or invalid x-admin-token" });
  }
  next();
}

router.use(adminAuth);

// Helper: run a DB query and handle the "db not connected" case gracefully
async function runQuery(sql, params = []) {
  if (!db) throw new Error("Database client not initialized");
  // Support both pg (db.query) style and knex/sequelize style
  if (typeof db.query === "function") {
    const result = await db.query(sql, params);
    return result.rows || result;
  }
  throw new Error("Unsupported DB client interface");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/claims
// Returns the 100 most-recent claims with fraud info
// Used by: Admin LiveClaimsFeed (polled every 10 s)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/claims", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        c.claim_id,
        w.name            AS worker_name,
        w.zone_pincode,
        p.plan_type,
        c.payout_amount,
        c.fraud_score,
        c.trigger_type,
        c.status,
        c.created_at,
        c.fraud_signals
      FROM claims c
      JOIN workers  w ON w.worker_id = c.worker_id
      LEFT JOIN policies p ON p.policy_id = c.policy_id
      ORDER BY c.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error("[admin/claims]", err.message);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/claims/review-queue
// Returns pending Tier-3 claims (fraud_score 0.70–0.90) for manual review
// Used by: Admin ManualReview page
// ─────────────────────────────────────────────────────────────────────────────
router.get("/claims/review-queue", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        c.claim_id,
        w.name            AS worker_name,
        w.zone_pincode,
        p.plan_type,
        c.payout_amount,
        c.fraud_score,
        c.trigger_type,
        c.created_at,
        c.fraud_signals,
        c.evidence_json   AS evidence
      FROM claims c
      JOIN workers  w ON w.worker_id = c.worker_id
      LEFT JOIN policies p ON p.policy_id = c.policy_id
      WHERE c.fraud_score BETWEEN 0.70 AND 0.90
        AND c.status = 'pending'
      ORDER BY c.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("[admin/review-queue]", err.message);
    res.status(500).json({ error: "Failed to fetch review queue" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/claims/:id/review
// Body: { action: "approve" | "reject", note?: string }
// Used by: Admin ManualReview + FraudQueue
// ─────────────────────────────────────────────────────────────────────────────
router.post("/claims/:id/review", async (req, res) => {
  const { id }           = req.params;
  const { action, note } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
  }

  try {
    const newStatus = action === "approve" ? "approved" : "rejected";

    await runQuery(
      `UPDATE claims
       SET status        = $1,
           reviewer_note = $2,
           reviewed_at   = NOW()
       WHERE claim_id = $3`,
      [newStatus, note || null, id]
    );

    // Trigger payout if approved (optional — won't crash if service not present)
    if (action === "approve") {
      try {
        const paymentService = require("../services/paymentService");
        await paymentService.initiateUpiPayout(id);
      } catch (_) {
        console.warn("[admin/review] Payment service not available — skipping payout trigger");
      }
    }

    res.json({ claim_id: id, status: newStatus });
  } catch (err) {
    console.error("[admin/review]", err.message);
    res.status(500).json({ error: "Failed to update claim" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/zones/heatmap
// Returns disruption count per pincode (last 90 days)
// Used by: Admin ZoneHeatmap page
// ─────────────────────────────────────────────────────────────────────────────
router.get("/zones/heatmap", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        z.pincode,
        z.area_name,
        COUNT(de.event_id)           AS disruption_count,
        COUNT(DISTINCT po.policy_id) AS active_policies,
        ROUND(AVG(z.premium_multiplier)::numeric, 2) AS premium_multiplier
      FROM zones z
      LEFT JOIN disruption_events de
        ON de.zone_pincode = z.pincode
       AND de.triggered_at >= NOW() - INTERVAL '90 days'
      LEFT JOIN policies po
        ON po.zone_pincode = z.pincode
       AND po.status = 'active'
      GROUP BY z.pincode, z.area_name, z.premium_multiplier
      ORDER BY disruption_count DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("[admin/zones/heatmap]", err.message);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/analytics
// Returns KPIs + weekly loss ratio + premium pool data
// Used by: Admin Analytics page
// ─────────────────────────────────────────────────────────────────────────────
router.get("/analytics", async (req, res) => {
  try {
    const summary = await runQuery(`
      SELECT
        COALESCE(SUM(po.weekly_premium), 0)                                  AS premium_pool,
        COALESCE(SUM(c.payout_amount) FILTER (WHERE c.status = 'approved'), 0) AS total_payouts,
        ROUND(
          100.0 * COALESCE(SUM(c.payout_amount) FILTER (WHERE c.status = 'approved'), 0)
          / NULLIF(SUM(po.weekly_premium), 0), 1
        )                                                                     AS loss_ratio,
        COUNT(DISTINCT po.policy_id) FILTER (WHERE po.status = 'active')      AS active_policies,
        COUNT(c.claim_id) FILTER (WHERE c.created_at >= DATE_TRUNC('week', NOW())) AS claims_this_week
      FROM policies po
      LEFT JOIN claims c ON c.policy_id = po.policy_id
    `);

    const triggerBreakdown = await runQuery(`
      SELECT trigger_type AS trigger, COUNT(*) AS count
      FROM claims
      WHERE created_at >= DATE_TRUNC('week', NOW())
      GROUP BY trigger_type
      ORDER BY count DESC
    `);

    const planDist = await runQuery(`
      SELECT plan_type AS plan, COUNT(*) AS count
      FROM policies
      WHERE status = 'active'
      GROUP BY plan_type
      ORDER BY count DESC
    `);

    res.json({
      summary:           Array.isArray(summary) ? summary[0] : summary,
      trigger_breakdown: triggerBreakdown,
      plan_distribution: planDist,
    });
  } catch (err) {
    console.error("[admin/analytics]", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
