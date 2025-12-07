'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
    theme: 'light' | 'dark'
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => {}
})

export function useTheme() {
    return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
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

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
                {children}
            </ThemeContext.Provider>
        )
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

