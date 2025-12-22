'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Globe } from 'lucide-react'

export interface Language {
    code: string
    name: string
    flag: string
    nativeName?: string
}

// Default supported content languages
export const CONTENT_LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
    { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
]

interface LanguageSelectorProps {
    value: string
    onChange: (code: string) => void
    languages?: Language[]
    label?: string
    showNativeName?: boolean
    showFlag?: boolean
    disabled?: boolean
    className?: string
}

export function LanguageSelector({
    value,
    onChange,
    languages = CONTENT_LANGUAGES,
    label,
    showNativeName = true,
    showFlag = true,
    disabled = false,
    className = ''
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedLanguage = languages.find(lang => lang.code === value) || languages[0]

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (code: string) => {
        onChange(code)
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2.5
                    bg-white dark:bg-gray-800 
                    border border-gray-200 dark:border-gray-700 rounded-lg
                    text-gray-900 dark:text-white
                    hover:border-gray-300 dark:hover:border-gray-600
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="flex items-center gap-2">
                    {showFlag && (
                        <span className="text-lg">{selectedLanguage.flag}</span>
                    )}
                    <span className="font-medium">
                        {showNativeName && selectedLanguage.nativeName 
                            ? selectedLanguage.nativeName 
                            : selectedLanguage.name
                        }
                    </span>
                </div>
                <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            type="button"
                            onClick={() => handleSelect(language.code)}
                            className={`
                                w-full flex items-center justify-between gap-2 px-3 py-2.5
                                text-left transition-colors duration-150
                                ${language.code === value
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                {showFlag && (
                                    <span className="text-lg">{language.flag}</span>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {showNativeName && language.nativeName 
                                            ? language.nativeName 
                                            : language.name
                                        }
                                    </span>
                                    {showNativeName && language.nativeName && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {language.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {language.code === value && (
                                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// Compact version for inline use
interface CompactLanguageSelectorProps {
    value: string
    onChange: (code: string) => void
    languages?: Language[]
}

export function CompactLanguageSelector({
    value,
    onChange,
    languages = CONTENT_LANGUAGES
}: CompactLanguageSelectorProps) {
    const selectedLanguage = languages.find(lang => lang.code === value) || languages[0]

    return (
        <div className="flex gap-1">
            {languages.map((language) => (
                <button
                    key={language.code}
                    type="button"
                    onClick={() => onChange(language.code)}
                    title={language.nativeName || language.name}
                    className={`
                        w-9 h-9 rounded-lg flex items-center justify-center
                        text-lg transition-all duration-200
                        ${language.code === value
                            ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                    `}
                >
                    {language.flag}
                </button>
            ))}
        </div>
    )
}

export default LanguageSelector

