import React, { useState } from 'react';
import { Users, Search, Mail, Filter, Download, ArrowUpRight, ArrowDownRight, CreditCard, ShieldAlert } from 'lucide-react';

// Mocking Subscription Interface based on standard payment architecture
export interface AdminSubscription {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Canceled' | 'Past Due';
  type: 'Monthly VIP' | 'Annual Pro' | 'Beat Pass';
  startDate: string;
  renewalDate?: string;
  amount: number;
}

export const SubscriptionsModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Canceled'>('All');

  // Currently, the StoreContext only holds generic basic subscribers (notifyOnBeatDrop). 
  // For a robust subscription system, we fetch/map from Stripe/PayPal architecture.
  // Using placeholder records matching the database shape for real rendering until DB population.
  const [subscriptions] = useState<AdminSubscription[]>([]);

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const canceledCount = subscriptions.filter(s => s.status === 'Canceled').length;
  const totalCount = subscriptions.length;
  const newThisMonth = 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
              <p className="text-neutral-400 text-sm">Manage VIP members, recurring billing, and welcome sequences.</p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex items-center gap-3 w-full md:w-auto">
            <Mail className="text-neutral-500" size={20} />
            <div>
              <p className="text-xs font-bold text-neutral-300 uppercase">Welcome Email Sequence</p>
              <p className="text-[10px] text-amber-500 font-mono flex items-center gap-1"><ShieldAlert size={10} /> CONNECTION REQUIRED</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="text-xs text-neutral-400 uppercase font-bold mb-1">Total Subscribers</div>
            <div className="text-3xl font-extrabold text-white font-mono">{totalCount}</div>
          </div>
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="text-xs text-neutral-400 uppercase font-bold mb-1">Active Subscribers</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">{activeCount}</div>
          </div>
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="text-xs text-neutral-400 uppercase font-bold mb-1">Canceled Subscribers</div>
            <div className="text-3xl font-extrabold text-red-400 font-mono">{canceledCount}</div>
          </div>
          <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="text-xs text-neutral-400 uppercase font-bold mb-1">New This Month</div>
            <div className="text-3xl font-extrabold text-indigo-400 font-mono">{newThisMonth}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-neutral-950 border border-neutral-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Canceled">Canceled Only</option>
            </select>
            <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-900/50 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider">Subscriber</th>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider">Type / Amount</th>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider">Start Date</th>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider">Renewal Date</th>
                <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredSubs.length > 0 ? filteredSubs.map(sub => (
                <tr key={sub.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{sub.name}</div>
                    <div className="text-xs text-neutral-500">{sub.email}</div>
                    <div className="text-[10px] text-neutral-600 font-mono mt-0.5">{sub.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-neutral-300 font-medium">{sub.type}</div>
                    <div className="text-xs text-neutral-500">${sub.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{sub.startDate}</td>
                  <td className="px-6 py-4 text-neutral-400">{sub.renewalDate || '--'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded transition-colors">
                      Manage
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 italic">
                    No subscriptions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
