import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Check, X, UserPlus, User } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'

// Fuzzy score: higher = better match. Returns 0 if no match.
function fuzzyScore(name, query) {
  if (!query) return 1
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  if (n === q) return 4
  if (n.startsWith(q)) return 3
  if (n.split(/\s+/).some(word => word.startsWith(q))) return 2
  if (n.includes(q)) return 1
  // character overlap fallback for typos
  let matches = 0
  for (const ch of q) { if (n.includes(ch)) matches++ }
  return matches / q.length >= 0.6 ? 0.5 : 0
}

export default function NewInvoice() {
  const navigate = useNavigate()
  const [allClients, setAllClients] = useState([])

  // Client selection state
  // mode: null (standalone) | 'existing' (linked to saved client) | 'new' (will create)
  const [clientMode, setClientMode] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null) // only when mode=existing

  const [form, setForm] = useState({
    name: '', whatsapp: '', amount: '', currency: 'USD', description: '',
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  const recognitionRef = useRef(null)
  const nameInputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    api.get('/clients/').then(r => setAllClients(r.data)).catch(() => {})
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        nameInputRef.current && !nameInputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Ranked client suggestions
  const suggestions = form.name.trim()
    ? allClients
        .map(c => ({ client: c, score: fuzzyScore(c.name, form.name.trim()) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.client)
    : allClients.slice(0, 6)

  // Show "add as new client" when: field has text AND no exact match AND mode isn't already set
  const showAddNew = form.name.trim().length > 0 && clientMode === null

  function pickExistingClient(client) {
    setSelectedClient(client)
    setClientMode('existing')
    setForm(f => ({ ...f, name: client.name, whatsapp: client.whatsapp || '' }))
    setDropdownOpen(false)
  }

  function pickNewClient() {
    setClientMode('new')
    setDropdownOpen(false)
    // focus whatsapp next
  }

  function clearClientSelection() {
    setClientMode(null)
    setSelectedClient(null)
    setForm(f => ({ ...f, name: '', whatsapp: '' }))
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  function onNameChange(e) {
    const val = e.target.value
    setForm(f => ({ ...f, name: val }))
    // Clear any existing selection if user edits the name
    if (clientMode !== null) {
      setClientMode(null)
      setSelectedClient(null)
    }
    setDropdownOpen(true)
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'ar-LB'
    r.continuous = false
    r.interimResults = false
    r.onresult = e => {
      const text = e.results[0][0].transcript
      setForm(f => ({ ...f, description: f.description ? f.description + ' ' + text : text }))
      setRecording(false)
    }
    r.onerror = () => setRecording(false)
    r.onend = () => setRecording(false)
    recognitionRef.current = r
    r.start()
    setRecording(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.amount) return
    setError('')
    setSubmitting(true)
    try {
      let clientId = selectedClient?.id ?? null

      // Create new client first if needed
      if (clientMode === 'new') {
        const clientRes = await api.post('/clients/', {
          name: form.name.trim(),
          whatsapp: form.whatsapp.trim(),
        })
        clientId = clientRes.data.id
      }

      const res = await api.post('/invoices/', {
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim(),
        amount: form.amount,
        currency: form.currency,
        description: form.description,
        client: clientId,
      })
      navigate(`/invoices/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || (typeof data === 'object' ? Object.values(data).flat()[0] : null) || 'حدث خطأ، حاول مجدداً'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const showWhatsApp = clientMode !== 'existing'

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="فاتورة جديدة" back />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

          {/* ── Client / Name field ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              الاسم <span className="text-danger">*</span>
            </label>

            {/* Selected existing client chip */}
            {clientMode === 'existing' && selectedClient ? (
              <div className="flex items-center justify-between bg-primary-subtle rounded-md px-4 py-3 border border-primary/20">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-ink text-sm">{selectedClient.name}</span>
                    {selectedClient.whatsapp && (
                      <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{selectedClient.whatsapp}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearClientSelection}
                  className="p-1 text-ink-faint hover:text-ink rounded transition-colors"
                  aria-label="تغيير العميل"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* New client badge + clear */
              clientMode === 'new' ? (
                <div className="flex items-center justify-between bg-success-bg rounded-md px-4 py-3 border border-success/20">
                  <div className="flex items-center gap-2.5">
                    <UserPlus size={16} className="text-success shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium text-ink text-sm">{form.name}</span>
                      <span className="text-xs text-success">سيتم حفظه كعميل جديد</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearClientSelection}
                    className="p-1 text-ink-faint hover:text-ink rounded transition-colors"
                    aria-label="تغيير الاسم"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                /* Search / type input */
                <div className="relative" ref={dropdownRef}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={form.name}
                    onChange={onNameChange}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="ابحث عن عميل أو اكتب اسماً جديداً..."
                    className={inputClass}
                    autoComplete="off"
                  />

                  {dropdownOpen && (suggestions.length > 0 || showAddNew) && (
                    <div className="absolute top-full mt-1 inset-x-0 bg-bg border border-border rounded-md shadow-md overflow-hidden z-[20]">
                      <ul className="max-h-52 overflow-y-auto">
                        {suggestions.map(c => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onPointerDown={e => { e.preventDefault(); pickExistingClient(c) }}
                              className="w-full text-start flex items-center justify-between px-4 py-2.5 hover:bg-surface transition-colors"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-ink truncate">{c.name}</span>
                                {c.whatsapp && (
                                  <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{c.whatsapp}</span>
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

                        {showAddNew && (
                          <li className="border-t border-border">
                            <button
                              type="button"
                              onPointerDown={e => { e.preventDefault(); pickNewClient() }}
                              className="w-full text-start flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface transition-colors text-primary"
                            >
                              <UserPlus size={15} className="shrink-0" />
                              <span className="text-sm font-medium">
                                إضافة "{form.name}" كعميل جديد
                              </span>
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* WhatsApp — hidden when existing saved client with number */}
          {showWhatsApp && (
            <Field label="رقم واتساب">
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+961 70 000 000"
                className={`${inputClass} ltr-isolate`}
                dir="ltr"
              />
            </Field>
          )}

          {/* Amount + currency */}
          <Field label="المبلغ" required>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                min="0"
                step="any"
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
                    {cur === 'USD' ? '$' : 'ل.ل.'}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Description + voice */}
          <Field label="الوصف">
            <div className="relative">
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف البضاعة أو الخدمة..."
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary resize-none pb-12"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onPointerDown={startVoice}
                  onPointerUp={stopVoice}
                  onPointerLeave={stopVoice}
                  className={`absolute bottom-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-fast ${
                    recording ? 'bg-danger text-white scale-110' : 'bg-primary text-primary-text'
                  }`}
                  aria-label={recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                >
                  {recording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>
            {recording && (
              <p className="text-xs text-danger flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse inline-block" />
                جارٍ التسجيل… أفلت للإيقاف
              </p>
            )}
          </Field>

          {error && (
            <p role="alert" className="text-sm text-danger bg-danger-bg rounded-md px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !form.name.trim() || !form.amount}
            className="h-12 rounded-md bg-primary text-primary-text font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {submitting ? 'جارٍ الحفظ…' : (
              <><Check size={18} /> حفظ الفاتورة</>
            )}
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
        {label}{required && <span className="text-danger mr-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'h-12 rounded-md border border-border bg-surface px-4 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full'
