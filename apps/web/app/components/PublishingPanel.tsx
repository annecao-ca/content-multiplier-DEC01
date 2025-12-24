'use client'
import { useState, useEffect } from 'react'
import Button from './Button'

interface PublishingCredential {
    platform: string
    credential_type: string
    is_active: boolean
    expires_at?: string
    created_at: string
}

interface PublishingStatus {
    pack_status: {
        publishing_status?: string
        last_published_at?: string
        publishing_errors?: any
    }
    jobs: Array<{
        platform: string
        status: string
        external_url?: string
        published_at?: string
        error_message?: string
    }>
}

interface TwitterTemplate {
    template_id: string
    name: string
    prompt: string
    topics: string[]
    tone: string
    hashtags?: string[]
}

const PLATFORMS = [
    { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'sendgrid', name: 'SendGrid Email', icon: '📧' },
    { id: 'mailchimp', name: 'Mailchimp', icon: '📬' },
    { id: 'wordpress', name: 'WordPress', icon: '📝' },
    { id: 'medium', name: 'Medium', icon: '📖' }
]

import { API_URL } from '../lib/api-config'

export default function PublishingPanel({ packId }: { packId: string }) {
    const [credentials, setCredentials] = useState<PublishingCredential[]>([])
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [publishingStatus, setPublishingStatus] = useState<PublishingStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [showOAuthModal, setShowOAuthModal] = useState<string | null>(null)
    const [scheduledAt, setScheduledAt] = useState('')
    const [twitterTemplates, setTwitterTemplates] = useState<TwitterTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [generatedContent, setGeneratedContent] = useState<any>(null)
    const [showTwitterBot, setShowTwitterBot] = useState(false)
    const [generateLoading, setGenerateLoading] = useState(false)

    async function loadCredentials() {
        try {
            const res = await fetch(`${API_URL}/api/publishing/credentials`)
            const data = await res.json()
            if (data.ok) {
                setCredentials(data.credentials || [])
            }
        } catch (error) {
            console.error('Failed to load credentials:', error)
        }
    }

    async function loadPublishingStatus() {
        try {
            const res = await fetch(`${API_URL}/api/publishing/status/${packId}`)
            const data = await res.json()
            if (data.ok) {
                setPublishingStatus(data.status)
            }
        } catch (error) {
            console.error('Failed to load publishing status:', error)
        }
    }

    async function authenticatePlatform(platform: string) {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/api/publishing/auth/${platform}`)
            const data = await res.json()
            
            if (data.auth_url) {
                window.open(data.auth_url, '_blank', 'width=600,height=600')
                setShowOAuthModal(platform)
            } else if (data.already_configured) {
                alert(`✅ ${platform} is already configured and ready to use!`)
                await loadCredentials() // Refresh to show the platform as authenticated
            } else if (data.requires_api_key) {
                alert(`${platform} is configured with API key. If you see this message, the platform should be ready to use.`)
                await loadCredentials() // Refresh credentials
            } else {
                alert('Authentication failed: ' + (data.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Authentication error:', error)
            alert('Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    async function publishContent() {
        if (selectedPlatforms.length === 0) {
            alert('Please select at least one platform')
            return
        }

        try {
            setLoading(true)
            
            // Get pack content for publishing
            const packRes = await fetch(`${API_URL}/api/packs/${packId}`)
            const pack = await packRes.json()
            
            // Use generated content for Twitter if available
            const twitterContent = generatedContent && selectedPlatforms.includes('twitter') 
                ? {
                    text: generatedContent.text,
                    thread: generatedContent.thread || []
                }
                : {
                    text: pack.derivatives?.x?.[0] || pack.draft_markdown?.substring(0, 280)
                }

            const publishData = {
                pack_id: packId,
                platforms: selectedPlatforms,
                content: {
                    title: pack.seo?.title || 'Content Pack',
                    text: selectedPlatforms.includes('twitter') ? twitterContent.text : pack.derivatives?.x?.[0] || pack.draft_markdown?.substring(0, 280),
                    thread: selectedPlatforms.includes('twitter') ? twitterContent.thread : undefined,
                    content: pack.draft_markdown,
                    subject: pack.seo?.title || 'Newsletter from Content Multiplier',
                    html_content: pack.derivatives?.newsletter || pack.draft_markdown,
                    text_content: pack.draft_markdown,
                    from_email: 'fo.cuahang@gmail.com',
                    from_name: 'Content Multiplier'
                },
                scheduled_at: scheduledAt || undefined
            }

            const res = await fetch(`${API_URL}/api/publishing/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(publishData)
            })

            const data = await res.json()
            
            if (data.ok) {
                alert(scheduledAt ? 'Publishing scheduled successfully!' : 'Publishing started successfully!')
                await loadPublishingStatus()
            } else {
                alert('Publishing failed: ' + (data.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Publishing error:', error)
            alert('Publishing failed')
        } finally {
            setLoading(false)
        }
    }

    async function retryFailed() {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/api/publishing/retry/${packId}`, { method: 'POST' })
            const data = await res.json()
            
            if (data.ok) {
                alert('Retry started successfully!')
                await loadPublishingStatus()
            } else {
                alert('Retry failed: ' + (data.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Retry error:', error)
            alert('Retry failed')
        } finally {
            setLoading(false)
        }
    }

    async function loadTwitterTemplates() {
        try {
            const res = await fetch(`${API_URL}/api/twitter-bot/templates`)
            const data = await res.json()
            if (data.success) {
                setTwitterTemplates(data.data)
            }
        } catch (error) {
            console.error('Failed to load Twitter templates:', error)
        }
    }

    async function generateTwitterContent() {
        if (!selectedTemplate) {
            alert('Please select a template first')
            return
        }

        try {
            setGenerateLoading(true)
            
            // Get pack content for context
            const packRes = await fetch(`${API_URL}/api/packs/${packId}`)
            const pack = await packRes.json()
            
            const res = await fetch(`${API_URL}/api/twitter-bot/test-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedTemplate,
                    topic: pack.seo?.title || pack.idea_title || 'technology'
                })
            })
            
            const data = await res.json()
            if (data.success) {
                setGeneratedContent(data.data)
            } else {
                alert('Content generation failed: ' + data.error)
            }
        } catch (error) {
            console.error('Content generation error:', error)
            alert('Content generation failed')
        } finally {
            setGenerateLoading(false)
        }
    }

    async function useGeneratedContent() {
        if (!generatedContent) return
        
        // Update the selected platforms to include Twitter if not already selected
        if (!selectedPlatforms.includes('twitter')) {
            setSelectedPlatforms([...selectedPlatforms, 'twitter'])
        }
        
        // You could also update the pack content here or modify publishContent to use generated content
        alert('Generated content will be used for Twitter when publishing!')
    }

    useEffect(() => {
        loadCredentials()
        loadPublishingStatus()
        loadTwitterTemplates()
        
        // Check for OAuth completion
        const checkOAuth = () => {
            if (showOAuthModal) {
                loadCredentials()
                setShowOAuthModal(null)
            }
        }
        
        const interval = setInterval(checkOAuth, 2000)
        return () => clearInterval(interval)
    }, [showOAuthModal])

    const authenticatedPlatforms = credentials.filter(c => c.is_active).map(c => c.platform)
    const availablePlatforms = PLATFORMS.filter(p => authenticatedPlatforms.includes(p.id))

    return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 mt-8 shadow-sm">
            <h2 className="m-0 mb-4 text-xl font-semibold text-[hsl(var(--foreground))]">Publishing</h2>

            {/* Platform Authentication */}
            <div className="mb-8">
                <h3 className="m-0 mb-4 text-lg font-medium text-[hsl(var(--foreground))]">
                    Connect Platforms
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                    {PLATFORMS.map(platform => {
                        const isAuthenticated = authenticatedPlatforms.includes(platform.id)
                        return (
                            <div key={platform.id} className={`flex items-center justify-between p-2 border border-[hsl(var(--border))] rounded-lg transition-all duration-200 ${
                                isAuthenticated ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--secondary))]'
                            }`}>
                                <span className="text-sm text-[hsl(var(--foreground))]">
                                    {platform.icon} {platform.name}
                                </span>
                                {isAuthenticated ? (
                                    <span className="text-emerald-500 text-xs">✓</span>
                                ) : (
                                    <Button
                                        onClick={() => authenticatePlatform(platform.id)}
                                        disabled={loading}
                                        style={{ 
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.8rem',
                                            minHeight: 'auto'
                                        }}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Platform Selection */}
            {availablePlatforms.length > 0 && (
                <div className="mb-8">
                    <h3 className="m-0 mb-4 text-lg font-medium text-[hsl(var(--foreground))]">
                        Select Platforms to Publish
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                        {availablePlatforms.map(platform => (
                            <label key={platform.id} className={`flex items-center p-2 border border-[hsl(var(--border))] rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedPlatforms.includes(platform.id) 
                                    ? 'bg-[hsl(var(--primary))]/20 ring-1 ring-[hsl(var(--primary))]/30' 
                                    : 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--secondary))]'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={selectedPlatforms.includes(platform.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPlatforms([...selectedPlatforms, platform.id])
                                            // Show Twitter bot options when Twitter is selected
                                            if (platform.id === 'twitter') {
                                                setShowTwitterBot(true)
                                            }
                                        } else {
                                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id))
                                            // Hide Twitter bot options when Twitter is deselected
                                            if (platform.id === 'twitter') {
                                                setShowTwitterBot(false)
                                                setGeneratedContent(null)
                                            }
                                        }
                                    }}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>
                                    {platform.icon} {platform.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Twitter Bot Content Generation */}
            {showTwitterBot && selectedPlatforms.includes('twitter') && (
                <div style={{ 
                    marginBottom: '2rem',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    borderRadius: '12px',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#7dd3fc' }}>
                        🤖 AI-Generated Twitter Content
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                        Use the Twitter bot's AI templates to generate optimized content for your post.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#7dd3fc' }}>
                            Content Template
                        </label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                background: 'rgb(30, 41, 59)',
                                color: '#e2e8f0'
                            }}
                        >
                            <option value="">Select a template...</option>
                            {twitterTemplates.map(template => (
                                <option key={template.template_id} value={template.template_id}>
                                    {template.name} ({template.tone}) - {template.topics.join(', ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <Button
                            onClick={generateTwitterContent}
                            disabled={generateLoading || !selectedTemplate}
                            style={{
                                background: '#0ea5e9',
                                color: 'white',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            {generateLoading ? '🔄 Generating...' : '✨ Generate Content'}
                        </Button>
                    </div>

                    {generatedContent && (
                        <div style={{
                            background: 'rgb(30, 41, 59)',
                            border: '1px solid rgba(14, 165, 233, 0.3)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginTop: '1rem'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#7dd3fc' }}>Generated Tweet:</h4>
                            <p style={{ 
                                margin: '0 0 1rem 0', 
                                padding: '0.5rem',
                                background: 'rgb(15, 23, 42)',
                                border: '1px solid rgb(51, 65, 85)',
                                borderRadius: '6px',
                                fontStyle: 'italic',
                                color: '#e2e8f0'
                            }}>
                                "{generatedContent.text}"
                            </p>
                            
                            {generatedContent.thread && generatedContent.thread.length > 0 && (
                                <div>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#7dd3fc' }}>Thread:</h5>
                                    {generatedContent.thread.map((tweet: string, index: number) => (
                                        <p key={index} style={{
                                            margin: '0 0 0.5rem 0',
                                            padding: '0.5rem',
                                            background: 'rgb(15, 23, 42)',
                                            border: '1px solid rgb(51, 65, 85)',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            color: '#e2e8f0'
                                        }}>
                                            {index + 2}. "{tweet}"
                                        </p>
                                    ))}
                                </div>
                            )}

                            {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                                <div style={{ marginTop: '0.5rem', color: '#94a3b8' }}>
                                    <strong style={{ color: '#7dd3fc' }}>Suggested hashtags:</strong> {generatedContent.hashtags.join(' ')}
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#10b981' }}>
                                ✅ This content will be used when publishing to Twitter
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scheduling */}
            <div className="mb-8">
                <h3 className="m-0 mb-4 text-lg font-medium text-[hsl(var(--foreground))]">
                    Schedule Publishing (Optional)
                </h3>
                <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="p-2 border border-[hsl(var(--input-border))] rounded-lg text-sm bg-[hsl(var(--input))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:border-[hsl(var(--primary))] transition-all duration-200"
                />
            </div>

            {/* Publish Button */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <Button
                    onClick={publishContent}
                    disabled={loading || selectedPlatforms.length === 0}
                    style={{
                        background: '#059669',
                        color: 'white',
                        padding: '0.75rem 1.5rem'
                    }}
                >
                    {loading ? 'Publishing...' : (scheduledAt ? 'Schedule Publish' : 'Publish Now')}
                </Button>
                
                {publishingStatus?.jobs?.some(job => job.status === 'failed') && (
                    <Button
                        onClick={retryFailed}
                        disabled={loading}
                        variant="neutral"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        Retry Failed
                    </Button>
                )}
            </div>

            {/* Publishing Status */}
            {publishingStatus && (
                <div>
                    <h3 className="m-0 mb-4 text-lg font-medium text-[hsl(var(--foreground))]">
                        Publishing Status
                    </h3>
                    <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg p-4">
                        <p className="m-0 mb-2 text-[hsl(var(--foreground))]">
                            <strong>Overall Status:</strong> {publishingStatus.pack_status?.publishing_status || 'Not published'}
                        </p>
                        {publishingStatus.pack_status?.last_published_at && (
                            <p className="m-0 mb-4 text-[hsl(var(--muted-foreground))]">
                                <strong className="text-[hsl(var(--foreground))]">Last Published:</strong> {new Date(publishingStatus.pack_status.last_published_at).toLocaleString()}
                            </p>
                        )}
                        
                        {publishingStatus.jobs.length > 0 && (
                            <div>
                                <strong className="text-[hsl(var(--foreground))]">Platform Status:</strong>
                                <div className="mt-2 space-y-2">
                                    {publishingStatus.jobs.map((job, index) => (
                                        <div key={index} className={`flex justify-between items-center p-2 border border-[hsl(var(--border))] rounded-lg mb-2 transition-all duration-200 ${
                                            job.status === 'published' ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' :
                                            job.status === 'failed' ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-amber-500/10 ring-1 ring-amber-500/20'
                                        }`}>
                                            <span className="text-[hsl(var(--foreground))]">
                                                {PLATFORMS.find(p => p.id === job.platform)?.icon} {job.platform}
                                            </span>
                                            <div className="text-right">
                                                <div className={`font-bold text-sm ${
                                                    job.status === 'published' ? 'text-emerald-500' :
                                                    job.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                                                }`}>
                                                    {job.status}
                                                </div>
                                                {job.external_url && (
                                                    <a
                                                        href={job.external_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 text-xs no-underline hover:text-blue-300 transition-colors"
                                                    >
                                                        View Post →
                                                    </a>
                                                )}
                                                {job.error_message && (
                                                    <div className="text-red-400 text-xs mt-1">
                                                        {job.error_message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OAuth Modal */}
            {showOAuthModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'rgb(30, 41, 59)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        textAlign: 'center',
                        border: '1px solid rgb(51, 65, 85)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#f1f5f9' }}>Connecting to {showOAuthModal}</h3>
                        <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8' }}>
                            Please complete the authentication in the popup window.
                        </p>
                        <Button
                            onClick={() => setShowOAuthModal(null)}
                            variant="neutral"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}