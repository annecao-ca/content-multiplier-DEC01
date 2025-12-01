/**
 * IDEA FORM COMPONENT
 * 
 * Form để người dùng nhập thông tin tạo ý tưởng mới
 * 
 * Props:
 * - onSubmit: (data) => void - Callback khi submit form
 * - loading?: boolean - Hiển thị loading state
 */

'use client';

import { useState } from 'react';

export interface IdeaFormData {
    title: string;
    description: string;
    persona: string;
    industry: string;
}

interface IdeaFormProps {
    onSubmit: (data: IdeaFormData) => void;
    loading?: boolean;
}

export default function IdeaForm({ onSubmit, loading = false }: IdeaFormProps) {
    const [formData, setFormData] = useState<IdeaFormData>({
        title: '',
        description: '',
        persona: '',
        industry: ''
    });
    
    const [errors, setErrors] = useState<Partial<Record<keyof IdeaFormData, string>>>({});
    
    // Validate form
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof IdeaFormData, string>> = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 10) {
            newErrors.title = 'Title must be at least 10 characters';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        }
        
        if (!formData.persona.trim()) {
            newErrors.persona = 'Persona is required';
        }
        
        if (!formData.industry.trim()) {
            newErrors.industry = 'Industry is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validate()) {
            onSubmit(formData);
            // Reset form
            setFormData({
                title: '',
                description: '',
                persona: '',
                industry: ''
            });
            setErrors({});
        }
    };
    
    // Update field
    const updateField = (field: keyof IdeaFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error khi user typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📝 Create New Idea
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="e.g., How AI Transforms Modern Marketing"
                        disabled={loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            errors.title ? 'border-red-500' : 'border-gray-300'
                        } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">❌ {errors.title}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
                </div>
                
                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Detailed explanation of your idea..."
                        disabled={loading}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600">❌ {errors.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Minimum 20 characters</p>
                </div>
                
                {/* Persona & Industry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Persona */}
                    <div>
                        <label htmlFor="persona" className="block text-sm font-semibold text-gray-700 mb-2">
                            Persona <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="persona"
                            type="text"
                            value={formData.persona}
                            onChange={(e) => updateField('persona', e.target.value)}
                            placeholder="e.g., Marketing Manager"
                            disabled={loading}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                errors.persona ? 'border-red-500' : 'border-gray-300'
                            } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {errors.persona && (
                            <p className="mt-1 text-sm text-red-600">❌ {errors.persona}</p>
                        )}
                    </div>
                    
                    {/* Industry */}
                    <div>
                        <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-2">
                            Industry <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="industry"
                            type="text"
                            value={formData.industry}
                            onChange={(e) => updateField('industry', e.target.value)}
                            placeholder="e.g., SaaS, E-commerce"
                            disabled={loading}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                errors.industry ? 'border-red-500' : 'border-gray-300'
                            } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {errors.industry && (
                            <p className="mt-1 text-sm text-red-600">❌ {errors.industry}</p>
                        )}
                    </div>
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                    }`}
                >
                    {loading ? '⏳ Saving...' : '💾 Create Idea'}
                </button>
            </form>
        </div>
    );
}

