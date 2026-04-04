import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useEffect } from 'react'

export default function Offline() {
  const navigate  = useNavigate()
  const isOnline  = useOnlineStatus()

  useEffect(() => {
    if (isOnline) navigate(-1)
  }, [isOnline, navigate])

  return (
    <div className="page-wrapper min-h-screen items-center justify-center text-center px-8">
      <div className="animate-fade-in">
        <div className="text-7xl mb-6">📡</div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">You're Offline</h1>
        <p className="text-white/50 text-base leading-relaxed mb-8">
          No internet connection detected. Your coverage remains active — we'll sync your data when you're back online.
        </p>

        <div className="card mb-8 text-left">
          <h3 className="font-semibold text-white/80 text-sm mb-3">Available Offline</h3>
          <ul className="space-y-2">
            {['View your coverage status', 'See your plan details', 'Check recent claim history'].map(item => (
              <li key={item} className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-accent-green">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
        <p className="text-white/25 text-xs mt-4">We'll reconnect automatically when online</p>
      </div>
    </div>
  )
}
