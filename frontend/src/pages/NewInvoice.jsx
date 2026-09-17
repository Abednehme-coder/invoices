import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Check, ChevronDown, X } from 'lucide-react'
import api from '../api'
import PageHeader from '../components/PageHeader'

export default function NewInvoice() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const [form, setForm] = useState({
    name: '', whatsapp: '', amount: '', currency: 'USD', description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    api.get('/clients/').then(r => setClients(r.data)).catch(() => {})
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  function selectClient(client) {
    setSelectedClient(client)
    setForm(f => ({ ...f, name: client.name, whatsapp: client.whatsapp }))
    setShowClientList(false)
    setClientSearch('')
  }

  function clearClient() {
    setSelectedClient(null)
    setForm(f => ({ ...f, name: '', whatsapp: '' }))
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.whatsapp.includes(clientSearch)
  )

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
      const payload = {
        name: form.name,
        whatsapp: form.whatsapp,
        amount: form.amount,
        currency: form.currency,
        description: form.description,
        client: selectedClient?.id ?? null,
      }
      const res = await api.post('/invoices/', payload)
      navigate(`/invoices/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ، حاول مجدداً')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <PageHeader title="فاتورة جديدة" back />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

          {/* Client selector */}
          <section className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink">العميل</label>

            {selectedClient ? (
              <div className="flex items-center justify-between bg-primary-subtle rounded-md px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-ink">{selectedClient.name}</span>
                  <span className="text-xs text-ink-muted ltr-isolate" dir="ltr">{selectedClient.whatsapp}</span>
                </div>
                <button type="button" onClick={clearClient} className="p-1 text-ink-faint hover:text-ink rounded">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClientList(v => !v)}
                  className="w-full flex items-center justify-between h-12 rounded-md border border-border bg-surface px-4 text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span>اختر عميلاً أو أدخل يدوياً</span>
                  <ChevronDown size={18} className={`transition-transform ${showClientList ? 'rotate-180' : ''}`} />
                </button>

                {showClientList && (
                  <div className="absolute top-full mt-1 inset-x-0 z-overlay bg-bg border border-border rounded-md shadow-md overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <input
                        type="text"
                        placeholder="ابحث عن عميل..."
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        className="w-full h-9 rounded border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-ink-faint text-center">لا توجد نتائج</p>
                      ) : (
                        filteredClients.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectClient(c)}
                            className="w-full text-start flex flex-col px-4 py-2.5 hover:bg-surface transition-colors"
                          >
                            <span className="text-sm font-medium text-ink">{c.name}</span>
                            <span className="text-xs text-ink-faint ltr-isolate" dir="ltr">{c.whatsapp}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Name (manual override or standalone) */}
          <Field label="الاسم" required>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="اسم العميل أو الزبون"
              className={inputClass}
              required
            />
          </Field>

          {/* WhatsApp */}
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
                    recording
                      ? 'bg-danger text-white scale-110'
                      : 'bg-primary text-primary-text'
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
            disabled={submitting || !form.name || !form.amount}
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
