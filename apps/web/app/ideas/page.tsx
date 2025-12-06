'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Sparkles, ArrowLeft, Trash2, CheckCircle, AlertCircle, Tag, Edit } from 'lucide-react';
import { useToast, EmptyState, SkeletonList, Badge, ConfirmModal } from '../components/ui';

// API URL - backend running on port 3001
const API_URL = 'http://localhost:3001';

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
    const toast = useToast();
    
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
            const ideasArray = Array.isArray(data) ? data : (data?.ideas || data?.data || []);
            setIdeas(ideasArray);
            setSelectedCount(ideasArray.filter((i: any) => i.status === 'selected').length);
        } catch (error: any) {
            console.error('Error loading ideas:', error);
            setIdeas([]);
            setSelectedCount(0);
        } finally {
            setInitialLoading(false);
        }
    }

    async function gen() {
        if (!persona.trim() || !industry.trim()) {
            setError('Please fill in both Persona and Industry fields');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Health check
            try {
                const healthCheck = await fetch(`${API_URL}/api/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                if (!healthCheck.ok) throw new Error(`Backend health check failed: ${healthCheck.status}`);
            } catch (healthError: any) {
                console.error('[Ideas] Backend health check failed:', healthError);
                throw new Error(`Cannot connect to backend server at ${API_URL}. Please ensure the API server is running on port 3001.`);
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
                language: language,
                    corpus_hints: corpusHints.trim(),
                    count: count,
                    temperature: temperature
                }),
                signal: AbortSignal.timeout(120000)
        });
            
            if (!r.ok) {
                let errorMessage = `Server error: ${r.status} ${r.statusText}`;
                try {
                    const errorData = await r.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            const data = await r.json();
            const serverIdeas = Array.isArray(data.ideas) ? data.ideas : [];
            
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
            }));
            
            if (mappedIdeas.length > 0) {
                setIdeas(mappedIdeas);
                setSelectedCount(mappedIdeas.filter((i: any) => i.status === 'selected').length);
            } else {
                await load();
            }
            
            toast.success(`Successfully generated ${mappedIdeas.length || count} ideas!`);
            
        } catch (err: any) {
            console.error('[Ideas] Generation error:', err);
            let errorMessage = 'An error occurred while generating ideas';
            if (err.name === 'AbortError' || err.message?.includes('timeout')) {
                errorMessage = 'Request timed out. The AI generation is taking longer than expected. Please try again.';
            } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
                errorMessage = `Cannot connect to backend server at ${API_URL}. Please ensure:\n1. The API server is running on port 3001\n2. Check the browser console for more details`;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            toast.error('Failed to generate ideas', errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function selectIdea(ideaId: string) {
        if (!ideaId) return;
        setIdeas((prev) => prev.map((idea: any) => 
            (idea.idea_id === ideaId || idea.id === ideaId)
                ? { ...idea, status: 'selected' } 
                : idea
        ));
        setSelectedCount((prev) => prev + 1);
        try {
            await fetch(`${API_URL}/api/ideas/${ideaId}/select`, { 
                method: 'POST',
                headers: { 'x-user-id': 'demo-user', 'x-user-role': 'CL' }
            });
            toast.success('Idea selected successfully');
        } catch (err) {
            console.warn('Select API failed (ignored):', err);
            toast.error('Failed to select idea');
        }
    }

    const handleDeleteClick = (ideaId: string) => {
        setIdeaToDelete(ideaId);
        setDeleteModalOpen(true);
    };

    async function deleteIdea(ideaId: string) {
        if (!ideaId) return;
        setIdeas((prev) => prev.filter((i: any) => i.idea_id !== ideaId && i.id !== ideaId));
        try {
            const r = await fetch(`${API_URL}/api/ideas/${ideaId}`, { 
                method: 'DELETE',
                headers: { 'x-user-id': 'demo-user', 'x-user-role': 'CL' }
            });
            if (!r.ok) {
                toast.error('Failed to delete idea');
                return;
            }
            toast.success('Idea deleted successfully');
        } catch (err) {
            console.warn('Delete request error (ignored):', err);
            toast.error('Failed to delete idea');
        }
    }

    async function updateTags(ideaId: string, tagsString: string) {
        if (!ideaId) return;
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
        setIdeas((prev) => prev.map((idea: any) => 
            (idea.idea_id === ideaId || idea.id === ideaId)
                ? { ...idea, tags: tags } 
                : idea
        ));
        setEditingTags({ ...editingTags, [ideaId]: '' });
        try {
            await fetch(`${API_URL}/api/ideas/${ideaId}/tags`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user',
                    'x-user-role': 'CL'
                },
                body: JSON.stringify({ tags })
            });
            toast.success('Tags updated successfully');
        } catch (err) {
            console.warn('Update tags API failed (ignored):', err);
            toast.error('Failed to update tags');
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <main className="max-w-5xl mx-auto p-8 bg-gray-50 min-h-screen">
        {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-600">
                        <ArrowLeft size={20} />
            </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content Ideas</h1>
                        <p className="text-gray-500 mt-1">Generate and manage your content strategy</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-900">{ideas.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-medium">Total</span>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-bold text-blue-600">{selectedCount}</span>
                        <span className="text-xs text-blue-600 uppercase font-medium">Selected</span>
        </div>
            </div>
        </div>

        {/* Generate Ideas Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Sparkles className="text-emerald-600" size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Generate New Ideas</h2>
                </div>

            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Target Audience (Persona) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                            placeholder="e.g., Marketing Manager at B2B SaaS"
                        disabled={loading}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                    />
                </div>
                
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Industry / Niche <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g., SaaS, Fintech, Healthcare"
                        disabled={loading}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                    />
                </div>
                
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Topic Hints / Keywords (Optional)
                    </label>
            <input
                type="text"
                        value={corpusHints}
                        onChange={(e) => setCorpusHints(e.target.value)}
                            placeholder="e.g., AI automation, remote work trends, productivity hacks"
                        disabled={loading}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-700">Quantity</label>
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 rounded">{count}</span>
                </div>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            disabled={loading}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-700">Creativity</label>
                            <span className="text-sm text-gray-500">
                                {temperature < 0.5 ? 'Conservative' : temperature < 0.9 ? 'Balanced' : 'Creative'}
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                    </div>
                </div>
                
                <button
                    onClick={gen}
                    disabled={loading || !persona.trim() || !industry.trim()}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2
                        ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : (!persona.trim() || !industry.trim())
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-md active:scale-[0.99]'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            <span>Generate Ideas</span>
                        </>
                    )}
                </button>
        </div>

            {/* Loading State */}
            {initialLoading && (
                <SkeletonList type="ideas" count={6} />
            )}

            {/* Empty State */}
            {!initialLoading && ideas.length === 0 && (
                <EmptyState
                    icon={Sparkles}
                    title="No Ideas Yet"
                    description="Generate your first content ideas by filling in the form above. Ideas will help you create engaging content for your audience."
                    actionLabel="Generate Ideas"
                    onAction={() => {
                        document.querySelector('button[onClick]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                />
            )}

            {/* Ideas List - Table */}
            {!initialLoading && ideas.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Generated Results
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{ideas.length}</span>
                    </h2>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Scores</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Tags</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {ideas.map((i, idx) => (
                                        <tr key={i.idea_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                #{idx + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-xs">
                                                <div className="line-clamp-2">{i.one_liner}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                                                <div className="line-clamp-2">{i.angle || i.description || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge 
                                                    status={i.status === 'selected' ? 'approved' : i.status === 'draft' ? 'draft' : 'review'}
                                                >
                                                    {i.status === 'selected' ? '⭐ Selected' : i.status === 'draft' ? '📝 Draft' : i.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500">Novelty</span>
                                                        <span className="font-bold text-gray-900">{i.scores?.novelty || 0}/5</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500">Demand</span>
                                                        <span className="font-bold text-gray-900">{i.scores?.demand || 0}/5</span>
                            </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500">Fit</span>
                                                        <span className="font-bold text-gray-900">{i.scores?.fit || 0}/5</span>
                            </div>
                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                {i.tags && i.tags.length > 0 ? (
                                                        i.tags.map((tag: string, tIdx: number) => (
                                                            <span key={tIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                                                #{tag}
                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            // Edit functionality - có thể mở modal hoặc chuyển sang edit mode
                                                            const newTitle = prompt('Edit title:', i.one_liner);
                                                            if (newTitle && newTitle.trim()) {
                                                                setIdeas((prev) => prev.map((idea: any) =>
                                                                    (idea.idea_id === i.idea_id || idea.id === i.idea_id)
                                                                        ? { ...idea, one_liner: newTitle.trim() }
                                                                        : idea
                                                                ));
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Idea"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(i.idea_id || i.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Idea"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </div>
            </div>
        )}

            {/* Next Steps CTA */}
        {selectedCount > 0 && (
                <div className="fixed bottom-8 right-8 max-w-sm bg-white border border-blue-200 shadow-xl rounded-xl p-6 animate-in slide-in-from-bottom-4 z-50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">Ready to Create?</h3>
                            <p className="text-sm text-gray-600 mb-3">You have selected {selectedCount} ideas. Turn them into detailed content briefs now.</p>
                            <Link href="/briefs" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                Create Briefs <ArrowLeft size={16} className="rotate-180" />
                            </Link>
                        </div>
                    </div>
            </div>
        )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setIdeaToDelete(null);
                }}
                onConfirm={() => {
                    if (ideaToDelete) {
                        deleteIdea(ideaToDelete);
                        setDeleteModalOpen(false);
                        setIdeaToDelete(null);
                    }
                }}
                title="Delete Idea"
                description="Are you sure you want to delete this idea? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="destructive"
            />
        </main>
    );
}
