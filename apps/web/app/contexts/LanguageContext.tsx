'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { Language } from '../translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Initialize language from localStorage immediately (prevents hydration mismatch)
    const [language, setLanguage] = useState<Language>(() => {
        if (typeof window === 'undefined') return 'en'
        try {
            const saved = localStorage.getItem('content-multiplier-language')
            if (saved && (saved === 'en' || saved === 'vn')) {
                return saved
            }
        } catch {
            // Ignore localStorage errors
        }
        return 'en'
    })

    useEffect(() => {
        // Save language to localStorage whenever it changes
        try {
            localStorage.setItem('content-multiplier-language', language)
        } catch {
            // Ignore localStorage errors
        }
    }, [language])

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
