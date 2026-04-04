import { useState, useEffect } from 'react'
import { format, startOfMonth, getDay, getDaysInMonth, addMonths, subMonths } from 'date-fns'
import { generateMockCalendar } from '../utils/mockData'
import { riskAPI } from '../utils/api'

const RISK_LABEL = { low: 'Low Risk', medium: 'Med Risk', high: 'High Risk', normal: 'Clear' }
const RISK_DOT   = { low: 'bg-accent-green', medium: 'bg-accent-yellow', high: 'bg-accent-red', normal: 'bg-transparent' }
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DisruptionCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calData, setCalData]         = useState([])
  const [selected, setSelected]       = useState(null)

  useEffect(() => {
    const year  = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    riskAPI.getDisruptionCal(month)
      .then(r => setCalData(r.data))
      .catch(() => setCalData(generateMockCalendar(year, month)))
  }, [currentDate])

  const today        = new Date()
  const monthStart   = startOfMonth(currentDate)
  const startWeekDay = getDay(monthStart)
  const daysInMonth  = getDaysInMonth(currentDate)
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()

  const cells = []
  for (let i = 0; i < startWeekDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getDayRisk = (day) => calData.find(c => c.day === day)?.risk || 'normal'

  const highlightCount = calData.filter(c => c.risk === 'high').length
  const mediumCount    = calData.filter(c => c.risk === 'medium').length

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-white">Disruption Forecast</h2>
          <p className="text-white/40 text-xs mt-0.5">High-risk week preview</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-white/70 text-sm font-medium px-2 min-w-[90px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Risk summary */}
      {(highlightCount > 0 || mediumCount > 0) && (
        <div className="flex gap-2 mb-4">
          {highlightCount > 0 && (
            <span className="badge badge-rejected">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
              {highlightCount} high-risk {highlightCount === 1 ? 'day' : 'days'}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="badge badge-pending">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" />
              {mediumCount} medium-risk
            </span>
          )}
        </div>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-white/25 text-xs font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const risk     = getDayRisk(day)
          const isToday  = isCurrentMonth && day === today.getDate()
          const isSel    = selected === day

          return (
            <button
              key={day}
              onClick={() => setSelected(isSel ? null : day)}
              className={`cal-day ${
                risk === 'low'    ? 'cal-day-low'    :
                risk === 'medium' ? 'cal-day-medium' :
                risk === 'high'   ? 'cal-day-high'   : 'cal-day-normal'
              } ${isToday ? 'cal-day-today' : ''} ${isSel ? 'scale-110 ring-2 ring-brand-400 ring-offset-1 ring-offset-surface-card' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selected && (() => {
        const risk = getDayRisk(selected)
        return (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${RISK_DOT[risk]}`} />
            <div>
              <p className="text-white/70 text-sm font-medium">
                {format(currentDate, 'MMMM')} {selected}
              </p>
              <p className={`text-xs ${
                risk === 'high' ? 'text-accent-red' :
                risk === 'medium' ? 'text-accent-yellow' :
                risk === 'low' ? 'text-accent-green' : 'text-white/30'
              }`}>
                {RISK_LABEL[risk]}
                {risk !== 'normal' && ' — payout may trigger'}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        {[
          { risk: 'high',   label: 'High',   cls: 'text-accent-red' },
          { risk: 'medium', label: 'Medium', cls: 'text-accent-yellow' },
          { risk: 'low',    label: 'Low',    cls: 'text-accent-green' },
        ].map(({ risk, label, cls }) => (
          <div key={risk} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-md ${
              risk === 'high' ? 'bg-accent-red/30' :
              risk === 'medium' ? 'bg-accent-yellow/30' : 'bg-accent-green/30'
            }`} />
            <span className={`text-xs ${cls} opacity-70`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
