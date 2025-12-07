'use client'

import React, { useState } from "react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts"
import { ChevronRight, Rocket, Layers, FileText, Package2, Share2, BarChart3, Clock3, Flame, Plus, CalendarDays, Zap, CheckCircle2, AlertCircle, Circle, ChevronDown, ChevronUp, Sparkles, ExternalLink } from "lucide-react"
import {
    PageHeader,
    Section,
    Card,
    SubCard,
    CardHeader,
    CardTitle,
    CardDescription,
    StatCard,
    Badge,
    PrimaryButton,
    Input,
    Grid,
    EmptyState,
    Alert,
} from "../components/webflow-ui"
import {
    DashboardHero,
    ActivityItemDark,
    ActivitySection,
} from "../components/dashboard-ui"

// --- Mock Data -------------------------------------------------
const kpi = {
    ideas: 24,
    briefs: 12,
    packs: 8,
    reach: 45200,
    engagementRate: 3.8,
}

const kpiTrend = [
    { d: "Mon", ideas: 3, reach: 5.1 },
    { d: "Tue", ideas: 6, reach: 6.2 },
    { d: "Wed", ideas: 4, reach: 7.4 },
    { d: "Thu", ideas: 5, reach: 8.3 },
    { d: "Fri", ideas: 2, reach: 7.9 },
    { d: "Sat", ideas: 3, reach: 9.1 },
    { d: "Sun", ideas: 1, reach: 10.2 },
]

const topChannels = [
    { channel: "Twitter", reach: 18000 },
    { channel: "LinkedIn", reach: 14500 },
    { channel: "Blog", reach: 9200 },
    { channel: "YouTube", reach: 3500 },
]

const workflow = [
    { id: 1, stage: "Ideate", label: "AI Trends 2025 content pack", progress: 100, status: "done", due: "Today", urgency: "none" },
    { id: 2, stage: "Research", label: "Marketing Guide brief", progress: 65, status: "in_progress", due: "Tomorrow", urgency: "high" },
    { id: 3, stage: "Create", label: "LinkedIn carousel for FRSPP", progress: 40, status: "in_progress", due: "Wed", urgency: "medium" },
    { id: 4, stage: "Optimize", label: "Twitter thread variations", progress: 15, status: "queued", due: "Fri", urgency: "low" },
    { id: 5, stage: "Publish", label: "Q2 recap to 5 platforms", progress: 0, status: "queued", due: "—", urgency: "low" },
]

const recent = [
    { time: "2h", text: "Published 'AI Trends 2024' to 5 platforms", type: "publish", icon: "🟢", platforms: ["Twitter", "LinkedIn", "Blog", "YouTube", "Medium"] },
    { time: "5h", text: "Generated 10 content variations for 'Marketing Guide'", type: "optimize", icon: "🟡", link: "/packs/123" },
    { time: "1d", text: "Created research brief for 'Social Media Strategy'", type: "research", icon: "🔵", link: "/briefs/456" },
]

const toolCards = [
    { title: "Content Ideas", desc: "Generate AI‑powered ideas tailored to audience", icon: Rocket, stat: kpi.ideas, cta: "New Idea", href: "/ideas" },
    { title: "Research Briefs", desc: "Create comprehensive research briefs with citations", icon: FileText, stat: kpi.briefs, cta: "New Brief", href: "/briefs" },
    { title: "Content Packs", desc: "Draft and manage collections", icon: Package2, stat: kpi.packs, cta: "New Pack", href: "/packs/new" },
    { title: "Multi‑Platform Publishing", desc: "Distribute everywhere", icon: Share2, stat: 5, cta: "Connect", href: "/settings/publishing" },
    { title: "Twitter Bot", desc: "Automate presence with AI", icon: Zap, stat: 3, cta: "Open Bot", href: "/settings/twitter-bot" },
    { title: "Analytics", desc: "Track performance & optimize", icon: BarChart3, stat: kpi.reach, cta: "View Analytics", href: "/analytics" },
]

// --- Helper Components -----------------------------------------
function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-[#0b1120]">
            <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${value}%` }}
            />
        </div>
    )
}

function MiniChart({ data, dataKey }: { data: typeof kpiTrend; dataKey: string }) {
    return (
        <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Main Component -------------------------------------------
export default function DashboardPage() {
    const [showCompleted, setShowCompleted] = useState(false)
    const [workflowFilter, setWorkflowFilter] = useState<"all" | "active">("active")
    const [searchQuery, setSearchQuery] = useState("")

    // Filter workflow items
    const activeWorkflow = workflow.filter(item => item.status !== "done")
    const completedWorkflow = workflow.filter(item => item.status === "done")
    const displayedWorkflow = workflowFilter === "active" ? activeWorkflow : workflow

    // Group workflow by urgency
    const urgentItems = displayedWorkflow.filter(item => item.urgency === "high" && item.status !== "done")
    const inProgressItems = displayedWorkflow.filter(item => item.status === "in_progress" && item.urgency !== "high")
    const queuedItems = displayedWorkflow.filter(item => item.status === "queued")

    // Filter tools by search
    const filteredTools = toolCards.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            {/* Hero Header */}
            <DashboardHero
                title="Content Multiplier — Mission Control"
                description="Plan, create, and distribute multi‑platform content with AI. Track progress, performance, and next actions in one place."
                cta={
                    <Link href="/packs/new">
                        <PrimaryButton variant="secondary" size="lg">
                            <Plus className="mr-2 h-4 w-4" /> Start New Content Pack
                        </PrimaryButton>
                    </Link>
                }
            />

            {/* KPI Snapshot */}
            <Section>
                <Grid cols={4} className="lg:grid-cols-5">
                    <StatCard
                        label="Active Ideas"
                        value={kpi.ideas}
                        trend="↑ 12% vs last week"
                        trendType="up"
                        icon={<Sparkles className="h-4 w-4" />}
                    />
                    <StatCard
                        label="Research Briefs"
                        value={kpi.briefs}
                        trend="↑ 8%"
                        trendType="up"
                        icon={<FileText className="h-4 w-4" />}
                    />
                    <StatCard
                        label="Content Packs"
                        value={kpi.packs}
                        hint="Ready to publish"
                        icon={<Package2 className="h-4 w-4" />}
                    />
                    <StatCard
                        label="Total Reach"
                        value={`${(kpi.reach / 1000).toFixed(1)}K`}
                        trend="↑ 9%"
                        trendType="up"
                        icon={<Share2 className="h-4 w-4" />}
                    />
                    <StatCard
                        label="Engagement Rate"
                        value={`${kpi.engagementRate}%`}
                        hint="Best on Tue 9am"
                        icon={<BarChart3 className="h-4 w-4" />}
                    />
                </Grid>
            </Section>

            {/* Recent Activity */}
            <Section>
                <ActivitySection
                    title="Recent Activity"
                    description="Latest actions across creation, optimization, and publishing"
                    viewAllHref="/analytics"
                >
                    {recent.map((r, i) => (
                        <ActivityItemDark
                            key={i}
                            icon={r.icon}
                            text={r.text}
                            time={r.time}
                            platforms={r.platforms}
                            link={r.link}
                        />
                    ))}
                </ActivitySection>
            </Section>

            {/* Workflow + Channel Performance */}
            <Section>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Workflow Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5" /> Content Creation Workflow
                                    </CardTitle>
                                    <CardDescription>Track stage progress and jump to the next action</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PrimaryButton
                                        variant={workflowFilter === "active" ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setWorkflowFilter("active")}
                                    >
                                        Active
                                    </PrimaryButton>
                                    <PrimaryButton
                                        variant={workflowFilter === "all" ? "primary" : "ghost"}
                                        size="sm"
                                        onClick={() => setWorkflowFilter("all")}
                                    >
                                        All
                                    </PrimaryButton>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="space-y-6">
                            {/* URGENT Items */}
                            {urgentItems.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <h3 className="text-sm font-semibold text-red-600">🔴 URGENT (Due Today/Tomorrow)</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {urgentItems.map(item => (
                                            <SubCard key={item.id} className="border-2 border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="danger">{item.stage}</Badge>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-[#e5e7eb]">{item.label}</div>
                                                        <ProgressBar value={item.progress} />
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Due: {item.due}</span>
                                                            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {item.progress}%</span>
                                                        </div>
                                                    </div>
                                                    <PrimaryButton size="sm">Continue <ChevronRight className="ml-1 h-4 w-4" /></PrimaryButton>
                                                </div>
                                            </SubCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* IN PROGRESS Items */}
                            {inProgressItems.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <Circle className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                        <h3 className="text-sm font-semibold text-yellow-600">🟡 IN PROGRESS</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {inProgressItems.map(item => (
                                            <SubCard key={item.id}>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="warning">{item.stage}</Badge>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-[#e5e7eb]">{item.label}</div>
                                                        <ProgressBar value={item.progress} />
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Due: {item.due}</span>
                                                            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {item.progress}%</span>
                                                        </div>
                                                    </div>
                                                    <PrimaryButton variant="secondary" size="sm">Continue <ChevronRight className="ml-1 h-4 w-4" /></PrimaryButton>
                                                </div>
                                            </SubCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* QUEUED Items */}
                            {queuedItems.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <Circle className="h-4 w-4 text-gray-400" />
                                        <h3 className="text-sm font-semibold text-slate-500">⚪ QUEUED</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {queuedItems.map(item => (
                                            <SubCard key={item.id} className="opacity-75">
                                                <div className="flex items-center gap-4">
                                                    <Badge>{item.stage}</Badge>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-[#e5e7eb]">{item.label}</div>
                                                        <ProgressBar value={item.progress} />
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Due: {item.due}</span>
                                                            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {item.progress}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SubCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* COMPLETED Items (Collapsible) */}
                            {completedWorkflow.length > 0 && (
                                <div>
                                    <button
                                        className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-[#0b1120]"
                                        onClick={() => setShowCompleted(!showCompleted)}
                                    >
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-slate-500">✅ COMPLETED ({completedWorkflow.length})</span>
                                        </span>
                                        {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    {showCompleted && (
                                        <div className="mt-3 space-y-2">
                                            {completedWorkflow.map(item => (
                                                <SubCard key={item.id} className="opacity-60">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="success">{item.stage}</Badge>
                                                        <div className="flex-1 text-sm">{item.label}</div>
                                                        <span className="flex items-center gap-1 text-xs text-green-600">
                                                            <CheckCircle2 className="h-3 w-3" /> Completed {item.due}
                                                        </span>
                                                    </div>
                                                </SubCard>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Channel Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" /> Channel Performance
                            </CardTitle>
                            <CardDescription>Where your audience is growing.</CardDescription>
                        </CardHeader>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topChannels}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="channel" axisLine={false} tickLine={false} fontSize={12} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="reach" radius={[6, 6, 0, 0]} fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </Section>

            {/* Quick Actions Menu */}
            <Section>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" /> Quick Actions
                                </CardTitle>
                                <CardDescription>Jump to any tool or create new content</CardDescription>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Input
                                placeholder="Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>

                    <Grid cols={3}>
                        {filteredTools.map((tool) => {
                            const Icon = tool.icon
                            return (
                                <Link key={tool.title} href={tool.href}>
                                    <SubCard className="group h-full transition-all hover:shadow-md hover:ring-2 hover:ring-indigo-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 dark:from-indigo-900/30 dark:to-violet-900/30 dark:text-indigo-400">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <Badge variant="info">{tool.stat}</Badge>
                                        </div>
                                        <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-[#e5e7eb]">{tool.title}</h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-[#9ca3af]">{tool.desc}</p>
                                        <div className="mt-4 flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            {tool.cta}
                                            <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </SubCard>
                                </Link>
                            )
                        })}
                    </Grid>
                </Card>
            </Section>

            {/* Footer tip */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#9ca3af]">
                <Flame className="h-4 w-4" />
                <span>Tip: Peak engagement for your audience is usually <b>Tue 9:00–11:00</b>. Schedule posts to maximize reach.</span>
            </div>
        </>
    )
}
