import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, RefreshCw } from 'lucide-react'
import api from '../api'
import BottomNav from '../components/BottomNav'
import InvoiceRow from '../components/InvoiceRow'
import Spinner from '../components/Spinner'
import { formatUSD, formatLBP } from '../components/CurrencyDisplay'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setLoading(true)
    try {
      const res = await api.get('/dashboard/')
      setData(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalUSD = parseFloat(data?.total_owed_usd ?? 0)
  const totalLL  = parseFloat(data?.total_owed_ll  ?? 0)
  const rate     = parseFloat(data?.ll_per_usd     ?? 0)
  const active   = data?.active_invoices   ?? []
  const recent   = data?.recently_paid     ?? []

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-sticky bg-bg border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">حساب</h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="الإعدادات"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size={32} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center px-4">
            <p className="text-ink-muted">تعذّر تحميل البيانات</p>
            <button
              onClick={load}
              className="flex items-center gap-2 text-sm text-primary font-medium"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* Total owed section */}
            <section className="px-4 pt-6 pb-5 border-b border-border-subtle">
              <p className="text-sm text-ink-muted mb-2">إجمالي غير المدفوع</p>
              <p
                className="tabular-nums ltr-isolate font-bold text-primary leading-none mb-1"
                dir="ltr"
                style={{ fontSize: 'clamp(2rem, 9vw, 2.75rem)' }}
              >
                {formatUSD(totalUSD)}
              </p>
              <p
                className="tabular-nums ltr-isolate text-ink-muted text-base"
                dir="ltr"
              >
                {formatLBP(totalLL)}
              </p>
              {rate > 0 && (
                <p className="text-xs text-ink-faint mt-2">
                  <span dir="ltr" className="ltr-isolate">1$ = {formatLBP(rate)}</span>
                </p>
              )}
            </section>

            {/* Active invoices */}
            <section className="px-4 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-ink">الفواتير النشطة</h2>
                {active.length > 0 && (
                  <span className="text-xs bg-primary-subtle text-primary font-medium px-2 py-0.5 rounded-full">
                    {active.length}
                  </span>
                )}
              </div>

              {active.length === 0 ? (
                <EmptyState
                  message="لا توجد فواتير نشطة"
                  action="إنشاء فاتورة جديدة"
                  onAction={() => navigate('/invoices/new')}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {active.map(inv => (
                    <InvoiceRow key={inv.id} invoice={inv} onPaid={load} />
                  ))}
                </div>
              )}
            </section>

            {/* Recently paid */}
            {recent.length > 0 && (
              <section className="px-4 pt-6 pb-2">
                <div className="flex flex-col mb-3">
                  <h2 className="text-base font-semibold text-ink">مدفوعة مؤخراً</h2>
                  <p className="text-xs text-ink-faint">ستنتقل إلى الأرشيف خلال 48 ساعة</p>
                </div>
                <div className="flex flex-col gap-2">
                  {recent.map(inv => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function EmptyState({ message, action, onAction }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 12h6M12 9v6M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"
            stroke="var(--color-ink-faint)" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-ink-muted text-sm">{message}</p>
      {action && (
        <button
          onClick={onAction}
          className="text-sm text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {action}
        </button>
      )}
    </div>
  )
}
