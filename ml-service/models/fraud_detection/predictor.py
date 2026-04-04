import joblib
import numpy as np

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

# ── Mock weather cross-check ──────────────────────────────────
# In production: call OpenWeatherMap historical API here.
# For prototype: hardcoded active disruptions per pincode + type.
ACTIVE_DISRUPTIONS = {
    ('560001', 'rain'), ('110001', 'aqi'),
    ('400001', 'rain'), ('700001', 'aqi'),
    ('500001', 'heat'),
}

def _verify_disruption_was_real(pincode: str, trigger_type: str) -> bool:
    return (pincode, trigger_type) in ACTIVE_DISRUPTIONS

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
    # Spec: "no submission happens if worker is Offline"
    if platform_online_status == 0:
        return {
            'fraud_score': 1.0,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim blocked — worker was offline during disruption',
            'block_reason': ['shift_verification_failed'],
        }

    # ── Fix 3: Claim window validation ───────────────────────
    # Spec: "claim filed outside disruption window" is a timing anomaly
    DISRUPTION_WINDOW_SECONDS = 6 * 3600   # must claim within 6 hours of trigger
    time_since_trigger = claim_submitted_epoch - disruption_start_epoch

    if time_since_trigger < 0 or time_since_trigger > DISRUPTION_WINDOW_SECONDS:
        return {
            'fraud_score': 0.92,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim denied — filed outside disruption window',
            'block_reason': ['outside_disruption_window'],
        }

    # ── Fix 5: Weather cross-check ────────────────────────────
    # Spec: "verify disruption claim against actual API data"
    weather_verified = _verify_disruption_was_real(pincode, trigger_type)
    if not weather_verified:
        return {
            'fraud_score': 0.95,
            'is_fraud': True,
            'tier': 'auto_rejected',
            'action': 'Claim denied — no verified disruption at this location',
            'block_reason': ['weather_cross_check_failed'],
        }

    # ── Fix 2: Rule-based hard filters ───────────────────────
    # Spec: "hard filters for GPS spoofing and duplicate prevention"
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
    # Runs only if all hard filters pass
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