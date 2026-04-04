// ZoneHeatmap.jsx — Disruption frequency heatmap per pincode
// Fetches from GET /api/admin/zones/heatmap
// Renders a visual grid + table of zone risk levels

import { useState, useEffect } from "react";
import { fetchZoneHeatmap } from "../utils/api";

// Map disruption count to a color intensity
function getHeatColor(count, maxCount) {
  if (maxCount === 0) return "#1a1a2e";
  const ratio = count / maxCount;
  if (ratio > 0.75) return "#e63946"; // high — red
  if (ratio > 0.5)  return "#f4a261"; // medium-high — orange
  if (ratio > 0.25) return "#e9c46a"; // medium — yellow
  return "#2a9d8f";                   // low — teal
}

function getRiskLabel(count, maxCount) {
  const ratio = count / maxCount || 0;
  if (ratio > 0.75) return "HIGH";
  if (ratio > 0.5)  return "MED-H";
  if (ratio > 0.25) return "MEDIUM";
  return "LOW";
}

export default function ZoneHeatmap() {
  const [zones, setZones]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchZoneHeatmap()
      .then(setZones)
      .catch(() => setZones(MOCK_ZONES)) // fallback to mock if API is down
      .finally(() => setLoading(false));
  }, []);

  const maxCount = Math.max(...zones.map((z) => z.disruption_count), 1);

  if (loading) return <div className="loading-state">Loading heatmap...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Zone Disruption Heatmap</h1>
        <p className="page-subtitle">
          Disruption frequency per pincode — last 90 days
        </p>
      </div>

      {/* Grid heatmap */}
      <div className="heatmap-grid">
        {zones.map((zone) => (
          <div
            key={zone.pincode}
            className={`heatmap-cell ${selected?.pincode === zone.pincode ? "selected" : ""}`}
            style={{ backgroundColor: getHeatColor(zone.disruption_count, maxCount) }}
            onClick={() => setSelected(zone)}
            title={`${zone.pincode} — ${zone.disruption_count} disruptions`}
          >
            <span className="cell-pincode">{zone.pincode}</span>
            <span className="cell-count">{zone.disruption_count}</span>
          </div>
        ))}
      </div>

      {/* Zone detail panel */}
      {selected && (
        <div className="zone-detail-panel">
          <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
          <h3>📍 {selected.pincode} — {selected.area_name}</h3>
          <div className="zone-stats">
            <div className="stat-item">
              <span className="stat-label">Disruptions (90d)</span>
              <span className="stat-value">{selected.disruption_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Risk Level</span>
              <span className={`risk-badge risk-${getRiskLabel(selected.disruption_count, maxCount).toLowerCase()}`}>
                {getRiskLabel(selected.disruption_count, maxCount)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Policies</span>
              <span className="stat-value">{selected.active_policies}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dominant Trigger</span>
              <span className="stat-value">{selected.dominant_trigger}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Premium Multiplier</span>
              <span className="stat-value">{selected.premium_multiplier}×</span>
            </div>
          </div>
        </div>
      )}

      {/* Sortable table */}
      <div className="zone-table-wrapper">
        <h2>All Zones</h2>
        <table className="zone-table">
          <thead>
            <tr>
              <th>Pincode</th>
              <th>Area</th>
              <th>Disruptions</th>
              <th>Risk</th>
              <th>Active Policies</th>
              <th>Premium Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {[...zones]
              .sort((a, b) => b.disruption_count - a.disruption_count)
              .map((zone) => (
                <tr
                  key={zone.pincode}
                  className="zone-row"
                  onClick={() => setSelected(zone)}
                >
                  <td>{zone.pincode}</td>
                  <td>{zone.area_name}</td>
                  <td>{zone.disruption_count}</td>
                  <td>
                    <span className={`risk-badge risk-${getRiskLabel(zone.disruption_count, maxCount).toLowerCase()}`}>
                      {getRiskLabel(zone.disruption_count, maxCount)}
                    </span>
                  </td>
                  <td>{zone.active_policies}</td>
                  <td>{zone.premium_multiplier}×</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fallback mock data if backend is not ready
const MOCK_ZONES = [
  { pincode: "560034", area_name: "Koramangala",   disruption_count: 28, active_policies: 142, dominant_trigger: "rain",     premium_multiplier: 1.8 },
  { pincode: "560095", area_name: "Whitefield",    disruption_count: 18, active_policies: 98,  dominant_trigger: "rain",     premium_multiplier: 1.4 },
  { pincode: "110001", area_name: "Connaught Place",disruption_count: 35, active_policies: 210, dominant_trigger: "aqi",     premium_multiplier: 2.1 },
  { pincode: "110092", area_name: "Shahdara",      disruption_count: 31, active_policies: 180, dominant_trigger: "aqi",      premium_multiplier: 1.9 },
  { pincode: "400001", area_name: "Fort Mumbai",   disruption_count: 22, active_policies: 115, dominant_trigger: "rain",     premium_multiplier: 1.6 },
  { pincode: "600001", area_name: "Chennai Central",disruption_count: 14, active_policies: 76, dominant_trigger: "heat",     premium_multiplier: 1.2 },
  { pincode: "700001", area_name: "Kolkata BBD",   disruption_count: 19, active_policies: 90,  dominant_trigger: "rain",     premium_multiplier: 1.5 },
  { pincode: "500001", area_name: "Hyderabad Old", disruption_count: 10, active_policies: 55,  dominant_trigger: "heat",     premium_multiplier: 1.1 },
  { pincode: "411001", area_name: "Pune Camp",     disruption_count: 8,  active_policies: 40,  dominant_trigger: "rain",     premium_multiplier: 1.0 },
  { pincode: "302001", area_name: "Jaipur Center", disruption_count: 5,  active_policies: 30,  dominant_trigger: "heat",     premium_multiplier: 1.0 },
  { pincode: "560001", area_name: "Bangalore MG",  disruption_count: 12, active_policies: 65,  dominant_trigger: "rain",     premium_multiplier: 1.3 },
  { pincode: "201301", area_name: "Noida Sector 18",disruption_count: 24, active_policies: 130,dominant_trigger: "aqi",      premium_multiplier: 1.7 },
];
