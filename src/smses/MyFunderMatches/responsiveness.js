"use client"

/* ════════════════════════════════════════════════════════════════════════════
   responsiveness.js

   The spec's cross-cutting metric for funders, catalysts and advisors:

     "Calculate it from the median number of business days between an eligible
      SME action and the organisation's first meaningful platform response.
      Display the metric as a human-readable range and pair it with the
      percentage of eligible enquiries answered. Do not measure final
      investment or programme decision time as response time."

   Three rules follow from that wording and are enforced here:

   1. Business days, not calendar days. A Friday enquiry answered Monday is one
      day, not three.
   2. The clock stops at the FIRST meaningful response, not the outcome. A
      decision that lands eight weeks later does not make a funder slow if they
      replied in two days. Callers must pass firstRespondedAt, never
      decidedAt / approvedAt / declinedAt.
   3. Below the sample threshold the metric is withheld rather than estimated.
      One fast reply is not a track record, and a badge on n=1 is worse than
      no badge.

   Scope note: a funder's responsiveness is computed across every SME that
   approached them, not just the SME looking at the table. That is a
   whole-collection read, so it belongs in a scheduled Cloud Function writing
   responsivenessMetrics/{organisationId}. computeResponsiveness below is the
   pure function that function should call; the client only reads the result.
   ════════════════════════════════════════════════════════════════════════ */

export const RESPONSIVENESS_MIN_SAMPLE = 5
export const RESPONSIVENESS_COLLECTION = "responsivenessMetrics"

const toDate = (value) => {
  if (!value) return null
  const d = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole business days between two instants, weekends excluded. */
export const businessDaysBetween = (from, to) => {
  const start = toDate(from)
  const end = toDate(to)
  if (!start || !end || end < start) return null

  let days = 0
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const target = new Date(end)
  target.setHours(0, 0, 0, 0)

  while (cursor < target) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days += 1
  }
  return days
}

const percentile = (sorted, p) => {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0]
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/**
 * @param records [{ smeActedAt, firstRespondedAt, eligible? }]
 *   smeActedAt        when the SME did something that warrants a reply
 *   firstRespondedAt  the organisation's first meaningful response, or null
 *   eligible          set false for enquiries that never warranted a reply
 *                     (withdrawn before sending, duplicates, and so on)
 */
export function computeResponsiveness(records = [], { minSample = RESPONSIVENESS_MIN_SAMPLE } = {}) {
  const eligible = records.filter((r) => r && r.eligible !== false && toDate(r.smeActedAt))

  const durations = eligible
    .map((r) => businessDaysBetween(r.smeActedAt, r.firstRespondedAt))
    .filter((d) => d !== null)
    .sort((a, b) => a - b)

  const answeredRate = eligible.length === 0 ? null : Math.round((durations.length / eligible.length) * 100)

  const meetsThreshold = durations.length >= minSample

  return {
    sampleSize: durations.length,
    eligibleCount: eligible.length,
    answeredRate,
    median: meetsThreshold ? Math.round(percentile(durations, 0.5)) : null,
    fast: meetsThreshold ? Math.round(percentile(durations, 0.25)) : null,
    slow: meetsThreshold ? Math.round(percentile(durations, 0.75)) : null,
    meetsThreshold,
    computedAt: new Date().toISOString(),
  }
}

/** Group raw records by organisation, then compute. For the Cloud Function. */
export function computeResponsivenessByOrganisation(records = [], keyOf = (r) => r.funderId, options) {
  const buckets = {}
  records.forEach((record) => {
    const key = keyOf(record)
    if (!key) return
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(record)
  })
  return Object.fromEntries(Object.entries(buckets).map(([key, list]) => [key, computeResponsiveness(list, options)]))
}

/** "2–5 days" / "Same day" / "Not enough data" */
export function formatResponsiveness(metric) {
  if (!metric || !metric.meetsThreshold) return "Not enough data"

  const { fast, slow, median } = metric
  const unit = (n) => `${n} day${n === 1 ? "" : "s"}`

  if (median === 0 && slow === 0) return "Same day"
  if (fast === slow) return unit(median)
  return `${fast === 0 ? "Same day" : fast}–${unit(slow)}`
}

export function formatAnsweredRate(metric) {
  if (!metric || metric.answeredRate === null) return null
  return `${metric.answeredRate}% answered`
}

/** Sort key: unmeasured organisations sort last rather than first. */
export function responsivenessSortValue(metric) {
  if (!metric || !metric.meetsThreshold) return Number.MAX_SAFE_INTEGER
  return metric.median
}

/* ─── Badge ─────────────────────────────────────────────────────────────────
   Spec: "display a responsiveness badge on profiles where the minimum data
   threshold has been met". Below the threshold this renders plain muted text,
   never a badge — an unearned badge is the thing the threshold exists to
   prevent.
   ──────────────────────────────────────────────────────────────────────── */
export const ResponsivenessBadge = ({ metric, showRate = true, size = "sm" }) => {
  if (!metric || !metric.meetsThreshold) {
    return <span className="text-[#a89482] text-xs">Not enough data</span>
  }

  const { median } = metric
  const tone =
    median <= 3
      ? { bg: "#E8F5E8", fg: "#388E3C" }
      : median <= 10
        ? { bg: "#FFF3E0", fg: "#F57C00" }
        : { bg: "#FFEBEE", fg: "#D32F2F" }

  const rate = formatAnsweredRate(metric)

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tone.fg }} />
        {formatResponsiveness(metric)}
      </span>
      {showRate && rate && <span className="text-[10px] text-[#a89482]">{rate}</span>}
    </span>
  )
}