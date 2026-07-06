import { RegistrationForm } from '@/components/features/clients/RegistrationForm'

export const metadata = {
  title: 'Crear cuenta — Rodamientos',
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegistrationForm />
    </div>
  )
}
