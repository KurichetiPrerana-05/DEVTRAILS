import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const { worker } = useAuth()

  useEffect(() => {
    if (worker) navigate('/dashboard', { replace: true })
  }, [worker, navigate])

  return (
    <div className="page-wrapper min-h-screen relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[-20%] w-[60%] h-[60%] rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
      </div>

      <div className="relative flex flex-col min-h-screen px-6 pt-16 pb-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <ShieldIcon />
          </div>
          <span className="font-display font-bold text-xl text-white">GigShield</span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center mt-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-6 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Parametric Insurance – Instant Payouts
          </div>

          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Work Protected.<br />
            <span className="text-brand-400">Rain or Shine.</span>
          </h1>

          <p className="text-white/55 text-base leading-relaxed mb-10">
            Auto-triggered insurance for gig workers.
            When it rains, you get paid — no claims, no paperwork.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {['🌧 Rain Disruption', '😮‍💨 Bad AQI', '⚡ Instant UPI', '📱 WhatsApp Alerts'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                {f}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { label: 'Workers Protected', value: '12K+' },
              { label: 'Avg Payout Time', value: '< 1 hr' },
              { label: 'Cities Covered',   value: '8' },
            ].map(s => (
              <div key={s.label} className="card text-center py-4">
                <div className="font-display text-xl font-bold text-brand-300">{s.value}</div>
                <div className="text-white/40 text-xs mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Get Started — It's Free
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Already have an account? Login
          </button>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          IRDAI sandbox compliant · No hidden charges
        </p>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
            fill="white" fillOpacity="0.9"/>
    </svg>
  )
}
