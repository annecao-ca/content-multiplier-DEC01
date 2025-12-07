'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Package, Plus, ArrowLeft, Eye, FileText, CheckCircle } from 'lucide-react'
import { useToast } from '../components/ui'
import {
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
    Tabs,
} from '../components/webflow-ui'
import { DashboardHero } from '../components/dashboard-ui'

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001'

interface ContentPack {
    pack_id: string
    status: string
    draft_markdown?: string
    derivatives?: any
    seo?: any
    created_at: string
    brief_id?: string
}

function PacksContent() {
    const [packs, setPacks] = useState<ContentPack[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const searchParams = useSearchParams()
    const publishFilter = searchParams.get('filter') || 'all'
    const toast = useToast()

    async function loadPacks() {
        try {
            const res = await fetch(`${API_URL}/api/packs`)
            if (!res.ok) {
                throw new Error('Failed to fetch packs')
            }
            const data = await res.json()
            if (Array.isArray(data)) {
                setPacks(data)
            } else {
                console.error('Unexpected data format from API:', data)
                setPacks([])
            }
        } catch (err) {
            console.error('Failed to load packs:', err)
            setPacks([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadPacks()
    }, [])

    // Filter packs based on tab
    const filteredPacks = packs.filter(pack => {
        if (activeTab === 'all') return true
        if (activeTab === 'published') return pack.status === 'published'
        if (activeTab === 'pending') return pack.status !== 'published'
        return true
    })

    const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
        switch (status) {
            case 'published': return 'success'
            case 'draft': return 'warning'
            case 'ready_for_review': return 'info'
            default: return 'default'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return '📝'
            case 'ready_for_review': return '👀'
            case 'published': return '✅'
            default: return '❓'
        }
    }

    const tabs = [
        { id: 'all', label: 'All', count: packs.length },
        { id: 'published', label: 'Published', count: packs.filter(p => p.status === 'published').length },
        { id: 'pending', label: 'Pending', count: packs.filter(p => p.status !== 'published').length },
    ]

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <DashboardHero
                title="Content Packs"
                description="Manage your content drafts and published packs"
                cta={
                    <div className="flex items-center gap-3">
                        <Link href="/briefs">
                            <PrimaryButton variant="secondary" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </PrimaryButton>
                        </Link>
                        <Link href="/packs/new">
                            <PrimaryButton className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316]">
                                <Plus className="mr-2 h-4 w-4" /> Create New Pack
                            </PrimaryButton>
                        </Link>
                    </div>
                }
            />

            {/* Tabs */}
            <Section className="mb-0">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </Section>

            {filteredPacks.length === 0 ? (
                <Section>
                    <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                        <EmptyState
                            icon={<Package className="h-8 w-8 text-slate-400" />}
                            title="No Content Packs Yet"
                            description="Start by creating your first content pack from an approved brief."
                            actionLabel="Go to Briefs →"
                            onAction={() => window.location.href = '/briefs'}
                        />
                    </Card>
                </Section>
            ) : (
                <Section>
                    <Grid cols={2}>
                        {filteredPacks.map((pack) => (
                            <Card key={pack.pack_id} className="group transition-all hover:shadow-lg bg-slate-900/70 border border-slate-800">
                                {/* Header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-indigo-500/30">
                                            <Package className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-50">
                                                Content Pack
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Created {new Date(pack.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusVariant(pack.status)}>
                                        {getStatusIcon(pack.status)} {pack.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {/* Content Preview */}
                                {pack.draft_markdown ? (
                                    <SubCard className="mb-4 max-h-32 overflow-hidden bg-slate-800/50 border-slate-700">
                                        <p className="line-clamp-4 text-sm text-slate-300">
                                            {pack.draft_markdown.substring(0, 200)}...
                                        </p>
                                    </SubCard>
                                ) : (
                                    <SubCard className="mb-4 flex flex-col items-center py-8 text-center bg-slate-800/50 border-slate-700">
                                        <FileText className="mb-2 h-8 w-8 text-slate-500" />
                                        <p className="text-sm text-slate-400">No draft content yet</p>
                                    </SubCard>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        {pack.derivatives ? '✓ Has derivatives' : '○ No derivatives'}
                                    </span>
                                    <Link href={`/packs/${pack.pack_id}`}>
                                        <PrimaryButton size="sm" variant="secondary">
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </Grid>
                </Section>
            )}
        </div>
    )
}

export default function PacksPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <PacksContent />
        </Suspense>
    )
}
