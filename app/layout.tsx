import type { Metadata, Viewport } from "next"
import { Inter, Calistoga } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { EMPRESA } from "@/lib/constants"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const calistoga = Calistoga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-calistoga",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: `${EMPRESA.nombre} · Catering casero para empresas`,
    template: `%s · ${EMPRESA.nombre}`,
  },
  description:
    "Comida casera y tradicional servida cada día en tu oficina. Reparto de lunes a sábado de 12:00 a 16:00 en Rubí y alrededores.",
  keywords: [
    "catering empresas",
    "comida casera oficina",
    "catering Rubí",
    "comida diaria empresas Barcelona",
  ],
  authors: [{ name: EMPRESA.nombre }],
  openGraph: {
    title: `${EMPRESA.nombre} · Catering casero para empresas`,
    description:
      "Comida casera y tradicional servida cada día en tu oficina. De lunes a sábado, de 12:00 a 16:00.",
    locale: "es_ES",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${calistoga.variable} antialiased`}>
        <ThemeProvider>
          {/* Salto al contenido: primer elemento enfocable con teclado (WCAG 2.4.1) */}
          <a
            href="#contenido"
            className="solo-lectores focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary focus:no-underline"
          >
            Saltar al contenido
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
