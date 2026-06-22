import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSettings } from '../lib/db.js'
import { warmCache } from '../lib/fx.js'

const DEFAULT = {
  home_currency: 'AED',
  pinned_currencies: ['AED', 'USD', 'EUR', 'JPY', 'GBP'],
  period_start_day: 1,
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        warmCache(s.home_currency)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next) // optimistic
    await updateSettings(patch)
    if (patch.home_currency) warmCache(patch.home_currency)
  }, [settings])

  return { settings, loading, save }
}
