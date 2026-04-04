// routes/worker.routes.js — stub routes for the Worker PWA (P1)
// Covers: /api/auth/*, /api/workers/me/*, /api/risk/*, /api/notifications/*
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const axios  = require('axios');
const claimController = require('../controllers/claim.controller');

// ── Middleware: verify JWT ────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.worker = jwt.verify(token, process.env.JWT_SECRET || 'gigshield_jwt_secret_dev');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/send-otp  — always succeeds (prototype: OTP is always "123456")
router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  console.log(`[OTP] Sending OTP to ${phone} (prototype: use 123456)`);
  res.json({ success: true, message: 'OTP sent (use 123456 in prototype)' });
});

// POST /api/auth/verify-otp  — accepts any OTP in prototype
router.post('/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });

  // Look up worker by phone
  let workerRow;
  try {
    const result = await db.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    workerRow = result.rows[0];
  } catch (e) {
    workerRow = null;
  }

  const token = jwt.sign(
    { phone, worker_id: workerRow?.worker_id },
    process.env.JWT_SECRET || 'gigshield_jwt_secret_dev',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    isNew: !workerRow,
    worker: workerRow || { phone, name: 'Demo Worker', worker_id: null },
  });
});

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { phone, name, platform, city } = req.body;
  try {
    // Upsert worker
    const result = await db.query(
      `INSERT INTO workers (name, phone, platform, city, zone_pincode)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city
       RETURNING *`,
      [name || 'Worker', phone, platform || 'other', city || 'Bengaluru', '560001']
    );
    const worker = result.rows[0];
    const token  = jwt.sign(
      { phone, worker_id: worker.worker_id },
      process.env.JWT_SECRET || 'gigshield_jwt_secret_dev',
      { expiresIn: '7d' }
    );
    res.json({ token, worker });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WORKER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/workers/me
router.get('/workers/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.*, p.plan_type, p.status AS policy_status, p.weekly_premium
       FROM workers w
       LEFT JOIN policies p ON p.worker_id = w.worker_id AND p.status = 'active'
       WHERE w.phone = $1`,
      [req.worker.phone]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Worker not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[workers/me]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── City Coordinates Lookup ──────────────────────────────────────────────────
const CITY_COORDS = {
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'Mumbai':    { lat: 18.9322, lon: 72.8344 },
  'Delhi':     { lat: 28.6139, lon: 77.2090 },
  'Chennai':   { lat: 13.0827, lon: 80.2707 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Pune':      { lat: 18.5204, lon: 73.8567 },
  'Kolkata':   { lat: 22.5726, lon: 88.3639 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 }
};

// ── Helper: Fetch Live Conditions (Weather + AQI) ─────────────────────────────
async function fetchLiveConditions(lat = 12.9716, lon = 77.5946, city = 'Bengaluru') {
  let stats = { rain: '0 mm', aqi: 45, triggered: false };
  
  try {
    // 1. Weather (Open-Meteo)
    const wRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=rain,showers`);
    const rain = wRes.data.current.rain + wRes.data.current.showers;
    stats.rain = rain > 0 ? `${rain} mm` : '0 mm';

    // 2. AQI (WAQI) - Try Geo first, then City name
    let aqiRes;
    try {
      aqiRes = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`);
      if (!aqiRes.data.data?.aqi) throw new Error('Geo AQI failed');
    } catch (_) {
      aqiRes = await axios.get(`https://api.waqi.info/feed/${city.toLowerCase()}/?token=demo`);
    }
    
    stats.aqi = aqiRes.data.data?.aqi || 45;
    stats.triggered = rain > 5 || stats.aqi > 250;

    console.log(`[Conditions] ${city}: Rain=${stats.rain}, AQI=${stats.aqi}`);
  } catch (err) {
    console.error(`[Conditions Error] ${city}:`, err.message);
  }
  return stats;
}

// GET /api/workers/me/coverage-status
router.get('/workers/me/coverage-status', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.plan_type, p.status, p.weekly_premium, z.risk_level, z.area_name, w.city, w.created_at, w.worker_id
       FROM workers w
       JOIN policies p ON p.worker_id = w.worker_id AND p.status = 'active'
       JOIN zones z ON z.pincode = w.zone_pincode
       WHERE w.phone = $1`,
      [req.worker.phone]
    );
    const row = result.rows[0] || { plan_type: 'Standard', status: 'active', risk_level: 'MEDIUM', city: 'Bengaluru', created_at: new Date() };
    
    const daysActive  = Math.max(1, Math.ceil((new Date() - new Date(row.created_at)) / (1000 * 60 * 60 * 24)));
    
    const statsRes = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(payout_amount), 0) as total 
       FROM claims WHERE worker_id = $1 AND status = 'approved'`,
      [row.worker_id]
    );
    const stats = statsRes.rows[0] || { count: 0, total: 0 };

    const coords = CITY_COORDS[row.city] || CITY_COORDS['Bengaluru'];
    const live = await fetchLiveConditions(coords.lat, coords.lon, row.city);

    res.json({
      isActive: row.status === 'active',
      plan_type: row.plan_type,
      zoneRisk: row.risk_level?.toLowerCase() || 'medium',
      area_name: row.area_name,
      weekly_premium: row.weekly_premium,
      daysActive: daysActive,
      totalPaid: parseFloat(stats.total) || 0,
      totalClaims: parseInt(stats.count) || 0,
      todayCondition: live
    });
  } catch (err) {
    console.error('[coverage-status]', err.message);
    res.json({ isActive: false, zoneRisk: 'medium', todayCondition: { rain: '0mm', aqi: 42, triggered: false }, daysActive: 1, totalPaid: 0, totalClaims: 0 });
  }
});

// PUT /api/workers/me/plan
router.put('/workers/me/plan', auth, async (req, res) => {
  const { plan } = req.body;
  try {
    await db.query(
      `UPDATE policies SET plan_type = $1 WHERE worker_id = (
         SELECT worker_id FROM workers WHERE phone = $2
       ) AND status = 'active'`,
      [plan, req.worker.phone]
    );
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/me/claims
router.get('/workers/me/claims', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.* FROM claims c
       JOIN workers w ON w.worker_id = c.worker_id
       WHERE w.phone = $1
       ORDER BY c.created_at DESC`,
      [req.worker.phone]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RISK / DISRUPTION
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/risk/zone?lat=&lng=
router.get('/risk/zone', async (req, res) => {
  try {
    // Return the first zone's risk level as a prototype approximation
    const result = await db.query(
      `SELECT risk_level, area_name, premium_multiplier FROM zones LIMIT 1`
    );
    const zone = result.rows[0] || { risk_level: 'MEDIUM', area_name: 'Your Zone' };
    res.json({ risk_level: zone.risk_level, area: zone.area_name });
  } catch (err) {
    res.json({ risk_level: 'MEDIUM', area: 'Unknown Zone' });
  }
});

// GET /api/risk/disruption-calendar
router.get('/risk/disruption-calendar', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DATE(triggered_at) AS date, trigger_type, severity
       FROM disruption_events
       ORDER BY triggered_at DESC LIMIT 30`
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// GET /api/risk/current
router.get('/risk/current', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT trigger_type, severity, triggered_at
       FROM disruption_events ORDER BY triggered_at DESC LIMIT 1`
    );
    res.json(result.rows[0] || { trigger_type: 'none', severity: 'LOW' });
  } catch (err) {
    res.json({ trigger_type: 'none', severity: 'LOW' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/notifications/prefs',    auth, (req, res) => res.json({ whatsapp: true, sms: false }));
router.put('/notifications/prefs',    auth, (req, res) => res.json({ success: true, ...req.body }));
router.post('/notifications/whatsapp/test', auth, (req, res) => res.json({ sent: true }));

// Bridge for P1 Worker PWA claim filing
router.post('/claims/create', claimController.createClaim);

module.exports = router;
