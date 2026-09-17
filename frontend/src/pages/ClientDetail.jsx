import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, Check } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import InvoiceRow from '../components/InvoiceRow'
import CurrencyDisplay, { formatUSD, formatLBP } from '../components/CurrencyDisplay'
import Spinner from '../components/Spinner'
import BottomSheet from '../components/BottomSheet'

// ─── Payment preview (plain JS, no deps) ─────────────────────────────────────
function previewDistribution(invoices, amountUSD) {
  let remaining = amountUSD
  const rows = []
  for (const inv of invoices) {
    if (remaining <= 0) break
    const invRemaining = parseFloat(inv.remaining_usd)
    const cover = Math.min(remaining, invRemaining)
    rows.push({
      id: inv.id,
      reference: inv.reference,
      name: inv.name,
      invRemaining,
      cover,
      willBePaid: cover >= invRemaining - 0.001,
    })
    remaining -= cover
  }
  return { rows, leftover: remaining }
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paySheetOpen, setPaySheetOpen] = useState(false)

  const fetchSummary = useCallback(() => {
    api.get(`/clients/${id}/summary/`).then(r => setSummary(r.data)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  function onPaymentSuccess() {
    setPaySheetOpen(false)
    setLoading(true)
    fetchSummary()
  }

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
  const unpaid = summary.invoices.filter(i => ['unpaid', 'partial'].includes(i.status))
  const activeInvoices = summary.invoices.filter(i => !i.is_archived)

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
              {summary.unpaid_count > 0 && <span>{summary.unpaid_count} غير مدفوعة</span>}
              {summary.partial_count > 0 && <span>{summary.partial_count} مدفوعة جزئياً</span>}
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
            onClick={() => setPaySheetOpen(true)}
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
            activeInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} onPaid={fetchSummary} />)
          )}
        </div>
      </main>

      {/* ── Payment sheet ── */}
      <BottomSheet
        open={paySheetOpen}
        onClose={() => setPaySheetOpen(false)}
        title="تسجيل دفعة"
      >
        <PaymentForm
          clientId={id}
          clientName={summary.name}
          totalOwedUsd={owed}
          unpaidInvoices={unpaid}
          onSuccess={onPaymentSuccess}
        />
      </BottomSheet>
    </div>
  )
}

// ─── Payment form (inside sheet) ─────────────────────────────────────────────
function PaymentForm({ clientId, clientName, totalOwedUsd, unpaidInvoices, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [note, setNote] = useState('')
  const [rate, setRate] = useState(90000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/settings/').then(r => setRate(parseFloat(r.data.ll_per_usd))).catch(() => {})
  }, [])

  const amountUSD = amount
    ? (currency === 'USD' ? parseFloat(amount) : parseFloat(amount) / rate)
    : 0

  const sorted = [...unpaidInvoices].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const { rows: preview, leftover } = amountUSD > 0
    ? previewDistribution(sorted, amountUSD)
    : { rows: [], leftover: 0 }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/payments/', {
        client: parseInt(clientId),
        amount: parseFloat(amount),
        currency,
        note,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

      {/* Client hint */}
      <p className="text-sm text-ink-muted">
        رصيد{' '}
        <span className="font-medium text-ink">{clientName}</span>
        {' '}—{' '}
        <span className="ltr-isolate text-danger font-semibold" dir="ltr">
          {formatUSD(totalOwedUsd)}
        </span>
      </p>

      {/* Amount + currency */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="المبلغ"
          min="0"
          step="any"
          className="flex-1 h-12 rounded-md border border-border bg-surface px-4 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary ltr-isolate"
          dir="ltr"
          autoFocus
          required
        />
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          {['USD', 'LBP'].map(cur => (
            <button
              key={cur}
              type="button"
              onClick={() => setCurrency(cur)}
              className={`px-4 h-12 text-sm font-medium transition-colors ${
                currency === cur
                  ? 'bg-primary text-primary-text'
                  : 'bg-surface text-ink-muted hover:bg-surface-raised'
              }`}
            >
              {cur === 'USD' ? '$' : 'ل.ل.'}
            </button>
          ))}
        </div>
      </div>

      {amount && currency === 'LBP' && (
        <p className="text-xs text-ink-faint ltr-isolate -mt-2" dir="ltr">
          ≈ {formatUSD(amountUSD)}
        </p>
      )}

      {/* Note */}
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="ملاحظة (اختياري)"
        className="h-11 rounded-md border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Live preview */}
      {preview.length > 0 && (
        <div className="bg-surface rounded-xl overflow-hidden divide-y divide-border">
          {preview.map(row => (
            <div key={row.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{row.reference}</span>
                <span className="text-sm text-ink truncate">{row.name}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className={`text-sm font-semibold ltr-isolate tabular-nums ${row.willBePaid ? 'text-success' : 'text-warning'}`} dir="ltr">
                  {formatUSD(row.cover)}
                </span>
                <span className={`text-xs ${row.willBePaid ? 'text-success' : 'text-ink-faint'}`}>
                  {row.willBePaid ? 'مسدد بالكامل' : `يتبقى ${formatUSD(row.invRemaining - row.cover)}`}
                </span>
              </div>
            </div>
          ))}
          {leftover > 0.001 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary-subtle">
              <span className="text-sm text-ink-muted">رصيد زائد</span>
              <span className="text-sm font-semibold ltr-isolate text-primary" dir="ltr">
                {formatUSD(leftover)}
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-bg rounded-md px-3 py-2 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !amount || parseFloat(amount) <= 0}
        className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {submitting ? 'جارٍ الحفظ…' : <><Check size={18} /> تأكيد الدفعة</>}
      </button>
    </form>
  )
}
