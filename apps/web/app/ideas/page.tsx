'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '../components/Button';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useLanguage } from '../contexts/LanguageContext';

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001';

// Loading Spinner Component
function LoadingSpinner() {
    return (
        <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }}>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Form fields
    const [persona, setPersona] = useState('Marketing Manager at B2B SaaS');
    const [industry, setIndustry] = useState('SaaS');
    const [corpusHints, setCorpusHints] = useState('');
    const [count, setCount] = useState(10);
    const [temperature, setTemperature] = useState(0.8);
    
    const [selectedCount, setSelectedCount] = useState(0);
    const [editingTags, setEditingTags] = useState<{ [key: string]: string }>({});
    const { language } = useLanguage();

    async function load() {
        try {
            const r = await fetch(`${API_URL}/api/ideas`);
            if (!r.ok) {
                console.error('Failed to load ideas:', r.status, r.statusText);
                setIdeas([]);
                setSelectedCount(0);
                return;
            }
        const data = await r.json();
            // Ensure data is an array
            const ideasArray = Array.isArray(data) ? data : (data?.ideas || data?.data || []);
            setIdeas(ideasArray);
            setSelectedCount(ideasArray.filter((i: any) => i.status === 'selected').length);
        } catch (error: any) {
            console.error('Error loading ideas:', error);
            setIdeas([]);
            setSelectedCount(0);
        }
    }

    async function gen() {
        // Validate inputs
        if (!persona.trim() || !industry.trim()) {
            setError('Please fill in both Persona and Industry fields');
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
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
                language: language,
                    corpus_hints: corpusHints.trim(),
                    count: count,
                    temperature: temperature
            })
        });
            
            const data = await r.json();
            
            if (!r.ok) {
                throw new Error(data.error || 'Failed to generate ideas');
            }
            
            setSuccess(`Successfully generated ${data.ideas?.length || count} ideas!`);
            await load();
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
            
        } catch (err: any) {
            setError(err.message || 'An error occurred while generating ideas');
        } finally {
            setLoading(false);
        }
    }

    async function selectIdea(ideaId: string) {
        await fetch(`${API_URL}/api/ideas/${ideaId}/select`, { 
            method: 'POST',
            headers: {
                'x-user-id': 'demo-user',
                'x-user-role': 'CL'
            }
        });
        load();
    }

    async function deleteIdea(ideaId: string) {
        const ok = confirm('Delete this idea? This cannot be undone.')
        if (!ok) return
        const r = await fetch(`${API_URL}/api/ideas/${ideaId}`, { 
            method: 'DELETE',
            headers: {
                'x-user-id': 'demo-user',
                'x-user-role': 'CL'
            }
        })
        if (!r.ok) {
            const e = await r.json().catch(() => ({}))
            alert(e.error || 'Failed to delete idea')
            return
        }
        load()
    }

    async function updateTags(ideaId: string, tagsString: string) {
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
        await fetch(`${API_URL}/api/ideas/${ideaId}/tags`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-id': 'demo-user',
                'x-user-role': 'CL'
            },
            body: JSON.stringify({ tags })
        });
        load();
        setEditingTags({ ...editingTags, [ideaId]: '' });
    }

    useEffect(() => { load(); }, []);

    return <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            <Link href="/" style={{
                marginRight: '1rem',
                padding: '0.5rem 1rem',
                background: '#2d3748',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.2)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3b475e'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2d3748'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                ← Back
            </Link>
            <h1 style={{ margin: 0 }}>Content Ideas</h1>
        </div>

        {/* Stats */}
        <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            display: 'flex',
            gap: '2rem'
        }}>
            <div>
                <strong>{ideas.length}</strong> ideas total
            </div>
            <div>
                <strong>{selectedCount}</strong> selected
            </div>
        </div>

        {/* Generate Ideas Form */}
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1a202c' }}>
                🎨 Generate Content Ideas
            </h2>
            
            {/* Error Message */}
            {error && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>❌</span>
                    <div>
                        <strong>Error:</strong> {error}
                    </div>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            
            {/* Success Message */}
            {success && (
                <div style={{
                    background: '#d1fae5',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>✅</span>
                    <div>
                        <strong>Success!</strong> {success}
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            padding: '0.25rem'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            
            {/* Form Grid */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Persona */}
                <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        Persona (Target Audience) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        placeholder="e.g., Marketing Manager at B2B SaaS, Startup Founder"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'text'
                        }}
                    />
                </div>
                
                {/* Industry */}
                <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        Industry <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g., SaaS, E-commerce, Fintech, Healthcare"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'text'
                        }}
                    />
                </div>
                
                {/* Corpus Hints */}
                <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        Topic Hints (Optional)
                    </label>
            <input
                type="text"
                        value={corpusHints}
                        onChange={(e) => setCorpusHints(e.target.value)}
                        placeholder="e.g., AI, automation, productivity, remote work"
                        disabled={loading}
                style={{
                    width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                    borderRadius: '8px',
                            fontSize: '1rem',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'text'
                }}
            />
                    <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Add keywords to guide AI (comma-separated)
                    </div>
                </div>
                
                {/* Count & Temperature */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                            Number of Ideas: {count}
                        </label>
            <input
                            type="range"
                            min={5}
                max={20}
                value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            disabled={loading}
                            style={{
                                width: '100%',
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Recommended: 10 ideas
                        </div>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                            Creativity: {temperature.toFixed(1)} 
                            {temperature < 0.5 ? ' (Conservative)' : temperature < 0.9 ? ' (Balanced)' : ' (Creative)'}
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.1}
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            disabled={loading}
                style={{
                                width: '100%',
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            0 = Factual, 1 = Balanced, 2 = Very Creative
                        </div>
                    </div>
                </div>
                
                {/* Generate Button */}
                <button
                    onClick={gen}
                    disabled={loading || !persona.trim() || !industry.trim()}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: loading ? '#9ca3af' : (!persona.trim() || !industry.trim()) ? '#d1d5db' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : (!persona.trim() || !industry.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: loading ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading && persona.trim() && industry.trim()) {
                            e.currentTarget.style.background = '#059669';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading && persona.trim() && industry.trim()) {
                            e.currentTarget.style.background = '#10b981';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }
                    }}
                >
                    {loading ? (
                        <>
                            <LoadingSpinner />
                            Generating Ideas...
                        </>
                    ) : (
                        <>
                            🚀 Generate Ideas
                        </>
                    )}
                </button>
                
                {loading && (
                    <div style={{
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        padding: '0.5rem'
                    }}>
                        Please wait... AI is generating {count} creative ideas for you
                    </div>
                )}
        </div>
        </div>

        {/* Ideas List */}
        {ideas.length > 0 && (
            <div>
                <h2>Your Ideas</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {ideas.map(i => (
                        <div key={i.idea_id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            background: i.status === 'selected' ? '#e8f5e8' : 'white'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#333' }}>{i.one_liner}</h3>
                                <StatusBadge status={i.status} />
                            </div>

                            {i.angle && (
                                <p style={{ margin: '0.5rem 0', color: '#666' }}>
                                    <strong>Angle:</strong> {i.angle}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                                <div><strong>Novelty:</strong> {i.scores?.novelty}/5</div>
                                <div><strong>Demand:</strong> {i.scores?.demand}/5</div>
                                <div><strong>Fit:</strong> {i.scores?.fit}/5</div>
                            </div>

                            {i.personas && i.personas.length > 0 && (
                                <div style={{ margin: '0.5rem 0' }}>
                                    <strong>Audiences:</strong> {i.personas.join(', ')}
                                </div>
                            )}

                            {/* Tags Display/Edit */}
                            <div style={{ margin: '1rem 0' }}>
                                <strong>Tags:</strong>
                                {i.tags && i.tags.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {i.tags.map((tag: string, idx: number) => (
                                            <span key={idx} style={{
                                                background: '#e3f2fd',
                                                color: '#1976d2',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                border: '1px solid #90caf9'
                                            }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.9rem' }}>No tags</span>
                                )}
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Add tags (comma-separated)"
                                        value={editingTags[i.idea_id] || ''}
                                        onChange={(e) => setEditingTags({ ...editingTags, [i.idea_id]: e.target.value })}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <Button
                                        onClick={() => updateTags(i.idea_id, editingTags[i.idea_id] || '')}
                                        variant="neutral"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        Update Tags
                                    </Button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <Button onClick={() => selectIdea(i.idea_id)} disabled={i.status === 'selected'} variant={i.status === 'selected' ? 'success' : 'primary'}>
                                    {i.status === 'selected' ? '✅ Selected' : '⭐ Select'}
                                </Button>
                                <Button onClick={() => deleteIdea(i.idea_id)} variant='danger'>
                                    🗑️ Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Next Steps */}
        {selectedCount > 0 && (
            <div style={{
                background: '#e3f2fd',
                padding: '1.5rem',
                borderRadius: '8px',
                marginTop: '2rem',
                border: '1px solid #2196f3'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>🎯 Next Steps</h3>
                <p style={{ margin: '0.5rem 0' }}>
                    ✅ You have {selectedCount} selected idea{selectedCount > 1 ? 's' : ''} ready to develop!
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                    👉 <Link href="/briefs" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
                        Create a Brief →
                    </Link> to turn your selected ideas into detailed content plans
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                    💡 <Link href="/briefs" style={{ color: '#1976d2', textDecoration: 'none' }}>
                        Briefs
                    </Link> help you develop comprehensive content strategies with outlines, key points, and distribution plans
                </p>
            </div>
        )}

        {ideas.length === 0 && !loading && (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666'
            }}>
                <h2>🚀 Ready to Generate Ideas?</h2>
                <p>Click the button above to create your first 10 content ideas!</p>
            </div>
        )}
    </main>;
}
