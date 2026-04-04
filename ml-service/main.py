from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    from models.risk_model.predictor import score_risk
    from models.fraud_detection.predictor import score_fraud
    print("GigShield ML Service — models loaded")
    yield


app = FastAPI(
    title="GigShield ML Service",
    version="2.0.0",
    lifespan=lifespan,
)


# ── Request schemas ───────────────────────────────────────────

class RiskRequest(BaseModel):
    pincode:              str   = Field(...,  example="560001")
    season:               str   = Field(...,  example="monsoon")
    platform:             str   = Field(...,  example="zepto")
    shift_type:           str   = Field(...,  example="evening")
    rain_disruptions_3m:  int   = Field(5,    ge=0)
    aqi_disruptions_3m:   int   = Field(2,    ge=0)
    heat_disruptions_3m:  int   = Field(1,    ge=0)
    flood_vulnerability:  float = Field(0.3,  ge=0.0, le=1.0)
    avg_claim_rate:       float = Field(0.1,  ge=0.0, le=1.0)
    imd_red_alert:        int   = Field(0,    ge=0,   le=1)
    worker_claim_history: float = Field(0.1,  ge=0.0, le=1.0)


class FraudRequest(BaseModel):
    pincode:                  str   = Field(..., example="560001")
    trigger_type:             str   = Field(..., example="rain")
    gps_accuracy_radius:      float = Field(..., example=12.5)
    location_jump_velocity:   float = Field(..., example=25.0)
    cell_tower_match:         int   = Field(..., example=1)
    platform_online_status:   int   = Field(..., example=1)
    claim_latency_seconds:    int   = Field(..., example=300)
    motion_detected:          int   = Field(..., example=1)
    app_active:               int   = Field(..., example=1)
    historical_claim_rate:    float = Field(..., example=0.1)
    device_shared:            int   = Field(..., example=0)
    disruption_start_epoch:   int   = Field(..., example=1711900800)
    claim_submitted_epoch:    int   = Field(..., example=1711901100)


# ── Routes ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "GigShield ML Service", "version": "2.0.0"}


@app.post("/score-risk")
def risk_endpoint(req: RiskRequest):
    try:
        from risk_model.predictor import score_risk
        return score_risk(
            pincode=req.pincode,
            season=req.season,
            platform=req.platform,
            shift_type=req.shift_type,
            rain_disruptions_3m=req.rain_disruptions_3m,
            aqi_disruptions_3m=req.aqi_disruptions_3m,
            heat_disruptions_3m=req.heat_disruptions_3m,
            flood_vulnerability=req.flood_vulnerability,
            avg_claim_rate=req.avg_claim_rate,
            imd_red_alert=req.imd_red_alert,
            worker_claim_history=req.worker_claim_history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score-fraud")
def fraud_endpoint(req: FraudRequest):
    try:
        from fraud_detection.predictor import score_fraud
        return score_fraud(
            pincode=req.pincode,
            trigger_type=req.trigger_type,
            gps_accuracy_radius=req.gps_accuracy_radius,
            location_jump_velocity=req.location_jump_velocity,
            cell_tower_match=req.cell_tower_match,
            platform_online_status=req.platform_online_status,
            claim_latency_seconds=req.claim_latency_seconds,
            motion_detected=req.motion_detected,
            app_active=req.app_active,
            historical_claim_rate=req.historical_claim_rate,
            device_shared=req.device_shared,
            disruption_start_epoch=req.disruption_start_epoch,
            claim_submitted_epoch=req.claim_submitted_epoch,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))