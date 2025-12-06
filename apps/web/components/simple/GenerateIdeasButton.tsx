import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateIdeasButtonProps {
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
}

export default function GenerateIdeasButton({ onClick, loading, disabled }: GenerateIdeasButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                flex items-center justify-center gap-2
                ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : disabled
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                }
            `}
        >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Generating Ideas...</span>
                </>
            ) : (
                <>
                    <Sparkles size={20} />
                    <span>Generate Ideas</span>
                </>
            )}
        </button>
    );
}
