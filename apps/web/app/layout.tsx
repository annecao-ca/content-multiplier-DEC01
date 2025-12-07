import { LanguageProvider } from './contexts/LanguageContext'
import ThemeProvider from './components/ThemeProvider'
import { ToastProvider } from './components/ui'
import { AppShell } from './components/webflow-ui'
import './globals.css'

export const metadata = {
    title: 'Content Multiplier',
    description: 'AI-powered content workflow'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans antialiased">
                <ThemeProvider>
                    <ToastProvider>
                        <LanguageProvider>
                            <AppShell>
                                {children}
                            </AppShell>
                        </LanguageProvider>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
