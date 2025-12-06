import React from 'react';
import { User, Briefcase, FileText } from 'lucide-react';

interface IdeaFormProps {
    persona: string;
    setPersona: (value: string) => void;
    industry: string;
    setIndustry: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    disabled?: boolean;
}

export default function IdeaForm({
    persona, setPersona,
    industry, setIndustry,
    description, setDescription,
    disabled
}: IdeaFormProps) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <FileText size={20} />
                </span>
                Project Details
            </h2>

            <div className="space-y-4">
                {/* Persona Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        Target Audience (Persona)
                    </label>
                    <input
                        type="text"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        placeholder="e.g. Marketing Manager, Startup Founder"
                        disabled={disabled}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                {/* Industry Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Briefcase size={16} className="text-gray-400" />
                        Industry / Niche
                    </label>
                    <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. SaaS, Fintech, Healthcare"
                        disabled={disabled}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                {/* Description/Context Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Additional Context (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Any specific topics or themes you want to focus on..."
                        disabled={disabled}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
