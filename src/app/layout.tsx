import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Steyr Bearings Group - Distribuidora Importadora de Rodamientos',
  description: 'Industrial bearings and components catalog',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isDev = process.env.NODE_ENV !== 'production'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const showDevSwitcher = isDev && (!supabaseUrl || supabaseUrl.includes('placeholder'))

  let devProfileId: string | null = null
  if (showDevSwitcher) {
    const cookieStore = await cookies()
    devProfileId = cookieStore.get('dev_profile_id')?.value ?? null
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {showDevSwitcher && (
          <>
            {/* Bottom padding so content isn't hidden behind the dev bar */}
            <div style={{ height: '40px' }} aria-hidden />
            {/* Dynamic import keeps this completely out of the production bundle */}
            <DevSwitcherLoader profileId={devProfileId} />
          </>
        )}
      </body>
    </html>
  )
}

// Inline async component so we can use dynamic import without making the whole layout async-heavy
async function DevSwitcherLoader({ profileId }: { profileId: string | null }) {
  const { DevUserSwitcher } = await import('@/components/dev/DevUserSwitcher')
  return <DevUserSwitcher currentProfileId={profileId} />
}
