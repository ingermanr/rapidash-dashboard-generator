import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rapidash - Dashboard Generator',
  description: 'Generador de dashboards profesionales: crea layouts optimizados a partir de tus variables y exporta especificaciones completas en PDF.',
  generator: 'Rapidash',
  keywords: ['dashboard', 'generator', 'layouts', 'visualización', 'datos', 'charts', 'PDF'],
  authors: [{ name: 'Rapidash Team' }],
  creator: 'Rapidash',
  publisher: 'Rapidash',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0054ee',
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="application-name" content="Rapidash" />
        <meta name="apple-mobile-web-app-title" content="Rapidash" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#FF6B6B" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
