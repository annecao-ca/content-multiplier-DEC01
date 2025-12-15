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

/**
 * ThemeProvider - Quản lý theme light/dark cho toàn bộ app
 * 
 * Cách hoạt động:
 * 1. Script trong layout.tsx chạy TRƯỚC khi React render → set class 'dark' trên <html> ngay lập tức (tránh flash)
 * 2. ThemeProvider đọc theme từ localStorage hoặc system preference
 * 3. Khi toggle: cập nhật localStorage + thêm/xóa class 'dark' trên <html>
 * 4. Tailwind CSS tự động áp dụng styles dựa trên class 'dark' trên <html>
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Luôn khởi tạo bằng giá trị cố định để SSR/CSR đồng nhất
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')

    // Effect 1: sau khi mount, đọc localStorage và đồng bộ class 'dark'
    useEffect(() => {
        try {
            const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
            const next = saved === 'light' || saved === 'dark' ? saved : 'dark'
            setTheme(next)
            document.documentElement.classList.toggle('dark', next === 'dark')
        } catch (e) {
            console.warn('Failed to load theme from localStorage:', e)
            document.documentElement.classList.add('dark')
        }
    }, [])

    // Effect 2: mỗi khi theme đổi, sync class + localStorage
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        try {
            localStorage.setItem('theme', theme)
        } catch (e) {
            console.warn('Failed to save theme to localStorage:', e)
        }
    }, [theme])

    // Toggle theme: light ↔ dark
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

