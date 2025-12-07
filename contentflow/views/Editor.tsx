import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export const Editor: React.FC = () => {
  const [content, setContent] = useState('# New Document\n\nStart writing your story here... Supports Markdown.');

  const toolbarItems = [
    { icon: 'format_h1', label: 'H1' },
    { icon: 'format_h2', label: 'H2' },
    { icon: 'format_bold', label: 'Bold' },
    { icon: 'format_italic', label: 'Italic' },
    { icon: 'format_strikethrough', label: 'Strike' },
    { icon: 'format_quote', label: 'Quote' },
    { icon: 'format_list_bulleted', label: 'List' },
    { icon: 'format_list_numbered', label: 'Ordered' },
    { icon: 'link', label: 'Link' },
    { icon: 'image', label: 'Image' },
    { icon: 'code', label: 'Code' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-surface-dark shrink-0">
         <div className="flex items-center gap-4">
             <div className="text-primary font-bold">CF</div>
             <h2 className="font-bold text-slate-900 dark:text-white">New Document</h2>
             <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="material-symbols-outlined text-sm">cloud_done</span> All changes saved
             </span>
         </div>
         <div className="flex items-center gap-3">
             <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><span className="material-symbols-outlined">settings</span></button>
             <button className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-blue-600 transition-colors">Publish</button>
         </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-1 bg-slate-50 dark:bg-background-dark shrink-0 overflow-x-auto">
         {toolbarItems.map((item, i) => (
            <button key={i} className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" title={item.label}>
               <span className="material-symbols-outlined text-lg">{item.icon}</span>
            </button>
         ))}
         <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>
         <button className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors ml-auto">
             <span className="material-symbols-outlined text-lg">fullscreen</span>
         </button>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex min-h-0">
         {/* Editor */}
         <div className="flex-1 flex flex-col min-w-0">
            <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
               className="flex-1 w-full resize-none bg-background-light dark:bg-background-dark text-slate-900 dark:text-white p-8 border-none focus:ring-0 font-mono text-base outline-none"
               placeholder="Start writing..."
            ></textarea>
         </div>

         {/* Resizer Mockup */}
         <div className="w-px bg-slate-200 dark:bg-slate-800 hover:bg-primary cursor-col-resize transition-colors"></div>

         {/* Preview */}
         <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-surface-dark overflow-y-auto">
            <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
               <ReactMarkdown>{content}</ReactMarkdown>
            </div>
         </div>
      </div>

      {/* Footer Stats */}
      <div className="h-10 border-t border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 text-xs font-medium text-slate-500 bg-white dark:bg-surface-dark shrink-0">
         <div className="flex items-center gap-2">
            <span>Word Count:</span>
            <span className="text-slate-900 dark:text-white">{content.split(/\s+/).filter(w => w.length > 0).length}</span>
         </div>
         <div className="w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
         <div className="flex items-center gap-2">
            <span>Reading Time:</span>
            <span className="text-slate-900 dark:text-white">{Math.ceil(content.split(/\s+/).filter(w => w.length > 0).length / 200)} min</span>
         </div>
      </div>
    </div>
  );
};