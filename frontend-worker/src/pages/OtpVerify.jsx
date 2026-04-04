import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function OtpVerify() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { verifyOtp } = useAuth()

  const phone  = location.state?.phone  || '+91XXXXXXXXXX'
  const isDemo = location.state?.demo   || false

  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resendTimer, setTimer] = useState(30)

  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val.slice(-1)
    setOtp(newOtp)
    setError('')
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      handleVerify(paste)
    }
    e.preventDefault()
  }

  const handleVerify = async (code) => {
    setLoading(true)
    setError('')
    try {
      if (isDemo) {
        // Demo mode: treat any 6-digit code as valid
        await new Promise(r => setTimeout(r, 800))
        navigate('/register', { state: { phone, demo: true, isNew: true } })
        return
      }
      const { isNew } = await verifyOtp(phone, code)
      if (isNew) {
        navigate('/register', { state: { phone } })
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    setTimer(30)
    setOtp(['', '', '', '', '', ''])
    setError('')
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="page-wrapper min-h-screen">
      <div className="flex items-center gap-4 p-5 pt-12">
        <button onClick={() => navigate('/login')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <ChevronLeft />
        </button>
        <span className="font-display font-semibold text-white">Verify OTP</span>
      </div>

      <div className="flex-1 px-6 pt-8 animate-slide-up">
        {isDemo && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-sm">
            🧪 <strong>Demo mode</strong> — Enter any 6 digits to continue
          </div>
        )}

        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Enter OTP 🔐
        </h1>
        <p className="text-white/50 text-base mb-2">
          Sent to <span className="text-white font-medium">{phone}</span>
        </p>
        <button onClick={() => navigate('/login')} className="text-brand-400 text-sm mb-10 hover:text-brand-300 transition-colors">
          Change number
        </button>

        {/* OTP Grid */}
        <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className={`otp-input ${error ? 'border-accent-red' : ''} ${loading ? 'opacity-60' : ''}`}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-accent-red text-sm mb-4">
            ⚠ {error}
          </p>
        )}

        {/* Resend */}
        <div className="text-center mb-10">
          {resendTimer > 0 ? (
            <p className="text-white/40 text-sm">
              Resend in <span className="text-white/60 font-mono">{resendTimer}s</span>
            </p>
          ) : (
            <button onClick={handleResend} className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
              Resend OTP
            </button>
          )}
        </div>

        <button
          className="btn-primary"
          onClick={() => handleVerify(otp.join(''))}
          disabled={loading || otp.some(d => !d)}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Verifying…
            </span>
          ) : 'Verify & Continue →'}
        </button>
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

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
