'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { registerClient } from '@/lib/clients/actions'
import { isValidCuit, formatCuit, normalizeCuit } from '@/lib/utils/cuit'

type Step = 1 | 2 | 3

interface FormData {
  email: string
  password: string
  confirmPassword: string
  cuit: string
  razonSocial: string
  phone: string
  companyName: string
}

interface AfipValidationState {
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'degraded'
  message: string
  razonSocial?: string
}

const EMPTY_FORM: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  cuit: '',
  razonSocial: '',
  phone: '',
  companyName: '',
}

export function RegistrationForm() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [afipState, setAfipState] = useState<AfipValidationState>({
    status: 'idle',
    message: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function update(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleCuitChange(raw: string) {
    // Auto-format as user types
    const digits = normalizeCuit(raw)
    if (digits.length <= 11 && /^\d*$/.test(digits)) {
      const formatted = digits.length === 11 ? formatCuit(digits) : raw
      update('cuit', formatted)
    }
    // Reset AFIP state when CUIT changes
    setAfipState({ status: 'idle', message: '' })
  }

  async function validateCuit() {
    if (!isValidCuit(formData.cuit)) {
      setAfipState({
        status: 'invalid',
        message: 'Formato de CUIT inválido o dígito verificador incorrecto.',
      })
      return
    }

    setAfipState({ status: 'loading', message: 'Verificando con AFIP…' })

    try {
      const res = await fetch(
        `/api/afip/validate?cuit=${encodeURIComponent(normalizeCuit(formData.cuit))}`
      )
      const json = await res.json()

      if (json.valid) {
        const name = json.persona?.razonSocial ?? json.persona?.nombre ?? ''
        setAfipState({
          status: 'valid',
          message: `CUIT válido — ${name}`,
          razonSocial: name,
        })
        if (name && !formData.razonSocial) {
          update('razonSocial', name)
        }
      } else if (json.reason === 'api_error') {
        setAfipState({
          status: 'degraded',
          message: 'No se pudo verificar en este momento — podés continuar igual.',
        })
      } else {
        setAfipState({
          status: 'invalid',
          message:
            json.reason === 'inactive'
              ? 'Este CUIT está inactivo en AFIP.'
              : 'CUIT no encontrado en AFIP.',
        })
      }
    } catch {
      setAfipState({
        status: 'degraded',
        message: 'No se pudo verificar en este momento — podés continuar igual.',
      })
    }
  }

  function validateStep1(): string | null {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      return 'Todos los campos son obligatorios.'
    }
    if (formData.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden.'
    }
    return null
  }

  function validateStep2(): string | null {
    if (!formData.cuit) return 'El CUIT es obligatorio.'
    if (!isValidCuit(formData.cuit)) return 'CUIT inválido.'
    if (afipState.status === 'invalid') return 'El CUIT no pudo ser validado. Por favor verificá el número.'
    return null
  }

  function goToStep2() {
    const err = validateStep1()
    if (err) { setFormError(err); return }
    setFormError(null)
    setStep(2)
  }

  function goToStep3() {
    const err = validateStep2()
    if (err) { setFormError(err); return }
    setFormError(null)
    setStep(3)
  }

  function submit() {
    startTransition(async () => {
      const result = await registerClient({
        email: formData.email,
        password: formData.password,
        fullName: formData.razonSocial || formData.companyName || formData.email,
        cuit: formData.cuit,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setFormError(result.error)
        setStep(result.code === 'INVALID_CUIT' ? 2 : 1)
      }
    })
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuenta creada</CardTitle>
          <CardDescription>
            Estamos verificando tu CUIT en segundo plano. Recibirás un email cuando tu cuenta esté completamente activada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Paso {step} de 3 —{' '}
          {step === 1 ? 'Cuenta' : step === 2 ? 'Datos de empresa' : 'Confirmar'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1 — Account */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                required
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <Button className="w-full" onClick={goToStep2}>
              Continue
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2 — Business info */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <div className="flex gap-2">
                <Input
                  id="cuit"
                  type="text"
                  placeholder="20-12345678-9"
                  value={formData.cuit}
                  onChange={(e) => handleCuitChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCuit}
                  disabled={afipState.status === 'loading' || !formData.cuit}
                >
                  {afipState.status === 'loading' ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
              {afipState.status === 'valid' && (
                <p className="text-sm text-green-600">{afipState.message}</p>
              )}
              {afipState.status === 'invalid' && (
                <p className="text-sm text-destructive">{afipState.message}</p>
              )}
              {afipState.status === 'degraded' && (
                <p className="text-sm text-yellow-600">{afipState.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Company name / Full name</Label>
              <Input
                id="razonSocial"
                type="text"
                value={formData.razonSocial}
                onChange={(e) => update('razonSocial', e.target.value)}
                placeholder="Pre-filled from AFIP if verified"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={goToStep3} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{formData.email}</span>
              </p>
              <p>
                <span className="text-muted-foreground">CUIT:</span>{' '}
                <span className="font-medium">{formData.cuit}</span>
              </p>
              {formData.razonSocial && (
                <p>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{formData.razonSocial}</span>
                </p>
              )}
              {formData.phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{formData.phone}</span>
                </p>
              )}
            </div>
            {afipState.status === 'degraded' && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                AFIP verification is pending. Your account will be activated once verification completes.
              </p>
            )}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={isPending}
              >
                Back
              </Button>
              <Button onClick={submit} className="flex-1" disabled={isPending}>
                {isPending ? 'Creating account…' : 'Create account'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
