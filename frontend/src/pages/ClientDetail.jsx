import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import InvoiceRow from '../components/InvoiceRow'
import CurrencyDisplay from '../components/CurrencyDisplay'
import Spinner from '../components/Spinner'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/clients/${id}/summary/`).then(r => setSummary(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل العميل" back />
      <div className="flex-1 flex items-center justify-center"><Spinner size={32} /></div>
    </div>
  )

  if (!summary) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل العميل" back />
      <div className="flex-1 flex items-center justify-center text-ink-faint">العميل غير موجود</div>
    </div>
  )

  const owed = parseFloat(summary.total_owed_usd)
  const owedLL = parseFloat(summary.total_owed_ll)
  const activeInvoices = summary.invoices.filter(i => i.status !== 'paid' || !i.is_archived)
  const unpaid = summary.invoices.filter(i => ['unpaid', 'partial'].includes(i.status))

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title={summary.name} back />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-4">

        {/* Balance card */}
        <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-ink-muted">إجمالي الديون</span>
              {owed > 0 ? (
                <CurrencyDisplay usd={owed} ll={owedLL} size="lg" />
              ) : (
                <span className="text-lg font-bold text-success">لا توجد ديون</span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 text-xs text-ink-faint">
              <span>{summary.unpaid_count} غير مدفوعة</span>
              <span>{summary.partial_count} مدفوعة جزئياً</span>
            </div>
          </div>

          {summary.whatsapp && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-ink-muted">واتساب</span>
              <a
                href={`https://wa.me/${summary.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary ltr-isolate underline-offset-2 hover:underline"
                dir="ltr"
              >
                {summary.whatsapp}
              </a>
            </div>
          )}
        </div>

        {/* Record payment button */}
        {unpaid.length > 0 && (
          <button
            onClick={() => navigate(`/clients/${id}/pay`)}
            className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <CreditCard size={18} />
            تسجيل دفعة
          </button>
        )}

        {/* Invoice list */}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink-muted px-1">الفواتير</h2>
          {activeInvoices.length === 0 ? (
            <p className="text-center text-sm text-ink-faint py-8">لا توجد فواتير نشطة</p>
          ) : (
            activeInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)
          )}
        </div>
      </main>
    </div>
  )
}
