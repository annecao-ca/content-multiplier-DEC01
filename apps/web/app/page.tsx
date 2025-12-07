'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, FileText, Package, Zap, BarChart3, Users, TrendingUp, Clock, CheckCircle, Play } from 'lucide-react'
import { useState, useEffect } from 'react'

// Social proof metrics
const metrics = [
    {
        value: '10,000+',
        label: 'Content Ideas Generated',
        description: '"Content Multiplier transformed our content strategy. We now produce 5x more content with the same team."',
        company: 'TechStartup Inc.',
        role: 'Head of Marketing',
        image: '👨‍💼',
        color: 'from-violet-600 to-indigo-600'
    },
    {
        value: '85%',
        label: 'Time Saved on Research',
        description: '"The AI-powered research briefs cut our preparation time from days to hours. Game changer."',
        company: 'Digital Agency Co.',
        role: 'Content Director',
        image: '👩‍💻',
        color: 'from-cyan-600 to-blue-600'
    },
    {
        value: '3x',
        label: 'Increase in Engagement',
        description: '"Multi-platform publishing with optimized content for each channel tripled our engagement rates."',
        company: 'Growth Marketing Ltd.',
        role: 'CEO',
        image: '👨‍🦱',
        color: 'from-emerald-600 to-teal-600'
    }
]

// Features
const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered Ideas',
        description: 'Generate dozens of content ideas tailored to your audience in seconds',
        color: 'bg-violet-500',
        link: '/ideas'
    },
    {
        icon: FileText,
        title: 'Research Briefs',
        description: 'Comprehensive research with citations and structured outlines',
        color: 'bg-blue-500',
        link: '/briefs'
    },
    {
        icon: Package,
        title: 'Content Packs',
        description: 'Draft, edit, and manage your content collections efficiently',
        color: 'bg-emerald-500',
        link: '/packs'
    },
    {
        icon: Zap,
        title: 'Multi-Platform',
        description: 'Publish to Twitter, LinkedIn, Blog, and more with one click',
        color: 'bg-orange-500',
        link: '/settings/publishing'
    },
    {
        icon: BarChart3,
        title: 'Analytics',
        description: 'Track performance and optimize your content strategy',
        color: 'bg-pink-500',
        link: '/analytics'
    },
    {
        icon: Users,
        title: 'RAG Knowledge',
        description: 'Build your knowledge base for smarter AI responses',
        color: 'bg-indigo-500',
        link: '/documents'
    }
]

// Workflow steps
const workflowSteps = [
    { step: 1, title: 'Generate Ideas', icon: '💡', description: 'AI creates tailored content ideas' },
    { step: 2, title: 'Research', icon: '📚', description: 'Deep dive with citations' },
    { step: 3, title: 'Create Draft', icon: '✍️', description: 'AI-assisted content creation' },
    { step: 4, title: 'Optimize', icon: '🎯', description: 'Platform-specific versions' },
    { step: 5, title: 'Publish', icon: '🚀', description: 'Distribute everywhere' },
]

export default function Home() {
    const [currentMetric, setCurrentMetric] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
        const interval = setInterval(() => {
            setCurrentMetric((prev) => (prev + 1) % metrics.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Announcement Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>New: Multi-LLM Support — Use GPT-4, Gemini, Claude, or DeepSeek</span>
                    <Link href="/settings" className="underline hover:no-underline flex items-center gap-1">
                        Configure now <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 dark:from-gray-900 dark:via-indigo-950 dark:to-violet-950" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/40 via-transparent to-transparent dark:from-blue-900/20" />
                
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
                    <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 mb-8 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Powered by AI</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                            <span className="block">Where creativity</span>
                            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                meets scale
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                            The AI-powered platform that transforms your ideas into 
                            <span className="font-semibold text-gray-900 dark:text-white"> multi-channel content</span> in minutes, not days.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/ideas"
                                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:scale-105"
                            >
                                <Sparkles className="w-5 h-5" />
                                Start Creating
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-full text-lg font-semibold border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md transition-all"
                            >
                                <Play className="w-5 h-5" />
                                View Dashboard
                            </Link>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span>Setup in 2 minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-violet-500" />
                                <span>10x faster content creation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Trusted by content creators worldwide
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            See how teams are scaling their content with AI
                        </p>
                    </div>

                    {/* Metrics Cards Carousel */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {metrics.map((metric, index) => (
                            <div
                                key={index}
                                className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-500 ${
                                    currentMetric === index 
                                        ? 'scale-105 shadow-2xl z-10' 
                                        : 'scale-100 shadow-lg opacity-80'
                                }`}
                            >
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-90`} />
                                
                                {/* Content */}
                                <div className="relative text-white">
                                    {/* Metric */}
                                    <div className="text-5xl font-bold mb-2">{metric.value}</div>
                                    <div className="text-lg font-medium mb-6 opacity-90">{metric.label}</div>
                                    
                                    {/* Quote */}
                                    <blockquote className="text-white/90 italic mb-6 leading-relaxed">
                                        "{metric.description}"
                                    </blockquote>
                                    
                                    {/* Author */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                                            {metric.image}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{metric.company}</div>
                                            <div className="text-sm opacity-80">{metric.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Carousel Indicators */}
                    <div className="flex justify-center gap-2 mt-8">
                        {metrics.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentMetric(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    currentMetric === index 
                                        ? 'bg-blue-600 w-8' 
                                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Everything you need to scale content
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            From ideation to publication, we've got you covered with AI-powered tools
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Link
                                key={index}
                                href={feature.link}
                                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Arrow */}
                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="py-20 bg-gradient-to-br from-gray-900 to-indigo-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Your content workflow, supercharged
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            From idea to publication in 5 simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {workflowSteps.map((step, index) => (
                            <div key={index} className="relative">
                                {/* Connector Line */}
                                {index < workflowSteps.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-violet-500" />
                                )}
                                
                                <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-700/50 hover:border-blue-500/50 transition-colors group">
                                    {/* Step Number */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        Step {step.step}
                                    </div>
                                    
                                    {/* Icon */}
                                    <div className="text-4xl mb-4 group-hover:scale-125 transition-transform">
                                        {step.icon}
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white dark:bg-gray-950">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Ready to 10x your content?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
                        Join thousands of creators using AI to scale their content production
                    </p>
                    
                    <Link
                        href="/ideas"
                        className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 rounded-full text-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:scale-105"
                    >
                        <Sparkles className="w-6 h-6" />
                        Get Started Free
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                        No credit card required • Free tier available
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                                📦
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">Content Multiplier</span>
                        </div>
                        
                        <div className="flex gap-8 text-sm text-gray-600 dark:text-gray-400">
                            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                            <Link href="/ideas" className="hover:text-blue-600 transition-colors">Ideas</Link>
                            <Link href="/briefs" className="hover:text-blue-600 transition-colors">Briefs</Link>
                            <Link href="/packs" className="hover:text-blue-600 transition-colors">Packs</Link>
                            <Link href="/settings" className="hover:text-blue-600 transition-colors">Settings</Link>
                        </div>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                            © 2024 Content Multiplier. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
