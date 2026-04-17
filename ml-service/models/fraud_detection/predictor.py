import joblib
import numpy as np
import requests
import os

_model = joblib.load('models/fraud_model.pkl')

TIER_MAP = [
    (0.4, 'auto_approved'),
    (0.7, 'soft_challenge'),
    (0.9, 'manual_review'),
    (1.1, 'auto_rejected'),
]

TIER_ACTIONS = {
    'auto_approved':  'Instant payout processed',
    'soft_challenge': 'One-tap WhatsApp location ping sent',
    'manual_review':  'Queued for human review within 4 hours',
    'auto_rejected':  'Claim denied — appeal available',
}

# ── Pincode → approximate lat/lon mapping ─────────────────────
# For production: replace with a full pincode geocoding DB or API.
PINCODE_COORDS = {
    '560001': (12.9716, 77.5946),  # Bangalore
    '110001': (28.6139, 77.2090),  # Delhi
    '400001': (18.9388, 72.8354),  # Mumbai
    '700001': (22.5726, 88.3639),  # Kolkata
    '500001': (17.3850, 78.4867),  # Hyderabad
    '600001': (13.0827, 80.2707),  # Chennai
    '411001': (18.5204, 73.8567),  # Pune
    '302001': (26.9124, 75.7873),  # Jaipur
    '380001': (23.0225, 72.5714),  # Ahmedabad
    '226001': (26.8467, 80.9462),  # Lucknow
}

# Fallback hardcoded set used only when Open-Meteo is unavailable
_FALLBACK_DISRUPTIONS = {
    ('560001', 'rain'), ('110001', 'aqi'),
    ('400001', 'rain'), ('700001', 'aqi'),
    ('500001', 'heat'),
}

def _verify_disruption_via_openmeteo(pincode: str, trigger_type: str) -> bool:
    """
    Calls Open-Meteo current weather API to verify a real disruption
    exists at the claimed pincode.
    
    Thresholds:
      rain  → precipitation > 5 mm in last hour
      aqi   → pm10 > 150 µg/m³  (Open-Meteo Air Quality API)
      heat  → temperature > 40°C
    """
    coords = PINCODE_COORDS.get(pincode)
    if not coords:
        # Unknown pincode: cannot verify → treat as unverified
        return False

    lat, lon = coords
    timeout = int(os.environ.get('WEATHER_API_TIMEOUT', '5'))

    try:
        if trigger_type in ('rain',):
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&current=precipitation"
                f"&timezone=auto"
            )
            r = requests.get(url, timeout=timeout)
            r.raise_for_status()
            precip = r.json()['current'].get('precipitation', 0)
            return precip > 5.0  # mm

        elif trigger_type in ('aqi',):
            url = (
                f"https://air-quality-api.open-meteo.com/v1/air-quality"
                f"?latitude={lat}&longitude={lon}"
                f"&current=pm10"
                f"&timezone=auto"
            )
            r = requests.get(url, timeout=timeout)
            r.raise_for_status()
            pm10 = r.json()['current'].get('pm10', 0)
            return pm10 > 150  # µg/m³

        elif trigger_type in ('heat',):
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m"
                f"&timezone=auto"
            )
            r = requests.get(url, timeout=timeout)
            r.raise_for_status()
            temp = r.json()['current'].get('temperature_2m', 0)
            return temp > 40.0  # °C

        else:
            # Unknown trigger type → cannot verify
            return False

    except Exception as e:
        print(f"[Weather API] Open-Meteo call failed for {pincode}/{trigger_type}: {e}")
        # Graceful fallback to hardcoded set rather than hard-blocking all claims
        return (pincode, trigger_type) in _FALLBACK_DISRUPTIONS


def _verify_disruption_was_real(pincode: str, trigger_type: str) -> bool:
    return _verify_disruption_via_openmeteo(pincode, trigger_type)


# ── Main fraud scorer ─────────────────────────────────────────
def score_fraud(
    pincode: str,
    trigger_type: str,
    gps_accuracy_radius: float,
    location_jump_velocity: float,
    cell_tower_match: int,
    platform_online_status: int,
    claim_latency_seconds: int,
    motion_detected: int,
    app_active: int,
    historical_claim_rate: float,
    device_shared: int,
    disruption_start_epoch: int,
    claim_submitted_epoch: int,
) -> dict:

    # ── Fix 1: Hard block — shift verification ────────────────
    if platform_online_status == 0:
        return {
            'fraud_score': 1.0,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim blocked — worker was offline during disruption',
            'block_reason': ['shift_verification_failed'],
        }

    # ── Claim window validation ───────────────────────────────
    DISRUPTION_WINDOW_SECONDS = 6 * 3600
    time_since_trigger = claim_submitted_epoch - disruption_start_epoch

    if time_since_trigger < 0 or time_since_trigger > DISRUPTION_WINDOW_SECONDS:
        return {
            'fraud_score': 0.92,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim denied — filed outside disruption window',
            'block_reason': ['outside_disruption_window'],
        }

    # ── Real weather cross-check via Open-Meteo ───────────────
    weather_verified = _verify_disruption_was_real(pincode, trigger_type)
    if not weather_verified:
        return {
            'fraud_score': 0.95,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim denied — no verified disruption at this location',
            'block_reason': ['weather_cross_check_failed'],
        }

    # ── Rule-based hard filters ───────────────────────────────
    hard_block_reasons = []

    if location_jump_velocity > 100:
        hard_block_reasons.append('impossible_location_velocity')

    if gps_accuracy_radius < 5 and cell_tower_match == 0:
        hard_block_reasons.append('gps_spoof_signature')

    if device_shared == 1 and claim_latency_seconds < 60:
        hard_block_reasons.append('coordinated_device_fraud')

    if hard_block_reasons:
        return {
            'fraud_score': 0.95,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': TIER_ACTIONS['auto_rejected'],
            'block_reason': hard_block_reasons,
        }

    # ── Isolation Forest (ML layer) ───────────────────────────
    features = [[
        gps_accuracy_radius,
        location_jump_velocity,
        cell_tower_match,
        platform_online_status,
        claim_latency_seconds,
        motion_detected,
        app_active,
        historical_claim_rate,
        device_shared,
        int(weather_verified),
    ]]

    raw_score   = _model.decision_function(features)[0]
    fraud_score = float(np.clip(0.5 - raw_score, 0, 1))
    fraud_score = round(fraud_score, 3)

    tier = 'auto_rejected'
    for threshold, label in TIER_MAP:
        if fraud_score < threshold:
            tier = label
            break

    return {
        'fraud_score':  fraud_score,
        'is_fraud':     fraud_score >= 0.7,
        'tier':         tier,
        'action':       TIER_ACTIONS[tier],
        'block_reason': [],
    }
