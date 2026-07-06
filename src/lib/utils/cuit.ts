/**
 * CUIT (Clave Única de Identificación Tributaria) validation for Argentina.
 * Format: XX-XXXXXXXX-X (with or without dashes)
 *
 * Validation algorithm:
 * 1. Strip dashes
 * 2. Verify length is 11 digits
 * 3. Apply checksum: multiply each digit by [5,4,3,2,7,6,5,4,3,2], sum mod 11
 * 4. Check digit = 11 - (sum mod 11); if result is 11 → 0, if 10 → 9
 */

export class CuitValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_FORMAT' | 'INVALID_LENGTH' | 'INVALID_CHECKSUM'
  ) {
    super(message)
    this.name = 'CuitValidationError'
  }
}

/**
 * Strips dashes from a CUIT string and returns raw digits.
 */
export function normalizeCuit(cuit: string): string {
  return cuit.replace(/-/g, '')
}

/**
 * Validates a CUIT string (with or without dashes).
 * Returns true if valid, throws CuitValidationError if invalid.
 */
export function validateCuit(cuit: string): true {
  if (typeof cuit !== 'string' || cuit.trim() === '') {
    throw new CuitValidationError(
      'CUIT must be a non-empty string',
      'INVALID_FORMAT'
    )
  }

  const digits = normalizeCuit(cuit)

  if (!/^\d+$/.test(digits)) {
    throw new CuitValidationError(
      'CUIT must contain only digits (with optional dashes)',
      'INVALID_FORMAT'
    )
  }

  if (digits.length !== 11) {
    throw new CuitValidationError(
      `CUIT must be exactly 11 digits, got ${digits.length}`,
      'INVALID_LENGTH'
    )
  }

  // Checksum validation
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const nums = digits.split('').map(Number)

  const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0)
  const remainder = sum % 11

  let expectedCheckDigit: number
  if (remainder === 0) {
    expectedCheckDigit = 0
  } else if (remainder === 1) {
    expectedCheckDigit = 9
  } else {
    expectedCheckDigit = 11 - remainder
  }

  if (nums[10] !== expectedCheckDigit) {
    throw new CuitValidationError(
      `Invalid CUIT checksum: expected check digit ${expectedCheckDigit}, got ${nums[10]}`,
      'INVALID_CHECKSUM'
    )
  }

  return true
}

/**
 * Returns true if the CUIT is valid, false otherwise (no exception thrown).
 */
export function isValidCuit(cuit: string): boolean {
  try {
    validateCuit(cuit)
    return true
  } catch {
    return false
  }
}

/**
 * Formats raw 11-digit CUIT string to XX-XXXXXXXX-X format.
 */
export function formatCuit(cuit: string): string {
  const digits = normalizeCuit(cuit)
  if (digits.length !== 11) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
