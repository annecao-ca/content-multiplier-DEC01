/**
 * GENERATE IDEAS BUTTON COMPONENT
 * 
 * Button với form để generate ideas từ AI
 * 
 * Props:
 * - onGenerate: (params) => Promise<void> - Callback khi generate
 * - loading?: boolean - Loading state
 * - error?: string | null - Error message
 */

'use client';

import { useState } from 'react';

export interface GenerateIdeasParams {
    persona: string;
    industry: string;
    corpusHints?: string;
    count?: number;
    temperature?: number;
}

interface GenerateIdeasButtonProps {
    onGenerate: (params: GenerateIdeasParams) => Promise<void>;
    loading?: boolean;
    error?: string | null;
}

// Loading Spinner
function LoadingSpinner() {
    return (
        <div className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    );
}

export default function GenerateIdeasButton({ 
    onGenerate, 
    loading = false,
    error = null
}: GenerateIdeasButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [persona, setPersona] = useState('Marketing Manager at B2B SaaS');
    const [industry, setIndustry] = useState('SaaS');
    const [corpusHints, setCorpusHints] = useState('');
    const [count, setCount] = useState(10);
    const [temperature, setTemperature] = useState(0.8);
    
    const handleGenerate = async () => {
        if (!persona.trim() || !industry.trim()) {
            alert('Please fill in Persona and Industry');
            return;
        }
        
        await onGenerate({
            persona: persona.trim(),
            industry: industry.trim(),
            corpusHints: corpusHints.trim() || undefined,
            count,
            temperature
        });
        
        // Close modal after success
        if (!error) {
            setIsOpen(false);
        }
    };
    
    const getTemperatureLabel = (temp: number) => {
        if (temp < 0.5) return 'Conservative';
        if (temp < 0.9) return 'Balanced';
        return 'Creative';
    };
    
    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                    loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
                }`}
            >
                {loading ? (
                    <>
                        <LoadingSpinner />
                        Generating...
                    </>
                ) : (
                    <>
                        🚀 Generate Ideas
                    </>
                )}
            </button>
            
            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                🎨 Generate Content Ideas
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={loading}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                    <span className="text-2xl">❌</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-red-900">Error</p>
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Persona */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Persona (Target Audience) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={persona}
                                    onChange={(e) => setPersona(e.target.value)}
                                    placeholder="e.g., Marketing Manager at B2B SaaS"
                                    disabled={loading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            
                            {/* Industry */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Industry <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder="e.g., SaaS, E-commerce, Fintech"
                                    disabled={loading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            
                            {/* Corpus Hints */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Topic Hints (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={corpusHints}
                                    onChange={(e) => setCorpusHints(e.target.value)}
                                    placeholder="e.g., AI, automation, productivity"
                                    disabled={loading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Add keywords to guide AI (comma-separated)
                                </p>
                            </div>
                            
                            {/* Sliders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Count */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Number of Ideas: <span className="text-blue-600">{count}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="20"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                        disabled={loading}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>5</span>
                                        <span>20</span>
                                    </div>
                                </div>
                                
                                {/* Temperature */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Creativity: <span className="text-blue-600">{temperature.toFixed(1)}</span>
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({getTemperatureLabel(temperature)})
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(Number(e.target.value))}
                                        disabled={loading}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Factual</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Loading Message */}
                            {loading && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <p className="text-blue-900 font-medium">
                                        🤖 AI is generating {count} creative ideas...
                                    </p>
                                    <p className="text-blue-700 text-sm mt-1">
                                        This may take 5-15 seconds
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={loading || !persona.trim() || !industry.trim()}
                                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                                    loading || !persona.trim() || !industry.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner />
                                        Generating...
                                    </>
                                ) : (
                                    '🚀 Generate Ideas'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

