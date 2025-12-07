import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const data = [
  { name: 'Mon', active: 40, ideas: 24 },
  { name: 'Tue', active: 30, ideas: 13 },
  { name: 'Wed', active: 20, ideas: 58 },
  { name: 'Thu', active: 27, ideas: 39 },
  { name: 'Fri', active: 18, ideas: 48 },
  { name: 'Sat', active: 23, ideas: 38 },
  { name: 'Sun', active: 34, ideas: 43 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome back, here is what's happening with your content.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Drafts', value: '12', icon: 'edit_document', color: 'bg-blue-500' },
          { label: 'Published (30d)', value: '45', icon: 'publish', color: 'bg-green-500' },
          { label: 'Generated Ideas', value: '128', icon: 'lightbulb', color: 'bg-amber-500' },
          { label: 'Pending Reviews', value: '5', icon: 'rate_review', color: 'bg-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
              <span className={`material-symbols-outlined text-${stat.color.replace('bg-', '')}`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Content Activity</h3>
            <select className="bg-slate-100 dark:bg-slate-900 border-none text-sm rounded-lg px-3 py-1 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ideas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Engagement Trends</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Average user interaction per post.</p>
          <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line type="monotone" dataKey="ideas" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { title: 'AI Marketing Trends', views: '2.4k', trend: '+12%' },
              { title: 'Top 10 Design Tools', views: '1.8k', trend: '+5%' },
              { title: 'Remote Work Guide', views: '1.2k', trend: '-2%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <span className="text-sm font-medium truncate max-w-[120px]">{item.title}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-slate-500">{item.views}</span>
                  <span className={item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};