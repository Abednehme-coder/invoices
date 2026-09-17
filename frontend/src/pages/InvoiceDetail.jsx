import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, Trash2, CheckCircle, CreditCard, User } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import BottomSheet from '../components/BottomSheet'
import { formatUSD, formatAmount } from '../components/CurrencyDisplay'
import Spinner from '../components/Spinner'

function formatDateTime(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('ar-LB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(dateStr))
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [paySheetOpen, setPaySheetOpen] = useState(false)

  function reload() {
    return api.get(`/invoices/${id}/`).then(r => setInvoice(r.data))
  }

  useEffect(() => { reload().finally(() => setLoading(false)) }, [id])

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const res = await api.post(`/invoices/${id}/mark-paid/`)
      setInvoice(res.data)
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleDelete() {
    if (!confirm('حذف هذه الفاتورة نهائياً؟')) return
    setDeleting(true)
    try {
      await api.delete(`/invoices/${id}/`)
      navigate(-1)
    } catch {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل الفاتورة" back />
      <div className="flex-1 flex items-center justify-center"><Spinner size={32} /></div>
    </div>
  )

  if (!invoice) return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تفاصيل الفاتورة" back />
      <div className="flex-1 flex items-center justify-center text-ink-faint">الفاتورة غير موجودة</div>
    </div>
  )

  const remaining = parseFloat(invoice.remaining_usd)
  const total = parseFloat(invoice.amount_usd)
  const paidAmt = total - remaining
  const progressPct = total > 0 ? Math.round((paidAmt / total) * 100) : 0
  const isPaid = invoice.status === 'paid'
  const isPartial = invoice.status === 'partial'
  const isUnpaid = invoice.status === 'unpaid'
  const isActive = isUnpaid || isPartial
  const waLink = invoice.whatsapp
    ? `https://wa.me/${invoice.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader
        title={invoice.reference}
        back
        action={
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-10 h-10 flex items-center justify-center rounded-md text-danger hover:bg-danger-bg transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            aria-label="حذف الفاتورة"
          >
            <Trash2 size={18} />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-8 flex flex-col gap-4">

        {/* ── Hero: amount + status ── */}
        <div className={`rounded-xl p-5 flex flex-col gap-3 ${isPaid ? 'bg-success-bg' : 'bg-surface'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-ink-muted">
                {isPaid ? 'مدفوعة' : isPartial ? 'المتبقي' : 'المبلغ'}
              </span>
              <span
                className={`ltr-isolate tabular-nums font-bold leading-none ${isPaid ? 'text-success' : isPartial ? 'text-danger' : 'text-ink'}`}
                dir="ltr"
                style={{ fontSize: 'clamp(1.75rem, 7vw, 2.25rem)' }}
              >
                {isPaid
                  ? formatUSD(total)
                  : isPartial
                    ? formatUSD(remaining)
                    : formatAmount(parseFloat(invoice.amount), invoice.currency)}
              </span>
              {invoice.currency === 'LBP' && !isPaid && !isPartial && (
                <span className="text-sm text-ink-muted ltr-isolate tabular-nums" dir="ltr">
                  ≈ {formatUSD(total)}
                </span>
              )}
            </div>
            <StatusBadge status={invoice.status} size="md" />
          </div>

          {/* Progress bar for partial */}
          {isPartial && (
            <div className="flex flex-col gap-1.5">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-faint">
                <span>مدفوع <span className="ltr-isolate" dir="ltr">{formatUSD(paidAmt)}</span></span>
                <span className="ltr-isolate" dir="ltr">{progressPct}%</span>
              </div>
            </div>
          )}

          {isPaid && invoice.paid_at && (
            <span className="text-xs text-success">{formatDateTime(invoice.paid_at)}</span>
          )}
        </div>

        {/* ── Action buttons ── */}
        {isActive && (
          <div className={`grid gap-2 ${invoice.client && invoice.client_name ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Partial payment — only if linked to a client */}
            {invoice.client && invoice.client_name && (
              <button
                onClick={() => setPaySheetOpen(true)}
                className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <CreditCard size={17} />
                تسجيل دفعة
              </button>
            )}
            {/* Mark fully paid */}
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="h-12 rounded-md bg-success text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:opacity-90 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
            >
              <CheckCircle size={17} />
              {markingPaid ? 'جارٍ…' : 'مدفوعة كاملاً'}
            </button>
          </div>
        )}

        {/* WhatsApp */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-md border border-border bg-surface text-ink font-medium flex items-center justify-center gap-2 transition-colors hover:bg-surface-raised active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MessageCircle size={17} className="text-success" />
            تواصل عبر واتساب
          </a>
        )}

        {/* ── Details ── */}
        <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wide">تفاصيل</h3>

          <Row label="الاسم">
            <span className="text-sm font-medium text-ink">{invoice.name}</span>
          </Row>

          <Row label="المبلغ الأصلي">
            <span className="ltr-isolate tabular-nums text-sm font-medium text-ink" dir="ltr">
              {formatAmount(parseFloat(invoice.amount), invoice.currency)}
            </span>
          </Row>

          {invoice.currency === 'LBP' && (
            <Row label="بالدولار">
              <span className="ltr-isolate tabular-nums text-sm text-ink-muted" dir="ltr">
                {formatUSD(total)}
              </span>
            </Row>
          )}

          <Row label="تاريخ الإنشاء">
            <span className="text-sm text-ink-muted">{formatDate(invoice.created_at)}</span>
          </Row>

          {invoice.description && (
            <div className="flex flex-col gap-1 pt-1 border-t border-border">
              <span className="text-xs text-ink-faint">الوصف</span>
              <p className="text-sm text-ink leading-relaxed">{invoice.description}</p>
            </div>
          )}
        </div>

        {/* ── Client ── */}
        {invoice.client_name && (
          <button
            onClick={() => navigate(`/clients/${invoice.client}`)}
            className="bg-surface rounded-xl p-4 flex items-center justify-between gap-3 text-start hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">{invoice.client_name}</span>
                <span className="text-xs text-ink-faint">عرض ملف العميل</span>
              </div>
            </div>
            <span className="text-ink-faint text-lg">‹</span>
          </button>
        )}

        {/* ── Danger zone ── */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-11 rounded-md border border-danger/30 text-danger text-sm font-medium flex items-center justify-center gap-2 hover:bg-danger-bg transition-colors disabled:opacity-50"
        >
          <Trash2 size={15} />
          حذف الفاتورة
        </button>
      </main>

      {/* Payment sheet — only for client invoices */}
      {invoice.client && (
        <BottomSheet
          open={paySheetOpen}
          onClose={() => setPaySheetOpen(false)}
          title="تسجيل دفعة"
        >
          <InvoicePaymentForm
            invoice={invoice}
            onSuccess={() => { setPaySheetOpen(false); reload() }}
          />
        </BottomSheet>
      )}
    </div>
  )
}

// ── Inline payment form (sheet) ───────────────────────────────────────────────
function InvoicePaymentForm({ invoice, onSuccess }) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/payments/', {
        client: invoice.client,
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

  const remaining = parseFloat(invoice.remaining_usd)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-ink-muted">
        متبقي على هذه الفاتورة:{' '}
        <span className="font-semibold text-danger ltr-isolate" dir="ltr">{formatUSD(remaining)}</span>
      </p>

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
        <p className="text-xs text-ink-faint ltr-isolate -mt-2" dir="ltr">≈ {formatUSD(amountUSD)}</p>
      )}

      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="ملاحظة (اختياري)"
        className="h-11 rounded-md border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {error && (
        <p className="text-sm text-danger bg-danger-bg rounded-md px-3 py-2 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !amount || parseFloat(amount) <= 0}
        className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary-hover transition-colors"
      >
        {submitting ? 'جارٍ الحفظ…' : 'تأكيد الدفعة'}
      </button>
    </form>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-muted shrink-0">{label}</span>
      {children}
    </div>
  )
}
