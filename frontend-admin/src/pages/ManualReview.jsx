// ManualReview.jsx — Human reviewer panel for Tier 3 claims (fraud score 0.7–0.9)
// Fetches GET /api/admin/claims/review-queue
// Actions: approve / reject with optional note

import { useState, useEffect } from "react";
import { fetchReviewQueue, reviewClaim } from "../utils/api";

const MOCK_QUEUE = [
  {
    claim_id: "CLM-8821-A", worker_name: "Ravi Kumar",   zone_pincode: "560034",
    plan_type: "Standard",  payout_amount: 1000, fraud_score: 0.82, trigger_type: "rain",
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    fraud_signals: ["location_jump_velocity", "gps_accuracy_perfect"],
    worker_history: { total_claims: 4, approved: 3, rejected: 0 },
    evidence: { platform_status: "Online", cell_tower_match: true, gps_accuracy_m: 8 }
  },
  {
    claim_id: "CLM-8834-B", worker_name: "Priya Singh",  zone_pincode: "110001",
    plan_type: "Premium",   payout_amount: 1500, fraud_score: 0.76, trigger_type: "aqi",
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    fraud_signals: ["claim_timing_anomaly"],
    worker_history: { total_claims: 7, approved: 6, rejected: 1 },
    evidence: { platform_status: "Online", cell_tower_match: false, gps_accuracy_m: 45 }
  },
  {
    claim_id: "CLM-8840-C", worker_name: "Arjun Das",    zone_pincode: "400001",
    plan_type: "Basic",     payout_amount: 500,  fraud_score: 0.88, trigger_type: "rain",
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    fraud_signals: ["device_fingerprint_dup", "claim_timing_anomaly", "gps_accuracy_perfect"],
    worker_history: { total_claims: 2, approved: 1, rejected: 0 },
    evidence: { platform_status: "Offline", cell_tower_match: false, gps_accuracy_m: 2 }
  },
];

export default function ManualReview() {
  const [queue, setQueue]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote]         = useState("");
  const [processing, setProcessing] = useState(false);
  const [decisions, setDecisions]   = useState({});

  useEffect(() => {
    fetchReviewQueue()
      .then(setQueue)
      .catch(() => setQueue(MOCK_QUEUE))
      .finally(() => setLoading(false));
  }, []);

  const pendingQueue = queue.filter((c) => !decisions[c.claim_id]);

  const handleDecision = async (claimId, action) => {
    setProcessing(true);
    try {
      await reviewClaim(claimId, action, note); // POST /api/admin/claims/:id/review
      setDecisions((prev) => ({ ...prev, [claimId]: action }));
      setSelected(null);
      setNote("");
    } catch (err) {
      alert("Failed to submit decision. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-state">Loading review queue...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manual Review Queue</h1>
        <p className="page-subtitle">Tier 3 claims — fraud score 0.70–0.90</p>
        <span className="badge badge-orange">{pendingQueue.length} pending</span>
      </div>

      <div className="review-layout">
        {/* Left: queue list */}
        <div className="review-list">
          {pendingQueue.length === 0 && (
            <p className="empty-state">✅ No claims awaiting review.</p>
          )}
          {queue.map((claim) => {
            const decision = decisions[claim.claim_id];
            const waitMins = Math.floor((Date.now() - new Date(claim.created_at)) / 60000);

            return (
              <div
                key={claim.claim_id}
                className={`review-item ${selected?.claim_id === claim.claim_id ? "active" : ""} ${decision ? "decided" : ""}`}
                onClick={() => !decision && setSelected(claim)}
              >
                <div className="review-item-top">
                  <span className="worker-name">{claim.worker_name}</span>
                  {decision ? (
                    <span className={`decision-pill ${decision}`}>
                      {decision === "approve" ? "✅ Approved" : "❌ Rejected"}
                    </span>
                  ) : (
                    <span className="wait-time">⏱ {waitMins}m ago</span>
                  )}
                </div>
                <div className="review-item-meta">
                  <span>📍 {claim.zone_pincode}</span>
                  <span>₹{claim.payout_amount}</span>
                  <span className="fraud-chip">{(claim.fraud_score * 100).toFixed(0)}% fraud</span>
                </div>
                <div className="signal-tags-mini">
                  {claim.fraud_signals.map((s) => (
                    <span key={s} className="signal-tag-mini">⚠️ {s.replace(/_/g, " ")}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: detail panel */}
        <div className="review-detail">
          {!selected ? (
            <div className="no-selection">
              <span>← Select a claim to review</span>
            </div>
          ) : (
            <>
              <h2>Claim {selected.claim_id}</h2>

              <section className="detail-section">
                <h4>Worker Info</h4>
                <Row label="Name"          value={selected.worker_name} />
                <Row label="Plan"          value={selected.plan_type} />
                <Row label="Zone"          value={selected.zone_pincode} />
                <Row label="Trigger"       value={selected.trigger_type} />
                <Row label="Payout"        value={`₹${selected.payout_amount}`} />
                <Row label="Past Claims"   value={`${selected.worker_history.total_claims} total, ${selected.worker_history.approved} approved`} />
              </section>

              <section className="detail-section">
                <h4>Evidence Signals</h4>
                <Row
                  label="Platform Status"
                  value={selected.evidence.platform_status}
                  highlight={selected.evidence.platform_status !== "Online" ? "red" : "green"}
                />
                <Row
                  label="Cell Tower Match"
                  value={selected.evidence.cell_tower_match ? "✅ Match" : "❌ Mismatch"}
                  highlight={selected.evidence.cell_tower_match ? "green" : "red"}
                />
                <Row
                  label="GPS Accuracy"
                  value={`${selected.evidence.gps_accuracy_m}m`}
                  highlight={selected.evidence.gps_accuracy_m < 5 ? "red" : "green"}
                />
              </section>

              <section className="detail-section">
                <h4>Fraud Signals Triggered</h4>
                {selected.fraud_signals.map((s) => (
                  <div key={s} className="signal-detail">⚠️ {s.replace(/_/g, " ")}</div>
                ))}
              </section>

              <section className="detail-section">
                <h4>Reviewer Note (optional)</h4>
                <textarea
                  className="review-note"
                  placeholder="Add a note for audit trail..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </section>

              <div className="review-actions">
                <button
                  className="btn-approve-lg"
                  disabled={processing}
                  onClick={() => handleDecision(selected.claim_id, "approve")}
                >
                  {processing ? "Submitting..." : "✅ Approve Claim"}
                </button>
                <button
                  className="btn-reject-lg"
                  disabled={processing}
                  onClick={() => handleDecision(selected.claim_id, "reject")}
                >
                  {processing ? "Submitting..." : "❌ Reject Claim"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Small helper row component
function Row({ label, value, highlight }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value ${highlight ? `highlight-${highlight}` : ""}`}>{value}</span>
    </div>
  );
}
