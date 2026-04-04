import joblib
import numpy as np

_model     = joblib.load('models/risk_model.pkl')
_encoders  = joblib.load('models/risk_encoders.pkl')
_reg_model = joblib.load('models/disruption_hours_model.pkl')

MULTIPLIER_MAP = {0: 0.85, 1: 1.0, 2: 1.35}
RISK_LABEL_MAP = {0: 'Low', 1: 'Medium', 2: 'High'}

# ── Three-tier pincode fallback ───────────────────────────────
# Tier 1: exact pincode known → use directly
# Tier 2: pincode unknown → map to nearest district pincode
# Tier 3: district unknown → use state-level default
DISTRICT_FALLBACK = {
    '560': '560001', '110': '110001', '400': '400001',
    '600': '600001', '500': '500001', '411': '411001',
    '380': '380001', '302': '302001', '700': '700001',
}
STATE_DEFAULT_PINCODE = '560001'  # Tier 3: generic fallback

def resolve_pincode(pincode: str, encoder) -> int:
    if pincode in encoder.classes_:
        return int(encoder.transform([pincode])[0])         # Tier 1
    district = pincode[:3]
    fallback = DISTRICT_FALLBACK.get(district, STATE_DEFAULT_PINCODE)
    if fallback in encoder.classes_:
        return int(encoder.transform([fallback])[0])        # Tier 2
    return 0                                                 # Tier 3

def safe_encode(encoder, value) -> int:
    if value in encoder.classes_:
        return int(encoder.transform([value])[0])
    return 0

def score_risk(
    pincode: str,
    season: str,
    platform: str,
    shift_type: str,
    rain_disruptions_3m: int,
    aqi_disruptions_3m: int,
    heat_disruptions_3m: int,
    flood_vulnerability: float,
    avg_claim_rate: float,
    imd_red_alert: int = 0,
    worker_claim_history: float = 0.1,
) -> dict:

    features = [[
        resolve_pincode(pincode, _encoders['pincode']),
        safe_encode(_encoders['season'],   season),
        safe_encode(_encoders['platform'], platform),
        safe_encode(_encoders['shift'],    shift_type),
        rain_disruptions_3m,
        aqi_disruptions_3m,
        heat_disruptions_3m,
        flood_vulnerability,
        avg_claim_rate,
        imd_red_alert,
        worker_claim_history,
    ]]

    risk_class    = int(_model.predict(features)[0])
    probabilities = _model.predict_proba(features)[0].tolist()
    multiplier    = MULTIPLIER_MAP[risk_class]

    predicted_hours = float(_reg_model.predict(features)[0])
    predicted_hours = round(max(0.0, predicted_hours), 2)

    base_premiums = {'Basic': 10, 'Standard': 20, 'Premium': 30}

    return {
        'risk_label':       RISK_LABEL_MAP[risk_class],
        'risk_score':       round(float(probabilities[risk_class]), 3),
        'premium_multiplier': multiplier,
        'adjusted_premiums': {
            plan: round(base * multiplier)
            for plan, base in base_premiums.items()
        },
        'predicted_disruption_hours_week': predicted_hours,
        'probabilities': {
            'Low':    round(probabilities[0], 3),
            'Medium': round(probabilities[1], 3),
            'High':   round(probabilities[2], 3),
        },
        'data_tier_used': (
            'Tier1_exact_pincode'
            if pincode in _encoders['pincode'].classes_
            else 'Tier2_district_fallback'
            if pincode[:3] in DISTRICT_FALLBACK
            else 'Tier3_state_default'
        ),
    }