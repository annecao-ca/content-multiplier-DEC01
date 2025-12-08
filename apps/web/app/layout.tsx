import Script from 'next/script'
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
        <html lang="en" suppressHydrationWarning className="dark">
            <body className="font-sans antialiased bg-[#020617] text-[#e5e7eb]">
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                    const initialTheme = theme || systemTheme;
                                    const html = document.documentElement;
                                    if (initialTheme === 'dark') {
                                        html.classList.add('dark');
                                        html.style.backgroundColor = '#020617';
                                        html.style.color = '#e5e7eb';
                                    } else {
                                        html.classList.remove('dark');
                                        html.style.backgroundColor = '#ffffff';
                                        html.style.color = '#0f172a';
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
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
