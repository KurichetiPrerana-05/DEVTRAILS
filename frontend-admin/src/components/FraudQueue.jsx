// FraudQueue.jsx — Sidebar list of high-fraud-score claims
// These require manual insurer action (approve / reject)

import { useState } from "react";
import { reviewClaim } from "../utils/api";

export default function FraudQueue({ claims }) {
  const [processing, setProcessing] = useState(null);
  const [reviewed, setReviewed]     = useState({});

  const handleAction = async (claimId, action) => {
    setProcessing(claimId);
    try {
      await reviewClaim(claimId, action); // POST /api/admin/claims/:id/review
      setReviewed((prev) => ({ ...prev, [claimId]: action }));
    } catch (err) {
      alert(`Failed to ${action} claim. Try again.`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fraud-queue">
      <h2>
        🚨 Fraud Queue
        <span className="badge badge-red">{claims.length}</span>
      </h2>

      {claims.length === 0 && (
        <p className="empty-state">No flagged claims.</p>
      )}

      {claims.map((claim) => {
        const decision = reviewed[claim.claim_id];
        const isBusy   = processing === claim.claim_id;

        return (
          <div key={claim.claim_id} className="fraud-item">
            <div className="fraud-item-header">
              <span className="worker-name">{claim.worker_name}</span>
              <span className="fraud-score-pill">
                Score: {(claim.fraud_score * 100).toFixed(0)}%
              </span>
            </div>

            <div className="fraud-signals">
              {(claim.fraud_signals || []).map((sig) => (
                <span key={sig} className="signal-tag">⚠️ {sig}</span>
              ))}
            </div>

            {decision ? (
              <div className={`decision-badge ${decision}`}>
                {decision === "approve" ? "✅ Approved" : "❌ Rejected"}
              </div>
            ) : (
              <div className="fraud-actions">
                <button
                  className="btn-approve"
                  disabled={isBusy}
                  onClick={() => handleAction(claim.claim_id, "approve")}
                >
                  {isBusy ? "..." : "Approve"}
                </button>
                <button
                  className="btn-reject"
                  disabled={isBusy}
                  onClick={() => handleAction(claim.claim_id, "reject")}
                >
                  {isBusy ? "..." : "Reject"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
