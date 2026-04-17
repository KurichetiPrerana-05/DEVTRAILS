const pool = require('../config/db');
const axios = require('axios');
const pointInPolygon = require('point-in-polygon');

exports.processClaim = async (data) => {
  const { 
    lat, lon, user_id, 
    trigger_type = 'rain', 
    gps_accuracy_radius = 10.0,
    platform_online_status = 1,
    motion_detected = 1
  } = data;

  // ── Fetch zone ──
  const zone = await pool.query('SELECT * FROM zones LIMIT 1');
  const polygon = zone.rows[0].coordinates;
  const inside = pointInPolygon([lat, lon], polygon);
  
  // ── Fetch worker's active policy + real profile data ──
  const policyRes = await pool.query(
    `SELECT p.policy_id, p.zone_pincode, p.plan_type,
            w.platform, w.city, w.shift_type,
            w.rain_disruptions_3m, w.aqi_disruptions_3m, w.heat_disruptions_3m,
            w.flood_vulnerability, w.avg_claim_rate, w.worker_claim_history
     FROM policies p
     JOIN workers w ON w.worker_id = p.worker_id
     WHERE p.worker_id = $1 AND p.status = $2
     LIMIT 1`,
    [user_id, 'active']
  );

  const policy_id = policyRes.rows[0]?.policy_id || null;
  const pincode   = policyRes.rows[0]?.zone_pincode || zone.rows[0].pincode;

  // Derive season from current month
  const month = new Date().getMonth() + 1; // 1-12
  const season = (month >= 6 && month <= 9) ? 'monsoon'
               : (month >= 3 && month <= 5) ? 'summer'
               : (month >= 10 && month <= 11) ? 'post_monsoon'
               : 'winter';

  // Real worker profile data (fallback to safe defaults if worker row missing)
  const workerPlatform         = policyRes.rows[0]?.platform           || 'other';
  const workerShiftType        = policyRes.rows[0]?.shift_type         || 'full_day';
  const rainDisruptions3m      = policyRes.rows[0]?.rain_disruptions_3m  ?? 3;
  const aqiDisruptions3m       = policyRes.rows[0]?.aqi_disruptions_3m   ?? 1;
  const heatDisruptions3m      = policyRes.rows[0]?.heat_disruptions_3m  ?? 0;
  const floodVulnerability     = policyRes.rows[0]?.flood_vulnerability   ?? 0.3;
  const avgClaimRate           = policyRes.rows[0]?.avg_claim_rate        ?? 0.1;
  const workerClaimHistory     = policyRes.rows[0]?.worker_claim_history  ?? 0.1;

  // ── 1. Duplicate Claim Prevention ──
  const duplicateRes = await pool.query(
    `SELECT count(*) FROM claims 
     WHERE worker_id = $1 AND created_at > NOW() - INTERVAL '30 minutes'`,
    [user_id]
  );
  const isDuplicate = parseInt(duplicateRes.rows[0].count) > 0;

  // ── 2. ML Scoring (Risk & Fraud) ──
  let riskScore = 0.5;
  let fraudScore = 0.1;
  let signals = [];

  // Real GPS timing: use actual claim submission time vs disruption start
  // We look up the latest active disruption event for this pincode
  let disruption_start_epoch = Math.floor(Date.now() / 1000) - 3600; // default: 1hr ago
  try {
    const disruptionRes = await pool.query(
      `SELECT EXTRACT(EPOCH FROM started_at)::int AS epoch
       FROM disruption_events
       WHERE pincode = $1 AND trigger_type = $2 AND ended_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [pincode, trigger_type]
    );
    if (disruptionRes.rows[0]?.epoch) {
      disruption_start_epoch = disruptionRes.rows[0].epoch;
    }
  } catch (_) {
    // disruption_events table may not exist in all deploys; fallback is safe
  }

  const claim_submitted_epoch = Math.floor(Date.now() / 1000);
  const claim_latency_seconds = claim_submitted_epoch - disruption_start_epoch;

  try {
    // A. Risk Score — using real worker data
    const riskRes = await axios.post(`${process.env.ML_SERVICE_URL}/score-risk`, {
      pincode,
      season,
      platform:             workerPlatform,
      shift_type:           workerShiftType,
      rain_disruptions_3m:  rainDisruptions3m,
      aqi_disruptions_3m:   aqiDisruptions3m,
      heat_disruptions_3m:  heatDisruptions3m,
      flood_vulnerability:  floodVulnerability,
      avg_claim_rate:       avgClaimRate,
      imd_red_alert:        0, // TODO: wire to IMD API when available
      worker_claim_history: workerClaimHistory,
    });
    riskScore = riskRes.data.risk_score || 0.5;

    // B. Fraud Score — using real GPS timing
    const fraudRes = await axios.post(`${process.env.ML_SERVICE_URL}/score-fraud`, {
      pincode,
      trigger_type,
      gps_accuracy_radius,
      location_jump_velocity: inside ? 0.0 : 50.0,
      cell_tower_match: 1,
      platform_online_status,
      claim_latency_seconds,
      motion_detected,
      app_active: 1,
      historical_claim_rate: avgClaimRate,
      device_shared: 0,
      disruption_start_epoch,
      claim_submitted_epoch,
    });
    fraudScore = fraudRes.data.fraud_score || 0.1;
    signals    = fraudRes.data.signals || [];
  } catch (mlErr) {
    console.warn('[Claim Service] ML unreachable - using fallback scores', mlErr.message);
  }

  // ── 3. Decision Engine ──
  let status = 'approved';
  let final_trigger = trigger_type;

  if (isDuplicate) {
    status = 'pending';
    final_trigger = 'duplicate_flag';
    signals.push('duplicate_attempt');
    fraudScore = Math.max(fraudScore, 0.85);
  } else if (!inside) {
    status = 'pending';
    final_trigger = 'location_mismatch';
    signals.push('outside_risk_zone');
    fraudScore = Math.max(fraudScore, 0.82);
  } else if (riskScore > 0.8 || fraudScore > 0.7) {
    status = 'pending'; // Requires Tier 3 (Manual Review)
  }

  // ── 4. Save Integrated Result ──
  const result = await pool.query(
    `INSERT INTO claims(
      worker_id, policy_id, risk_score, fraud_score, fraud_signals, 
      status, in_risk_zone, trigger_type, evidence_json
    )
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      user_id, policy_id, riskScore, fraudScore, JSON.stringify(signals),
      status, inside, final_trigger, 
      JSON.stringify({ lat, lon, ml_risk: riskScore, ml_fraud: fraudScore, claim_latency_seconds })
    ]
  );

  return result.rows[0];
};
