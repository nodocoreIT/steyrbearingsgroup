import Link from 'next/link'
import { Building2, Bell, Star } from 'lucide-react'

const sections = [
  {
    href: '/admin/settings/empresa',
    icon: Building2,
    title: 'Empresa',
    description: 'Nombre, CUIT, contacto, dirección y redes sociales.',
  },
  {
    href: '/admin/settings/alertas',
    icon: Bell,
    title: 'Alertas',
    description: 'Configuración de alertas de inactividad de clientes.',
  },
  {
    href: '/admin/settings/scoring',
    icon: Star,
    title: 'Scoring',
    description: 'Pesos y factores para el scoring de clientes.',
  },
]

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Administrá los parámetros del sistema.</p>
      </div>

      <div className="space-y-2">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
