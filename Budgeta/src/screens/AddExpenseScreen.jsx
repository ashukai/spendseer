import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCategories, addTransaction } from '../lib/db.js'
import { useSettings } from '../hooks/useSettings.js'
import { convert, convertSync, fetchRates } from '../lib/fx.js'
import CategoryIcon from '../components/CategoryIcon.jsx'

const ALL_CURRENCIES = [
  'AED','USD','EUR','JPY','GBP','CHF','CNY','CAD','AUD','SGD',
  'HKD','KRW','INR','MXN','BRL','TRY','SAR','SEK','NOK','DKK',
  'NZD','ZAR','THB','IDR','MYR','PHP','PKR','EGP','ILS','CZK',
  'PLN','HUF','RON','HRK','BGN','RSD','UAH','ARS','CLP','COP',
]

const KEYPAD = [
  ['1',''],['2','ABC'],['3','DEF'],
  ['4','GHI'],['5','JKL'],['6','MNO'],
  ['7','PQRS'],['8','TUV'],['9','WXYZ'],
  ['.',''],['0',''],['⌫',''],
]

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 200, 500]

export default function AddExpenseScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useSettings()

  // Persist last-used currency across sessions
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem('spendseer_last_currency') ?? settings.pinned_currencies[0] ?? 'AED'
  )
  const [rawAmount, setRawAmount]     = useState('')
  const [homePreview, setHomePreview] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [note, setNote]               = useState('')
  const [saving, setSaving]           = useState(false)

  function setCurrency(code) {
    setCurrencyState(code)
    localStorage.setItem('spendseer_last_currency', code)
  }

  useEffect(() => {
    const catId = searchParams.get('categoryId')
    if (!catId) return
    getCategories()
      .then((cats) => {
        const found = cats.find((c) => c.id === catId)
        if (found) setSelectedCat(found)
      })
      .catch(console.error)
    fetchRates(settings.home_currency).catch(() => {})
  }, [searchParams, settings.home_currency])

  // Only fall back to settings default if nothing stored
  useEffect(() => {
    if (!localStorage.getItem('spendseer_last_currency')) {
      setCurrencyState(settings.pinned_currencies[0] ?? 'AED')
    }
  }, [settings.pinned_currencies])

  useEffect(() => {
    const amount = parseFloat(rawAmount) || 0
    if (amount === 0) { setHomePreview(null); return }
    const preview = convertSync(amount, currency, settings.home_currency)
    setHomePreview(preview)
  }, [rawAmount, currency, settings.home_currency])

  function pressKey(key) {
    setRawAmount((prev) => {
      if (key === '⌫') return prev.slice(0, -1)
      if (key === '.' && prev.includes('.')) return prev
      if (key === '.' && prev === '') return '0.'
      if (prev === '0' && key !== '.') return key
      const next = prev + key
      const parts = next.split('.')
      if (parts[1]?.length > 2) return prev
      return next
    })
  }

  function tapQuickAmount(amt) {
    setRawAmount(String(amt))
  }

  async function handleSave() {
    const amount = parseFloat(rawAmount)
    if (!amount || !selectedCat) return
    setSaving(true)
    try {
      const { rate, homeAmount } = await convert(amount, currency, settings.home_currency)
      await addTransaction({
        amount,
        currency,
        rate,
        home_amount: homeAmount,
        category_id: selectedCat.id,
        note: note.trim() || null,
        spent_at: new Date().toISOString(),
      })
      navigate('/', { replace: true })
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const pinnedCurrencies = settings.pinned_currencies ?? ['AED','USD','EUR','JPY','GBP']
  const allCurrencies = [
    ...pinnedCurrencies,
    ...ALL_CURRENCIES.filter((c) => !pinnedCurrencies.includes(c)),
  ]
  const amount = parseFloat(rawAmount) || 0
  const showPreview = homePreview != null && currency !== settings.home_currency

  return (
    <div className="screen add-screen">
      {/* Header: back + category */}
      <div className="add-top">
        <div className="add-header">
          <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
          {selectedCat && (
            <div className="add-cat-pill" style={{ '--pill-color': selectedCat.color }}>
              <CategoryIcon icon={selectedCat.icon} color={selectedCat.color} size={34} />
              <div>
                <div className="add-cat-name" style={{ color: selectedCat.color }}>
                  {selectedCat.name}
                </div>
                <div className="add-cat-sub">Enter amount · pick currency below</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amount display */}
      <div className="amount-wrap">
        <div className="amount-row">
          <span className="amount-currency">{currency}</span>
          <span className="amount-value">{rawAmount || '0'}</span>
        </div>
        <div className="home-preview">
          {showPreview ? `≈ ${settings.home_currency} ${homePreview.toFixed(2)}` : ' '}
        </div>
      </div>

      {/* Keypad */}
      <div className="keypad">
        {KEYPAD.map(([k, sub]) => (
          <button
            key={k}
            className={`key${k === '⌫' ? ' key-del' : ''}`}
            onClick={() => pressKey(k)}
          >
            {k === '⌫' ? (
              <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>⌫</span>
            ) : (
              <>
                <span className="key-num">{k}</span>
                {sub && <span className="key-sub">{sub}</span>}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Quick-amount chips — moved below keypad so they sit in thumb zone */}
      <div className="quick-amounts">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            className={`quick-chip${rawAmount === String(amt) ? ' quick-chip-active' : ''}${[10, 50, 100].includes(amt) ? ' quick-chip-wide' : ''}`}
            onClick={() => tapQuickAmount(amt)}
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Currency row — near thumb, above save */}
      <div className="cur-section">
        <div className="cur-row">
          {allCurrencies.map((code) => (
            <button
              key={code}
              className={`cur-chip ${currency === code ? 'cur-chip-active' : ''}`}
              onClick={() => setCurrency(code)}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Note + Save */}
      <div className="add-bottom-row">
        <input
          className="note-input-inline"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
        />
        <button
          className="save-btn-inline"
          disabled={!amount || !selectedCat || saving}
          onClick={handleSave}
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
