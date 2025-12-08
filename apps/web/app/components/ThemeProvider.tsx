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
    // Initialize theme from script in head (prevents flash)
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'dark' // Default to dark to match initial HTML class
        try {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
            if (savedTheme) return savedTheme
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            return systemTheme
        } catch {
            return 'dark'
        }
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Sync with document class (already set by script)
        const html = document.documentElement
        const currentTheme = html.classList.contains('dark') ? 'dark' : 'light'
        if (currentTheme !== theme) {
            setTheme(currentTheme)
        }
        
        // Ensure body background matches theme
        if (currentTheme === 'dark') {
            document.body.style.backgroundColor = '#020617'
            document.body.style.color = '#e5e7eb'
        } else {
            document.body.style.backgroundColor = '#ffffff'
            document.body.style.color = '#0f172a'
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme', newTheme)
            // Update document class immediately
            if (typeof document !== 'undefined') {
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
            return newTheme
        })
    }

    // Prevent hydration mismatch - use theme from script
    if (!mounted) {
        const initialTheme = typeof window !== 'undefined' 
            ? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
            : 'dark'
        return (
            <ThemeContext.Provider value={{ theme: initialTheme, toggleTheme: () => {} }}>
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

