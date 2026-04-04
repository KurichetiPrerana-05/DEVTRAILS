import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Home',
    path: '/dashboard',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'claims',
    label: 'Claims',
    path: '/claims',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'plans',
    label: 'Plans',
    path: '/plans',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#818cf8' : 'none'} stroke={active ? '#818cf8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/>
      </svg>
    ),
  },
]

export default function BottomNav({ active }) {
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="flex items-center justify-around px-2 pt-3 pb-2">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-brand-400' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {item.icon(isActive)}
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-brand-400" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
