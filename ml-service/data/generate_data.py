import pandas as pd
import numpy as np

np.random.seed(42)
N = 2000

zones = ['560001', '560034', '110001', '400001', '600001',
         '500001', '411001', '380001', '302001', '700001']

# Realistic flood vulnerability per pincode (based on Indian city flood history)
flood_vuln_map = {
    '560001': 0.6,  # Bangalore - moderate
    '560034': 0.7,  # Koramangala - higher
    '110001': 0.3,  # Delhi - lower
    '400001': 0.8,  # Mumbai - high
    '600001': 0.5,  # Chennai - moderate
    '500001': 0.4,  # Hyderabad
    '411001': 0.5,  # Pune
    '380001': 0.3,  # Ahmedabad
    '302001': 0.2,  # Jaipur - low
    '700001': 0.65, # Kolkata - moderate-high
}

# ── Risk model data ───────────────────────────────────────────
risk_df = pd.DataFrame({
    'pincode':  np.random.choice(zones, N),
    'season':   np.random.choice(['monsoon', 'summer', 'winter', 'post_monsoon'], N),
    'rain_disruptions_3m': np.random.randint(0, 20, N),
    'aqi_disruptions_3m':  np.random.randint(0, 10, N),
    'heat_disruptions_3m': np.random.randint(0, 8,  N),
    'avg_claim_rate':      np.random.uniform(0, 0.5, N),
    'platform':   np.random.choice(['zepto', 'blinkit', 'swiggy'], N),
    'shift_type': np.random.choice(['morning', 'evening', 'night'], N),
    'imd_red_alert': np.random.randint(0, 2, N),         # NEW: IMD red alert flag
    'worker_claim_history': np.random.uniform(0, 1, N),  # NEW: per-worker past claim rate
})

risk_df['flood_vulnerability'] = risk_df['pincode'].map(flood_vuln_map)

def assign_risk(row):
    score = (
        row['rain_disruptions_3m'] / 20 * 0.35 +
        row['flood_vulnerability'] * 0.25 +
        row['aqi_disruptions_3m']  / 10 * 0.12 +
        row['heat_disruptions_3m'] / 8  * 0.10 +
        row['imd_red_alert'] * 0.10 +
        row['worker_claim_history'] * 0.08 +
        (0.15 if row['season'] == 'monsoon' else 0)
    )
    if score < 0.3:  return 0  # Low
    elif score < 0.6: return 1  # Medium
    else:             return 2  # High

risk_df['risk_label'] = risk_df.apply(assign_risk, axis=1)

# Simulate disruption hours target for regression model
risk_df['disruption_hours'] = (
    risk_df['rain_disruptions_3m'] * 0.15 +
    risk_df['aqi_disruptions_3m']  * 0.10 +
    risk_df['flood_vulnerability']  * 3.0  +
    risk_df['imd_red_alert']        * 1.5  +
    np.random.normal(0, 0.5, N)
).clip(0, 8)

risk_df.to_csv('data/risk_training_data.csv', index=False)
print("Risk data saved:", risk_df['risk_label'].value_counts().to_dict())

# ── Fraud model data ──────────────────────────────────────────
# Active disruptions for mock weather cross-check
ACTIVE_DISRUPTIONS = {
    ('560001', 'rain'), ('110001', 'aqi'),
    ('400001', 'rain'), ('700001', 'aqi'),
    ('500001', 'heat'),
}

pincodes      = np.random.choice(zones, N)
trigger_types = np.random.choice(['rain', 'aqi', 'heat', 'curfew', 'platform_down'], N)

fraud_df = pd.DataFrame({
    'pincode':                pincodes,
    'trigger_type':           trigger_types,
    'gps_accuracy_radius':    np.random.uniform(3, 120, N),
    'location_jump_velocity': np.random.uniform(0, 130, N),
    'cell_tower_match':       np.random.randint(0, 2, N),
    'platform_online_status': np.random.randint(0, 2, N),
    'claim_latency_seconds':  np.random.randint(10, 7200, N),
    'motion_detected':        np.random.randint(0, 2, N),
    'app_active':             np.random.randint(0, 2, N),
    'historical_claim_rate':  np.random.uniform(0, 1, N),
    'device_shared':          np.random.randint(0, 2, N),
    'disruption_start_epoch': np.full(N, 1711900800),
    'claim_submitted_epoch':  1711900800 + np.random.randint(-3600, 25200, N),
})

fraud_df['weather_verified'] = fraud_df.apply(
    lambda r: 1 if (r['pincode'], r['trigger_type']) in ACTIVE_DISRUPTIONS else 0, axis=1
)

def assign_fraud(row):
    score = 0
    if row['platform_online_status'] == 0:          score += 0.35
    if row['gps_accuracy_radius'] < 6:              score += 0.20
    if row['location_jump_velocity'] > 90:          score += 0.20
    if row['cell_tower_match'] == 0:                score += 0.15
    if row['claim_latency_seconds'] < 60:           score += 0.10
    if row['device_shared'] == 1:                   score += 0.10
    if row['weather_verified'] == 0:                score += 0.15
    time_since = row['claim_submitted_epoch'] - row['disruption_start_epoch']
    if time_since < 0 or time_since > 21600:        score += 0.20
    return 1 if score >= 0.5 else 0

fraud_df['is_fraud'] = fraud_df.apply(assign_fraud, axis=1)
fraud_df.to_csv('data/fraud_training_data.csv', index=False)
print("Fraud data saved:", fraud_df['is_fraud'].value_counts().to_dict())