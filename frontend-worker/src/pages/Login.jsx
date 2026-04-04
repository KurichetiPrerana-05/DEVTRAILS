import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    return digits
  }

  const handleSubmit = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(`+91${phone}`)
      navigate('/verify', { state: { phone: `+91${phone}` } })
    } catch (err) {
      // Demo mode: allow navigation even without backend
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        navigate('/verify', { state: { phone: `+91${phone}`, demo: true } })
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="page-wrapper min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 pt-12">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/10 transition-colors">
          <ChevronLeft />
        </button>
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
          <ShieldMini />
        </div>
        <span className="font-display font-bold text-white">GigShield</span>
      </div>

      <div className="flex-1 px-6 pt-8 animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-white/50 text-base mb-10">
          Enter your phone number to receive an OTP
        </p>

        {/* Phone Input */}
        <div className="mb-6">
          <label className="input-label">Mobile Number</label>
          <div className="flex gap-3">
            <div className="flex items-center justify-center px-4 bg-white/5 border border-white/10 rounded-xl text-white/60 font-mono text-sm select-none whitespace-nowrap">
              🇮🇳 +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                setError('')
                setPhone(formatPhone(e.target.value))
              }}
              onKeyDown={handleKeyDown}
              placeholder="98765 43210"
              className="input-field font-mono tracking-wider flex-1"
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-2 text-accent-red text-sm flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}
        </div>

        {/* Info note */}
        <div className="card mb-8 flex items-start gap-3">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-white/70 text-sm leading-relaxed">
              We'll send a 6-digit OTP via SMS. Your number is used for payouts and WhatsApp alerts.
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || phone.length !== 10}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Sending OTP…
            </span>
          ) : 'Send OTP →'}
        </button>

        <p className="text-center text-white/30 text-xs mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
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

function ShieldMini() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
