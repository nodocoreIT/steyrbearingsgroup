import { describe, it, expect } from 'vitest'
import {
  validateCuit,
  isValidCuit,
  normalizeCuit,
  formatCuit,
  CuitValidationError,
} from './cuit'

describe('normalizeCuit', () => {
  it('strips dashes', () => {
    expect(normalizeCuit('20-12345678-6')).toBe('20123456786')
  })

  it('returns raw digits unchanged', () => {
    expect(normalizeCuit('20123456786')).toBe('20123456786')
  })
})

describe('validateCuit', () => {
  // Valid CUIT examples (checksums verified via algorithm)
  // 20-12345678-6: sum = 5*2+4*0+3*1+2*2+7*3+6*4+5*5+4*6+3*7+2*8 = 10+0+3+4+21+24+25+24+21+16 = 148; 148%11=5; 11-5=6 ✓
  it('accepts a valid CUIT with dashes', () => {
    expect(validateCuit('20-12345678-6')).toBe(true)
  })

  it('accepts a valid CUIT without dashes', () => {
    expect(validateCuit('20123456786')).toBe(true)
  })

  it('accepts another valid CUIT (persona juridica)', () => {
    // 30-12345678-1
    expect(validateCuit('30-12345678-1')).toBe(true)
  })

  // Invalid length
  it('throws INVALID_LENGTH for too short CUIT', () => {
    expect(() => validateCuit('2012345678')).toThrow(CuitValidationError)
    expect(() => validateCuit('2012345678')).toThrow('10')
  })

  it('throws INVALID_LENGTH for too long CUIT', () => {
    expect(() => validateCuit('201234567891')).toThrow(CuitValidationError)
  })

  // Invalid format
  it('throws INVALID_FORMAT for non-numeric input', () => {
    expect(() => validateCuit('AB-12345678-6')).toThrow(CuitValidationError)
  })

  it('throws INVALID_FORMAT for empty string', () => {
    expect(() => validateCuit('')).toThrow(CuitValidationError)
  })

  // Invalid checksum
  it('throws INVALID_CHECKSUM when check digit is wrong', () => {
    // Valid is 20123456786, change last to 9 → invalid
    expect(() => validateCuit('20123456789')).toThrow(CuitValidationError)
  })

  it('throws with INVALID_CHECKSUM error code', () => {
    try {
      validateCuit('20123456781')
    } catch (e) {
      expect(e).toBeInstanceOf(CuitValidationError)
      expect((e as CuitValidationError).code).toBe('INVALID_CHECKSUM')
    }
  })
})

describe('isValidCuit', () => {
  it('returns true for valid CUIT', () => {
    expect(isValidCuit('20123456786')).toBe(true)
  })

  it('returns false for invalid CUIT (bad checksum)', () => {
    expect(isValidCuit('20123456789')).toBe(false)
  })

  it('returns false for invalid CUIT (wrong length)', () => {
    expect(isValidCuit('2012345678')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidCuit('')).toBe(false)
  })
})

describe('formatCuit', () => {
  it('formats raw digits to XX-XXXXXXXX-X', () => {
    expect(formatCuit('20123456786')).toBe('20-12345678-6')
  })

  it('returns input unchanged if not 11 digits', () => {
    expect(formatCuit('2012345678')).toBe('2012345678')
  })
})
