import './globals.css'

export const metadata = {
  title: 'Draft Football Multi',
  description: 'Jeu de draft en temps réel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-900 text-white min-h-screen">{children}</body>
    </html>
  )
}