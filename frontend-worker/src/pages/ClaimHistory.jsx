import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { workerAPI } from '../utils/api'
import { MOCK_CLAIMS } from '../utils/mockData'
import ClaimCard from '../components/ClaimCard'
import BottomNav from '../components/BottomNav'

const FILTERS = ['All', 'Paid', 'Processing', 'Rejected']

export default function ClaimHistory() {
  const navigate  = useNavigate()
  const [claims, setClaims]     = useState(MOCK_CLAIMS)
  const [filter, setFilter]     = useState('All')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    workerAPI.getClaims()
      .then(r => setClaims(r.data))
      .catch(() => setClaims(MOCK_CLAIMS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All'
    ? claims
    : claims.filter(c => c.status.toLowerCase() === filter.toLowerCase())

  const totalPaid = claims
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="page-wrapper min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <ChevronLeft />
          </button>
          <h1 className="font-display text-xl font-bold text-white">Claim History</h1>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-3">
            <p className="font-display font-bold text-white text-xl">{claims.length}</p>
            <p className="text-white/35 text-xs">Total</p>
          </div>
          <div className="card text-center py-3">
            <p className="font-display font-bold text-accent-green text-xl">₹{totalPaid}</p>
            <p className="text-white/35 text-xs">Earned</p>
          </div>
          <div className="card text-center py-3">
            <p className="font-display font-bold text-accent-yellow text-xl">
              {claims.filter(c => c.status === 'processing').length}
            </p>
            <p className="text-white/35 text-xs">Pending</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                ${filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Claims list */}
      <div className="px-5 space-y-3">
        {loading ? (
          <>
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 mt-4">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-white/50 text-sm">No {filter.toLowerCase()} claims found</p>
          </div>
        ) : (
          filtered.map(c => <ClaimCard key={c.id} claim={c} detailed />)
        )}
      </div>

      <BottomNav active="claims" />
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}
