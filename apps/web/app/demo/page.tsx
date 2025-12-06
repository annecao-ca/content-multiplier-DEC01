'use client';

import React, { useState } from 'react';
import IdeaForm from '../../components/simple/IdeaForm';
import IdeaList from '../../components/simple/IdeaList';
import GenerateIdeasButton from '../../components/simple/GenerateIdeasButton';
import EmptyState from '../../components/simple/EmptyState';
import Toast from '../../components/simple/Toast';
import { Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:3001';

export default function DemoPage() {
    // State for form inputs
    const [persona, setPersona] = useState('Marketing Manager');
    const [industry, setIndustry] = useState('SaaS');
    const [description, setDescription] = useState('');

    // State for data and loading
    const [ideas, setIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // State for notifications
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const generateIdeas = async () => {
        // Basic validation
        if (!persona.trim() || !industry.trim()) {
            setToast({ message: 'Please fill in both Persona and Industry fields.', type: 'error' });
            return;
        }

        setLoading(true);
        setToast(null);

        try {
            const response = await fetch(`${API_URL}/api/ideas/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user', // Mock user ID
                    'x-user-role': 'CL'
                },
                body: JSON.stringify({
                    persona,
                    industry,
                    corpus_hints: description,
                    count: 5 // Generate 5 ideas for this demo
                }),
                signal: AbortSignal.timeout(120000) // 2 minutes timeout
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to generate ideas');
            }

            const data = await response.json();

            // Handle different response structures if necessary
            const newIdeas = Array.isArray(data.ideas) ? data.ideas : [];

            setIdeas(newIdeas);
            setToast({ message: `Successfully generated ${newIdeas.length} ideas!`, type: 'success' });

        } catch (error: any) {
            console.error('Error:', error);
            setToast({ message: error.message || 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-4">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Idea Generator
                    </h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Generate high-quality content ideas tailored to your audience using AI.
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Input Section */}
                    <section className="space-y-6">
                        <IdeaForm
                            persona={persona}
                            setPersona={setPersona}
                            industry={industry}
                            setIndustry={setIndustry}
                            description={description}
                            setDescription={setDescription}
                            disabled={loading}
                        />

                        <GenerateIdeasButton
                            onClick={generateIdeas}
                            loading={loading}
                            disabled={!persona || !industry}
                        />
                    </section>

                    {/* Results Section */}
                    <section>
                        {ideas.length > 0 ? (
                            <IdeaList ideas={ideas} />
                        ) : (
                            <EmptyState />
                        )}
                    </section>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
}
