/**
 * Normalize raw metric values to a 0–100 scale.
 * These helpers are pure functions with no side effects — safe to unit test in isolation.
 */

/**
 * Normalizes a purchase volume value against a maximum expected volume.
 * Returns 100 when value >= max, 0 when value is 0 or max is 0.
 */
export function normalizeVolume(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.min(100, (value / max) * 100)
}

/**
 * Normalizes a purchase frequency count against a maximum expected count.
 * Returns 100 when count >= max, 0 when count is 0 or max is 0.
 */
export function normalizeFrequency(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0
  return Math.min(100, (count / max) * 100)
}

/**
 * Calculates the payment behavior score as an acceptance rate.
 * Returns 0 when no quotes have been sent.
 * @param accepted - number of quotes with status 'accepted'
 * @param totalSent - total number of quotes sent (status 'sent' + 'accepted' + 'declined')
 */
export function normalizePayment(accepted: number, totalSent: number): number {
  if (totalSent <= 0) return 0
  const rate = accepted / totalSent
  return Math.min(100, Math.max(0, rate * 100))
}
