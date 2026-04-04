// LiveClaimsFeed.jsx — Real-time feed of incoming claims + fraud queue
// Polls GET /api/admin/claims every 10 seconds

import { useState, useEffect } from "react";
import { fetchClaims } from "../utils/api";
import ClaimCard from "../components/ClaimCard";
import FraudQueue from "../components/FraudQueue";

const POLL_INTERVAL_MS = 10_000;

export default function LiveClaimsFeed() {
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadClaims = async () => {
    try {
      const data = await fetchClaims();
      setClaims(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to fetch claims. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
    const interval = setInterval(loadClaims, POLL_INTERVAL_MS);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Split into fraud queue (score > 0.7) and normal feed
  const fraudQueue  = claims.filter((c) => c.fraud_score > 0.7);
  const normalFeed  = claims.filter((c) => c.fraud_score <= 0.7);

  if (loading) return <div className="loading-state">Loading claims feed...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Live Claims Feed</h1>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <div className="pulse-dot" title="Live polling active" />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="feed-layout">
        {/* Main claims stream */}
        <section className="claims-stream">
          <h2>
            Incoming Claims
            <span className="badge">{normalFeed.length}</span>
          </h2>
          {normalFeed.length === 0 ? (
            <p className="empty-state">No new claims right now.</p>
          ) : (
            normalFeed.map((claim) => (
              <ClaimCard key={claim.claim_id} claim={claim} />
            ))
          )}
        </section>

        {/* Fraud queue sidebar */}
        <section className="fraud-sidebar">
          <FraudQueue claims={fraudQueue} />
        </section>
      </div>
    </div>
  );
}
