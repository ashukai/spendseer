/**
 * FX rate utility
 * Source: https://open.er-api.com/v6/latest/{BASE}
 * Attribution required: link to exchangerate-api.com in the UI.
 *
 * Fetches with BASE = home currency.
 * rates[CODE] = units of CODE per 1 home unit
 * → home_amount = foreign_amount / rates[foreignCode]
 * → rate stored on tx = 1 / rates[foreignCode]  (home per 1 foreign unit)
 */

const CACHE_KEY = 'budgeta_fx'
const TTL_MS = 60 * 60 * 1000 // 1 hour

function readCache(homeCurrency) {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { base, rates, fetchedAt } = JSON.parse(raw)
    if (base !== homeCurrency) return null
    if (Date.now() - fetchedAt > TTL_MS) return null
    return rates
  } catch {
    return null
  }
}

function writeCache(homeCurrency, rates) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ base: homeCurrency, rates, fetchedAt: Date.now() })
  )
}

let inflight = null

export async function fetchRates(homeCurrency) {
  const cached = readCache(homeCurrency)
  if (cached) return cached

  // Deduplicate concurrent calls
  if (!inflight) {
    inflight = fetch(`https://open.er-api.com/v6/latest/${homeCurrency}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.result !== 'success') throw new Error('FX fetch failed')
        writeCache(homeCurrency, json.rates)
        return json.rates
      })
      .finally(() => { inflight = null })
  }
  return inflight
}

/**
 * Returns { rate, homeAmount }
 * rate = home per 1 unit of foreignCurrency (stored on the transaction)
 * homeAmount = amount * rate
 */
export async function convert(amount, foreignCurrency, homeCurrency) {
  if (foreignCurrency === homeCurrency) {
    return { rate: 1, homeAmount: amount }
  }
  const rates = await fetchRates(homeCurrency)
  const unitsOfForeignPerHome = rates[foreignCurrency]
  if (!unitsOfForeignPerHome) throw new Error(`No rate for ${foreignCurrency}`)
  const rate = 1 / unitsOfForeignPerHome          // home per 1 foreign
  const homeAmount = parseFloat((amount * rate).toFixed(2))
  return { rate, homeAmount }
}

/**
 * For the live-conversion preview as the user types.
 * Returns homeAmount synchronously from cache, or null if not cached yet.
 */
export function convertSync(amount, foreignCurrency, homeCurrency) {
  if (foreignCurrency === homeCurrency) return amount
  const rates = readCache(homeCurrency)
  if (!rates || !rates[foreignCurrency]) return null
  const rate = 1 / rates[foreignCurrency]
  return parseFloat((amount * rate).toFixed(2))
}

/** Warm the cache on app load so conversions feel instant. */
export function warmCache(homeCurrency) {
  fetchRates(homeCurrency).catch(() => {})
}
