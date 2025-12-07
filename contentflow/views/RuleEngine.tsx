import React, { useState } from 'react';

export const RuleEngine: React.FC = () => {
  const [activeRule, setActiveRule] = useState('Tech News Keyword Scan');
  
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <span>Dashboard</span>
        <span>/</span>
        <span>Settings</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">Rule Engine</span>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Workflow Rule Engine</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure rules to automate your content creation workflow.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rule List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Rules</h2>
            <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors">
              Add New Rule
            </button>
          </div>
          
          <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
             <input type="text" placeholder="Find a rule..." className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-surface-dark border-none rounded-lg text-sm focus:ring-2 focus:ring-primary" />
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
             {[
               { name: 'Tech News Keyword Scan', active: true, color: 'bg-primary' },
               { name: 'Assign Social Media Posts', active: false, color: 'bg-slate-600' },
               { name: 'High-Priority Topic Alert', active: true, color: 'bg-slate-600' },
             ].map((rule) => (
               <div 
                 key={rule.name} 
                 className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${activeRule === rule.name ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                 onClick={() => setActiveRule(rule.name)}
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${activeRule === rule.name ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                     <span className="material-symbols-outlined">rule</span>
                   </div>
                   <div>
                     <p className="font-medium text-sm leading-tight mb-1">{rule.name}</p>
                     <p className={`text-xs ${rule.active ? 'text-green-500' : 'text-slate-400'}`}>{rule.active ? 'Active' : 'Inactive'}</p>
                   </div>
                 </div>
                 <button className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Edit</button>
               </div>
             ))}
          </div>
        </div>

        {/* Config Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex justify-between items-center">
            <input 
              type="text" 
              value={activeRule} 
              onChange={(e) => setActiveRule(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white w-full"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Inactive</span>
              <button className="w-12 h-6 bg-green-500 rounded-full relative transition-colors">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>

          {/* IF Card */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4"><span className="text-slate-500 font-normal">IF</span> (Triggers)</h3>
            
            <div className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col gap-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm">
                    <option>Keyword</option>
                    <option>Source</option>
                  </select>
                  <select className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm">
                    <option>contains</option>
                    <option>is exactly</option>
                  </select>
                  <input type="text" defaultValue="AI, Machine Learning" className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm" />
               </div>
               <p className="text-xs text-slate-500">Use commas to separate multiple keywords.</p>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">AND</button>
              <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">OR</button>
            </div>
          </div>

           {/* THEN Card */}
           <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4"><span className="text-slate-500 font-normal">THEN</span> (Actions)</h3>
            
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm">
                    <option>Auto-trigger Idea</option>
                  </select>
                  <input type="text" defaultValue="Draft a blog post about the keyword" className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm" />
              </div>

               <div className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm">
                    <option>Add Tag</option>
                  </select>
                  <input type="text" defaultValue="Trending Tech" className="bg-white dark:bg-surface-dark border-none rounded-lg p-2 text-sm" />
              </div>
            </div>

            <button className="mt-4 flex items-center gap-2 text-primary font-medium text-sm hover:underline">
              <span className="material-symbols-outlined text-lg">add_circle</span> Add Action
            </button>
          </div>

          <div className="flex justify-end gap-3">
             <button className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
             <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors">Save Rule</button>
          </div>

        </div>
      </div>
    </div>
  );
};