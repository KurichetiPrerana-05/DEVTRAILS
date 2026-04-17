// LiveClaimsFeed.jsx — Real-time feed using Socket.io with REST polling fallback

import { useState, useEffect, useRef } from "react";
import { fetchClaims } from "../utils/api";
import ClaimCard from "../components/ClaimCard";
import FraudQueue from "../components/FraudQueue";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const POLL_INTERVAL_MS = 10_000; // fallback polling interval

export default function LiveClaimsFeed() {
  const [claims, setClaims]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive]           = useState(false); // true when Socket.io connected
  const socketRef = useRef(null);
  const pollRef   = useRef(null);

  const mergeClaims = (incoming) => {
    setClaims(prev => {
      const existingIds = new Set(prev.map(c => c.claim_id));
      const fresh = incoming.filter(c => !existingIds.has(c.claim_id));
      return fresh.length > 0
        ? [...fresh, ...prev].slice(0, 100) // cap at 100 for performance
        : prev;
    });
    setLastUpdated(new Date());
    setError(null);
  };

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
    // Initial full load
    loadClaims();

    // ── Try Socket.io first ──────────────────────────────────
    let socket;
    try {
      // Dynamically import socket.io-client so the build doesn't break
      // if the package isn't installed in the admin frontend yet.
      import("socket.io-client").then(({ default: io }) => {
        socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          setIsLive(true);
          setError(null);
          // Cancel REST polling — Socket.io is live
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        });

        socket.on("new_claims", (incoming) => {
          mergeClaims(incoming);
        });

        socket.on("disconnect", () => {
          setIsLive(false);
          // Fall back to REST polling while disconnected
          if (!pollRef.current) {
            pollRef.current = setInterval(loadClaims, POLL_INTERVAL_MS);
          }
        });

        socket.on("connect_error", () => {
          // Socket.io unavailable — use REST polling
          if (!pollRef.current) {
            pollRef.current = setInterval(loadClaims, POLL_INTERVAL_MS);
          }
        });
      }).catch(() => {
        // socket.io-client not installed — fall back to polling
        pollRef.current = setInterval(loadClaims, POLL_INTERVAL_MS);
      });
    } catch (_) {
      pollRef.current = setInterval(loadClaims, POLL_INTERVAL_MS);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Split into fraud queue (score > 0.7) and normal feed
  const fraudQueue = claims.filter((c) => c.fraud_score > 0.7);
  const normalFeed = claims.filter((c) => c.fraud_score <= 0.7);

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
        <div
          className={`pulse-dot ${isLive ? "pulse-dot--live" : "pulse-dot--polling"}`}
          title={isLive ? "Live — Socket.io connected" : "Polling every 10s"}
        />
        <span className="feed-mode-label">
          {isLive ? "● LIVE" : "○ Polling"}
        </span>
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
