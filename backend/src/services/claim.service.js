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

  const zone = await pool.query('SELECT * FROM zones LIMIT 1');
  const polygon = zone.rows[0].coordinates;
  const inside = pointInPolygon([lat, lon], polygon);
  
  const policyRes = await pool.query(
    'SELECT policy_id, zone_pincode FROM policies WHERE worker_id = $1 AND status = $2 LIMIT 1',
    [user_id, 'active']
  );
  const policy_id = policyRes.rows[0]?.policy_id || null;
  const pincode   = policyRes.rows[0]?.zone_pincode || zone.rows[0].pincode;

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

  try {
    // A. Risk Score
    const riskRes = await axios.post(`${process.env.ML_SERVICE_URL}/score-risk`, {
      pincode, season: "monsoon", platform: "zepto", shift_type: "evening",
      rain_disruptions_3m: 5, aqi_disruptions_3m: 2, heat_disruptions_3m: 1,
      flood_vulnerability: 0.3, avg_claim_rate: 0.1, imd_red_alert: 0, worker_claim_history: 0.1
    });
    riskScore = riskRes.data.risk_score || 0.5;

    // B. Fraud Score (The critical missing integration)
    const fraudRes = await axios.post(`${process.env.ML_SERVICE_URL}/score-fraud`, {
      pincode, trigger_type, gps_accuracy_radius,
      location_jump_velocity: inside ? 0.0 : 50.0, // simplified logic
      cell_tower_match: 1, platform_online_status,
      claim_latency_seconds: 300, motion_detected, app_active: 1,
      historical_claim_rate: 0.1, device_shared: 0,
      disruption_start_epoch: Math.floor(Date.now()/1000) - 3600,
      claim_submitted_epoch: Math.floor(Date.now()/1000)
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
      JSON.stringify({ lat, lon, ml_risk: riskScore, ml_fraud: fraudScore })
    ]
  );

  return result.rows[0];
};