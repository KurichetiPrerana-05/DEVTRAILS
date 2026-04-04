import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
import joblib, os

df = pd.read_csv('data/fraud_training_data.csv')

FEATURES = [
    'gps_accuracy_radius', 'location_jump_velocity', 'cell_tower_match',
    'platform_online_status', 'claim_latency_seconds', 'motion_detected',
    'app_active', 'historical_claim_rate', 'device_shared',
    'weather_verified',   # NEW
]

X = df[FEATURES]
y = df['is_fraud']

# Train only on legit claims — IF learns the normal distribution
X_legit = X[y == 0]

model = IsolationForest(
    n_estimators=200, contamination=0.15, random_state=42
)
model.fit(X_legit)

raw_preds = model.predict(X)
preds = (raw_preds == -1).astype(int)

print(classification_report(y, preds, target_names=['Legit', 'Fraud']))

os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/fraud_model.pkl')
print("Fraud model saved.")