/**
 * IDEAS DEMO PAGE
 * 
 * Trang demo đầy đủ với tất cả components:
 * - IdeaForm: Form tạo idea mới
 * - GenerateIdeasButton: Generate từ AI
 * - IdeaList: Hiển thị danh sách
 * - IdeaEmptyState: Empty state
 * - Toast: Notifications
 * 
 * Chạy tại: http://localhost:3000/ideas-demo
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import IdeaForm, { IdeaFormData } from '../../components/ideas/IdeaForm';
import GenerateIdeasButton, { GenerateIdeasParams } from '../../components/ideas/GenerateIdeasButton';
import IdeaList, { Idea } from '../../components/ideas/IdeaList';
import IdeaEmptyState from '../../components/ideas/IdeaEmptyState';
import { ToastContainer, useToast } from '../../components/ideas/Toast';

export default function IdeasDemoPage() {
    // State
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatingLoading, setGeneratingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    
    // Toast notifications
    const toast = useToast();
    
    // Load ideas from API
    const loadIdeas = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ideas');
            if (response.ok) {
                const data = await response.json();
                setIdeas(data.map((item: any) => ({
                    id: item.idea_id,
                    title: item.one_liner,
                    description: item.angle || 'No description',
                    persona: item.personas?.[0],
                    industry: 'N/A',
                    status: item.status,
                    scores: item.scores,
                    tags: item.tags,
                    created_at: item.created_at
                })));
            }
        } catch (err: any) {
            console.error('Failed to load ideas:', err);
        } finally {
            setLoading(false);
        }
    };
    
    // Create new idea manually
    const handleCreateIdea = async (formData: IdeaFormData) => {
        try {
            toast.info('Creating idea...');
            
            // Simulate API call (thay bằng real API)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newIdea: Idea = {
                id: `idea-${Date.now()}`,
                title: formData.title,
                description: formData.description,
                persona: formData.persona,
                industry: formData.industry,
                status: 'proposed',
                created_at: new Date().toISOString()
            };
            
            setIdeas(prev => [newIdea, ...prev]);
            setShowForm(false);
            
            toast.success('Idea created successfully! 🎉');
            
        } catch (err: any) {
            toast.error('Failed to create idea: ' + err.message);
        }
    };
    
    // Generate ideas from AI
    const handleGenerateIdeas = async (params: GenerateIdeasParams) => {
        setGeneratingLoading(true);
        setError(null);
        
        try {
            toast.info(`Generating ${params.count} ideas...`);
            
            const response = await fetch('/api/ideas/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user',
                    'x-user-role': 'CL'
                },
                body: JSON.stringify({
                    persona: params.persona,
                    industry: params.industry,
                    corpus_hints: params.corpusHints,
                    count: params.count,
                    temperature: params.temperature,
                    language: 'en'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate ideas');
            }
            
            // Reload ideas
            await loadIdeas();
            
            toast.success(`Successfully generated ${data.ideas?.length || params.count} ideas! 🎉`);
            
        } catch (err: any) {
            setError(err.message || 'Failed to generate ideas');
            toast.error(err.message || 'Failed to generate ideas');
        } finally {
            setGeneratingLoading(false);
        }
    };
    
    // Select idea
    const handleSelectIdea = async (id: string) => {
        try {
            const ideaId = ideas.find(i => i.id === id)?.id;
            if (!ideaId) return;
            
            await fetch(`/api/ideas/${ideaId}/select`, { 
                method: 'POST',
                headers: {
                    'x-user-id': 'demo-user',
                    'x-user-role': 'CL'
                }
            });
            
            await loadIdeas();
            toast.success('Idea selected! ⭐');
            
        } catch (err: any) {
            toast.error('Failed to select idea');
        }
    };
    
    // Delete idea
    const handleDeleteIdea = async (id: string) => {
        try {
            const ideaId = ideas.find(i => i.id === id)?.id;
            if (!ideaId) return;
            
            await fetch(`/api/ideas/${ideaId}`, { 
                method: 'DELETE',
                headers: {
                    'x-user-id': 'demo-user',
                    'x-user-role': 'CL'
                }
            });
            
            await loadIdeas();
            toast.success('Idea deleted');
            
        } catch (err: any) {
            toast.error('Failed to delete idea');
        }
    };
    
    // Load on mount
    useEffect(() => {
        loadIdeas();
    }, []);
    
    const selectedCount = ideas.filter(i => i.status === 'selected').length;
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Toast Container */}
            <ToastContainer toasts={toast.toasts} onClose={toast.hideToast} />
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/dashboard"
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                            >
                                ← Back
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    💡 Content Ideas
                                </h1>
                                <p className="text-gray-600 text-sm mt-1">
                                    Create and manage your content ideas
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <GenerateIdeasButton
                                onGenerate={handleGenerateIdeas}
                                loading={generatingLoading}
                                error={error}
                            />
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all"
                            >
                                ✏️ Create Manually
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Ideas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {ideas.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">💡</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Selected</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">
                                    {selectedCount}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Proposed</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">
                                    {ideas.filter(i => i.status === 'proposed').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Create Form (Collapsible) */}
                {showForm && (
                    <div className="mb-8 animate-fade-in">
                        <IdeaForm
                            onSubmit={handleCreateIdea}
                            loading={loading}
                        />
                    </div>
                )}
                
                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-600">Loading ideas...</p>
                    </div>
                )}
                
                {/* Empty State */}
                {!loading && ideas.length === 0 && (
                    <IdeaEmptyState
                        onGenerateClick={() => {
                            // Trigger generate button click
                            document.querySelector<HTMLButtonElement>('[data-generate-btn]')?.click();
                        }}
                    />
                )}
                
                {/* Ideas List */}
                {!loading && ideas.length > 0 && (
                    <IdeaList
                        ideas={ideas}
                        onSelect={handleSelectIdea}
                        onDelete={handleDeleteIdea}
                    />
                )}
                
                {/* Next Steps */}
                {selectedCount > 0 && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                            🎯 Next Steps
                        </h3>
                        <p className="text-blue-800 mb-4">
                            You have {selectedCount} selected idea{selectedCount > 1 ? 's' : ''} ready to develop!
                        </p>
                        <Link
                            href="/briefs"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                        >
                            Create Brief →
                        </Link>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

