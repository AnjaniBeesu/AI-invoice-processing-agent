import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoice AI Agent', description: 'AI-powered invoice processing and PO matching' }

export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html> }