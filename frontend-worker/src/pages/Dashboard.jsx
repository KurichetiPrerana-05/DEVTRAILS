import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MOCK_WORKER, MOCK_COVERAGE_STATUS, MOCK_CLAIMS } from '../utils/mockData'
import { workerAPI } from '../utils/api'
import WhatsAppBanner from '../components/WhatsAppBanner'
import DisruptionCalendar from '../components/DisruptionCalendar'
import BottomNav from '../components/BottomNav'
import ClaimCard from '../components/ClaimCard'

export default function Dashboard() {
  const navigate = useNavigate()
  const { worker, logout } = useAuth()

  const [status, setStatus]   = useState({
    isActive: true, plan_type: '...', zoneRisk: 'loading', todayCondition: { rain: '--', aqi: '--', triggered: false },
    daysActive: '--', totalPaid: '--', totalClaims: '--'
  })
  const [claims, setClaims]   = useState([])
  const [greeting, setGreeting] = useState('')
  const [isFiling, setIsFiling] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    
    // Unified sync from backend
    Promise.all([
      workerAPI.getStatus().then(r => setStatus(r.data)).catch(() => {}),
      workerAPI.getClaims().then(r => setClaims(r.data?.slice(0, 2))).catch(() => {})
    ]).finally(() => setIsSyncing(false))
  }, [])

  const handleFileClaim = async () => {
    // Guard: require authenticated worker — never fall back to a seeded demo ID
    if (!worker?.worker_id) {
      alert('Please log in to file a claim.')
      navigate('/login')
      return
    }

    setIsFiling(true)
    try {
      // Get current location — user must grant permission; no silent coord substitution
      let pos
      try {
        pos = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        })
      } catch (_) {
        throw new Error('Location access is required to file a claim. Please enable GPS and try again.')
      }

      const res = await workerAPI.createClaim({
        user_id: worker.worker_id,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      })
      
      alert(`Claim Filed! ID: ${res.data.claim_id || res.data.id || 'new'}`)
      // Refresh claims list
      const updated = await workerAPI.getClaims()
      setClaims(updated.data?.slice(0, 2))
    } catch (err) {
      alert('Error filing claim: ' + err.message)
    } finally {
      setIsFiling(false)
    }
  }

  const displayWorker = worker || MOCK_WORKER
  const planName = { basic: 'Basic', standard: 'Standard', premium: 'Premium' }[displayWorker.plan] || 'Standard'

  return (
    <div className="page-wrapper min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/40 text-sm">{greeting} 👋</p>
            <h1 className="font-display text-xl font-bold text-white mt-0.5">
              {displayWorker.name || 'Worker'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/plans')}
              className="px-3 py-1.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 text-xs font-semibold"
            >
              {planName}
            </button>
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Coverage Status Card */}
        <div className="rounded-2xl p-5 mb-1 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 60%, #0f0f1a 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
               style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />

          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Coverage Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-accent-green animate-pulse' : 'bg-white/20'}`} />
                <span className={`font-display text-lg font-bold ${status.isActive ? 'text-accent-green' : 'text-white/40'}`}>
                  {status.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Zone Risk</p>
              <p className={`font-semibold capitalize ${
                status.zoneRisk === 'low' ? 'text-accent-green' :
                status.zoneRisk === 'medium' ? 'text-accent-yellow' : 'text-accent-red'
              }`}>
                {status.zoneRisk?.toUpperCase()} RISK
              </p>
            </div>
          </div>

          {/* Today's conditions */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-0.5">🌧 Rainfall</p>
              <p className="text-white font-mono font-semibold text-sm">{status.todayCondition?.rain}</p>
            </div>
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-0.5">😮‍💨 AQI</p>
              <p className={`font-mono font-semibold text-sm ${status.todayCondition?.aqi > 300 ? 'text-accent-red' : status.todayCondition?.aqi > 200 ? 'text-accent-yellow' : 'text-white'}`}>
                {status.todayCondition?.aqi}
              </p>
            </div>
            <div className="flex-1 px-3 py-2 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-0.5">⚡ Triggered</p>
              <p className={`font-semibold text-sm ${status.todayCondition?.triggered ? 'text-accent-green' : 'text-white/40'}`}>
                {status.todayCondition?.triggered ? 'YES' : 'NO'}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 text-center">
              <p className="font-display font-bold text-white text-lg">{status.daysActive}</p>
              <p className="text-white/35 text-xs">Days Active</p>
            </div>
            <div className="px-3 py-2.5 text-center">
              <p className="font-display font-bold text-accent-green text-lg">₹{status.totalPaid}</p>
              <p className="text-white/35 text-xs">Total Earned</p>
            </div>
            <div className="px-3 py-2.5 text-center">
              <p className="font-display font-bold text-white text-lg">{status.totalClaims}</p>
              <p className="text-white/35 text-xs">Claims</p>
            </div>
          </div>
        </div>

        {/* Manual Claim Action */}
        <div className="px-5 mb-5">
           <button
             onClick={handleFileClaim}
             disabled={isFiling}
             className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-display font-bold text-lg shadow-lg transition-all active:scale-95 ${
               isFiling ? 'bg-white/10 text-white/30' : 'bg-brand-500 text-white hover:bg-brand-400'
             }`}
           >
             <span className="text-2xl">{isFiling ? '🔄' : '🛡️'}</span>
             {isFiling ? 'Processing Claim...' : 'File New Claim'}
           </button>
        </div>
      </div>

      {/* WhatsApp Banner */}
      <div className="px-5 mb-5">
        <WhatsAppBanner enabled={displayWorker.whatsappEnabled} />
      </div>

      {/* Disruption Calendar */}
      <div className="px-5 mb-5">
        <DisruptionCalendar />
      </div>

      {/* Recent Claims */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-white">Recent Claims</h2>
          <button onClick={() => navigate('/claims')} className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
            View all →
          </button>
        </div>
        {claims.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-4xl mb-3">🛡</p>
            <p className="text-white/50 text-sm">No claims yet — your coverage is active!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map(c => <ClaimCard key={c.id} claim={c} />)}
          </div>
        )}
      </div>

      <BottomNav active="dashboard" />
    </div>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
