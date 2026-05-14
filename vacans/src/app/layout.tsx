import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: "Vacans",
  description: "Tu página de turnos, personalizada.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={nunito.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
