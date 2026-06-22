import { useState, useMemo } from 'react'
import { useSettings } from '../hooks/useSettings.js'
import { signOut, clearAllTransactions, clearPeriodTransactions, clearCategoryTransactions, getCategories } from '../lib/db.js'
import { getPeriodBounds } from '../lib/period.js'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from './HomeScreen.jsx'
import * as TablerIcons from '@tabler/icons-react'

// ─── Full world currency list ────────────────────────────────────────────────
const WORLD_CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'AFN', name: 'Afghan Afghani' },
  { code: 'ALL', name: 'Albanian Lek' },
  { code: 'AMD', name: 'Armenian Dram' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder' },
  { code: 'AOA', name: 'Angolan Kwanza' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'AWG', name: 'Aruban Florin' },
  { code: 'AZN', name: 'Azerbaijani Manat' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark' },
  { code: 'BBD', name: 'Barbadian Dollar' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'BIF', name: 'Burundian Franc' },
  { code: 'BMD', name: 'Bermudan Dollar' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'BSD', name: 'Bahamian Dollar' },
  { code: 'BTN', name: 'Bhutanese Ngultrum' },
  { code: 'BWP', name: 'Botswanan Pula' },
  { code: 'BYN', name: 'Belarusian Ruble' },
  { code: 'BZD', name: 'Belize Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CDF', name: 'Congolese Franc' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'CRC', name: 'Costa Rican Colón' },
  { code: 'CUP', name: 'Cuban Peso' },
  { code: 'CVE', name: 'Cape Verdean Escudo' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DJF', name: 'Djiboutian Franc' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'DOP', name: 'Dominican Peso' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'ERN', name: 'Eritrean Nakfa' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'EUR', name: 'Euro' },
  { code: 'FJD', name: 'Fijian Dollar' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'GEL', name: 'Georgian Lari' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'GIP', name: 'Gibraltar Pound' },
  { code: 'GMD', name: 'Gambian Dalasi' },
  { code: 'GNF', name: 'Guinean Franc' },
  { code: 'GTQ', name: 'Guatemalan Quetzal' },
  { code: 'GYD', name: 'Guyanaese Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HNL', name: 'Honduran Lempira' },
  { code: 'HTG', name: 'Haitian Gourde' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IQD', name: 'Iraqi Dinar' },
  { code: 'IRR', name: 'Iranian Rial' },
  { code: 'ISK', name: 'Icelandic Króna' },
  { code: 'JMD', name: 'Jamaican Dollar' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'KGS', name: 'Kyrgystani Som' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'KMF', name: 'Comorian Franc' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'KYD', name: 'Cayman Islands Dollar' },
  { code: 'KZT', name: 'Kazakhstani Tenge' },
  { code: 'LAK', name: 'Laotian Kip' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'LRD', name: 'Liberian Dollar' },
  { code: 'LYD', name: 'Libyan Dinar' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'MDL', name: 'Moldovan Leu' },
  { code: 'MGA', name: 'Malagasy Ariary' },
  { code: 'MKD', name: 'Macedonian Denar' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'MNT', name: 'Mongolian Tugrik' },
  { code: 'MOP', name: 'Macanese Pataca' },
  { code: 'MUR', name: 'Mauritian Rupee' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
  { code: 'MWK', name: 'Malawian Kwacha' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'MZN', name: 'Mozambican Metical' },
  { code: 'NAD', name: 'Namibian Dollar' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'NIO', name: 'Nicaraguan Córdoba' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'PAB', name: 'Panamanian Balboa' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'PYG', name: 'Paraguayan Guarani' },
  { code: 'QAR', name: 'Qatari Rial' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'RSD', name: 'Serbian Dinar' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SCR', name: 'Seychellois Rupee' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'SOS', name: 'Somali Shilling' },
  { code: 'SRD', name: 'Surinamese Dollar' },
  { code: 'SYP', name: 'Syrian Pound' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TJS', name: 'Tajikistani Somoni' },
  { code: 'TMT', name: 'Turkmenistani Manat' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar' },
  { code: 'TWD', name: 'New Taiwan Dollar' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'UYU', name: 'Uruguayan Peso' },
  { code: 'UZS', name: 'Uzbekistani Som' },
  { code: 'VES', name: 'Venezuelan Bolívar' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'XAF', name: 'Central African CFA Franc' },
  { code: 'XCD', name: 'East Caribbean Dollar' },
  { code: 'XOF', name: 'West African CFA Franc' },
  { code: 'XPF', name: 'CFP Franc' },
  { code: 'YER', name: 'Yemeni Rial' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'ZMW', name: 'Zambian Kwacha' },
]

// Home currency dropdown — same full list
const HOME_CURRENCY_CODES = WORLD_CURRENCIES.map((c) => c.code)

const PERIOD_DAYS = [
  { value: 1, label: 'Calendar month (1st)' },
  ...Array.from({ length: 27 }, (_, i) => ({
    value: i + 2,
    label: `${ordinal(i + 2)} of the month`,
  })),
]

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { settings, loading, save } = useSettings()
  const [saving, setSaving] = useState(false)
  const [currencySearch, setCurrencySearch] = useState('')
  const [currencySearchActive, setCurrencySearchActive] = useState(false)
  // danger zone
  const [deleteMode, setDeleteMode] = useState(null)     // null | 'all' | 'period' | 'category'
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteCatId, setDeleteCatId] = useState('')
  const [categories, setCategories] = useState([])
  const [deleting, setDeleting] = useState(false)

  async function handleSave(patch) {
    setSaving(true)
    await save(patch).catch(console.error)
    setSaving(false)
  }

  // Load categories when danger zone opens
  async function openDanger(mode) {
    setDeleteMode(mode)
    setDeleteConfirm(false)
    setDeleteCatId('')
    if (mode === 'category' && categories.length === 0) {
      const cats = await getCategories().catch(() => [])
      setCategories(cats)
      if (cats.length > 0) setDeleteCatId(cats[0].id)
    }
  }

  async function executeDeletion() {
    setDeleting(true)
    try {
      if (deleteMode === 'all') {
        await clearAllTransactions()
      } else if (deleteMode === 'period') {
        const b = getPeriodBounds(new Date(), settings.period_start_day ?? 1)
        await clearPeriodTransactions(b.from, b.to)
      } else if (deleteMode === 'category' && deleteCatId) {
        await clearCategoryTransactions(deleteCatId)
      }
      alert('Done — transactions deleted.')
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setDeleting(false)
      setDeleteMode(null)
      setDeleteConfirm(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function togglePin(code) {
    const pinned = settings.pinned_currencies
    const next = pinned.includes(code)
      ? pinned.filter((c) => c !== code)
      : [...pinned, code]
    if (next.length === 0) return
    handleSave({ pinned_currencies: next })
  }

  const filteredCurrencies = useMemo(() => {
    const q = currencySearch.trim().toLowerCase()
    if (!q) return WORLD_CURRENCIES
    return WORLD_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    )
  }, [currencySearch])

  if (loading) return <div className="screen"><p style={{ padding: 24 }}>Loading…</p></div>

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Settings</h2>
      </div>

      <div className="settings-list">

        {/* Home currency */}
        <div className="settings-section">
          <p className="settings-label">Home currency</p>
          <select
            className="settings-select"
            value={settings.home_currency}
            onChange={(e) => handleSave({ home_currency: e.target.value })}
          >
            {HOME_CURRENCY_CODES.map((c) => {
              const found = WORLD_CURRENCIES.find((x) => x.code === c)
              return (
                <option key={c} value={c}>
                  {c}{found ? ` — ${found.name}` : ''}
                </option>
              )
            })}
          </select>
          <p className="settings-hint">All totals are shown in this currency.</p>
        </div>

        {/* Period start day */}
        <div className="settings-section">
          <p className="settings-label">Budget period starts</p>
          <select
            className="settings-select"
            value={settings.period_start_day ?? 1}
            onChange={(e) => handleSave({ period_start_day: parseInt(e.target.value) })}
          >
            {PERIOD_DAYS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <p className="settings-hint">
            Set to your salary day for cycle-based tracking, or keep 1st for calendar months.
          </p>
        </div>

        {/* Pinned currencies */}
        <div className="settings-section">
          <p className="settings-label">Pinned currencies</p>
          <p className="settings-hint" style={{ marginBottom: 10 }}>
            Tap a pinned currency to remove it. Search to add more.
          </p>

          {/* Current pinned chips */}
          <div className="currency-chips" style={{ marginBottom: 12 }}>
            {settings.pinned_currencies.map((code) => (
              <button
                key={code}
                className="currency-chip currency-chip-active"
                onClick={() => togglePin(code)}
                title="Tap to unpin"
              >
                {code} ✕
              </button>
            ))}
          </div>

          {/* Search — expand list on focus */}
          <div className="currency-search-wrap">
            <TablerIcons.IconSearch size={16} stroke={2} color="var(--text-muted)" />
            <input
              className="currency-search-input"
              type="text"
              placeholder="Search to add currencies…"
              value={currencySearch}
              onFocus={() => setCurrencySearchActive(true)}
              onChange={(e) => setCurrencySearch(e.target.value)}
            />
            {(currencySearch || currencySearchActive) && (
              <button
                className="currency-search-clear"
                onClick={() => { setCurrencySearch(''); setCurrencySearchActive(false) }}
              >
                <TablerIcons.IconX size={14} stroke={2} />
              </button>
            )}
          </div>

          {/* Results list — only when search is active */}
          {currencySearchActive && (
            <div className="currency-results">
              {filteredCurrencies.length === 0 && (
                <p className="settings-hint" style={{ padding: '12px 0' }}>No match for "{currencySearch}"</p>
              )}
              {filteredCurrencies.map(({ code, name }) => {
                const pinned = settings.pinned_currencies.includes(code)
                return (
                  <button
                    key={code}
                    className={`currency-row ${pinned ? 'currency-row-pinned' : ''}`}
                    onClick={() => togglePin(code)}
                  >
                    <span className="currency-row-code">{code}</span>
                    <span className="currency-row-name">{name}</span>
                    {pinned
                      ? <TablerIcons.IconStarFilled size={16} color="var(--accent)" />
                      : <TablerIcons.IconStar size={16} stroke={1.5} color="var(--text-muted)" />
                    }
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="settings-section">
          <p className="settings-hint">
            Exchange rates by{' '}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="attr-link"
            >
              ExchangeRate-API
            </a>
            , updated daily.
          </p>
        </div>

        {/* Danger zone */}
        <div className="settings-section">
          <p className="settings-label" style={{ color: 'var(--danger)' }}>Danger zone</p>

          {!deleteMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="danger-btn" onClick={() => openDanger('all')}>
                Delete all transactions
              </button>
              <button className="danger-btn" onClick={() => openDanger('period')}>
                Delete this period's transactions
              </button>
              <button className="danger-btn" onClick={() => openDanger('category')}>
                Delete by category…
              </button>
            </div>
          )}

          {deleteMode && !deleteConfirm && (
            <div>
              {deleteMode === 'category' && (
                <div style={{ marginBottom: 10 }}>
                  <p className="settings-hint" style={{ marginBottom: 6 }}>Select category to clear:</p>
                  <select
                    className="settings-select"
                    value={deleteCatId}
                    onChange={(e) => setDeleteCatId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="settings-hint" style={{ color: 'var(--danger)', marginBottom: 10 }}>
                {deleteMode === 'all' && 'This deletes every expense you\'ve ever logged.'}
                {deleteMode === 'period' && 'This deletes all expenses in the current budget period.'}
                {deleteMode === 'category' && 'This deletes all expenses in the selected category.'}
                {' '}This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="danger-btn" onClick={() => setDeleteConfirm(true)}>
                  Confirm delete
                </button>
                <button className="text-btn" onClick={() => setDeleteMode(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteMode && deleteConfirm && (
            <div>
              <p className="settings-hint" style={{ color: 'var(--danger)', marginBottom: 10 }}>
                Last chance — are you absolutely sure?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="danger-btn" onClick={executeDeletion} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button className="text-btn" onClick={() => setDeleteMode(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="settings-section">
          <button className="signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>

      </div>

      <BottomNav active="settings" />
    </div>
  )
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
