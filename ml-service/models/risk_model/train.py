import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib, os

df = pd.read_csv('data/risk_training_data.csv')

le_season   = LabelEncoder()
le_platform = LabelEncoder()
le_shift    = LabelEncoder()
le_pincode  = LabelEncoder()

df['season_enc']   = le_season.fit_transform(df['season'])
df['platform_enc'] = le_platform.fit_transform(df['platform'])
df['shift_enc']    = le_shift.fit_transform(df['shift_type'])
df['pincode_enc']  = le_pincode.fit_transform(df['pincode'])

FEATURES = [
    'pincode_enc', 'season_enc', 'platform_enc', 'shift_enc',
    'rain_disruptions_3m', 'aqi_disruptions_3m', 'heat_disruptions_3m',
    'flood_vulnerability', 'avg_claim_rate',
    'imd_red_alert', 'worker_claim_history',   # NEW features
]

X = df[FEATURES]
y = df['risk_label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBClassifier(
    n_estimators=100, max_depth=4, learning_rate=0.1,
    eval_metric='mlogloss', random_state=42
)
model.fit(X_train, y_train)

print(classification_report(
    y_test, model.predict(X_test),
    target_names=['Low', 'Medium', 'High']
))

os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/risk_model.pkl')
joblib.dump({
    'season': le_season, 'platform': le_platform,
    'shift': le_shift,   'pincode': le_pincode
}, 'models/risk_encoders.pkl')
print("Risk classifier saved.")