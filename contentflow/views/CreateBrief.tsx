import React from 'react';

export const CreateBrief: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-background-light dark:bg-background-dark py-2">
         <div></div>
         <div className="flex gap-3">
           <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold text-sm transition-colors text-slate-700 dark:text-slate-200">Save Draft</button>
           <button className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors">Publish</button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        {/* Main Form */}
        <div className="flex-1 flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Create New Brief</h1>
            <p className="text-slate-500 dark:text-slate-400">Fill in the details below to structure your content plan.</p>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Core Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium mb-2">Title</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none" placeholder="The Ultimate Guide to Modern UI Design" />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2">Primary Keyword</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none" placeholder="UI Design Principles" />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2">Content Type</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none">
                    <option>Blog Post</option>
                    <option>Whitepaper</option>
                    <option>Case Study</option>
                 </select>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Content Details</h3>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Content Outline</label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-t-lg p-3 focus:ring-2 focus:ring-primary outline-none min-h-[200px]" placeholder="Provide a detailed structure..."></textarea>
                <div className="bg-slate-100 dark:bg-slate-800 border-x border-b border-slate-300 dark:border-slate-700 rounded-b-lg p-2 flex gap-1">
                   <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined text-lg">format_bold</span></button>
                   <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined text-lg">format_italic</span></button>
                   <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined text-lg">format_list_bulleted</span></button>
                   <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><span className="material-symbols-outlined text-lg">link</span></button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Attached Files</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                   <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                   <p className="text-sm"><span className="font-bold text-primary">Click to upload</span> or drag and drop</p>
                   <p className="text-xs mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
           <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-4">Status & Deadlines</h3>
              <div className="flex flex-col gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Status</label>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 text-sm font-bold">
                       <span className="w-2 h-2 rounded-full bg-amber-500"></span> Draft
                    </span>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Due Date</label>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-4">SEO Details</h3>
              <div className="flex flex-col gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Target Keywords</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                       <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Modern UI <button>✕</button></span>
                       <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Web Design <button>✕</button></span>
                       <input type="text" placeholder="Add tag..." className="bg-transparent border-none text-xs focus:ring-0 p-1 min-w-[60px]" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Meta Description</label>
                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none h-24 resize-none" placeholder="Enter meta description..."></textarea>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="font-bold mb-4">Checklist</h3>
              <div className="flex flex-col gap-2">
                 {['Add Call-to-Action (CTA)', 'Optimize Images', 'Proofread and Edit', 'Legal Review'].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm">
                       <input type="checkbox" defaultChecked={i < 2} className="rounded text-primary focus:ring-primary bg-slate-200 dark:bg-slate-700 border-none" />
                       <span className={i < 2 ? 'line-through text-slate-500' : ''}>{item}</span>
                    </label>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};