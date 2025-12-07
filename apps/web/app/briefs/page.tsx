'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '../contexts/LanguageContext'
import { FileText, CheckCircle, BookOpen, Target, BarChart, Send } from 'lucide-react'
import { useToast } from '../components/ui'
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
    Grid,
    EmptyState,
    LoadingSpinner,
    Alert,
} from '../components/webflow-ui'
import { DashboardHero, ActivityItemDark, ActivitySection } from '../components/dashboard-ui'

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001'

export default function BriefsPage() {
    const [selectedIdea, setSelectedIdea] = useState<any>(null)
    const [ideas, setIdeas] = useState<any[]>([])
    const [briefs, setBriefs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const toast = useToast()
    const { language } = useLanguage()

    async function loadIdeas() {
        try {
            const r = await fetch(`${API_URL}/api/ideas`)
            const all = await r.json()
            if (Array.isArray(all)) {
                setIdeas(all.filter((i: any) => i.status === 'selected'))
            } else {
                console.error('API returned non-array:', all)
                setIdeas([])
            }
        } catch (error) {
            console.error('Failed to load ideas:', error)
            setIdeas([])
        } finally {
            setInitialLoading(false)
        }
    }

    async function loadBriefs() {
        try {
            const r = await fetch(`${API_URL}/api/briefs`)
            if (r.ok) {
                const data = await r.json()
                setBriefs(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Failed to load briefs:', error)
        }
    }

    async function generateBrief(ideaId: string) {
        setLoading(true)
        setError(null)

        try {
            const briefId = `brief-${Date.now()}`
            const r = await fetch(`${API_URL}/api/briefs/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brief_id: briefId,
                    idea_id: ideaId,
                    query: selectedIdea?.one_liner || 'content research',
                    language: language
                })
            })

            if (!r.ok) {
                const data = await r.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to generate brief')
            }

            const data = await r.json()
            toast.success('Brief generated successfully!')

            // Add new brief to list
            if (data.brief) {
                setBriefs((prev) => [data.brief, ...prev])
            }

            setSelectedIdea(null)

        } catch (err: any) {
            const errorMsg = err.message || 'Failed to generate brief'
            setError(errorMsg)
            toast.error('Failed to generate brief', errorMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadIdeas()
        loadBriefs()
    }, [])

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHero
                title="Research Briefs"
                description="Create comprehensive research briefs from your selected ideas"
                cta={
                    ideas.length > 0 ? (
                        <Badge variant="info">{ideas.length} ideas ready</Badge>
                    ) : (
                        <PrimaryButton size="lg" onClick={() => window.location.href = '/ideas'}>
                            Select Ideas →
                        </PrimaryButton>
                    )
                }
            />

            {initialLoading ? (
                <LoadingSpinner />
            ) : ideas.length === 0 ? (
                <Section>
                    <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                        <EmptyState
                            icon={<FileText className="h-8 w-8 text-slate-400" />}
                            title="No Selected Ideas"
                            description="You need to select some ideas before creating briefs. Go back to the Ideas page and select the ideas you want to develop."
                            actionLabel="Go to Ideas →"
                            onAction={() => window.location.href = '/ideas'}
                        />
                    </Card>
                </Section>
            ) : (
                <>
                    {/* Available Ideas */}
                    <Section>
                        <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-white">Available Ideas for Research</CardTitle>
                                <CardDescription className="text-slate-400">Select an idea to create a comprehensive research brief</CardDescription>
                            </CardHeader>

                            <div className="space-y-3">
                                {ideas.map(idea => (
                                    <SubCard
                                        key={idea.idea_id}
                                        onClick={() => setSelectedIdea(idea)}
                                        className={`cursor-pointer transition-all bg-slate-800/50 border border-slate-700 hover:bg-slate-800 ${
                                            selectedIdea?.idea_id === idea.idea_id
                                                ? 'ring-2 ring-[#a855f7] bg-slate-800 border-[rgba(168,85,247,0.3)]'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-50">
                                                    {idea.one_liner}
                                                </h4>
                                                {idea.angle && (
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        <strong>Angle:</strong> {idea.angle}
                                                    </p>
                                                )}
                                            </div>
                                            <PrimaryButton
                                                variant={selectedIdea?.idea_id === idea.idea_id ? 'primary' : 'secondary'}
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedIdea(idea)
                                                }}
                                            >
                                                {selectedIdea?.idea_id === idea.idea_id ? '✓ Selected' : '📚 Research This'}
                                            </PrimaryButton>
                                        </div>
                                    </SubCard>
                                ))}
                            </div>
                        </Card>
                    </Section>

                    {/* Selected Idea - Research Panel */}
                    {selectedIdea && (
                        <Section>
                            <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-indigo-500/30">
                                            <span className="text-xl">🔬</span>
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">Research: {selectedIdea.one_liner}</CardTitle>
                                            <CardDescription className="text-slate-400">Generate a comprehensive research brief</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                {error && (
                                    <Alert type="error" message={error} onClose={() => setError(null)} />
                                )}

                                <SubCard className="mb-6 bg-slate-800/50 border-slate-700">
                                    <p className="mb-4 text-slate-300">
                                        This will search the knowledge base and create a comprehensive brief with:
                                    </p>
                                    <Grid cols={2} className="gap-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <BarChart className="h-4 w-4 text-indigo-400" />
                                            Market research and statistics
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <BookOpen className="h-4 w-4 text-indigo-400" />
                                            Relevant sources and citations
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <FileText className="h-4 w-4 text-indigo-400" />
                                            Content outline and key points
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Target className="h-4 w-4 text-indigo-400" />
                                            Target audience insights
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Send className="h-4 w-4 text-indigo-400" />
                                            Distribution strategy
                                        </div>
                                    </Grid>
                                </SubCard>

                                <div className="flex justify-center gap-4">
                                    <PrimaryButton
                                        onClick={() => generateBrief(selectedIdea.idea_id)}
                                        disabled={loading}
                                        size="lg"
                                        className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316]"
                                    >
                                        {loading ? '🔄 Generating Brief...' : '🚀 Generate Research Brief'}
                                    </PrimaryButton>
                                    {!loading && (
                                        <PrimaryButton
                                            onClick={() => setSelectedIdea(null)}
                                            variant="ghost"
                                            size="lg"
                                        >
                                            Cancel
                                        </PrimaryButton>
                                    )}
                                </div>
                            </Card>
                        </Section>
                    )}

                    {/* Generated Briefs List */}
                    {briefs.length > 0 && (
                        <Section>
                            <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        📋 Generated Briefs
                                        <Badge variant="success">{briefs.length}</Badge>
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Your research briefs ready for review</CardDescription>
                                </CardHeader>

                                <div className="space-y-4">
                                    {briefs.map((brief: any) => (
                                        <SubCard key={brief.brief_id} className="transition-all hover:shadow-md bg-slate-800/50 border-slate-700 hover:bg-slate-800">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-50">
                                                        📄 {brief.brief_id}
                                                        <Badge variant="success">
                                                            <CheckCircle className="mr-1 h-3 w-3" /> Complete
                                                        </Badge>
                                                    </h4>

                                                    {brief.key_points && brief.key_points.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-semibold uppercase text-slate-500">Key Points:</p>
                                                            <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                                                                {brief.key_points.slice(0, 3).map((point: string, idx: number) => (
                                                                    <li key={idx}>{point}</li>
                                                                ))}
                                                                {brief.key_points.length > 3 && (
                                                                    <li className="text-slate-500">... and {brief.key_points.length - 3} more</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {brief.outline && brief.outline.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-semibold uppercase text-slate-500">Outline:</p>
                                                            <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                                                                {brief.outline.slice(0, 4).map((section: any, idx: number) => (
                                                                    <li key={idx}>{section.h2 || section}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                <Link href={`/briefs/${brief.brief_id}`}>
                                                    <PrimaryButton size="sm">
                                                        View Full Brief →
                                                    </PrimaryButton>
                                                </Link>
                                            </div>
                                        </SubCard>
                                    ))}
                                </div>
                            </Card>
                        </Section>
                    )}
                </>
            )}
        </div>
    )
}
