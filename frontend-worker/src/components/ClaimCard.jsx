import { format } from 'date-fns'

const TYPE_ICONS = { rain: '🌧', aqi: '😮‍💨', platform: '⚡' }

const STATUS_CONFIG = {
  paid:       { label: 'Paid',       className: 'badge-active'   },
  processing: { label: 'Processing', className: 'badge-pending'  },
  rejected:   { label: 'Rejected',   className: 'badge-rejected' },
  pending:    { label: 'Pending',    className: 'badge-pending'  },
}

export default function ClaimCard({ claim, detailed = false }) {
  const config = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending
  const icon   = TYPE_ICONS[claim.type] || '🛡'

  const dateStr = (() => {
    try { return format(new Date(claim.date), 'dd MMM yyyy') }
    catch { return claim.date }
  })()

  const paidAtStr = claim.paidAt ? (() => {
    try { return format(new Date(claim.paidAt), 'dd MMM, hh:mm a') }
    catch { return claim.paidAt }
  })() : null

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-white capitalize">{claim.type} Disruption</p>
              <span className={`badge ${config.className}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  claim.status === 'paid' ? 'bg-accent-green' :
                  claim.status === 'processing' ? 'bg-accent-yellow' : 'bg-accent-red'
                }`} />
                {config.label}
              </span>
            </div>
            <p className="text-white/40 text-xs">{dateStr} · {claim.zone}</p>
            {detailed && (
              <p className="text-white/30 text-xs mt-1">
                Trigger: {claim.triggerValue} (threshold: {claim.threshold})
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-display font-bold text-lg ${
            claim.status === 'paid' ? 'text-accent-green' :
            claim.status === 'processing' ? 'text-accent-yellow' : 'text-white/30'
          }`}>
            {claim.status === 'rejected' ? '—' : `₹${claim.amount}`}
          </p>
          {claim.status === 'processing' && (
            <p className="text-white/30 text-xs">Pending</p>
          )}
        </div>
      </div>

      {detailed && claim.status === 'paid' && claim.upiRef && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-white/30 text-xs">Paid via UPI</p>
            <p className="text-white/50 text-xs font-mono mt-0.5">{claim.upiRef}</p>
          </div>
          {paidAtStr && <p className="text-white/30 text-xs">{paidAtStr}</p>}
        </div>
      )}

      {detailed && claim.status === 'processing' && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent-yellow rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-accent-yellow text-xs font-medium">Processing…</p>
          </div>
          <p className="text-white/30 text-xs mt-1.5">Payout typically arrives within 1 hour</p>
        </div>
      )}
    </div>
  )
}
