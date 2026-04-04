import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

df = pd.read_csv('data/risk_training_data.csv')

encoders    = joblib.load('models/risk_encoders.pkl')
le_season   = encoders['season']
le_platform = encoders['platform']
le_shift    = encoders['shift']
le_pincode  = encoders['pincode']

def safe_enc(enc, series):
    return series.apply(lambda v: enc.transform([v])[0] if v in enc.classes_ else 0)

df['season_enc']   = safe_enc(le_season,   df['season'])
df['platform_enc'] = safe_enc(le_platform, df['platform'])
df['shift_enc']    = safe_enc(le_shift,    df['shift_type'])
df['pincode_enc']  = safe_enc(le_pincode,  df['pincode'])

FEATURES = [
    'pincode_enc', 'season_enc', 'platform_enc', 'shift_enc',
    'rain_disruptions_3m', 'aqi_disruptions_3m', 'heat_disruptions_3m',
    'flood_vulnerability', 'avg_claim_rate',
    'imd_red_alert', 'worker_claim_history',
]

X = df[FEATURES]
y = df['disruption_hours']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

reg = XGBRegressor(
    n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42
)
reg.fit(X_train, y_train)

mae = mean_absolute_error(y_test, reg.predict(X_test))
print(f"Regression MAE: {mae:.2f} hours")

joblib.dump(reg, 'models/disruption_hours_model.pkl')
print("Regression model saved.")