/**
 * IDEA LIST COMPONENT
 * 
 * Hiển thị bảng danh sách các ý tưởng
 * 
 * Props:
 * - ideas: Idea[] - Danh sách ý tưởng
 * - onSelect?: (id) => void - Callback khi select idea
 * - onDelete?: (id) => void - Callback khi delete idea
 */

'use client';

export interface Idea {
    id: string;
    title: string;
    description: string;
    persona?: string;
    industry?: string;
    status?: 'proposed' | 'selected' | 'discarded';
    scores?: {
        novelty?: number;
        demand?: number;
        fit?: number;
        white_space?: number;
    };
    tags?: string[];
    created_at?: string;
}

interface IdeaListProps {
    ideas: Idea[];
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function IdeaList({ ideas, onSelect, onDelete }: IdeaListProps) {
    if (ideas.length === 0) {
        return null;
    }
    
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'selected': return 'bg-green-100 text-green-800 border-green-300';
            case 'discarded': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };
    
    const getStatusText = (status?: string) => {
        switch (status) {
            case 'selected': return '✅ Selected';
            case 'discarded': return '❌ Discarded';
            default: return '💡 Proposed';
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    💡 Your Ideas ({ideas.length})
                </h2>
            </div>
            
            <div className="space-y-4">
                {ideas.map((idea, index) => (
                    <div
                        key={idea.id}
                        className={`border rounded-lg p-6 transition-all ${
                            idea.status === 'selected'
                                ? 'bg-green-50 border-green-200 shadow-md'
                                : 'bg-white border-gray-200 hover:shadow-md'
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gray-400 font-mono text-sm">
                                        #{index + 1}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {idea.title}
                                    </h3>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(idea.status)}`}>
                                {getStatusText(idea.status)}
                            </span>
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-700 mb-4 leading-relaxed">
                            {idea.description}
                        </p>
                        
                        {/* Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {idea.persona && (
                                <div className="text-sm">
                                    <span className="font-semibold text-gray-600">👤 Persona:</span>
                                    <span className="text-gray-800 ml-2">{idea.persona}</span>
                                </div>
                            )}
                            {idea.industry && (
                                <div className="text-sm">
                                    <span className="font-semibold text-gray-600">🏢 Industry:</span>
                                    <span className="text-gray-800 ml-2">{idea.industry}</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Scores */}
                        {idea.scores && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                {idea.scores.novelty !== undefined && (
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Novelty</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {idea.scores.novelty}/5
                                        </div>
                                    </div>
                                )}
                                {idea.scores.demand !== undefined && (
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Demand</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {idea.scores.demand}/5
                                        </div>
                                    </div>
                                )}
                                {idea.scores.fit !== undefined && (
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-600 mb-1">Fit</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {idea.scores.fit}/5
                                        </div>
                                    </div>
                                )}
                                {idea.scores.white_space !== undefined && (
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-600 mb-1">White Space</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {idea.scores.white_space}/5
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Tags */}
                        {idea.tags && idea.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {idea.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                            {onSelect && (
                                <button
                                    onClick={() => onSelect(idea.id)}
                                    disabled={idea.status === 'selected'}
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                                        idea.status === 'selected'
                                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                    }`}
                                >
                                    {idea.status === 'selected' ? '✅ Selected' : '⭐ Select'}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this idea? This cannot be undone.')) {
                                            onDelete(idea.id);
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 active:scale-95 transition-all"
                                >
                                    🗑️ Delete
                                </button>
                            )}
                        </div>
                        
                        {/* Created Date */}
                        {idea.created_at && (
                            <div className="mt-3 text-xs text-gray-500">
                                Created: {new Date(idea.created_at).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

