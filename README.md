# GigShield — AI-Powered Parametric Income Insurance for Grocery Delivery Partners

## Guidewire DEVTrails 2026 | Phase 1 Submission

---

## 1. Problem Statement

India's quick-commerce grocery delivery partners are the backbone of platforms like Zepto, Blinkit, and Swiggy Instamart. A typical grocery delivery partner:

- Earns ₹700–₹1000/day depending on number of completed deliveries
- Works 8–10 hours per day, 6–7 days a week
- Has zero income protection against external disruptions

When extreme weather (heavy rain, heatwave), severe air pollution, government curfews, or platform outages occur, these workers lose 20–30% or more of their weekly earnings with absolutely no financial safety net.

**GigShield** solves this by providing automated, parametric income insurance — where payouts are triggered by pre-defined external conditions, not manual claims.

---

## 2. Persona: Grocery/Q-Commerce Delivery Partner

**Chosen Sub-Category:** Grocery / Q-Commerce (Zepto, Blinkit, Swiggy Instamart)

### Why Grocery Delivery?

Grocery delivery partners are particularly vulnerable because:

1. **Hyper-local, time-sensitive routes** — they operate within 5–10 km zones, making them highly exposed to local weather or disruption events
2. **No platform buffer** — unlike food delivery with restaurant preparation time, grocery delivery is immediate; any disruption instantly halts income
3. **Peak hours overlap with disruption risk** — evening peak hours (6–9 PM) coincide with storm windows in monsoon season

### Persona Profile

| Attribute | Detail |
|---|---|
| Platform | Zepto / Blinkit / Swiggy Instamart |
| Daily Earnings | ₹700–₹1000 |
| Working Hours | 8–10 hours/day |
| Weekly Earnings | ₹4,200–₹6,000 |
| Work Zone | Hyperlocal (5–10 km radius) |
| Payment Cycle | Weekly |
| Risk Exposure | Rain, heat, AQI, curfews, platform downtime |

### Persona-Based Scenario Workflows

**Scenario A — Heavy Rain Disruption:**
1. Delivery partner Ramesh is on shift in Koramangala, Bangalore
2. Rainfall exceeds 70mm; GigShield's weather trigger fires
3. System cross-validates Ramesh's GPS location against rain zone polygon
4. Claim auto-initiated; ₹1000 (Standard plan payout) credited to UPI within minutes
5. Ramesh receives WhatsApp notification confirming payout

**Scenario B — Severe AQI Alert:**
1. AQI in Delhi NCR crosses 350 (Hazardous)
2. GigShield triggers AQI disruption event for all registered partners in affected pincode zones
3. Claims batch-processed; fraud detection verifies active policy + location match
4. Payouts issued automatically; no action required from worker

**Scenario C — Platform Outage:**
1. Delivery app experiences downtime for >2 hours
2. Platform API health monitor (mocked) triggers downtime event
3. Partners with active policies in affected region are identified
4. Claims initiated and payouts processed within the disruption window

---

## 3. Weekly Premium Model

GigShield is structured entirely on a **weekly pricing model** aligned with the gig worker's natural earnings and payment cycle.

### Plans

| Plan | Weekly Premium | Max Payout/Week | Coverage Hours | Disruptions Covered |
|---|---|---|---|---|
| Basic | ₹10/week | ₹500 | Up to 4 hours | Rain, Heat |
| Standard | ₹20/week | ₹1000 | Up to 6 hours | Rain, Heat, AQI, Curfew |
| Premium | ₹30/week | ₹1500 | Up to 8 hours | All triggers including Platform Downtime |

### How the Weekly Model Works

- Worker purchases a plan every Monday (or on first login of the week)
- Coverage is active for 7 consecutive days from purchase
- Premiums are debited from a linked UPI or wallet
- All payouts are calculated based on **lost income during disruption hours**, not a flat amount
- If a worker earns ₹100/hour and a 5-hour rain disruption occurs, and they hold a ₹20 plan (max ₹1000), they receive ₹500 (5 hrs × ₹100)

### Premium Calculation Logic (AI-Driven)

The AI dynamically adjusts the base premium using a risk multiplier:

```
Adjusted Premium = Base Premium × Risk Multiplier

Risk Multiplier = f(
  historical_disruption_frequency_in_zone,
  current_season_risk_score,
  worker_claim_history,
  zone_flood_vulnerability_index
)
```

Example: A worker in a historically flood-prone zone during monsoon season may see a Standard plan priced at ₹25/week instead of ₹20, while a worker in a low-risk zone may pay ₹17/week.

---

## 4. Parametric Triggers

Triggers are monitored in real-time through public/mock APIs. A trigger automatically initiates the claim pipeline without any manual input from the worker.

| Trigger | API Source | Condition | Income Loss Basis |
|---|---|---|---|
| Heavy Rain | OpenWeatherMap API | Rainfall > 70mm in 6h window | Deliveries impossible; full hours lost |
| Heatwave | OpenWeatherMap API | Temperature > 45°C | Outdoor work halted; partial hours lost |
| Severe Air Pollution | AQICN API / OpenAQ | AQI > 350 (Hazardous) | Worker unable to safely operate |
| Government Curfew | News/Alert API (mocked) | Verified official curfew notice | Full shift coverage |
| Platform Downtime | Platform Health Monitor (mocked) | >2 consecutive hours of downtime | Proportional income loss |

> **Note:** Only income loss during the disruption window is covered. Vehicle damage, health issues, or other costs are explicitly excluded as per competition constraints.

### Trigger Validation Pipeline

```
External API Poll (every 15 min)
        ↓
Condition Threshold Check
        ↓
Zone Polygon Matching (worker GPS vs disruption area)
        ↓
Active Policy Verification
        ↓
Fraud Detection Layer
        ↓
Auto Claim Initiation → Payout Processing
```

---

## 5. AI/ML Integration Plan

### 5.1 Risk Assessment Model

**Goal:** Predict disruption risk per zone per week to dynamically price premiums.

**Features used:**
- Historical rainfall/temperature/AQI data per pincode (past 2 years)
- Zone flood vulnerability index
- Seasonal patterns (monsoon months, summer)
- Worker's past claim frequency (to adjust individual risk score)

**Model:** Gradient Boosting (XGBoost) classifier for weekly risk category (Low/Medium/High) + regression for expected disruption hours.

**Output:** Risk Score (0–1) per zone → mapped to premium multiplier

### 5.2 Fraud Detection System

**Goal:** Detect and block illegitimate claims.

**Signals monitored:**
- GPS location mismatch — worker's last known GPS vs disruption zone boundary
- Claim timing anomaly — claim submitted outside disruption window
- Device fingerprint — multiple claims from same device ID for different workers
- Historical pattern — unusually high claim rate compared to zone baseline
- Weather data cross-check — submitted disruption claim vs actual API data for that location and time

**Model:** Isolation Forest for anomaly detection on claim features + rule-based hard filters for GPS spoofing and duplicate prevention.

**Fraud Score:** Every claim gets a fraud score (0–1). Scores above 0.7 are flagged for manual review; scores above 0.9 are auto-rejected.

### 5.3 Dynamic Premium Calculation

**Goal:** Price insurance fairly based on actual risk, not flat rates.

At onboarding, the system pulls:
- Worker's operating zone (pincode)
- Platform (Zepto/Blinkit/Swiggy Instamart)
- Shift hours (morning/evening)

The risk model outputs a premium recommendation. Workers can see a transparent breakdown: "Your zone has had 12 rain disruptions in the past 3 months — your premium reflects this risk."

---

## 6. Platform Choice: Web (Progressive Web App)

**Justification:**

- Grocery delivery partners primarily use Android phones with varying RAM/storage
- A PWA (Progressive Web App) works like a native app without requiring Play Store installation
- Offline support for areas with poor connectivity
- WhatsApp integration for claim notifications and status updates (accessible to all users)
- Admin/insurer dashboard runs on full web (React)

**Worker-facing UI:** Lightweight PWA (React + Tailwind)
**Admin/Insurer dashboard:** Full React web app

---

## 7. Tech Stack

### Frontend
- **Worker App:** React PWA (Progressive Web App), Tailwind CSS
- **Admin Dashboard:** React + Recharts for analytics

### Backend
- **API Server:** Node.js + Express (REST APIs)
- **AI/ML Services:** Python (FastAPI) — separate microservice for risk model and fraud detection
- **Trigger Monitor:** Node.js cron service (polls external APIs every 15 minutes)

### Database
- **Primary:** PostgreSQL (users, policies, claims, payouts)
- **Cache:** Redis (trigger event deduplication, session management)

### External APIs
- **Weather:** OpenWeatherMap API (free tier)
- **Air Quality:** AQICN / OpenAQ API (free tier)
- **Location/Maps:** OpenStreetMap / Google Maps API
- **Curfew/Alerts:** Mocked JSON service simulating government alerts

### Payment Simulation
- **Razorpay** test mode (UPI simulation)
- Stripe sandbox (backup)

### AI/ML Libraries
- **scikit-learn / XGBoost** — risk scoring and premium calculation
- **Isolation Forest** (sklearn) — anomaly detection for fraud
- **Pandas / NumPy** — feature engineering

### Infrastructure
- **Hosting:** Render / Railway (backend), Vercel (frontend)
- **Version Control:** GitHub

---

## 8. Development Plan

### Phase 1 (Weeks 1–2): Ideation & Foundation ✅
- [x] Define persona and use cases
- [x] Design weekly premium model and trigger logic
- [x] Design system architecture
- [x] Set up GitHub repository and project structure
- [x] Build basic UI wireframes

### Phase 2 (Weeks 3–4): Automation & Protection
- [ ] Implement worker registration and onboarding flow
- [ ] Build insurance policy management (create, view, renew)
- [ ] Integrate weather and AQI APIs (free tier)
- [ ] Implement dynamic premium calculation with AI risk model
- [ ] Build claims management module
- [ ] Implement 3–5 automated parametric triggers
- [ ] Basic fraud detection rules

### Phase 3 (Weeks 5–6): Scale & Optimise
- [ ] Advanced ML-based fraud detection (Isolation Forest)
- [ ] Razorpay test mode integration for instant payouts
- [ ] Worker dashboard (earnings protected, active coverage, claim history)
- [ ] Admin/insurer dashboard (loss ratios, predictive disruption analytics)
- [ ] Final demo video and pitch deck preparation

---

## 9. Repository Structure

```
gigshield/
├── frontend/               # React PWA (worker app + admin dashboard)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
├── backend/                # Node.js + Express API server
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── services/
│       └── triggerMonitor/ # Cron service for API polling
├── ml-service/             # Python FastAPI for AI/ML
│   ├── risk_model/
│   └── fraud_detection/
├── data/                   # Mock data and seed files
├── docs/                   # Architecture diagrams
└── README.md
```

---

## 10. Coverage Constraints (As per Problem Statement)

GigShield explicitly **EXCLUDES** the following from all plans:
- Health insurance or medical bill coverage
- Life insurance
- Accident coverage
- Vehicle repair or maintenance costs

GigShield **ONLY** covers **income loss** caused by **external disruption events** that prevent a delivery partner from completing their shift.

---

## 11. Innovation Beyond the Brief

1. **Zone-Level Risk Maps** — Visual heatmap showing historical disruption frequency per delivery zone, helping workers understand why their premium is priced the way it is (transparency builds trust)
2. **WhatsApp-First Notifications** — All claim updates delivered via WhatsApp (no app required for notifications), reaching workers on the channel they already use
3. **Micro-Insurance Bundles** — Allow platforms (Zepto, Blinkit) to pre-purchase insurance blocks for their delivery fleet at a discounted rate, improving adoption
4. **Disruption Calendar** — Predictive calendar showing high-risk weeks (e.g., "Monsoon season begins next week — upgrade to Premium for ₹10 more")

---

*Submitted for Guidewire DEVTrails 2026 *
