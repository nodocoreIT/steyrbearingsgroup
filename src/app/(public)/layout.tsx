import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { getUser } from '@/lib/auth/get-user'
import { getClientIdByProfileId, getCartItemCount } from '@/lib/interest-lists/queries'

async function getCartCount(): Promise<number> {
  try {
    const user = await getUser()
    if (!user) return 0
    const clientId = await getClientIdByProfileId(user.id)
    if (!clientId) return 0
    return await getCartItemCount(clientId)
  } catch {
    return 0
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const cartCount = await getCartCount()

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <Link href="/">
            <Image src="/logo-transparente.png" alt="Logo" height={40} width={130} className="object-contain" />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/catalogo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Productos
            </Link>
            <Link href="/contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contacto
            </Link>

            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>

            <Link href="/mi-lista" className="relative flex items-center">
              <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-sm text-muted-foreground">
          <nav className="flex flex-wrap gap-6">
            <Link href="/nosotros" className="hover:text-foreground transition-colors">La Empresa</Link>
            <Link href="/envio" className="hover:text-foreground transition-colors">Información de Envío</Link>
            <Link href="/contacto" className="hover:text-foreground transition-colors">Contacto</Link>
          </nav>
          <div className="text-xs space-y-1 text-right">
            <p>© {new Date().getFullYear()} Steyr Bearings Group SA</p>
            <p>
              Desarrollado por{' '}
              <a
                href="https://www.nodocore.com.ar/nodo-it"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-80"
              >
                <strong style={{ color: '#DA5A0D' }}>NODO</strong> Core
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/5491140800657?text=Estoy%20en%20su%20tienda%2C%20necesito%20asesoramiento"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-20 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="30"
          height="30"
          fill="white"
        >
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.823.737 5.473 2.027 7.774L0 32l8.426-2.01A15.938 15.938 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.77-1.852l-.485-.29-5.003 1.194 1.228-4.877-.317-.5A13.268 13.268 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.2-2.354-1.162-2.719-1.294-.365-.133-.631-.2-.898.2-.266.398-1.031 1.294-1.264 1.56-.232.266-.465.3-.863.1-.398-.2-1.682-.62-3.203-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.175-.812.18-.179.398-.465.598-.697.2-.232.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.2-.898-2.164-1.23-2.962-.324-.778-.654-.673-.898-.685l-.764-.013c-.266 0-.697.1-.1063.498-.365.398-1.397 1.364-1.397 3.327 0 1.963 1.43 3.86 1.629 4.126.2.266 2.815 4.296 6.821 6.025.953.412 1.696.658 2.276.842.956.305 1.826.262 2.515.159.767-.115 2.354-.963 2.686-1.893.332-.93.332-1.728.232-1.893-.1-.166-.365-.266-.764-.465z" />
        </svg>
      </a>
    </div>
  )
}
