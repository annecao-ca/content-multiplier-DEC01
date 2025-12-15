'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
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
    StatCard,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Select,
    Input,
    EmptyState,
    LoadingSpinner,
    Alert,
} from '../components/webflow-ui'
import { DashboardHero } from '../components/dashboard-ui'

interface AnalyticsData {
    pack_id: string
    platform: string
    external_id: string
    external_url: string
    metrics: Record<string, any>
    published_at: string
    status: string
    error_message?: string
}

interface PlatformSummary {
    platform: string
    total_posts: number
    successful_posts: number
    failed_posts: number
    success_rate: number
    total_engagement: number
}

const PLATFORM_ICONS: Record<string, string> = {
    twitter: '𝕏',
    linkedin: '💼',
    facebook: '📘',
    instagram: '📷',
    sendgrid: '📧',
    mailchimp: '📬',
    wordpress: '📝',
    medium: '📖'
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
    const [platformSummary, setPlatformSummary] = useState<PlatformSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    })

    async function loadAnalytics() {
        setLoading(true)
        try {
            // Load analytics for all content packs
            const packsRes = await fetch('/api/packs')
            const packsData = await packsRes.json()

            const allAnalytics: AnalyticsData[] = []

            for (const pack of packsData.packs || []) {
                try {
                    const analyticsRes = await fetch(`/api/publishing/analytics/${pack.pack_id}`)
                    const analyticsData = await analyticsRes.json()

                    if (analyticsData.ok && analyticsData.analytics) {
                        allAnalytics.push(...analyticsData.analytics.map((item: any) => ({
                            ...item,
                            pack_id: pack.pack_id
                        })))
                    }
                } catch (error) {
                    console.error(`Failed to load analytics for pack ${pack.pack_id}:`, error)
                }
            }

            setAnalytics(allAnalytics)
            calculatePlatformSummary(allAnalytics)
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    function calculatePlatformSummary(data: AnalyticsData[]) {
        const platformStats: Record<string, PlatformSummary> = {}

        data.forEach(item => {
            if (!platformStats[item.platform]) {
                platformStats[item.platform] = {
                    platform: item.platform,
                    total_posts: 0,
                    successful_posts: 0,
                    failed_posts: 0,
                    success_rate: 0,
                    total_engagement: 0
                }
            }

            const stats = platformStats[item.platform]
            stats.total_posts++

            if (item.status === 'published') {
                stats.successful_posts++

                // Calculate engagement based on platform
                let engagement = 0
                if (item.metrics) {
                    switch (item.platform) {
                        case 'twitter':
                            engagement = (item.metrics.like_count || 0) +
                                (item.metrics.retweet_count || 0) +
                                (item.metrics.reply_count || 0)
                            break
                        case 'linkedin':
                            engagement = (item.metrics.views || 0) +
                                (item.metrics.likes || 0) +
                                (item.metrics.comments || 0) +
                                (item.metrics.shares || 0)
                            break
                        case 'facebook':
                            engagement = (item.metrics.reach || 0) +
                                (item.metrics.likes || 0) +
                                (item.metrics.comments || 0) +
                                (item.metrics.shares || 0)
                            break
                        case 'instagram':
                            engagement = (item.metrics.views || 0) +
                                (item.metrics.likes || 0) +
                                (item.metrics.comments || 0) +
                                (item.metrics.saves || 0)
                            break
                        case 'sendgrid':
                        case 'mailchimp':
                            engagement = (item.metrics.opens || 0) +
                                (item.metrics.clicks || 0)
                            break
                        default:
                            engagement = item.metrics.views || item.metrics.visits || 0
                    }
                }
                stats.total_engagement += engagement
            } else {
                stats.failed_posts++
            }

            stats.success_rate = (stats.successful_posts / stats.total_posts) * 100
        })

        setPlatformSummary(Object.values(platformStats))
    }

    const filteredAnalytics = analytics.filter(item => {
        const publishedDate = new Date(item.published_at)
        const fromDate = new Date(dateRange.from)
        const toDate = new Date(dateRange.to)

        const withinDateRange = publishedDate >= fromDate && publishedDate <= toDate
        const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform

        return withinDateRange && matchesPlatform
    })

    const totalPosts = filteredAnalytics.length
    const successfulPosts = filteredAnalytics.filter(item => item.status === 'published').length
    const failedPosts = totalPosts - successfulPosts
    const overallSuccessRate = totalPosts > 0 ? (successfulPosts / totalPosts) * 100 : 0

    useEffect(() => {
        loadAnalytics()
    }, [])

    const platformOptions = [
        { value: 'all', label: 'All Platforms' },
        ...Object.keys(PLATFORM_ICONS).map(platform => ({
            value: platform,
            label: `${PLATFORM_ICONS[platform]} ${platform}`
        }))
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <DashboardHero
                title="Publishing Analytics"
                description="Track performance and engagement across all your publishing platforms"
                cta={
                    <div className="flex items-center gap-3">
                        {totalPosts > 0 && (
                            <Badge variant="success">{totalPosts} published posts</Badge>
                        )}
                        <PrimaryButton onClick={loadAnalytics} disabled={loading} variant="secondary">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Loading...' : 'Refresh Data'}
                        </PrimaryButton>
                    </div>
                }
            />

            {/* Filters */}
            <Section>
                <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-white">Filters</CardTitle>
                    </CardHeader>
                    <Grid cols={4}>
                        <Select
                            label="Platform"
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            options={platformOptions}
                        />
                        <Input
                            label="From Date"
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        />
                        <Input
                            label="To Date"
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        />
                        <div className="flex items-end">
                            <PrimaryButton onClick={loadAnalytics} disabled={loading} className="w-full bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316]">
                                {loading ? 'Loading...' : 'Apply Filters'}
                            </PrimaryButton>
                        </div>
                    </Grid>
                </Card>
            </Section>

            {/* Overall Statistics */}
            <Section>
                <Grid cols={4}>
                    <StatCard
                        label="Total Posts"
                        value={totalPosts}
                        icon={<TrendingUp className="h-4 w-4" />}
                    />
                    <StatCard
                        label="Successful"
                        value={successfulPosts}
                        trendType="up"
                        icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
                    />
                    <StatCard
                        label="Failed"
                        value={failedPosts}
                        trendType={failedPosts > 0 ? "down" : "neutral"}
                        icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                    />
                    <StatCard
                        label="Success Rate"
                        value={`${overallSuccessRate.toFixed(1)}%`}
                        trendType={overallSuccessRate >= 90 ? "up" : overallSuccessRate >= 70 ? "neutral" : "down"}
                        icon={<TrendingUp className="h-4 w-4" />}
                    />
                </Grid>
            </Section>

            {/* Platform Summary */}
            <Section>
                <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-white">Platform Performance</CardTitle>
                        <CardDescription className="text-slate-400">Breakdown by publishing platform</CardDescription>
                    </CardHeader>

                    {platformSummary.length === 0 ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <EmptyState
                                title="No Data Available"
                                description="No analytics data available for the selected filters."
                            />
                        </Card>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead className="text-center">Total Posts</TableHead>
                                    <TableHead className="text-center">Successful</TableHead>
                                    <TableHead className="text-center">Failed</TableHead>
                                    <TableHead className="text-center">Success Rate</TableHead>
                                    <TableHead className="text-center">Total Engagement</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {platformSummary.map(platform => (
                                    <TableRow key={platform.platform}>
                                        <TableCell>
                                            <span className="flex items-center gap-2">
                                                <span className="text-xl">{PLATFORM_ICONS[platform.platform]}</span>
                                                <span className="capitalize">{platform.platform}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {platform.total_posts}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="success">{platform.successful_posts}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={platform.failed_posts > 0 ? "danger" : "default"}>
                                                {platform.failed_posts}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    platform.success_rate >= 90 ? "success" :
                                                        platform.success_rate >= 70 ? "warning" : "danger"
                                                }
                                            >
                                                {platform.success_rate.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {platform.total_engagement.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </Section>

            {/* Recent Posts */}
            <Section>
                <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Posts</CardTitle>
                        <CardDescription className="text-slate-400">Latest publishing activity</CardDescription>
                    </CardHeader>

                    {filteredAnalytics.length === 0 ? (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <EmptyState
                                title="No Posts Found"
                                description="No posts found for the selected filters."
                            />
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredAnalytics
                                .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                                .slice(0, 10)
                                .map((item, index) => (
                                    <SubCard
                                        key={index}
                                        className={`bg-slate-800/50 border-slate-700 hover:bg-slate-800 ${
                                            item.status === 'published'
                                                ? 'border-l-4 border-l-emerald-500'
                                                : 'border-l-4 border-l-red-500'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{PLATFORM_ICONS[item.platform]}</span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold capitalize text-slate-50">{item.platform}</span>
                                                        <Badge variant={item.status === 'published' ? 'success' : 'danger'}>
                                                            {item.status}
                                                        </Badge>
                                                    </div>
                                                    {item.external_url && (
                                                        <a
                                                            href={item.external_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-1 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                                                        >
                                                            View Post <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                    {item.error_message && (
                                                        <p className="mt-1 text-sm text-red-400">
                                                            Error: {item.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-sm text-slate-400">
                                                {new Date(item.published_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </SubCard>
                                ))}
                        </div>
                    )}
                </Card>
            </Section>
        </div>
    )
}
