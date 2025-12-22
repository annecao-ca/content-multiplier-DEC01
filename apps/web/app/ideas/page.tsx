'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { Loader2, Sparkles, ArrowLeft, Trash2, Edit, Tag, ArrowRight, CheckCircle, Globe, Image as ImageIcon } from 'lucide-react'
import { useToast, ConfirmModal } from '../components/ui'
import { LanguageSelector, CONTENT_LANGUAGES } from '../components/LanguageSelector'
import {
    PageHeader,
    Section,
    Card,
    SubCard,
    CardHeader,
    CardTitle,
    CardDescription,
    PrimaryButton,
    Badge,
    Input,
    Textarea,
    Grid,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    EmptyState,
    LoadingSpinner,
    Alert,
} from '../components/webflow-ui'
import { DashboardHero } from '../components/dashboard-ui'

// API URL - uses environment variable or falls back to localhost:3001
import { API_URL } from '../lib/api-config'

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null)
    const toast = useToast()

    // Form fields
    const [persona, setPersona] = useState('Marketing Manager at B2B SaaS')
    const [industry, setIndustry] = useState('SaaS')
    const [corpusHints, setCorpusHints] = useState('')
    const [count, setCount] = useState(10)
    const [temperature, setTemperature] = useState(0.8)
    const [contentLanguage, setContentLanguage] = useState('en') // Content generation language

    const [selectedCount, setSelectedCount] = useState(0)
    const { language } = useLanguage()

    // Get translations for current language with fallback
    const currentLanguage = language || 'en'
    const t = translations[currentLanguage]?.ideas || translations.en.ideas

    async function load() {
        try {
            const r = await fetch(`${API_URL}/api/ideas`)
            if (!r.ok) {
                console.error('Failed to load ideas:', r.status, r.statusText)
                setIdeas([])
                setSelectedCount(0)
                return
            }
            const data = await r.json()
            const ideasArray = Array.isArray(data) ? data : (data?.ideas || data?.data || [])
            setIdeas(ideasArray)
            setSelectedCount(ideasArray.filter((i: any) => i.status === 'selected').length)
        } catch (error: any) {
            console.error('Error loading ideas:', error)
            setIdeas([])
            setSelectedCount(0)
        } finally {
            setInitialLoading(false)
        }
    }

    async function gen() {
        if (!persona.trim() || !industry.trim()) {
            setError('Please fill in both Persona and Industry fields')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Health check
            try {
                const healthCheck = await fetch(`${API_URL}/api/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                })
                if (!healthCheck.ok) throw new Error(`Backend health check failed: ${healthCheck.status}`)
            } catch (healthError: any) {
                console.error('[Ideas] Backend health check failed:', healthError)
                throw new Error(`Cannot connect to backend server at ${API_URL}. Please ensure the API server is running on port 3001.`)
            }

            const r = await fetch(`${API_URL}/api/ideas/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user',
                    'x-user-role': 'CL'
                },
                body: JSON.stringify({
                    persona: persona.trim(),
                    industry: industry.trim(),
                    language: contentLanguage, // Use content language for AI generation
                    corpus_hints: corpusHints.trim(),
                    count: count,
                    temperature: temperature
                }),
                signal: AbortSignal.timeout(120000)
            })

            if (!r.ok) {
                let errorMessage = `Server error: ${r.status} ${r.statusText}`
                try {
                    const errorData = await r.json()
                    errorMessage = errorData.error || errorData.message || errorMessage
                } catch { }
                throw new Error(errorMessage)
            }

            const data = await r.json()
            const serverIdeas = Array.isArray(data.ideas) ? data.ideas : []

            const mappedIdeas = serverIdeas.map((idea: any, index: number) => ({
                idea_id: idea.idea_id || idea.id || `temp-${Date.now()}-${index}`,
                one_liner: idea.one_liner || idea.title || 'Untitled Idea',
                angle: idea.description || idea.angle || '',
                description: idea.description || idea.angle || '',
                personas: idea.personas || [persona],
                why_now: idea.why_now || [],
                evidence: idea.evidence || [],
                scores: idea.scores || { novelty: 3, demand: 3, fit: 3, white_space: 3 },
                status: idea.status || 'proposed',
                tags: idea.tags || [],
                created_at: idea.created_at || new Date().toISOString()
            }))

            if (mappedIdeas.length > 0) {
                setIdeas(mappedIdeas)
                setSelectedCount(mappedIdeas.filter((i: any) => i.status === 'selected').length)
            } else {
                await load()
            }

            toast.success(`Successfully generated ${mappedIdeas.length || count} ideas!`)

        } catch (err: any) {
            console.error('[Ideas] Generation error:', err)
            let errorMessage = 'An error occurred while generating ideas'
            if (err.name === 'AbortError' || err.message?.includes('timeout')) {
                errorMessage = 'Request timed out. The AI generation is taking longer than expected. Please try again.'
            } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
                errorMessage = `Cannot connect to backend server at ${API_URL}. Please ensure:\n1. The API server is running on port 3001\n2. Check the browser console for more details`
            } else if (err.message?.includes('API key') || err.message?.includes('403') || err.message?.includes('401') || err.message?.includes('leaked')) {
                errorMessage = `API Key Error: ${err.message}\n\nPlease go to Settings page to configure a valid API key for your preferred AI provider (OpenAI, DeepSeek, Gemini, etc.).`
            } else if (err.message) {
                errorMessage = err.message
            }
            setError(errorMessage)
            toast.error('Failed to generate ideas', errorMessage)
        } finally {
            setLoading(false)
        }
    }

    async function selectIdea(ideaId: string) {
        if (!ideaId) return
        console.log('[Ideas] Selecting idea:', ideaId)
        
        // Optimistic update
        setIdeas((prev) => prev.map((idea: any) =>
            (idea.idea_id === ideaId || idea.id === ideaId)
                ? { ...idea, status: 'selected' }
                : idea
        ))
        setSelectedCount((prev) => prev + 1)
        
        try {
            const response = await fetch(`${API_URL}/api/ideas/${ideaId}/select`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user', 
                    'x-user-role': 'CL' 
                },
                body: JSON.stringify({})
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[Ideas] Select API failed:', errorData)
                throw new Error(errorData.error || `API error: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('[Ideas] Select API response:', data)
            toast.success('Idea selected successfully')
        } catch (err: any) {
            console.error('[Ideas] Select API error:', err)
            // Revert optimistic update on error
            setIdeas((prev) => prev.map((idea: any) =>
                (idea.idea_id === ideaId || idea.id === ideaId)
                    ? { ...idea, status: 'proposed' }
                    : idea
            ))
            setSelectedCount((prev) => prev - 1)
            toast.error('Failed to select idea', err.message || 'Please try again')
        }
    }

    const handleDeleteClick = (ideaId: string) => {
        setIdeaToDelete(ideaId)
        setDeleteModalOpen(true)
    }

    async function deleteIdea(ideaId: string) {
        if (!ideaId) return
        setIdeas((prev) => prev.filter((i: any) => i.idea_id !== ideaId && i.id !== ideaId))
        try {
            const r = await fetch(`${API_URL}/api/ideas/${ideaId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': 'demo-user', 'x-user-role': 'CL' }
            })
            if (!r.ok) {
                toast.error('Failed to delete idea')
                return
            }
            toast.success('Idea deleted successfully')
        } catch (err) {
            console.warn('Delete request error (ignored):', err)
            toast.error('Failed to delete idea')
        }
    }

    useEffect(() => { load() }, [])

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero Header */}
            <DashboardHero
                title={t.title}
                description={t.subtitle}
                cta={
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 ring-1 ring-white/20">
                            <span className="text-2xl font-bold text-white">{ideas.length}</span>
                            <span className="text-xs uppercase text-white/80">{t.total}</span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 px-4 py-2 ring-1 ring-white/20">
                            <span className="text-2xl font-bold text-white">{selectedCount}</span>
                            <span className="text-xs uppercase text-white/80">{t.selected}</span>
                        </div>
                    </div>
                }
            />

            {/* Generate Ideas Form */}
            <Section>
                <Card className="bg-slate-900/70 border border-slate-800 rounded-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30">
                                <Sparkles className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">{t.generateNew}</CardTitle>
                                <CardDescription className="text-slate-400">Fill in the details to generate AI-powered content ideas</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {error && (
                        <Alert type="error" message={error} onClose={() => setError(null)} />
                    )}

                    <Grid cols={3} className="mb-6">
                        <Input
                            label={`${t.targetAudience} *`}
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="e.g., Marketing Manager at B2B SaaS"
                            disabled={loading}
                        />
                        <Input
                            label={`${t.industryNiche} *`}
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g., SaaS, Fintech, Healthcare"
                            disabled={loading}
                        />
                        <LanguageSelector
                            label="Content Language"
                            value={contentLanguage}
                            onChange={setContentLanguage}
                            languages={CONTENT_LANGUAGES}
                            disabled={loading}
                        />
                    </Grid>

                    <div className="mb-6">
                        <Input
                            label={t.topicHints}
                            value={corpusHints}
                            onChange={(e) => setCorpusHints(e.target.value)}
                            placeholder="e.g., AI automation, remote work trends, productivity hacks"
                            disabled={loading}
                        />
                    </div>

                    <Grid cols={2} className="mb-6">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-300">{t.quantity}</label>
                                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-sm text-slate-300">{count}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                disabled={loading}
                                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
                            />
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-300">{t.creativity}</label>
                                <span className="text-sm text-slate-400">
                                    {temperature < 0.5 ? t.conservative : temperature < 0.9 ? t.balanced : t.creative}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.1}
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                disabled={loading}
                                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-violet-500"
                            />
                        </div>
                    </Grid>

                    <button
                        onClick={gen}
                        disabled={loading || !persona.trim() || !industry.trim()}
                        className="w-full rounded-xl bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316] px-6 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {t.generating}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                {t.generateButton}
                            </>
                        )}
                    </button>
                </Card>
            </Section>

            {/* Loading State */}
            {initialLoading && <LoadingSpinner />}

            {/* Empty State */}
            {!initialLoading && ideas.length === 0 && (
                <Section>
                    <EmptyState
                        icon={<Sparkles className="h-8 w-8 text-slate-400" />}
                        title={t.noIdeas}
                        description={t.noIdeasDesc}
                        actionLabel={t.generateButton}
                        onAction={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    />
                </Section>
            )}

            {/* Ideas List - Table */}
            {!initialLoading && ideas.length > 0 && (
                <Section>
                    <Card className="bg-slate-900/70 border border-slate-800 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                {t.results}
                                <Badge variant="info">{ideas.length}</Badge>
                            </CardTitle>
                        </CardHeader>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>{t.title_col}</TableHead>
                                    <TableHead>{t.description}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                    <TableHead>{t.scores}</TableHead>
                                    <TableHead>{t.tags}</TableHead>
                                    <TableHead className="text-right">{t.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ideas.map((i, idx) => (
                                    <TableRow key={i.idea_id} className="bg-slate-800/50 border-b border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                                        <TableCell className="font-mono text-slate-400">#{idx + 1}</TableCell>
                                        <TableCell className="max-w-xs font-semibold text-white">
                                            <div className="line-clamp-2">{i.one_liner}</div>
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="line-clamp-2 text-slate-400">{i.angle || i.description || '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={i.status === 'selected' ? 'success' : i.status === 'draft' ? 'warning' : 'info'}
                                            >
                                                {i.status === 'selected' ? '⭐ Selected' : i.status === 'draft' ? '📝 Draft' : i.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400">N</span>
                                                    <span className="font-bold text-white">{i.scores?.novelty || 0}/5</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400">D</span>
                                                    <span className="font-bold text-white">{i.scores?.demand || 0}/5</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400">F</span>
                                                    <span className="font-bold text-white">{i.scores?.fit || 0}/5</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex max-w-xs flex-wrap gap-1">
                                                {i.tags && i.tags.length > 0 ? (
                                                    i.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                                                        <Badge key={tIdx} variant="info">#{tag}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                {i.status !== 'selected' && (
                                                    <button
                                                        onClick={() => selectIdea(i.idea_id || i.id)}
                                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-green-900/30 hover:text-green-400"
                                                        title="Select Idea"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const newTitle = prompt('Edit title:', i.one_liner)
                                                        if (newTitle && newTitle.trim()) {
                                                            setIdeas((prev) => prev.map((idea: any) =>
                                                                (idea.idea_id === i.idea_id || idea.id === i.idea_id)
                                                                    ? { ...idea, one_liner: newTitle.trim() }
                                                                    : idea
                                                            ))
                                                        }
                                                    }}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-indigo-400"
                                                    title="Edit Idea"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(i.idea_id || i.id)}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
                                                    title="Delete Idea"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </Section>
            )}

            {/* Next Steps CTA */}
            {selectedCount > 0 && (
                <div className="fixed bottom-8 right-8 z-50 max-w-sm animate-in slide-in-from-bottom-4">
                    <Card className="bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Ready to Create?</h3>
                                <p className="mb-3 text-sm text-slate-400">
                                    You have selected {selectedCount} ideas. Turn them into detailed content briefs now.
                                </p>
                                <Link href="/briefs" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:underline">
                                    Create Briefs <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setIdeaToDelete(null)
                }}
                onConfirm={() => {
                    if (ideaToDelete) {
                        deleteIdea(ideaToDelete)
                        setDeleteModalOpen(false)
                        setIdeaToDelete(null)
                    }
                }}
                title="Delete Idea"
                description="Are you sure you want to delete this idea? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="destructive"
            />
        </div>
    )
}
