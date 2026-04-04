// ClaimCard.jsx — Renders a single claim in the feed

// Maps fraud score to a visual tier label
function getTier(score) {
  if (score < 0.4) return { label: "Auto-Approved", cls: "tier-green" };
  if (score < 0.7) return { label: "Soft Challenge", cls: "tier-yellow" };
  if (score < 0.9) return { label: "Manual Review", cls: "tier-orange" };
  return { label: "Auto-Rejected", cls: "tier-red" };
}

function getTriggerIcon(trigger) {
  const icons = { rain: "🌧️", aqi: "😷", heat: "🌡️", curfew: "🚫", platform_down: "📴" };
  return icons[trigger] || "⚠️";
}

export default function ClaimCard({ claim }) {
  const tier = getTier(claim.fraud_score);

  return (
    <div className={`claim-card ${tier.cls}`}>
      <div className="claim-header">
        <span className="claim-id">#{claim.claim_id.slice(0, 8)}</span>
        <span className={`tier-badge ${tier.cls}`}>{tier.label}</span>
        <span className="claim-time">
          {new Date(claim.created_at).toLocaleTimeString()}
        </span>
      </div>

      <div className="claim-body">
        <div className="claim-info">
          <span>{getTriggerIcon(claim.trigger_type)}</span>
          <span className="worker-name">{claim.worker_name}</span>
          <span className="claim-zone">📍 {claim.zone_pincode}</span>
          <span className="plan-tag">{claim.plan_type}</span>
        </div>

        <div className="claim-amounts">
          <span className="payout-amount">₹{claim.payout_amount}</span>
          <div className="fraud-bar-wrapper" title={`Fraud score: ${claim.fraud_score}`}>
            <div
              className="fraud-bar"
              style={{ width: `${claim.fraud_score * 100}%` }}
            />
            <span className="fraud-score-label">{(claim.fraud_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
