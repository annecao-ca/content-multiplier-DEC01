import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="text-blue-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
                Fill in the form above and click "Generate Ideas" to get started with AI-powered content suggestions.
            </p>
        </div>
    );
}
