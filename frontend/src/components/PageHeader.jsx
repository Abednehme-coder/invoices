import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function PageHeader({ title, back, action }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-sticky bg-bg border-b border-border px-4 h-14 flex items-center justify-between gap-3">
      {/* Right side: back button or spacer */}
      <div className="w-10">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="رجوع"
          >
            {/* Flipped chevron for RTL back = pointing right */}
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <h1 className="flex-1 text-center text-lg font-semibold text-ink truncate">
        {title}
      </h1>

      {/* Left side: action button or spacer */}
      <div className="w-10 flex justify-end">
        {action}
      </div>
    </header>
  )
}
