import React, { useState } from 'react';
import { generateContentIdeas } from '../services/geminiService';
import { Idea } from '../types';

export const IdeaGeneration: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('Blog Post');
  const [audience, setAudience] = useState('Professionals');
  const [loading, setLoading] = useState(false);
  
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      title: 'How AI is Reshaping the Content Creation Landscape',
      description: 'An in-depth blog post exploring tools, techniques, and ethics.',
      type: 'Blog Post',
      isAi: true,
      isNew: true
    },
    {
      title: 'Top 5 AI Video Generators for Marketers',
      description: 'Comparison of leading video creation platforms.',
      type: 'Video',
      isAi: true
    }
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    const newIdeas = await generateContentIdeas(topic, contentType, audience);
    setIdeas(prev => [...newIdeas.map(i => ({...i, isAi: true, isNew: true})), ...prev]);
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Idea Generation</h1>
        <p className="text-slate-500 dark:text-slate-400">Generate, capture, and manage your content ideas in one place.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-full sticky top-6">
            <h2 className="text-lg font-bold mb-6">Generate New Ideas</h2>
            <form onSubmit={handleGenerate} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Main Topic or Keyword</span>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-none"
                  placeholder="e.g. 'The future of remote work'"
                />
              </label>
              
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Content Type</span>
                <select 
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Blog Post</option>
                  <option>Video</option>
                  <option>Social Media</option>
                  <option>Newsletter</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                 <span className="text-sm font-medium">Target Audience</span>
                 <select 
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                 >
                    <option>Professionals</option>
                    <option>Beginners</option>
                    <option>Technical Experts</option>
                    <option>General Public</option>
                 </select>
              </label>

              <button 
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">auto_awesome</span>
                )}
                Generate Ideas
              </button>
            </form>
          </div>
        </div>

        {/* Ideas List */}
        <div className="lg:col-span-6 flex flex-col gap-4">
           <h2 className="text-lg font-bold">Generated Ideas</h2>
           
           <div className="flex gap-2 mb-2">
             <div className="relative flex-1">
               <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
               <input type="text" placeholder="Search ideas..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary" />
             </div>
             <select className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm">
               <option>Sort: Newest</option>
               <option>Sort: Relevance</option>
             </select>
           </div>

           <div className="flex flex-col gap-4">
             {ideas.map((idea, idx) => (
               <div key={idx} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-semibold text-base pr-4">{idea.title}</h3>
                   <div className="flex gap-2 flex-shrink-0">
                     {idea.isAi && (
                       <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300">AI-Generated</span>
                     )}
                     {idea.isNew && (
                       <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">New</span>
                     )}
                   </div>
                 </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{idea.description}</p>
                 <div className="flex items-center gap-2">
                   <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                     <span className="material-symbols-outlined text-sm">add_circle</span> Add to Planner
                   </button>
                   <button className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
                     Archive
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Web Inbox */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-full">
            <h2 className="text-lg font-bold mb-6">Web Monitor Inbox</h2>
            <div className="flex flex-col gap-4">
              {[
                { title: "Google announces new 'Project Astra' AI assistant", source: "techcrunch.com" },
                { title: "The rise of prompt engineering as a critical skill", source: "wired.com" },
                { title: "OpenAI showcases impressive new video generation model", source: "theverge.com" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">{item.title}</p>
                    <span className="text-xs text-slate-400 mt-1 block">{item.source}</span>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};