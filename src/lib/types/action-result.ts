/**
 * ActionResult<T> — standard return type for all Server Actions.
 *
 * Usage:
 * ```ts
 * async function myAction(): Promise<ActionResult<string>> {
 *   try {
 *     return { success: true, data: 'result' }
 *   } catch (e) {
 *     return { success: false, error: 'Something went wrong', code: 'UNEXPECTED_ERROR' }
 *   }
 * }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * Type guard: narrows ActionResult to success branch.
 */
export function isActionSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T } {
  return result.success === true
}

/**
 * Type guard: narrows ActionResult to error branch.
 */
export function isActionError<T>(
  result: ActionResult<T>
): result is { success: false; error: string; code?: string } {
  return result.success === false
}
