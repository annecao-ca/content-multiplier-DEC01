/**
 * EMPTY STATE COMPONENT
 * 
 * Hiển thị khi chưa có ý tưởng nào
 * 
 * Props:
 * - onGenerateClick?: () => void - Callback khi click generate
 */

'use client';

interface IdeaEmptyStateProps {
    onGenerateClick?: () => void;
}

export default function IdeaEmptyState({ onGenerateClick }: IdeaEmptyStateProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 p-12 text-center">
            {/* Icon */}
            <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full">
                    <span className="text-5xl">💡</span>
                </div>
            </div>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                No Ideas Yet
            </h2>
            
            {/* Description */}
            <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Get started by generating AI-powered content ideas or create your own manually
            </p>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {onGenerateClick && (
                    <button
                        onClick={onGenerateClick}
                        className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">🚀</span>
                        Generate Ideas with AI
                    </button>
                )}
                
                <button
                    className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-xl">✏️</span>
                    Create Manually
                </button>
            </div>
            
            {/* Tips */}
            <div className="mt-8 pt-8 border-t border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    💡 Quick Tips:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="bg-white rounded-lg p-4">
                        <div className="font-semibold text-gray-900 mb-1">🎯 Be Specific</div>
                        <div>Define clear persona and industry for better results</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <div className="font-semibold text-gray-900 mb-1">🔥 Use Keywords</div>
                        <div>Add topic hints to guide AI generation</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <div className="font-semibold text-gray-900 mb-1">⚡ Adjust Creativity</div>
                        <div>Higher temperature = more creative ideas</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

