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
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans antialiased">
                {/* 
                    Script này chạy TRƯỚC khi React render để:
                    1. Đọc theme từ localStorage hoặc system preference
                    2. Set class 'dark' trên <html> ngay lập tức
                    3. Tránh flash of wrong theme (FOUC - Flash of Unstyled Content)
                    
                    ThemeProvider sẽ đọc lại và quản lý theme sau khi mount.
                */}
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('theme');
                                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                    const initialTheme = theme === 'light' || theme === 'dark' ? theme : systemTheme;
                                    const html = document.documentElement;
                                    
                                    // Chỉ set class 'dark' - Tailwind sẽ tự động áp dụng styles
                                    if (initialTheme === 'dark') {
                                        html.classList.add('dark');
                                    } else {
                                        html.classList.remove('dark');
                                    }
                                } catch (e) {
                                    // Fallback: default dark nếu có lỗi
                                    document.documentElement.classList.add('dark');
                                }
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
