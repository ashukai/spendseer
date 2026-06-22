/**
 * Period helpers.
 * periodStartDay: 1 = calendar month, 2–28 = salary-day cycle.
 *
 * Returns { from, to } as ISO strings (inclusive from, exclusive to).
 */
export function getPeriodBounds(date = new Date(), periodStartDay = 1) {
  const d = new Date(date)

  if (periodStartDay === 1) {
    // Calendar month
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to   = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return { from: from.toISOString(), to: to.toISOString() }
  }

  // Salary-day cycle: period runs from day X of one month to day X of next month
  const day = d.getDate()
  let periodStart, periodEnd

  if (day >= periodStartDay) {
    // We're in the current cycle: started this month on periodStartDay
    periodStart = new Date(d.getFullYear(), d.getMonth(), periodStartDay)
    periodEnd   = new Date(d.getFullYear(), d.getMonth() + 1, periodStartDay)
  } else {
    // We're in the cycle that started last month
    periodStart = new Date(d.getFullYear(), d.getMonth() - 1, periodStartDay)
    periodEnd   = new Date(d.getFullYear(), d.getMonth(), periodStartDay)
  }

  return { from: periodStart.toISOString(), to: periodEnd.toISOString() }
}

/**
 * Returns the same bounds shifted by `offset` periods.
 * offset = -1 means previous period, +1 means next period.
 */
export function shiftPeriod(bounds, offset, periodStartDay = 1) {
  const anchor = new Date(bounds.from)

  if (periodStartDay === 1) {
    const shifted = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1)
    return getPeriodBounds(shifted, 1)
  }

  // Move the anchor by `offset` months
  const shifted = new Date(anchor.getFullYear(), anchor.getMonth() + offset, periodStartDay)
  return getPeriodBounds(shifted, periodStartDay)
}

/** Human-readable period label, e.g. "June 2026" or "May 26 – Jun 25". */
export function periodLabel(bounds, periodStartDay = 1) {
  const from = new Date(bounds.from)
  const to   = new Date(new Date(bounds.to) - 1) // one ms before end

  if (periodStartDay === 1) {
    return from.toLocaleDateString('en', { month: 'long', year: 'numeric' })
  }

  const fmt = (d) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return `${fmt(from)} – ${fmt(to)}`
}
