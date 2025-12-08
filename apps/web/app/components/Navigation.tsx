'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Sun, Moon } from 'lucide-react'

export default function Navigation() {
    const pathname = usePathname()
    const { language, setLanguage } = useLanguage()
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const initialTheme = savedTheme || systemTheme
        setTheme(initialTheme)
        document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', description: 'Overview' },
        { href: '/ideas', label: 'Ideas', description: 'Generate ideas' },
        { href: '/briefs', label: 'Briefs', description: 'Research' },
        { href: '/documents', label: 'RAG', description: 'Documents & Search' },
        { href: '/packs', label: 'Content', description: 'Create & manage' },
        { href: '/analytics', label: 'Analytics', description: 'Metrics' },
        { href: '/publisher', label: 'Publisher', description: 'Multi-platform' },
        { href: '/settings', label: 'Settings', description: 'Configure' }
    ]

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: theme === 'dark' ? '#1a1a2e' : 'white',
            borderBottom: theme === 'dark' ? '1px solid #2d2d44' : '1px solid #e2e8f0',
            padding: '1rem 2rem',
            boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            transition: 'all 0.3s ease'
        }}>
            {/* Logo/Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                    }}>
                        📦
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: theme === 'dark' ? '#f1f5f9' : '#2d3748'
                    }}>
                        Content Multiplier
                    </h1>
                </Link>

                {/* Navigation Links */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                padding: '0.5rem 1rem',
                                textDecoration: 'none',
                                color: isActive(item.href) 
                                    ? '#667eea' 
                                    : theme === 'dark' ? '#a0aec0' : '#4a5568',
                                fontWeight: isActive(item.href) ? '600' : '500',
                                fontSize: '0.95rem',
                                borderBottom: isActive(item.href) ? '2px solid #667eea' : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                marginTop: '2px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.href)) {
                                    e.currentTarget.style.color = '#667eea'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.href)) {
                                    e.currentTarget.style.color = theme === 'dark' ? '#a0aec0' : '#4a5568'
                                }
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right Actions */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                {/* Theme Toggle */}
                {mounted && (
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: theme === 'dark' ? '#2d2d44' : '#f7fafc',
                            border: theme === 'dark' ? '1px solid #3d3d5c' : '1px solid #e2e8f0',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: theme === 'dark' ? '#fbbf24' : '#667eea'
                        }}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}
                
                {/* Language Toggle */}
                <div style={{
                    display: 'flex',
                    background: theme === 'dark' ? '#2d2d44' : '#f7fafc',
                    borderRadius: '20px',
                    padding: '0.25rem',
                    border: theme === 'dark' ? '1px solid #3d3d5c' : '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{
                            background: language === 'en' 
                                ? (theme === 'dark' ? '#3d3d5c' : 'white') 
                                : 'transparent',
                            color: language === 'en' ? '#667eea' : (theme === 'dark' ? '#a0aec0' : '#718096'),
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: language === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('vn')}
                        style={{
                            background: language === 'vn' 
                                ? (theme === 'dark' ? '#3d3d5c' : 'white') 
                                : 'transparent',
                            color: language === 'vn' ? '#667eea' : (theme === 'dark' ? '#a0aec0' : '#718096'),
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: language === 'vn' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        VN
                    </button>
                </div>

                {/* CTA Button */}
                <Link
                    href="/packs/new"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '0.65rem 1.5rem',
                        borderRadius: '50px',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }}
                >
                    ✨ Create Content
                </Link>
            </div>
        </nav>
    )
}
