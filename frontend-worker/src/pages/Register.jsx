import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const PLATFORMS = ['Swiggy', 'Zomato', 'Dunzo', 'Blinkit', 'Zepto', 'Porter', 'Other']
const CITIES    = ['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad']

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, setWorkerDirectly } = useAuth()

  const phone  = location.state?.phone  || ''
  const isDemo = location.state?.demo   || false

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    name: '', city: '', platform: '', vehicleType: '', upiId: ''
  })

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Enter your full name'
    if (!form.city)        return 'Select your city'
    return null
  }

  const validateStep2 = () => {
    if (!form.platform)     return 'Select your delivery platform'
    if (!form.upiId.trim()) return 'Enter your UPI ID for payouts'
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setStep(2)
  }

  // Builds a mock worker object and sets it in React state + localStorage
  // so ProtectedRoute sees a valid session before navigation
  const applyDemoWorker = () => {
    const mockWorker = {
      id: 'demo_001',
      name: form.name || 'Demo Worker',
      phone,
      city: form.city,
      platform: form.platform,
      vehicleType: form.vehicleType,
      upiId: form.upiId,
      plan: 'standard',
      coverageStatus: 'active',
      whatsappEnabled: true,
    }
    setWorkerDirectly(mockWorker)
  }

  const handleSubmit = async () => {
    const err = validateStep2()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        applyDemoWorker()
        navigate('/plans')
        return
      }
      await register({ ...form, phone })
      navigate('/plans')
    } catch (e) {
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNREFUSED') {
        // Backend offline — use demo worker so the app still works
        applyDemoWorker()
        navigate('/plans')
      } else {
        setError(e.response?.data?.message || 'Registration failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 pt-12">
        <button onClick={() => step === 1 ? navigate('/verify') : setStep(1)}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <ChevronLeft />
        </button>
        <span className="font-display font-semibold text-white">Create Profile</span>
        <div className="ml-auto text-white/40 text-sm">{step}/2</div>
      </div>

      {/* Progress */}
      <div className="px-5 mb-6">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 2) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 px-6 animate-slide-up">
        {step === 1 ? (
          <>
            <h1 className="font-display text-2xl font-bold text-white mb-1">Your Details</h1>
            <p className="text-white/50 text-sm mb-8">We'll use this to personalise your coverage</p>

            <div className="space-y-5">
              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Arjun Sharma"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">City</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => update('city', c)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150
                        ${form.city === c
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-white mb-1">Work Info</h1>
            <p className="text-white/50 text-sm mb-8">Tell us where you deliver so we can match your zone</p>

            <div className="space-y-5">
              <div>
                <label className="input-label">Primary Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => update('platform', p)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150
                        ${form.platform === p
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Vehicle Type</label>
                <div className="flex gap-2">
                  {['Bike 🏍', 'Bicycle 🚲', 'Foot 🚶'].map(v => (
                    <button
                      key={v}
                      onClick={() => update('vehicleType', v.split(' ')[0])}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150
                        ${form.vehicleType === v.split(' ')[0]
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">UPI ID (for payouts)</label>
                <input
                  type="text"
                  inputMode="email"
                  value={form.upiId}
                  onChange={e => update('upiId', e.target.value)}
                  placeholder="yourname@upi"
                  className="input-field font-mono"
                />
                <p className="text-white/30 text-xs mt-1.5">Claim payouts will be sent instantly to this UPI ID</p>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 text-accent-red text-sm flex items-center gap-1.5">
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-10 pt-6">
        {step === 1 ? (
          <button className="btn-primary" onClick={handleNext}>
            Continue →
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Setting up…' : 'Complete Registration →'}
          </button>
        )}
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
