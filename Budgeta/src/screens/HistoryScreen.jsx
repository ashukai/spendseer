import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTransactions, getCategories, deleteTransaction } from '../lib/db.js'
import { useSettings } from '../hooks/useSettings.js'
import { BottomNav, formatAmount } from './HomeScreen.jsx'
import CategoryIcon from '../components/CategoryIcon.jsx'
import * as TablerIcons from '@tabler/icons-react'

export default function HistoryScreen() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterCatId, setFilterCatId]   = useState(() => searchParams.get('catId') || null)
  const [expandedId, setExpandedId]     = useState(null) // tapped tx row
  const [deletingId, setDeletingId]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [txs, cats] = await Promise.all([
        getTransactions(null, null),
        getCategories(),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(txId) {
    setDeletingId(txId)
    try {
      await deleteTransaction(txId)
      setTransactions((prev) => prev.filter((t) => t.id !== txId))
      setExpandedId(null)
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // Active categories that have at least one transaction
  const activeCatIds = new Set(transactions.map((t) => t.category_id).filter(Boolean))
  const filterCats = categories.filter((c) => activeCatIds.has(c.id))

  const filtered = transactions.filter((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id)
    // Category filter
    if (filterCatId && tx.category_id !== filterCatId) return false
    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !cat?.name?.toLowerCase().includes(q) &&
        !tx.note?.toLowerCase().includes(q) &&
        !tx.currency?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // Group by calendar date
  const groups = []
  const seen = {}
  for (const tx of filtered) {
    const d = new Date(tx.spent_at)
    const key = d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
    if (!seen[key]) {
      seen[key] = { date: d, label: key, txs: [], total: 0 }
      groups.push(seen[key])
    }
    seen[key].txs.push(tx)
    seen[key].total += parseFloat(tx.home_amount)
  }

  const activeFilter = filterCats.find((c) => c.id === filterCatId)

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">History</h2>
      </div>

      {/* Search */}
      <div className="history-search-bar">
        <TablerIcons.IconSearch size={16} stroke={2} color="var(--text-muted)" />
        <input
          className="history-search-input"
          placeholder="Search note, currency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <TablerIcons.IconX size={15} stroke={2} />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      {filterCats.length > 0 && (
        <div className="history-cat-filter">
          <button
            className={`hcat-chip ${!filterCatId ? 'hcat-chip-all' : ''}`}
            onClick={() => setFilterCatId(null)}
          >
            All
          </button>
          {filterCats.map((cat) => (
            <button
              key={cat.id}
              className="hcat-chip"
              style={filterCatId === cat.id ? {
                background: cat.color,
                borderColor: cat.color,
                color: '#fff',
              } : {}}
              onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Active filter label */}
      {activeFilter && (
        <div className="history-filter-label">
          <CategoryIcon icon={activeFilter.icon} color={activeFilter.color} size={18} />
          <span style={{ color: activeFilter.color, fontWeight: 700, fontSize: 13 }}>
            {activeFilter.name}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            — {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {loading && (
        <p style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</p>
      )}

      {!loading && groups.length === 0 && (
        <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>
          {search || filterCatId
            ? 'No matching transactions.'
            : 'No expenses yet. Tap a category on Home to add one.'}
        </p>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {groups.map((g) => (
          <div key={g.label}>
            <div className="history-day-header">
              <span className="history-day-label">{dayLabel(g.date)}</span>
              <span className="history-day-total">
                {settings.home_currency} {formatAmount(g.total)}
              </span>
            </div>

            {g.txs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id)
              const isExpanded = expandedId === tx.id
              const isDeleting = deletingId === tx.id

              return (
                <div key={tx.id}>
                  <button
                    className={`tx-row history-tx-row${isExpanded ? ' tx-row-expanded' : ''}`}
                    onClick={() => toggleExpand(tx.id)}
                  >
                    {cat ? (
                      <CategoryIcon icon={cat.icon} color={cat.color} size={38} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg3)', flexShrink: 0 }} />
                    )}
                    <div className="tx-info">
                      <div className="tx-cat">{cat?.name ?? 'Uncategorized'}</div>
                      {tx.note && <div className="tx-note">{tx.note}</div>}
                    </div>
                    <div className="tx-amounts">
                      {tx.currency !== settings.home_currency && (
                        <span className="tx-foreign">{tx.currency} {formatAmount(tx.amount)}</span>
                      )}
                      <span className="tx-home">
                        {settings.home_currency} {formatAmount(tx.home_amount)}
                      </span>
                    </div>
                    <TablerIcons.IconChevronDown
                      size={14} stroke={2}
                      color="var(--text-muted)"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                    />
                  </button>

                  {isExpanded && (
                    <div className="tx-actions">
                      <span className="tx-action-date">
                        {new Date(tx.spent_at).toLocaleDateString('en', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <button
                        className="tx-delete-btn"
                        onClick={() => handleDelete(tx.id)}
                        disabled={isDeleting}
                      >
                        <TablerIcons.IconTrash size={15} stroke={2} />
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <BottomNav active="history" />
    </div>
  )
}

function dayLabel(d) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
