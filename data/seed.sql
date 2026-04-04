-- ─────────────────────────────────────────────────────────────────────────────
-- GigShield Prototype — Seed SQL
-- Auto-executed by PostgreSQL on first container start (docker-entrypoint-initdb.d)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Zones ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id               SERIAL PRIMARY KEY,
  pincode          VARCHAR(10) UNIQUE NOT NULL,
  area_name        VARCHAR(100),
  coordinates      JSONB,
  risk_level       VARCHAR(10) DEFAULT 'LOW',   -- LOW | MEDIUM | HIGH
  premium_multiplier NUMERIC(4,2) DEFAULT 1.0
);

-- ── Workers (users) ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  worker_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(100),
  phone            VARCHAR(15) UNIQUE NOT NULL,
  zone_pincode     VARCHAR(10) REFERENCES zones(pincode),
  city             VARCHAR(50),
  platform         VARCHAR(50),   -- zepto | swiggy | blinkit | dunzo
  otp              VARCHAR(6),
  otp_expires_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Policies ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
  policy_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id        UUID REFERENCES workers(worker_id),
  zone_pincode     VARCHAR(10) REFERENCES zones(pincode),
  plan_type        VARCHAR(20),   -- Basic | Standard | Premium
  weekly_premium   NUMERIC(10,2),
  status           VARCHAR(10) DEFAULT 'active',  -- active | lapsed | cancelled
  week_start       DATE DEFAULT CURRENT_DATE
);

-- ── Disruption Events (from ML / IMD alerts) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS disruption_events (
  event_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_pincode     VARCHAR(10) REFERENCES zones(pincode),
  trigger_type     VARCHAR(30),   -- rain | aqi | heat | flood
  triggered_at     TIMESTAMPTZ DEFAULT NOW(),
  severity         VARCHAR(10) DEFAULT 'MEDIUM'  -- LOW | MEDIUM | HIGH
);

-- ── Claims ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
  claim_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id        UUID REFERENCES workers(worker_id),
  policy_id        UUID REFERENCES policies(policy_id),
  payout_amount    NUMERIC(10,2),
  fraud_score      NUMERIC(5,4) DEFAULT 0.0,
  fraud_signals    JSONB DEFAULT '[]',
  trigger_type     VARCHAR(30),
  status           VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected | auto_approved
  evidence_json    JSONB,
  reviewer_note    TEXT,
  reviewed_at      TIMESTAMPTZ,
  -- Legacy columns (P2 compatibility)
  user_id          INT,
  risk_score       FLOAT,
  tier             VARCHAR(10),
  in_risk_zone     BOOLEAN,
  lat              NUMERIC(9,6),
  lon              NUMERIC(9,6),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Legacy users table (P2 compatibility) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  phone            VARCHAR(15)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO zones (pincode, area_name, coordinates, risk_level, premium_multiplier) VALUES
  ('560001', 'MG Road',         '[[12.97,77.60],[12.98,77.60],[12.98,77.61],[12.97,77.61]]', 'LOW',    1.0),
  ('560034', 'Koramangala',     '[[12.93,77.62],[12.94,77.62],[12.94,77.63],[12.93,77.63]]', 'HIGH',   1.6),
  ('560045', 'Indiranagar',     '[[12.97,77.64],[12.98,77.64],[12.98,77.65],[12.97,77.65]]', 'MEDIUM', 1.3),
  ('560076', 'HSR Layout',      '[[12.91,77.64],[12.92,77.64],[12.92,77.65],[12.91,77.65]]', 'HIGH',   1.5),
  ('560102', 'Whitefield',      '[[12.96,77.74],[12.97,77.74],[12.97,77.75],[12.96,77.75]]', 'MEDIUM', 1.2),
  ('500081', 'Hitech City',     '[[17.44,78.38],[17.45,78.38],[17.45,78.39],[17.44,78.39]]', 'LOW',    1.0),
  ('400001', 'Fort — Mumbai',   '[[18.93,72.83],[18.94,72.83],[18.94,72.84],[18.93,72.84]]', 'MEDIUM', 1.4)
ON CONFLICT (pincode) DO NOTHING;

INSERT INTO workers (worker_id, name, phone, zone_pincode, platform) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Ravi Kumar',    '9876543210', '560034', 'zepto'),
  ('a0000001-0000-0000-0000-000000000002', 'Priya Sharma',  '9876543211', '560045', 'swiggy'),
  ('a0000001-0000-0000-0000-000000000003', 'Arjun Singh',   '9876543212', '560076', 'blinkit'),
  ('a0000001-0000-0000-0000-000000000004', 'Meena Reddy',   '9876543213', '560102', 'zepto'),
  ('a0000001-0000-0000-0000-000000000005', 'Suresh Patil',  '9876543214', '560001', 'swiggy')
ON CONFLICT DO NOTHING;

INSERT INTO policies (policy_id, worker_id, zone_pincode, plan_type, weekly_premium, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '560034', 'Premium',  350.00, 'active'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', '560045', 'Standard', 200.00, 'active'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', '560076', 'Basic',    100.00, 'active'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', '560102', 'Standard', 200.00, 'active'),
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', '560001', 'Premium',  350.00, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO disruption_events (zone_pincode, trigger_type, triggered_at, severity) VALUES
  ('560034', 'rain',  NOW() - INTERVAL '2 days',   'HIGH'),
  ('560034', 'flood', NOW() - INTERVAL '10 days',  'HIGH'),
  ('560076', 'rain',  NOW() - INTERVAL '5 days',   'MEDIUM'),
  ('560045', 'aqi',   NOW() - INTERVAL '15 days',  'LOW'),
  ('560034', 'rain',  NOW() - INTERVAL '30 days',  'MEDIUM'),
  ('560102', 'heat',  NOW() - INTERVAL '3 days',   'LOW');

INSERT INTO claims (claim_id, worker_id, policy_id, payout_amount, fraud_score, fraud_signals, trigger_type, status) VALUES
  ('c0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    1000.00, 0.83,
    '["location_jump_velocity","gps_accuracy_perfect"]',
    'rain', 'pending'),
  ('c0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000002',
    'b0000001-0000-0000-0000-000000000002',
    500.00, 0.12,
    '[]',
    'rain', 'approved'),
  ('c0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000003',
    'b0000001-0000-0000-0000-000000000003',
    200.00, 0.75,
    '["device_shared"]',
    'aqi', 'pending'),
  ('c0000001-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000004',
    'b0000001-0000-0000-0000-000000000004',
    500.00, 0.45,
    '["claim_latency_high"]',
    'heat', 'pending'),
  ('c0000001-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000005',
    'b0000001-0000-0000-0000-000000000005',
    1000.00, 0.05,
    '[]',
    'flood', 'approved')
ON CONFLICT DO NOTHING;
