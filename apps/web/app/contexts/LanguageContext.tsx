'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { Language } from '../translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Khởi tạo cố định để SSR/CSR đồng nhất
    const [language, setLanguage] = useState<Language>('en')

    // Sau khi mount: đọc localStorage, cập nhật state
    useEffect(() => {
        try {
            const saved = localStorage.getItem('content-multiplier-language')
            if (saved === 'en' || saved === 'vn') {
                setLanguage(saved as Language)
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [])

    // Mỗi khi language đổi: lưu lại localStorage
    useEffect(() => {
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
