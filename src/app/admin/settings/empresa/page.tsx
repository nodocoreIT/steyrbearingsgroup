export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCompanySettings } from '@/lib/company/queries'
import { saveCompanySettings } from '@/lib/company/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function EmpresaSettingsPage() {
  const settings = await getCompanySettings()

  async function handleSave(formData: FormData) {
    'use server'
    const result = await saveCompanySettings(formData)
    if (result.success) redirect('/admin/settings/empresa?saved=1')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración de la empresa</h1>
        <p className="text-sm text-muted-foreground">Datos generales que se usan en presupuestos, emails y el sitio público.</p>
      </div>

      <form action={handleSave} className="space-y-6">
        {/* Identidad */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identidad</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre de la empresa</Label>
              <Input id="name" name="name" defaultValue={settings.name} placeholder="Ej. Rodamientos del Sur S.A." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cuit">CUIT</Label>
              <Input id="cuit" name="cuit" defaultValue={settings.cuit} placeholder="30-12345678-9" />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={settings.phone} placeholder="+54 11 4000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings.email} placeholder="ventas@empresa.com" />
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ubicación</h2>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" defaultValue={settings.address} placeholder="Av. Corrientes 1234, Piso 3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={settings.city} placeholder="Buenos Aires" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" defaultValue={settings.province} placeholder="CABA" />
            </div>
          </div>
        </section>

        {/* Redes */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Redes y web</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+54 9 11 4000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" name="instagram" defaultValue={settings.instagram} placeholder="@empresa" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Sitio web</Label>
            <Input id="website" name="website" defaultValue={settings.website} placeholder="https://www.empresa.com" />
          </div>
        </section>

        <div className="pt-2">
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
