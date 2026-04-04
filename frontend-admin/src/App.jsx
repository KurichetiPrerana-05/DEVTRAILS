import { useState } from "react";
import Sidebar from "./components/Sidebar";
import LiveClaimsFeed from "./pages/LiveClaimsFeed";
import ZoneHeatmap from "./pages/ZoneHeatmap";
import Analytics from "./pages/Analytics";
import ManualReview from "./pages/ManualReview";
import "./index.css";

const PAGES = {
  claims: LiveClaimsFeed,
  heatmap: ZoneHeatmap,
  analytics: Analytics,
  review: ManualReview,
};

export default function App() {
  const [activePage, setActivePage] = useState("claims");

  const PageComponent = PAGES[activePage];

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        <PageComponent />
      </main>
    </div>
  );
}
