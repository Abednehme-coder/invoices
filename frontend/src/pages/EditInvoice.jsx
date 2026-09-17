import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, X } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { formatPhone, sanitizePhone } from '../components/CurrencyDisplay'
import { sanitizeAmount, formatAmountInput } from '../utils/amount'

function fuzzyScore(name, query) {
  if (!query) return 1
  const n = name.toLowerCase(), q = query.toLowerCase()
  if (n === q) return 4
  if (n.startsWith(q)) return 3
  if (n.split(/\s+/).some(w => w.startsWith(q))) return 2
  if (n.includes(q)) return 1
  let matches = 0
  for (const ch of q) { if (n.includes(ch)) matches++ }
  return matches / q.length >= 0.6 ? 0.5 : 0
}

export default function EditInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [allClients, setAllClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)  // client object or null
  const [clientMode, setClientMode] = useState(null)           // 'existing' | null
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [form, setForm] = useState({
    name: '', whatsapp: '', amount: '', currency: 'USD', description: '',
  })

  const nameInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Load invoice + clients in parallel
  useEffect(() => {
    Promise.all([
      api.get(`/invoices/${id}/`),
      api.get('/clients/'),
    ]).then(([invRes, clientsRes]) => {
      const inv = invRes.data
      const clients = clientsRes.data
      setAllClients(clients)

      setForm({
        name: inv.name,
        whatsapp: inv.whatsapp || '',
        amount: inv.amount,
        currency: inv.currency,
        description: inv.description || '',
      })

      if (inv.client) {
        const linked = clients.find(c => c.id === inv.client)
        if (linked) {
          setSelectedClient(linked)
          setClientMode('existing')
        }
      }
    }).catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false))
  }, [id])

  // Ranked suggestions
  const suggestions = form.name.trim()
    ? allClients
        .map(c => ({ client: c, score: fuzzyScore(c.name, form.name.trim()) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.client)
    : allClients.slice(0, 6)

  function pickClient(client) {
    setSelectedClient(client)
    setClientMode('existing')
    setForm(f => ({ ...f, name: client.name, whatsapp: client.whatsapp || '' }))
    setDropdownOpen(false)
  }

  function clearClient() {
    setClientMode(null)
    setSelectedClient(null)
    setForm(f => ({ ...f, name: '', whatsapp: '' }))
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function onNameChange(e) {
    const val = e.target.value
    setForm(f => ({ ...f, name: val }))
    if (clientMode === 'existing') {
      setClientMode(null)
      setSelectedClient(null)
    }
    setDropdownOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    setError('')
    try {
      await api.patch(`/invoices/${id}/`, {
        name: form.name.trim(),
        whatsapp: form.whatsapp,
        amount: form.amount,
        currency: form.currency,
        description: form.description,
        client: selectedClient?.id ?? null,
      })
      navigate(`/invoices/${id}`, { replace: true })
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || (typeof data === 'object' ? Object.values(data).flat()[0] : null) || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    )
  }

  const showWhatsApp = clientMode !== 'existing'

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="تعديل الفاتورة" back />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

          {/* ── Client / Name ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              الاسم <span className="text-danger">*</span>
            </label>

            {clientMode === 'existing' && selectedClient ? (
              /* Selected client chip */
              <div className="flex items-center justify-between bg-primary-subtle rounded-md px-4 py-3 border border-primary/20">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-ink text-sm">{selectedClient.name}</span>
                    {selectedClient.whatsapp && (
                      <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">
                        {formatPhone(selectedClient.whatsapp)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearClient}
                  className="p-1 text-ink-faint hover:text-ink rounded transition-colors"
                  aria-label="تغيير العميل"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* Search input + dropdown */
              <div className="relative" ref={dropdownRef}>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={form.name}
                  onChange={onNameChange}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="ابحث عن عميل أو اكتب اسماً..."
                  className={inputClass}
                  autoComplete="off"
                />

                {dropdownOpen && suggestions.length > 0 && (
                  <div className="absolute top-full mt-1 inset-x-0 bg-bg border border-border rounded-md shadow-md overflow-hidden z-[20]">
                    <ul className="max-h-52 overflow-y-auto">
                      {suggestions.map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onPointerDown={e => { e.preventDefault(); pickClient(c) }}
                            className="w-full text-start flex items-center justify-between px-4 py-2.5 hover:bg-surface transition-colors"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-ink truncate">{c.name}</span>
                              {c.whatsapp && (
                                <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">
                                  {formatPhone(c.whatsapp)}
                                </span>
                              )}
                            </div>
                            {parseFloat(c.total_owed_usd) > 0 && (
                              <span className="text-xs text-danger ltr-isolate shrink-0 ms-2" dir="ltr">
                                ${parseFloat(c.total_owed_usd).toFixed(0)} دين
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp — hidden when client selected (has its own number) */}
          {showWhatsApp && (
            <Field label="رقم واتساب">
              <input
                type="tel"
                inputMode="numeric"
                value={formatPhone(form.whatsapp)}
                onChange={e => setForm(f => ({ ...f, whatsapp: sanitizePhone(e.target.value) }))}
                placeholder="XX XXX XXX"
                maxLength={10}
                className={`${inputClass} ltr-isolate`}
                dir="ltr"
              />
            </Field>
          )}

          {/* Amount + currency */}
          <Field label="المبلغ" required>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={formatAmountInput(form.amount)}
                onChange={e => setForm(f => ({ ...f, amount: sanitizeAmount(e.target.value) }))}
                placeholder="0"
                className={`${inputClass} flex-1 ltr-isolate`}
                dir="ltr"
                required
              />
              <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                {['USD', 'LBP'].map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, currency: cur }))}
                    className={`px-4 h-12 text-sm font-medium transition-colors ${
                      form.currency === cur
                        ? 'bg-primary text-primary-text'
                        : 'bg-surface text-ink-muted hover:bg-surface-raised'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Description */}
          <Field label="الوصف">
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="ملاحظات اختيارية..."
              rows={3}
              className={`${inputClass} h-auto py-2.5 resize-none`}
            />
          </Field>

          {error && (
            <p className="text-sm text-danger bg-danger-bg rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !form.name.trim() || !form.amount}
            className="h-12 rounded-md bg-primary text-primary-text font-semibold disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
          </button>

        </form>
      </main>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">
        {label}{required && <span className="text-danger ms-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'h-12 rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary w-full'
