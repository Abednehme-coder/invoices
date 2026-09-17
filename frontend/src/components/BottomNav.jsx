import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Users, Archive, Settings, Plus } from 'lucide-react'

const tabs = [
  { to: '/',         icon: Home,     label: 'الرئيسية' },
  { to: '/clients',  icon: Users,    label: 'العملاء'  },
  { to: '/invoices/new', icon: Plus, label: 'فاتورة',  primary: true },
  { to: '/archive',  icon: Archive,  label: 'الأرشيف' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-bg border-t border-border z-sticky"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="التنقل الرئيسي"
    >
      <div className="flex items-end h-16">
        {tabs.map(tab => (
          tab.primary
            ? <PrimaryTab key={tab.to} tab={tab} />
            : <RegularTab key={tab.to} tab={tab} />
        ))}
      </div>
    </nav>
  )
}

function RegularTab({ tab }) {
  const Icon = tab.icon
  return (
    <NavLink
      to={tab.to}
      end={tab.to === '/'}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 h-full min-h-[44px] text-xs transition-colors duration-fast ${
          isActive ? 'text-primary' : 'text-ink-faint'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
          <span>{tab.label}</span>
        </>
      )}
    </NavLink>
  )
}

function PrimaryTab({ tab }) {
  const navigate = useNavigate()
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <button
        onClick={() => navigate(tab.to)}
        className="w-12 h-12 rounded-full bg-primary text-primary-text flex items-center justify-center shadow-md transition-transform duration-fast active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="فاتورة جديدة"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  )
}
