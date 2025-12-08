'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useLanguage } from '../../contexts/LanguageContext'
import Button from '../../components/Button'
import { DashboardHero } from '../../components/dashboard-ui'

// API URL - backend running on port 3001
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function NewPackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const briefIdFromQuery = searchParams.get('brief_id')
    const [selectedBriefId, setSelectedBriefId] = useState<string>(briefIdFromQuery || '')
    const [briefs, setBriefs] = useState<any[]>([])
    const [loadingBriefs, setLoadingBriefs] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<string>('')
    const { language } = useLanguage()

    // Load briefs if no brief_id in query
    useEffect(() => {
        if (!briefIdFromQuery) {
            loadBriefs()
        }
    }, [briefIdFromQuery])

    async function loadBriefs() {
        setLoadingBriefs(true)
        try {
            const response = await fetch(`${API_URL}/api/briefs`)
            if (response.ok) {
                const data = await response.json()
                setBriefs(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Failed to load briefs:', error)
            setError('Failed to load briefs. Please try again.')
        } finally {
            setLoadingBriefs(false)
        }
    }

    async function createDraft() {
        if (!selectedBriefId) {
            setError('Please select a brief first')
            return
        }

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
                    brief_id: selectedBriefId,
                    audience: 'Technical decision-makers',
                    language: language
                })
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error || errorData.message || `API error: ${response.status}`
                throw new Error(errorMessage)
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
        <div className="min-h-screen bg-slate-950">
            <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
                <DashboardHero
                    title="Create Content Pack"
                    description="Generate a 1200-1600 word draft with grade ≤10 reading level using AI"
                    cta={
                        <Link href="/briefs">
                            <button className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                                ← Back to Briefs
                            </button>
                        </Link>
                    }
                />

                <div className="rounded-3xl bg-slate-900/70 border border-slate-800 px-4 py-4 md:px-6 md:py-6">
                    {/* Brief Selection */}
                    {!briefIdFromQuery && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Brief
                            </label>
                            {loadingBriefs ? (
                                <div className="text-slate-400">Loading briefs...</div>
                            ) : briefs.length === 0 ? (
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-slate-400 mb-3">No briefs available. Please create a brief first.</p>
                                    <Link href="/briefs">
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                            Go to Briefs
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <select
                                    value={selectedBriefId}
                                    onChange={(e) => setSelectedBriefId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Select a brief --</option>
                                    {briefs.map((brief) => (
                                        <option key={brief.brief_id} value={brief.brief_id}>
                                            {brief.title || brief.brief_id} {brief.created_at ? `(${new Date(brief.created_at).toLocaleDateString()})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {briefIdFromQuery && (
                        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">
                                <strong className="text-slate-300">Brief ID:</strong> {briefIdFromQuery}
                    </p>
                </div>
                    )}

                {/* Error Message */}
                {error && (
                        <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">❌</span>
                                <div>
                                    <strong className="text-red-300">Error:</strong>
                                    <p className="text-red-400 mt-1">{error}</p>
                                </div>
                            </div>
                    </div>
                )}

                {/* Progress Message */}
                {loading && progress && (
                        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-300">{progress}</span>
                            </div>
                    </div>
                )}

                    <button
                    onClick={createDraft} 
                        disabled={loading || !selectedBriefId}
                        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                            loading || !selectedBriefId
                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                        }`}
                >
                    {loading ? '⏳ Creating Draft...' : '🚀 Generate Draft'}
                    </button>

                {loading && (
                        <p className="mt-4 text-sm text-slate-400 text-center">
                        ⚠️ This process typically takes 30-60 seconds. Please do not close this page.
                    </p>
                )}
            </div>
            </div>
        </div>
    )
}

export default function NewPackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPackContent />
        </Suspense>
    )
}

