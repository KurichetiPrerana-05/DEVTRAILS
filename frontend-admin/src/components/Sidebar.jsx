// Sidebar.jsx — Admin navigation panel

const NAV_ITEMS = [
  { key: "claims",    label: "Live Claims",     icon: "⚡" },
  { key: "heatmap",  label: "Zone Heatmap",    icon: "🗺️" },
  { key: "analytics",label: "Analytics",       icon: "📊" },
  { key: "review",   label: "Manual Review",   icon: "🔍" },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🛡️</span>
        <span className="logo-text">GigShield</span>
        <span className="logo-sub">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nav-item ${activePage === key ? "active" : ""}`}
            onClick={() => onNavigate(key)}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
            {activePage === key && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot online" />
        <span>System Online</span>
      </div>
    </aside>
  );
}
