

# GigShield — AI-Powered Parametric Income Insurance for Grocery Delivery Partners

## Guidewire DEVTrails 2026 | Phase 1 Submission

---

## 1. Problem Statement

India's quick commerce grocery delivery partners form the main workforce of large platforms such as Zepto, Blinkit and Swiggy Instamart. In a typical case:

For example, during times when weather is extremely bad (e.g. heavy rain, heatwave), air pollution levels are very high, government imposes curfew, or platforms are down, these workers face loss of 20–30% or even more of their weekly earnings without any form of financial protection.

What GigShield does to fix this is that it offers delivery partners automated, parametric income insurance, which means that the insurance payments are made based on the occurrence of certain pre-agreed external events, rather than on the filing of a claim.

---

## Sub-Category Selected

Grocery / Q-Commerce (Zepto, Blinkit, Swiggy Instamart)

---

## Why Grocery Delivery?

Grocery delivery workers are very exposed to risks because:

1. **Hyper-local, time-sensitive routes**
   These routes are strictly limited to 5–10 km zones, so the delivery workers are very vulnerable to the influence of local weather or any other sudden events of disruption.

2. **No platform buffer**
   In contrast to food delivery which involves restaurant preparation time, grocery delivery is done instantly; hence any disruption will immediately stop earning the delivery person.

3. **Peak hours overlap with disruption risk**
   The highest demand hours in the evening (6–9 PM) also happen to be the times when the monsoon storms occur.

---

### Persona Profile

| Attribute       | Detail                                      |
| --------------- | ------------------------------------------- |
| Platform        | Zepto / Blinkit / Swiggy Instamart          |
| Daily Earnings  | 700–1000                                    |
| Working Hours   | 8–10 hours/day                              |
| Weekly Earnings | 4,200–6,000                                 |
| Work Zone       | Hyperlocal (5–10 km radius)                 |
| Payment Cycle   | Weekly                                      |
| Risk Exposure   | Rain, heat, AQI, curfews, platform downtime |

---

### Persona-Based Scenario Workflows

**Scenario A — Heavy Rain Disruption:**

1. Delivery partner Ramesh is working the night shift around Koramangala, Bangalore
2. GigShield's weather trigger goes off by rain intensity hitting 70mm+
3. The system double-checks Ramesh's GPS position with the rain zone polygon
4. The claim is auto initiated; 1000 (Standard plan payout) is credited to UPI within minutes
5. Ramesh is informed via WhatsApp message regarding payment

---

**Scenario B — Severe AQI Alert:**

1. AQI in Delhi NCR reaches 350 (Hazardous level)
2. GigShield raises AQI disruption alert for all partners registered in affected pincode zones
3. Claims are batch-processed; the fraud detection system verifies that the policy is active + location matching is done
4. Payments are done automatically; worker need not do anything

---
**Scenario C Platform Outage:** 1. Delivery application suffers downtime for a duration of more than 2 hours 2. Platform API health monitor (mocked) detects and raises a downtime event 3.

Partners with active policies in the affected region are identified 4. Claims are initiated, and payouts processed within the disruption period --- ## 3. Weekly Premium Model GigShield is based solely on the weekly pricing model that is naturally in line with the gig worker's earnings and pay cycle.

### Plans

| Plan | Weekly Premium | Max Payout/Week | Coverage Hours | Disruptions Covered |
|---|---|---|---|---|
| Basic | ₹10/week | ₹500 | Up to 4 hours | Rain, Heat |
| Standard | ₹20/week | ₹1000 | Up to 6 hours | Rain, Heat, AQI, Curfew |
| Premium | ₹30/week | ₹1500 | Up to 8 hours | All triggers including Platform Downtime |


## How the Weekly Model Works

---

## Premium Calculation Logic (AI-Driven)

The AI modifies the base premium by factoring in a risk multiplier:

```
Adjusted Premium = Base Premium × Risk Multiplier

Risk Multiplier = f(
  historical_disruption_frequency_in_zone,
  current_season_risk_score,
  worker_claim_history,
  zone_flood_vulnerability_index
)
```

For instance, a worker living in a flood-prone zone during the monsoon getting a Standard plan may find it ₹25/week instead of ₹20. On the other hand, a worker in a low-risk zone may pay ₹17/week.

---

## Financial Viability: Surviving a Catastrophic Weather Event

**The Risk:**

Consider a day when 1,000 Standard plan holders are in Bangalore during a big rainy season. GigShield will get only ₹20,000 as premiums but must pay up to ₹1,000,000 at the same time.

This problem is called **correlated risk**, when a single event affects everyone at the same time.

## How GigShield Responds to These

1. **Seasonal premium spike:**
   The system adjusts premium fairly and automatically based on season changes. For example, before the onset of monsoon season (June–September) or if the IMD issues a red alert, AI will automatically increase premiums. The Standard plan can be raised from ₹20 to ₹80–100/week in risky areas. Workers will receive a 2-week notice of the change and may decline, but only with surge pricing will they be covered during the season.

2. **Liquidity pool cap (payout throttling):**
   The total amount of cash handed out to all claimants in one disruption event cannot exceed 3 times the premium pool collected that week. Say, if the pool is ₹20,000, the total amount paid out cannot go beyond ₹60,000. To the extent the cap is reached, individual claim payments will be downscaled proportionally, and the left-out amount will be carried forward to the next week.

3. **Reinsurance Layer (Phase 3):**
   The implementation of a simulated reinsurance partner will be considered by GigShield, giving it a buffer to handle catastrophic losses beyond 5× the premium pool. Keeping the platform solvent during black swan events is an established industry standard.

---

Therefore, the model remains actuarially balanced: premium increases as risk increases while payouts are limited by the pool and not solely by the individual plan limits.

---


## Parametric Triggers

Triggers are sourced and tracked live via public/mock APIs. A trigger event is recorded, and thus the claim pipeline automatically begins without the worker's intervention.

**Note:** The only losses compensated are for the working hours affected by the disruption. Vehicle damage, health problems, or other related costs are strictly excluded as per competition rules.

---

## Trigger Validation Pipeline

```
External API Poll (every 15 min)
        ↓
Condition Threshold Check
        ↓
Zone Polygon Matching (worker GPS vs disruption area)
        ↓
Active Shift Verification (Platform API: worker status = "Online")
        ↓
Active Policy Verification
        ↓
Fraud Detection Layer
        ↓
Auto Claim Initiation
        ↓
Payout Processing
```

---
## Active Shift Verification

**The Risk:**
A worker's GPS location may be accurately inside a storm area even though they are at home on their day off.

If no shift verification is done, the system would mistakenly pay work income that was never impaired.

---

**The Fix:**
GigShield connects with the delivery platform's Partner API (or a substitute mock) to check that the worker's status was set to **"Online / Ready to Deliver"** exactly when the disruption trigger activated. Payments are made only if both conditions are true at the same time.

If a worker is Offline (day off, voluntarily inactive, or logged out), no submission happens — even if weather is bad.

This one rule sorts out the "sitting at home on a rainy day" loophole completely.

---

## Risk Assessment Model

**Goal:**
Assess weekly likelihood of different zones' disruptions to be able to adjust the premium prices dynamically.

---

**Features used:**

---

**Model:**
The final solution was a combination of XGBoost classifier predicting the risk categories weekly (Low/Medium/High) and regression for forecasting disruption hours.

---

**Output:**
Zone-wise Risk Score (0–1); the final result is a premium multiplier.

---

## Data Granularity & Fallback Strategy

India's weather station network doesn't provide hyper-local historical data for every 6-digit pincode. GigShield manages this through a three-tier data fallback:

1. **Tier 1 (Preferred):**
   Exact pincode-level data, obtained from either OpenWeatherMap's historical archive or IMD station data if available

---

## Fraud Detection System

**Goal:**
Help the insurance company reduce the fraudulent claims to the minimum.

---

**Signals checked:**

* **GPS location mismatch:** the last GPS location of the worker that was saved vs the location of the disruption zone
* **Claim timing anomaly:** the claim was filed outside of the disruption window
* **Device fingerprint:** more than one claim came from the same device ID but for different workers
* **Historical pattern:** the claim rate per worker is high in comparison to the baseline for the zone
* **Weather data cross-check:** the disruption claim was made to the system vs the actual API data for that location and time

---

**Model:**
Isolation Forest for anomaly detection on claim features + rule-based hard filters for GPS spoofing and duplicate prevention.

---

**Fraud Score:**
Each claim receives a fraud score (0–1). Scores over 0.7 go to officers for further review. Scores over 0.9 lead to automatic rejection.

---
### 5. 3 Dynamic Premium Calculation
**Goal:** Change insurance prices according to actual risk, not by a standard rate. Onboarding info that the system uses are: - Worker's operating zone (pincode) - Platform (Zepto/Blinkit/Swiggy Instamart) - Shift hours (morning/evening) The risk model gives a recommended premium.

Workers can get a fully transparent view: "The zone you live in had 12 rain disruptions during last 3 months your premium is a reflection of this risk. " ---
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

### Phase 1 (Weeks 1–2): Ideation & Foundation

* Identify the persona and use cases
* Design weekly premium model and trigger logic
* Design system architecture
* Set up GitHub repository and project structure
* Create basic UI wireframes

---

### Phase 2 (Weeks 3–4): Automation & Protection

* Implement worker registration and onboarding flow
* Build insurance policy management (create, view, renew)
* Integrate weather and AQI APIs (free tier)
* Implement dynamic premium calculation with AI risk model
* Build claims management module
* Implement 3–5 automated parametric triggers
* Basic fraud detection rules

---

### Phase 3 (Weeks 5–6): Scale & Optimise

* Advanced ML-based fraud detection (Isolation Forest)
* Razorpay test mode integration for instant payouts
* Worker dashboard (earnings protected, active coverage, claim history)
* Admin/insurer dashboard (loss ratios, predictive disruption analytics)
* Final demo video and pitch deck preparation

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

## Coverage Constraints

GigShield explicitly **EXCLUDES** the following from all plans:

GigShield **ONLY compensates loss of earnings** arising from external disruption events which directly prevent a delivery partner from completing their shift.

---

## Market Crash Compliance Update

Added in response to the Phase 1 mandatory security directive.

A coordinated syndicate of 500 workers exploited a competing platform using GPS-spoofing apps.

GigShield's architecture has been hardened to address this threat class directly.

Simple GPS verification alone will no longer be enough. GigShield has deployed an extra layer — a multi-signal behavioral authentication that renders large-scale GPS spoofing both economically and technically impractical.

---
## Behavioral Signal Analysis

Two totally different behavioral signatures result from this: a genuine stranded delivery partner and a bad actor spoofing their GPS.

GigShield's fraud engine is capable of analyzing all of these different data streams at the same time:

---

### Signal Comparison

| Signal                   | Genuine Worker (In Storm)                                        | GPS Spoofer (At Home)                                                               |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Accelerometer / Motion   | The phone is moving erratically (rain, wind, bumps)              | The phone is stationary or is lying on a flat surface                               |
| Network Cell Tower ID    | The tower is the same as the one by the claimed GPS location     | The tower ID corresponds to the home neighborhood, not the storm zone               |
| Battery & Charging State | Unpredictable battery drain; possibility of used bike power bank | Likely plugged into home charger                                                    |
| App Activity Pattern     | The delivery app is open, map is active, frequent GPS pings      | The delivery app is either closed or running in the background                      |
| Platform Online Status   | Status "Online" before and during the disruption                 | Status never changed to "Online" that day                                           |
| GPS Accuracy Radius      | A bit less accurate during rain time (normal)                    | Stands out with a suspiciously perfect accuracy (spoofers output clean coordinates) |
| Location Jump Velocity   | At realistic delivery speed                                      | Instantly teleports or moves at an impossible speed between pings                   |

---

The fraud engine takes in all these signals and combines them into one "ensemble" model (Isolation Forest for anomaly detection + a behavioral sequence classifier).

A GPS-only spoofer will set off 4–5 of these signals at the same time. As a result, a high fraud score is produced that automatically rejects the claim.

---
### 11.2 The Data: Detecting a Coordinated Fraud Ring

Individual bad actors are detectable.
Coordinated syndicates of 500 workers require **graph-level analysis**, not just per-claim checks.
**Data points collected beyond GPS:**
1. **Device fingerprint cluster analysis** — If 50 claims arrive within the same 10-minute window, all from devices that installed the same GPS-spoofing app (detected via app signature hash stored at onboarding), this is a coordinated ring signature.

2. **Claim timing spike detection** — During a verified disruption event, legitimate claims arrive in a **Poisson distribution** over time (random, organic). Coordinated fraud produces a **spike pattern** — many claims submitted almost simultaneously after a trigger fires. The system flags batches where >30 claims arrive within a 2-minute window from the same zone.

3. **Network topology fingerprint** — Cell tower IDs and Wi-Fi SSIDs (collected with consent at onboarding for fraud prevention) are cross-checked against the claimed GPS zone. A worker claiming to be in Koramangala but whose phone is connected to a home Wi-Fi in Whitefield is immediately flagged.

4. **Claim-to-disruption latency** — Genuine workers trigger claims within 5–20 minutes of a disruption starting. Syndicate members, watching for alerts on Telegram, often claim within seconds. Claims with sub-60-second latency from trigger fire to claim submission are scored higher for fraud.

5. **Cross-worker behavioral graph** — If Workers A, B, C, and D all claim the same event, with identical app-open timestamps, identical GPS accuracy values, and all connected to the same cell tower — they are graph-linked as a potential ring and all four claims are simultaneously escalated.

---

### 11.3 The UX Balance: Protecting Honest Workers from False Positives

Heavy rain causes real GPS inaccuracy, poor connectivity, and unusual phone behavior — exactly the conditions a naive fraud model would flag. GigShield uses a **four-tier response system** that scales friction with fraud score, never penalizing honest workers with complex verification:

| Tier | Fraud Score | Response | Worker Experience |
|---|---|---|---|
| **Auto-Approved** | < 0.4 | Instant payout | "✅ Claim approved — ₹1000 credited" |
| **Soft Challenge** | 0.4–0.7 | One-tap location ping via WhatsApp | Single button press; resolved in <30 min |
| **Manual Review** | 0.7–0.9 | Human reviewer within 4 hours | Notified with ETA; ₹50 credit if legitimate |
| **Auto-Rejected** | > 0.9 | Claim denied with clear reason | One appeal/quarter via 10-sec video |

**Key principle:** The burden of proof scales with the fraud score. Honest workers experiencing genuine network drops in bad weather will almost never reach Tier 3 or 4 — their motion sensor data, cell tower signal, and platform status will corroborate their claim even when GPS is inaccurate. Spoofers, lacking any of these corroborating signals, cannot clear even the Tier 2 soft challenge.

---

## 12. Innovation Beyond the Brief

1. **Zone-Level Risk Maps** — Visual heatmap showing historical disruption frequency per delivery zone, helping workers understand why their premium is priced the way it is (transparency builds trust)
2. **WhatsApp-First Notifications** — All claim updates delivered via WhatsApp (no app required for notifications), reaching workers on the channel they already use
3. **Micro-Insurance Bundles** — Allow platforms (Zepto, Blinkit) to pre-purchase insurance blocks for their delivery fleet at a discounted rate, improving adoption
4. **Disruption Calendar** — Predictive calendar showing high-risk weeks (e.g., "Monsoon season begins next week — upgrade to Premium for ₹10 more")

---

*Submitted for Guidewire DEVTrails 2026 | Phase 1 Deadline: March 20, End of Day*
