import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactions, getCategories } from '../lib/db.js'
import { useSettings } from '../hooks/useSettings.js'
import { getPeriodBounds, shiftPeriod, periodLabel } from '../lib/period.js'
import DonutRing from '../components/DonutRing.jsx'
import CategoryIcon from '../components/CategoryIcon.jsx'
import * as TablerIcons from '@tabler/icons-react'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { settings } = useSettings()

  const [bounds, setBounds]               = useState(() => getPeriodBounds(new Date(), 1))
  const [transactions, setTransactions]   = useState([])
  const [prevTransactions, setPrevTransactions] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    setBounds(getPeriodBounds(new Date(), settings.period_start_day))
  }, [settings.period_start_day])

  const prevBounds = useMemo(
    () => shiftPeriod(bounds, -1, settings.period_start_day),
    [bounds, settings.period_start_day]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, prevTxs, cats] = await Promise.all([
        getTransactions(bounds.from, bounds.to),
        getTransactions(prevBounds.from, prevBounds.to),
        getCategories(),
      ])
      setTransactions(txs)
      setPrevTransactions(prevTxs)
      setAllCategories(cats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [bounds, prevBounds])

  useEffect(() => { load() }, [load])

  const spendByCatId = transactions.reduce((acc, t) => {
    const id = t.category_id ?? 'uncategorized'
    acc[id] = (acc[id] ?? 0) + parseFloat(t.home_amount)
    return acc
  }, {})

  const total = Object.values(spendByCatId).reduce((s, v) => s + v, 0)

  const prevSpendByCatId = prevTransactions.reduce((acc, t) => {
    const id = t.category_id ?? 'uncategorized'
    acc[id] = (acc[id] ?? 0) + parseFloat(t.home_amount)
    return acc
  }, {})
  const prevTotal = Object.values(prevSpendByCatId).reduce((s, v) => s + v, 0)

  const pctChange = prevTotal > 0
    ? Math.round(((total - prevTotal) / prevTotal) * 100)
    : null

  const categoryRows = allCategories.map((cat) => ({
    ...cat,
    spent: spendByCatId[cat.id] ?? 0,
  }))

  const maxSpent = Math.max(...categoryRows.map((c) => c.spent), 1)

  const donutSegments = categoryRows
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .map((c) => ({ color: c.color, value: c.spent }))

  function shiftBounds(dir) {
    setBounds((prev) => shiftPeriod(prev, dir, settings.period_start_day))
  }

  const isCurrentPeriod =
    bounds.from === getPeriodBounds(new Date(), settings.period_start_day).from

  return (
    <div className="screen home-screen">
      <div className="home-top">
        <div className="period-nav">
          <button className="period-arrow" onClick={() => shiftBounds(-1)}>‹</button>
          <span className="period-label">
            {periodLabel(bounds, settings.period_start_day)}
          </span>
          <button
            className="period-arrow"
            onClick={() => shiftBounds(1)}
            disabled={isCurrentPeriod}
            style={{ opacity: isCurrentPeriod ? 0.3 : 1 }}
          >
            ›
          </button>
        </div>

        <div className="donut-wrap">
          <DonutRing segments={donutSegments} loading={loading} />
          <div className="donut-center">
            <span className="donut-currency">{settings.home_currency}</span>
            <span className="donut-total">
              {loading ? '—' : formatAmount(total)}
            </span>
            {!loading && pctChange !== null && (
              <span className={`donut-vs${pctChange > 0 ? ' donut-vs-up' : pctChange < 0 ? ' donut-vs-down' : ''}`}>
                {pctChange > 0 ? '▲' : pctChange < 0 ? '▼' : '='} {Math.abs(pctChange)}% vs last
              </span>
            )}
          </div>
        </div>

        {/* Period comparison bars — always show once there's current data */}
        {!loading && total > 0 && (
          <ComparisonBars
            categories={categoryRows}
            prevSpendByCatId={prevSpendByCatId}
            prevTotal={prevTotal}
            homeCurrency={settings.home_currency}
          />
        )}
      </div>

      {!loading && <p className="tap-hint">Tap a category to log an expense</p>}

      <div className="category-list">
        {categoryRows.map((cat) => (
          <div key={cat.id} className="category-row">
            {/* Icon tap → History filtered to this category */}
            <button
              className="cat-icon-btn"
              onClick={() => navigate(`/history?catId=${cat.id}`)}
              title="View history"
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size={44} />
            </button>
            {/* Rest of row → Add expense */}
            <button
              className="cat-row-body"
              onClick={() => navigate(`/add?categoryId=${cat.id}`)}
            >
              <span className="cat-name">{cat.name}</span>
              <span className={`cat-amount${cat.spent === 0 ? ' cat-amount-zero' : ''}`}>
                {cat.spent > 0 ? `${settings.home_currency} ${formatAmount(cat.spent)}` : '—'}
              </span>
              <span className="cat-add-hint">+ add</span>
            </button>
          </div>
        ))}
        {!loading && allCategories.length === 0 && (
          <p className="empty-hint">No categories yet. Add one in Categories.</p>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  )
}


function ComparisonBars({ categories, prevSpendByCatId, prevTotal }) {
  const rows = categories
    .filter((c) => c.spent > 0)
    .map((c) => ({ ...c, prev: prevSpendByCatId[c.id] ?? 0 }))
    .sort((a, b) => b.spent - a.spent)

  if (rows.length === 0) return null

  // No prev data yet — hide entirely, nothing to compare
  if (prevTotal === 0) return null

  const max = Math.max(...rows.flatMap((c) => [c.spent, c.prev]), 1)

  return (
    <div className="comparison-wrap">
      <div className="comparison-legend">
        <span className="cleg-this">● This period</span>
        <span className="cleg-prev">● Last period</span>
      </div>
      {rows.map((cat) => (
        <div key={cat.id} className="cmp-row">
          <span className="cmp-name">{cat.name}</span>
          <div className="cmp-bars">
            <div className="cmp-bar" style={{ width: `${(cat.spent / max) * 100}%`, background: cat.color }} />
            <div className="cmp-bar" style={{ width: `${(cat.prev / max) * 100}%`, background: cat.color, opacity: 0.28 }} />
          </div>
          <span className="cmp-amt">{formatAmount(cat.spent)}</span>
        </div>
      ))}
    </div>
  )
}

function BottomNav({ active }) {
  const navigate = useNavigate()
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${active === 'home' ? 'nav-active' : ''}`}
        onClick={() => navigate('/')}
      >
        <TablerIcons.IconHome size={22} stroke={1.8} /><span>Home</span>
      </button>
      <button
        className={`nav-btn ${active === 'history' ? 'nav-active' : ''}`}
        onClick={() => navigate('/history')}
      >
        <TablerIcons.IconReceipt size={22} stroke={1.8} /><span>History</span>
      </button>
      <button
        className={`nav-btn ${active === 'categories' ? 'nav-active' : ''}`}
        onClick={() => navigate('/categories')}
      >
        <TablerIcons.IconTag size={22} stroke={1.8} /><span>Categories</span>
      </button>
      <button
        className={`nav-btn ${active === 'settings' ? 'nav-active' : ''}`}
        onClick={() => navigate('/settings')}
      >
        <TablerIcons.IconSettings size={22} stroke={1.8} /><span>Settings</span>
      </button>
    </nav>
  )
}

function formatAmount(n) {
  return Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export { BottomNav, formatAmount }
