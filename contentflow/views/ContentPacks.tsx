import React from 'react';
import { Pack } from '../types';

export const ContentPacks: React.FC = () => {
  const packs: Pack[] = [
    { id: '1', name: 'The Future of AI in Marketing', status: 'Ready for Review', completedItems: 10, totalItems: 10, lastModified: '2 days ago' },
    { id: '2', name: 'Q3 Product Launch Campaign', status: 'Drafting', completedItems: 5, totalItems: 10, lastModified: '1 hour ago' },
    { id: '3', name: 'Sustainable Living Guide', status: 'Published', completedItems: 15, totalItems: 15, lastModified: '1 week ago' },
    { id: '4', name: 'Remote Work Best Practices', status: 'Error', completedItems: 3, totalItems: 5, lastModified: '3 days ago' },
  ];

  const getStatusColor = (status: Pack['status']) => {
    switch (status) {
      case 'Ready for Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'Drafting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
      case 'Published': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'Error': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getProgressColor = (status: Pack['status']) => {
     switch (status) {
      case 'Published': return 'bg-green-500';
      case 'Error': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Content Packs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and view the status of all your content.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
          <span className="material-symbols-outlined">add</span> Create New Pack
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center flex-wrap gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
          <input className="w-full bg-slate-100 dark:bg-background-dark border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary" placeholder="Search packs..." />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">filter_list</span> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined">swap_vert</span> Sort
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Pack Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Last Modified</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {packs.map((pack) => (
                <tr key={pack.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{pack.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(pack.status)}`}>
                      {pack.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getProgressColor(pack.status)}`} style={{ width: `${(pack.completedItems / pack.totalItems) * 100}%` }}></div>
                       </div>
                       <span className="text-xs text-slate-500 dark:text-slate-400">{pack.completedItems}/{pack.totalItems}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{pack.lastModified}</td>
                  <td className="px-6 py-4 text-right">
                    <a href="#" className="text-primary hover:underline font-medium">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-fit sticky top-6">
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Details: The Future of AI</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Target Keyword: AI Marketing Trends</p>

           <div className="flex gap-2 mb-6">
             <button className="flex-1 bg-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors">Review Content</button>
             <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Publish Pack</button>
           </div>

           <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Content Breakdown</h3>
              <ul className="space-y-3">
                 {[
                   { name: 'Blog Post: The Future of AI', status: 'Done' },
                   { name: 'Twitter Thread (5 tweets)', status: 'Done' },
                   { name: 'Hero Image', status: 'Done' },
                   { name: 'LinkedIn Article', status: 'Done' },
                 ].map((item, i) => (
                   <li key={i} className="flex justify-between items-center text-sm">
                     <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                     <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400">{item.status}</span>
                   </li>
                 ))}
              </ul>
           </div>

           <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Automation Workflow</h3>
              <div className="space-y-4">
                 <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                     <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs"><span className="material-symbols-outlined text-sm">check</span></div>
                     <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium">Drafting</h4>
                     <p className="text-xs text-slate-500">Completed</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                     <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
                     <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-primary">SEO Analysis</h4>
                     <p className="text-xs text-slate-500">In Progress</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                     <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-slate-500">Publishing</h4>
                     <p className="text-xs text-slate-500">Pending</p>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};