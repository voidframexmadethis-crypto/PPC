import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  format, subDays, isAfter, parseISO, startOfToday, startOfDay, subMonths, isWithinInterval
} from 'date-fns';
import { 
  TrendingUp, TrendingDown, DollarSign, Play, Download, Heart, Users, Activity,
  Calendar, ChevronDown, CheckCircle2, AlertCircle, Clock, Music, Eye
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { Beat } from '../../types';

export function AnalyticsDashboard() {
  const { state } = useStore();
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days' | '90days' | 'all'>('7days');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [activeMetric, setActiveMetric] = useState<'PLAY' | 'VIEW' | 'DOWNLOAD' | 'PURCHASE'>('PLAY');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Fetch all events for simplicity, but in a real app we'd paginate or filter by date on the server
        const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() || new Date() }));
        setEvents(data);
      } catch (err) {
        console.error("Failed to load analytics events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case 'today': startDate = startOfToday(); break;
      case 'yesterday': startDate = subDays(startOfToday(), 1); break;
      case '7days': startDate = subDays(now, 7); break;
      case '30days': startDate = subDays(now, 30); break;
      case '90days': startDate = subDays(now, 90); break;
      case 'all': default: startDate = new Date(0); break;
    }
    
    // For yesterday, we want ONLY yesterday
    if (dateRange === 'yesterday') {
      return events.filter(e => isWithinInterval(e.timestamp, { start: startDate, end: startOfToday() }));
    }
    
    return events.filter(e => isAfter(e.timestamp, startDate));
  }, [events, dateRange]);

  // Aggregate stats
  const totalPlays = filteredEvents.filter(e => e.eventType === 'PLAY').length;
  const totalViews = filteredEvents.filter(e => e.eventType === 'VIEW').length;
  const totalDownloads = filteredEvents.filter(e => e.eventType === 'DOWNLOAD').length;
  const purchaseEvents = filteredEvents.filter(e => e.eventType === 'PURCHASE');
  const totalPurchases = purchaseEvents.length;
  const totalRevenue = purchaseEvents.reduce((sum, e) => sum + (e.metadata?.price || 0), 0);

  // Time-series formatting
  const chartData = useMemo(() => {
    const dataMap: Record<string, { date: string, PLAY: number, VIEW: number, DOWNLOAD: number, PURCHASE: number, revenue: number }> = {};
    
    // Initialize dates based on range
    const daysToMap = dateRange === 'today' || dateRange === 'yesterday' ? 24 : dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 30;
    const isHourly = dateRange === 'today' || dateRange === 'yesterday';
    
    const now = new Date();
    for (let i = daysToMap - 1; i >= 0; i--) {
      let key = '';
      if (isHourly) {
        // Build hours
        const d = new Date(dateRange === 'yesterday' ? subDays(startOfToday(), 1) : startOfToday());
        d.setHours(d.getHours() + i);
        key = format(d, 'ha'); // 1AM, 2PM
      } else {
        key = format(subDays(now, i), 'MMM d');
      }
      dataMap[key] = { date: key, PLAY: 0, VIEW: 0, DOWNLOAD: 0, PURCHASE: 0, revenue: 0 };
    }

    filteredEvents.forEach(e => {
      const key = isHourly ? format(e.timestamp, 'ha') : format(e.timestamp, 'MMM d');
      if (dataMap[key]) {
        if (e.eventType === 'PLAY') dataMap[key].PLAY++;
        if (e.eventType === 'VIEW') dataMap[key].VIEW++;
        if (e.eventType === 'DOWNLOAD') dataMap[key].DOWNLOAD++;
        if (e.eventType === 'PURCHASE') {
          dataMap[key].PURCHASE++;
          dataMap[key].revenue += (e.metadata?.price || 0);
        }
      }
    });

    return Object.values(dataMap);
  }, [filteredEvents, dateRange]);

  // Top Beats
  const topBeats = useMemo(() => {
    const beatMap: Record<string, { plays: number, views: number, purchases: number, revenue: number, downloads: number }> = {};
    filteredEvents.forEach(e => {
      if (!e.trackId) return;
      if (!beatMap[e.trackId]) beatMap[e.trackId] = { plays: 0, views: 0, purchases: 0, revenue: 0, downloads: 0 };
      
      if (e.eventType === 'PLAY') beatMap[e.trackId].plays++;
      if (e.eventType === 'VIEW') beatMap[e.trackId].views++;
      if (e.eventType === 'DOWNLOAD') beatMap[e.trackId].downloads++;
      if (e.eventType === 'PURCHASE') {
        beatMap[e.trackId].purchases++;
        beatMap[e.trackId].revenue += (e.metadata?.price || 0);
      }
    });

    return Object.entries(beatMap)
      .map(([id, stats]) => {
        const beat = state.beats.find(b => b.id === id);
        return { id, title: beat?.title || 'Unknown Beat', cover: beat?.coverArt || '', ...stats };
      })
      .sort((a, b) => {
        if (activeMetric === 'PURCHASE') return b.revenue - a.revenue;
        return b[activeMetric.toLowerCase() as 'plays'|'views'|'downloads'] - a[activeMetric.toLowerCase() as 'plays'|'views'|'downloads'];
      })
      .slice(0, 5);
  }, [filteredEvents, state.beats, activeMetric]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];
  const pieData = topBeats.map(b => ({ name: b.title, value: activeMetric === 'PURCHASE' ? b.revenue : b[activeMetric.toLowerCase() as 'plays'|'views'|'downloads'] }));

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-neutral-400">Loading Professional Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-neutral-900">
        {[
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: '7days', label: 'Last 7 Days' },
          { id: '30days', label: 'Last 30 Days' },
          { id: '90days', label: 'Last 90 Days' },
          { id: 'all', label: 'All Time' },
        ].map(range => (
          <button
            key={range.id}
            onClick={() => setDateRange(range.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              dateRange === range.id
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Plays', value: totalPlays, icon: Play, color: 'text-indigo-400' },
          { label: 'Views', value: totalViews, icon: Eye, color: 'text-blue-400' },
          { label: 'Downloads', value: totalDownloads, icon: Download, color: 'text-emerald-400' },
          { label: 'Sales', value: totalPurchases, icon: Activity, color: 'text-fuchsia-400' },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl bg-neutral-950 border border-neutral-800 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-neutral-400">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white">Engagement Over Time</h3>
            <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['PLAY', 'VIEW', 'DOWNLOAD', 'PURCHASE'] as const).map(metric => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMetric === metric
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 w-full">
            {chartData.some(d => d[activeMetric] > 0 || (activeMetric === 'PURCHASE' && d.revenue > 0)) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#525252" 
                    tick={{fill: '#737373', fontSize: 12}} 
                    tickMargin={10} 
                  />
                  <YAxis 
                    stroke="#525252" 
                    tick={{fill: '#737373', fontSize: 12}}
                    tickFormatter={(val) => activeMetric === 'PURCHASE' ? `$${val}` : val} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#e5e5e5' }}
                    formatter={(value: number) => [activeMetric === 'PURCHASE' ? `$${value.toFixed(2)}` : value, activeMetric]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric === 'PURCHASE' ? 'revenue' : activeMetric} 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                <Activity className="w-8 h-8 opacity-20" />
                <p>No {activeMetric.toLowerCase()} data for this period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Funnel & Pie Chart */}
        <div className="space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-wider">Top Contributors</h3>
            {pieData.some(d => d.value > 0) ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                      itemStyle={{ color: '#e5e5e5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-neutral-500">Not enough data.</div>
            )}
            <div className="space-y-2 mt-4">
              {topBeats.map((beat, i) => (
                <div key={beat.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-neutral-300 truncate max-w-[120px]">{beat.title}</span>
                  </div>
                  <span className="text-white font-medium text-xs">
                    {activeMetric === 'PURCHASE' ? `$${beat.revenue.toFixed(2)}` : beat[activeMetric.toLowerCase() as 'plays'|'views'|'downloads']}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Beats Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Popular Beats</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <th className="pb-4 font-medium">Beat</th>
                <th className="pb-4 font-medium text-right">Plays</th>
                <th className="pb-4 font-medium text-right">Views</th>
                <th className="pb-4 font-medium text-right">Downloads</th>
                <th className="pb-4 font-medium text-right">Purchases</th>
                <th className="pb-4 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {topBeats.map((beat) => (
                <tr key={beat.id} className="group hover:bg-neutral-900/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {beat.cover ? (
                        <img src={beat.cover} alt={beat.title} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                          <Music className="w-4 h-4 text-neutral-500" />
                        </div>
                      )}
                      <span className="font-bold text-neutral-200">{beat.title}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-neutral-400 font-medium">{beat.plays}</td>
                  <td className="py-4 text-right text-neutral-400 font-medium">{beat.views}</td>
                  <td className="py-4 text-right text-neutral-400 font-medium">{beat.downloads}</td>
                  <td className="py-4 text-right text-neutral-400 font-medium">{beat.purchases}</td>
                  <td className="py-4 text-right text-indigo-400 font-bold">${beat.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {topBeats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No activity recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
