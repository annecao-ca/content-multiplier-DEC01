'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, Zap, Send, Bot, Save, TestTube, Play, ChevronRight } from 'lucide-react'
import { useToast, ConfirmModal } from '../components/ui'
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
    Input,
    Textarea,
    Select,
    Alert,
} from '../components/webflow-ui'
import { DashboardHero } from '../components/dashboard-ui'

interface LLMConfig {
    provider: 'openai' | 'deepseek' | 'anthropic' | 'gemini' | 'grok'
    apiKey: string
    model: string
    baseUrl?: string
}

const LLM_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4o-mini',
        requiresApiKey: true,
        description: 'OpenAI provides GPT models for general AI tasks with strong language understanding.'
    },
    deepseek: {
        name: 'DeepSeek',
        models: ['deepseek-chat', 'deepseek-coder'],
        defaultModel: 'deepseek-chat',
        baseUrl: 'https://api.deepseek.com',
        requiresApiKey: true,
        description: 'DeepSeek offers competitive AI models with strong coding capabilities and cost-effective pricing.'
    },
    anthropic: {
        name: 'Anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
        defaultModel: 'claude-3-5-sonnet-20241022',
        requiresApiKey: true,
        description: 'Anthropic provides Claude models with strong reasoning, safety features, and long context windows.'
    },
    gemini: {
        name: 'Google Gemini',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        defaultModel: 'gemini-1.5-flash',
        baseUrl: 'https://generativelanguage.googleapis.com',
        requiresApiKey: true,
        description: 'Google Gemini offers powerful multimodal AI with strong reasoning and real-time access to current information.'
    },
    grok: {
        name: 'xAI Grok',
        models: ['grok-beta', 'grok-1.5', 'grok-4-fast-non-reasoning'],
        defaultModel: 'grok-beta',
        baseUrl: 'https://api.x.ai',
        requiresApiKey: true,
        description: 'xAI Grok provides helpful AI with a focus on truth-seeking and real-time access to current events.'
    }
}

const settingsLinks = [
    {
        href: '/settings/publishing',
        icon: Send,
        title: 'Publishing Settings',
        description: 'Connect social media platforms, configure webhooks, and manage publishing credentials'
    },
    {
        href: '/settings/twitter-bot',
        icon: Bot,
        title: 'Twitter Bot',
        description: 'Automated Twitter posting with AI-generated content and scheduling'
    }
]

export default function SettingsPage() {
    const [config, setConfig] = useState<LLMConfig>({
        provider: 'openai',
        apiKey: '',
        model: 'gpt-4o-mini'
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState<'success' | 'error'>('success')
    const [prompt, setPrompt] = useState('Write a short haiku about content strategies.')
    const [running, setRunning] = useState(false)
    const toast = useToast()

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const response = await fetch('/api/settings/llm')
            if (response.ok) {
                const data = await response.json()
                setConfig(data)
            }
        } catch (error) {
            console.error('Failed to load LLM config:', error)
        }
    }

    const saveConfig = async () => {
        setSaving(true)
        setMessage('')

        try {
            const response = await fetch('/api/settings/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            if (response.ok) {
                setMessage('Settings saved successfully!')
                setMessageType('success')
                toast.success('Settings saved successfully!')
            } else {
                const error = await response.json()
                setMessage(`Error: ${error.error}`)
                setMessageType('error')
                toast.error('Failed to save settings', error.error)
            }
        } catch (error) {
            setMessage('Failed to save settings')
            setMessageType('error')
            toast.error('Failed to save settings')
        }

        setSaving(false)
    }

    const updateConfig = (updates: Partial<LLMConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }))
    }

    const testConnection = async () => {
        setSaving(true)
        setMessage('')

        try {
            const response = await fetch('/api/settings/llm/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            if (response.ok) {
                const result = await response.json()
                setMessage(`${result.provider} connected successfully!`)
                setMessageType('success')
                toast.success(`${result.provider} connected successfully!`)
            } else {
                const error = await response.json()
                setMessage(`Connection failed: ${error.error}`)
                setMessageType('error')
                toast.error('Connection failed', error.error)
            }
        } catch (error) {
            setMessage('Connection test failed')
            setMessageType('error')
            toast.error('Connection test failed')
        }

        setSaving(false)
    }

    const runPrompt = async () => {
        setRunning(true)
        setMessage('')
        try {
            const res = await fetch('/api/settings/llm/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Run failed')
            setMessage(`Output (model: ${data.model}):\n\n${data.output}`)
            setMessageType('success')
        } catch (e: any) {
            setMessage(e.message)
            setMessageType('error')
        } finally {
            setRunning(false)
        }
    }

    const providerOptions = Object.entries(LLM_PROVIDERS).map(([key, provider]) => ({
        value: key,
        label: provider.name
    }))

    const modelOptions = LLM_PROVIDERS[config.provider].models.map(model => ({
        value: model,
        label: model
    }))

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <DashboardHero
                title="Settings"
                description="Configure AI providers, publishing platforms, and automation settings"
            />

            {/* Quick Navigation */}
            <Section>
                <Grid cols={2}>
                    {settingsLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <Link key={link.href} href={link.href}>
                                <SubCard className="group h-full cursor-pointer rounded-2xl bg-slate-900/70 border border-slate-800 p-6 transition-all hover:shadow-md hover:ring-2 hover:ring-indigo-500/20 hover:bg-slate-800">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-50">{link.title}</h3>
                                            <p className="mt-1 text-sm text-slate-400">{link.description}</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </SubCard>
                            </Link>
                        )
                    })}
                </Grid>
            </Section>

            {/* LLM Configuration */}
            <Section>
                <Card className="bg-slate-900/70 border border-slate-800 rounded-3xl">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 ring-1 ring-violet-500/30">
                                <Zap className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white">LLM Configuration</CardTitle>
                                <CardDescription className="text-slate-400">Configure your AI provider and model settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <Grid cols={2} className="mb-6">
                        <Select
                            label="AI Provider"
                            value={config.provider}
                            onChange={(e) => updateConfig({
                                provider: e.target.value as any,
                                model: LLM_PROVIDERS[e.target.value as keyof typeof LLM_PROVIDERS].defaultModel
                            })}
                            options={providerOptions}
                        />
                        <Select
                            label="Model"
                            value={config.model}
                            onChange={(e) => updateConfig({ model: e.target.value })}
                            options={modelOptions}
                        />
                    </Grid>

                    <div className="mb-6">
                        <Input
                            label={`API Key (${LLM_PROVIDERS[config.provider].name})`}
                            type="password"
                            value={config.apiKey}
                            onChange={(e) => updateConfig({ apiKey: e.target.value })}
                            placeholder={`Enter your ${LLM_PROVIDERS[config.provider].name} API key`}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            🔒 Your API key is stored locally and never sent to our servers
                        </p>
                    </div>

                    {/* Custom Base URL */}
                    {['deepseek', 'gemini', 'grok'].includes(config.provider) && (
                        <div className="mb-6">
                            <Input
                                label="Base URL"
                                value={config.baseUrl || (LLM_PROVIDERS[config.provider] as any).baseUrl}
                                onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mb-6 flex flex-wrap gap-3">
                        <PrimaryButton onClick={saveConfig} disabled={saving} className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316]">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </PrimaryButton>
                        <PrimaryButton onClick={testConnection} disabled={saving || !config.apiKey} variant="secondary">
                            <TestTube className="mr-2 h-4 w-4" />
                            Test Connection
                        </PrimaryButton>
                        <PrimaryButton onClick={runPrompt} disabled={running} variant="secondary">
                            <Play className="mr-2 h-4 w-4" />
                            {running ? 'Running...' : 'Run Prompt'}
                        </PrimaryButton>
                    </div>

                    {/* Test Prompt */}
                    <div className="mb-6">
                        <Textarea
                            label="Test Prompt (uses saved provider & model)"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Status Message */}
                    {message && (
                        <Alert
                            type={messageType}
                            message={message}
                            onClose={() => setMessage('')}
                        />
                    )}

                    {/* Provider Info */}
                    <SubCard className="rounded-2xl bg-slate-800/50 border-slate-700">
                        <h4 className="mb-2 font-semibold text-slate-50">
                            About {LLM_PROVIDERS[config.provider].name}
                        </h4>
                        <p className="text-sm text-slate-400">
                            {LLM_PROVIDERS[config.provider].description}
                        </p>
                    </SubCard>
                </Card>
            </Section>
        </div>
    )
}
