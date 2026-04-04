// Analytics.jsx — Loss ratio charts + premium pool analytics
// Uses Recharts (already in the tech stack per README)

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { fetchAnalytics } from "../utils/api";
import { MOCK_ANALYTICS } from "../utils/mockData";

const COLORS = ["#2a9d8f", "#e9c46a", "#f4a261", "#e63946"];

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(() => setData(MOCK_ANALYTICS))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="loading-state">Loading analytics...</div>;

  const poolUtilization = ((data.summary.total_payouts / data.summary.premium_pool) * 100).toFixed(1);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Premium Pool & Loss Analytics</h1>
        <p className="page-subtitle">Weekly financial health of GigShield</p>
      </div>

      {/* KPI Summary Row */}
      <div className="kpi-row">
        <KpiCard label="Premium Pool (Week)"    value={`₹${data.summary.premium_pool.toLocaleString()}`}  color="teal" />
        <KpiCard label="Total Payouts"          value={`₹${data.summary.total_payouts.toLocaleString()}`} color="orange" />
        <KpiCard label="Loss Ratio"             value={`${data.summary.loss_ratio}%`}                     color={data.summary.loss_ratio > 80 ? "red" : "green"} />
        <KpiCard label="Pool Utilization"       value={`${poolUtilization}%`}                             color="yellow" />
        <KpiCard label="Active Policies"        value={data.summary.active_policies}                      color="teal" />
        <KpiCard label="Claims This Week"       value={data.summary.claims_this_week}                     color="blue" />
      </div>

      {/* ⚠️ Liquidity warning if payout > 3× pool */}
      {data.summary.total_payouts > data.summary.premium_pool * 3 && (
        <div className="liquidity-alert">
          ⚠️ Payout exceeds 3× premium pool cap — proportional downscaling active.
        </div>
      )}

      <div className="charts-grid">
        {/* Weekly loss ratio trend */}
        <div className="chart-card">
          <h3>Loss Ratio Trend (12 Weeks)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weekly_loss_ratio}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
              <XAxis dataKey="week" stroke="#888" />
              <YAxis stroke="#888" unit="%" />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line type="monotone" dataKey="loss_ratio"     stroke="#e63946" strokeWidth={2} name="Loss Ratio %" dot={false} />
              <Line type="monotone" dataKey="target_ratio"   stroke="#2a9d8f" strokeWidth={1} strokeDasharray="4 4" name="Target (70%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Premium pool vs payouts per week */}
        <div className="chart-card">
          <h3>Premium Pool vs Payouts (₹)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.weekly_pool}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
              <XAxis dataKey="week" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                formatter={(v) => `₹${v.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="premium_pool" fill="#2a9d8f" name="Premium Pool" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payouts"      fill="#e63946" name="Payouts"       radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trigger type breakdown */}
        <div className="chart-card">
          <h3>Claims by Trigger Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.trigger_breakdown}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                dataKey="count" nameKey="trigger"
                label={({ trigger, percent }) => `${trigger} ${(percent * 100).toFixed(0)}%`}
              >
                {data.trigger_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="chart-card">
          <h3>Policy Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.plan_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
              <XAxis type="number" stroke="#888" />
              <YAxis type="category" dataKey="plan" stroke="#888" width={70} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="#e9c46a" radius={[0, 4, 4, 0]} name="Policies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}
