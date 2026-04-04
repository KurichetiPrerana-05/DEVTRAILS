import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PLANS } from '../utils/mockData'
import { workerAPI } from '../utils/api'

export default function PlanSelection() {
  const navigate = useNavigate()
  const { worker, updateWorker } = useAuth()
  const [selected, setSelected] = useState(worker?.plan || 'standard')
  const [loading, setLoading]   = useState(false)

  const handleSelect = async () => {
    setLoading(true)
    try {
      await workerAPI.updatePlan(selected)
      updateWorker({ plan: selected })
    } catch (_) {
      updateWorker({ plan: selected }) // demo fallback
    } finally {
      navigate('/dashboard')
    }
  }

  const planColorMap = {
    basic:    { border: 'border-white/10',          selectedBorder: 'border-white/50',          bg: 'bg-white/3',          selectedBg: 'bg-white/8',           tag: 'bg-white/10 text-white/60' },
    standard: { border: 'border-brand-500/30',      selectedBorder: 'border-brand-500',         bg: 'bg-brand-900/10',     selectedBg: 'bg-brand-900/40',      tag: 'bg-brand-500/20 text-brand-300' },
    premium:  { border: 'border-yellow-500/30',     selectedBorder: 'border-yellow-400',        bg: 'bg-yellow-900/10',    selectedBg: 'bg-yellow-900/20',     tag: 'bg-yellow-400/15 text-yellow-300' },
  }

  return (
    <div className="page-wrapper min-h-screen">
      <div className="px-6 pt-14 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-5">
          Step 3 of 3 — Choose Your Plan
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Pick Your Shield</h1>
        <p className="text-white/50 text-sm">All plans include auto-triggered payouts. No claims needed.</p>
      </div>

      <div className="px-5 space-y-4 pb-36 overflow-y-auto">
        {PLANS.map(plan => {
          const isSelected = selected === plan.id
          const colors     = planColorMap[plan.id]

          return (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`plan-card border-2 transition-all duration-200 cursor-pointer
                ${isSelected ? colors.selectedBorder + ' ' + colors.selectedBg
                             : colors.border + ' ' + colors.bg}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-600 text-white shadow-lg shadow-brand-900/50">
                    ⭐ Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.tag}`}>
                      {plan.tagline}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-white/40 text-sm">/{plan.period}</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all
                  ${isSelected ? 'border-brand-400 bg-brand-500' : 'border-white/20 bg-transparent'}`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Max payout */}
              <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 flex items-center gap-2">
                <span className="text-accent-green text-lg">💸</span>
                <span className="text-white/70 text-sm">
                  Up to <strong className="text-white">₹{plan.maxPayout}</strong> per disruption day
                </span>
              </div>

              {/* Triggers */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {plan.triggers.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-white/5 text-white/50 text-xs border border-white/8">
                    {t}
                  </span>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="text-accent-green text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-8 pt-4 bg-gradient-to-t from-surface-dark via-surface-dark/95 to-transparent">
        <button className="btn-primary" onClick={handleSelect} disabled={loading}>
          {loading ? 'Activating coverage…' : `Activate ${PLANS.find(p => p.id === selected)?.name} Plan →`}
        </button>
        <p className="text-center text-white/25 text-xs mt-3">Cancel anytime · 7-day free trial</p>
      </div>
    </div>
  )
}
