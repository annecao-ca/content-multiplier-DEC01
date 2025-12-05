'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useLanguage } from '../../contexts/LanguageContext'
import Button from '../../components/Button'

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001';

function NewPackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const briefId = searchParams.get('brief_id')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<string>('')
    const { language } = useLanguage()

    async function createDraft() {
        setLoading(true)
        setError(null)
        setProgress('Initializing...')
        
        const packId = `pack-${Date.now()}`
        
        try {
            setProgress('Generating content with AI... This may take 30-60 seconds.')
            
            const response = await fetch(`${API_URL}/api/packs/draft`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user',
                    'x-user-role': 'WR'
                },
                body: JSON.stringify({
                    pack_id: packId,
                    brief_id: briefId,
                    audience: 'Technical decision-makers',
                    language: language
                })
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `API error: ${response.status}`)
            }
            
            setProgress('Draft created successfully! Redirecting...')
            const data = await response.json()
            
            // Small delay to show success message
            setTimeout(() => {
                router.push(`/packs/${packId}`)
            }, 500)
            
        } catch (err: any) {
            console.error('Error creating draft:', err)
            setError(err.message || 'Failed to create draft. Please try again.')
            setLoading(false)
            setProgress('')
        }
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/briefs" style={{ 
                color: '#3b82f6', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                marginBottom: '1.5rem'
            }}>← Back to Briefs</Link>
            
            <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Create Content Pack</h1>

            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                marginTop: '2rem'
            }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                        <strong>Brief ID:</strong> {briefId}
                    </p>
                    <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.6' }}>
                        This will generate a 1200-1600 word draft with grade ≤10 reading level using AI.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: '#991b1b'
                    }}>
                        <strong>❌ Error:</strong> {error}
                    </div>
                )}

                {/* Progress Message */}
                {loading && progress && (
                    <div style={{
                        background: '#dbeafe',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        color: '#1e40af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '3px solid #3b82f6',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span>{progress}</span>
                    </div>
                )}

                <Button 
                    onClick={createDraft} 
                    disabled={loading} 
                    variant={loading ? 'neutral' : 'primary'}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '⏳ Creating Draft...' : '🚀 Generate Draft'}
                </Button>

                {loading && (
                    <p style={{
                        marginTop: '1rem',
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        textAlign: 'center'
                    }}>
                        ⚠️ This process typically takes 30-60 seconds. Please do not close this page.
                    </p>
                )}
            </div>

            {/* Add CSS animation for spinner */}
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    )
}

export default function NewPackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPackContent />
        </Suspense>
    )
}

