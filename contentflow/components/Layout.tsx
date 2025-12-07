import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const navItems: { id: ViewState; icon: string; label: string }[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'ideas', icon: 'lightbulb', label: 'Idea Generation' },
    { id: 'packs', icon: 'inventory_2', label: 'Content Packs' },
    { id: 'briefs', icon: 'description', label: 'Create Brief' },
    { id: 'rules', icon: 'rule', label: 'Rule Engine' },
    { id: 'editor', icon: 'edit_document', label: 'Editor' },
  ];

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-[#111318] flex-shrink-0">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            CF
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight">ContentFlow</h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">Workspace</span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className={`material-symbols-outlined ${currentView === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
           <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
           <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50">
            <span className="material-symbols-outlined">help</span>
            Help Center
          </button>
          <div className="pt-4">
             <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 bg-cover bg-center" style={{ backgroundImage: 'url(https://picsum.photos/100)' }}></div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Alex Morgan</span>
                    <span className="text-xs text-slate-500">Pro Plan</span>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background-light dark:bg-background-dark relative">
        {children}
      </main>
    </div>
  );
};