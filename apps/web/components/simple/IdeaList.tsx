import React from 'react';
import { Star, TrendingUp, Target, Zap } from 'lucide-react';

interface Idea {
    idea_id: string;
    one_liner: string;
    description: string;
    why_it_works: string;
    scores: {
        novelty: number;
        demand: number;
        fit: number;
    };
}

interface IdeaListProps {
    ideas: Idea[];
}

export default function IdeaList({ ideas }: IdeaListProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Generated Ideas
                <span className="bg-blue-100 text-blue-700 text-sm px-2.5 py-0.5 rounded-full font-medium">
                    {ideas.length}
                </span>
            </h2>

            <div className="grid gap-6">
                {ideas.map((idea, index) => (
                    <div
                        key={idea.idea_id || index}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 text-blue-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1">
                                {index + 1}
                            </div>

                            <div className="flex-1 space-y-3">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {idea.one_liner}
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    {idea.description}
                                </p>

                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 border border-gray-100">
                                    <strong className="text-gray-900 flex items-center gap-2 mb-1">
                                        <Zap size={14} className="text-amber-500" />
                                        Why it works:
                                    </strong>
                                    {idea.why_it_works}
                                </div>

                                {/* Scores */}
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <Star size={14} className="text-yellow-500" />
                                        Novelty: <span className="text-gray-900">{idea.scores?.novelty}/5</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <TrendingUp size={14} className="text-green-500" />
                                        Demand: <span className="text-gray-900">{idea.scores?.demand}/5</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <Target size={14} className="text-blue-500" />
                                        Fit: <span className="text-gray-900">{idea.scores?.fit}/5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
