import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Lock, LayoutDashboard, Menu, Library, ShoppingCart, ShoppingBag, Settings, BarChart3, DollarSign, TrendingUp, PlayCircle, Share2, ThumbsUp, ThumbsDown, Music, UploadCloud, Download, Eye, Users, Mail, Bell, RefreshCw, Send, CheckCircle2, Volume2, Upload, LogOut, Disc, FileText, Trash2, Tag, Award, ShieldCheck, CreditCard, Video } from 'lucide-react';
import Uploader from './Uploader';
import BeatPackUploader from '../components/BeatPackUploader';
import { PlayerManagement } from '../components/admin/PlayerManagement';
import { FlashSaleStudio } from '../components/admin/FlashSaleStudio';
import { PushAlertsModule, ISRCModule, YouTubeManagerModule, PublishingModule, VaultsModule } from '../components/admin/RestoredAdminModules';
import { VideoAdMaker } from '../components/admin/VideoAdMaker';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { SubscriptionsModule } from '../components/admin/SubscriptionsModule';
import { OrdersModule } from '../components/admin/OrdersModule';
import { PlaqueStudio } from '../components/admin/PlaqueStudio';
import { AdminAchievements } from '../components/admin/AdminAchievements';
import { HallOfFame } from '../components/plaque/HallOfFame';

export default function Admin() {
  const { state, updateProfile, resetAnalytics } = useStore();
  const { user } = useAuth();
  const isAdmin = localStorage.getItem('NIGHTRUNNA_ADMIN_AUTH') === 'true' || user?.email === 'krypside@gmail.com';
  
  const [realAnalytics, setRealAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/analytics-report', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setRealAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics", error);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    // Ensure admin auth is saved if accessing via email
    if (user?.email === 'krypside@gmail.com' && localStorage.getItem('NIGHTRUNNA_ADMIN_AUTH') !== 'true') {
      localStorage.setItem('NIGHTRUNNA_ADMIN_AUTH', 'true');
    }
  }, [user]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscribers' | 'voicetag' | 'uploader' | 'packUploader' | 'plaque' | 'playerManagement' | 'flashSale' | 'push' | 'isrc' | 'videos' | 'videoAds' | 'publishing' | 'subscriptions' | 'salesAnalytics' | 'engagementAnalytics' | 'vaults' | 'iaUploadCenter' | 'notifications' | 'orders' | 'analytics' | 'settings'>('dashboard');
  const [subscribers, setSubscribers] = useState<{ email: string; name: string; subscribedAt: string; notifyOnBeatDrop: boolean }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'SALE' | 'MILESTONE' | 'DOWNLOAD' | 'TRENDING' | 'SUBSCRIBER'>('ALL');
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NAVIGATE' && event.data.url) {
          const rawUrl = event.data.url;
          const cleanTab = rawUrl.replace('/admin/', '').replace('/admin', 'dashboard');
          if (cleanTab) {
            setActiveTab(cleanTab as any);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [user]);

  const [plaqueArtist, setPlaqueArtist] = useState('');
  const [plaqueTitle, setPlaqueTitle] = useState('');
  const [plaqueShipping, setPlaqueShipping] = useState('');

  // 🏆 MILESTONES LOGIC
  const totalPlays = state.analytics.totalPlays || 0;
  
  const milestones = [
    { id: 'bronze', name: 'Bronze Milestone', goal: 100, color: '#cd7f32', icon: '🥉' },
    { id: 'silver', name: 'Silver Milestone', goal: 500, color: '#c0c0c0', icon: '🥈' },
    { id: 'gold', name: 'Gold Milestone', goal: 1000, color: '#FFD700', icon: '🥇' },
    { id: 'platinum', name: 'Platinum Milestone', goal: 5000, color: '#e5e4e2', icon: '💿' },
    { id: 'diamond', name: 'Diamond Milestone', goal: 10000, color: '#b9f2ff', icon: '💎' }
  ];

  const reachedMilestones = milestones.filter(m => totalPlays >= m.goal);
  const nextMilestone = milestones.find(m => totalPlays < m.goal);
  const isAwardEligible = reachedMilestones.length > 0;

  const filteredSubscribers = subscribers.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // 💰 REVENUE ANALYTICS
  const earningsFromBeats = state.beats.reduce((sum, beat) => sum + (beat.earnings || 0), 0);
  const totalEarnings = Math.max(state.analytics.totalEarnings || 0, earningsFromBeats);
  const platformFees = state.analytics.platformFees || 0;
  const netEarnings = totalEarnings - platformFees;
  
  const grossMarginPercent = totalEarnings > 0 ? Math.round((netEarnings / totalEarnings) * 100) : 0;
  const platformFeePercent = totalEarnings > 0 ? 100 - grossMarginPercent : 0;

  // Calculate totals
  const totalPlaysFromBeats = state.beats.reduce((sum, beat) => sum + (beat.plays || 0), 0);
  const displayPlays = Math.max(totalPlays, totalPlaysFromBeats);
  const totalLikes = state.beats.reduce((sum, beat) => sum + (beat.likes || 0), 0);
  const totalShares = state.beats.reduce((sum, beat) => sum + (beat.shares || 0), 0);
  const totalDownloads = state.beats.reduce((sum, beat) => sum + (beat.downloads || 0), 0);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden animate-in fade-in duration-500">
      {/* Mobile Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span className="font-bold">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('notifications')} 
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl relative text-neutral-300 hover:text-white transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-indigo-400" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white font-extrabold text-[9px] rounded-full border-2 border-neutral-950 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab(activeTab === 'mobile-menu' ? 'dashboard' : 'mobile-menu')} className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-neutral-950 border-r border-neutral-900 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${activeTab === 'mobile-menu' ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center px-6 border-b border-neutral-900">
            <BarChart3 className="w-6 h-6 text-indigo-500 mr-3" />
            <h2 className="text-xl font-extrabold tracking-tight">Admin</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'subscribers', label: 'Subscribers', icon: Mail },
              { id: 'beats', label: 'Beats', icon: Music },
              { id: 'collections', label: 'Collections', icon: Library },
              { id: 'orders', label: 'Orders', icon: DollarSign },
              { id: 'merch', label: 'Merch', icon: ShoppingBag },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'hall-of-fame', label: 'Hall of Fame', icon: ShieldCheck },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id || (activeTab === 'mobile-menu' && tab.id === 'dashboard');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950"></span>
                    )}
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-900">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl transition-all text-sm mb-3"
            >
              ← Back to Store
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('NIGHTRUNNA_ADMIN_AUTH');
                window.location.href = '/admin-portal';
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Lock Console
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#050505] pt-20 lg:pt-0">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          
          {/* Top Bar Navigation Header */}
          <div className="hidden lg:flex justify-between items-center mb-8 pb-4 border-b border-neutral-900">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest">
              <span>Admin Portal</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">{activeTab.toUpperCase()}</span>
            </div>
            <button
              onClick={() => setActiveTab('notifications')}
              className="flex items-center gap-2.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-sm font-bold text-white transition-all relative shadow-lg shadow-black/40"
            >
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white font-extrabold text-xs rounded-full ml-0.5">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
          
          {/* DASHBOARD TAB */}
          {(activeTab === 'dashboard' || activeTab === 'mobile-menu') && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                <p className="text-neutral-400 mt-2">Welcome back to the command center.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider mb-2">Total Streams</p>
                    <p className="text-3xl font-extrabold text-white">{displayPlays.toLocaleString()}</p>
                 </div>
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider mb-2">Gross Earnings</p>
                    <p className="text-3xl font-extrabold text-emerald-400">${totalEarnings.toLocaleString()}</p>
                 </div>
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider mb-2">Catalog Size</p>
                    <p className="text-3xl font-extrabold text-indigo-400">{state.beats.length}</p>
                 </div>
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-wider mb-2">Subscribers</p>
                    <p className="text-3xl font-extrabold text-fuchsia-400">{subscribers.length}</p>
                 </div>
              </div>
            </div>
          )}

          {/* BEATS TAB */}
          {activeTab === 'beats' && (
            <div className="space-y-12">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Beat Management</h1>
                <p className="text-neutral-400">Upload, edit, and organize your instrumental catalog.</p>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Uploader</h2>
                <Uploader />
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Player Management</h2>
                <PlayerManagement state={state} />
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Beat Packs</h2>
                <BeatPackUploader />
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">ISRC & Metadata</h2>
                <ISRCModule />
              </div>
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeTab === 'collections' && (
            <div className="space-y-12">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Collections & Sales</h1>
                <p className="text-neutral-400">Manage flash sales, vaults, and private links.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Flash Sales</h2>
                <FlashSaleStudio />
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Private Vaults</h2>
                <VaultsModule />
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-12">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Beat Sales & Orders</h1>
                <p className="text-neutral-400">View real-time transactions, buyer details, and PayPal payout routing.</p>
              </div>
              <OrdersModule />
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Active Subscriptions</h2>
                <SubscriptionsModule />
              </div>
            </div>
          )}

          {/* MERCH TAB */}
          {activeTab === 'merch' && (
            <div className="space-y-12">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Merchandise & Awards</h1>
                <p className="text-neutral-400">Manage plaques and physical product sales.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <PlaqueStudio 
                   plaqueArtist={plaqueArtist}
                   plaqueTitle={plaqueTitle}
                   plaqueShipping={plaqueShipping}
                   setPlaqueArtist={setPlaqueArtist}
                   setPlaqueTitle={setPlaqueTitle}
                   setPlaqueShipping={setPlaqueShipping}
                   isAwardEligible={isAwardEligible}
                   nextMilestone={nextMilestone}
                   reachedMilestones={reachedMilestones}
                />
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Store Analytics</h1>
                <p className="text-neutral-400">Real-time engagement, streams, and revenue data.</p>
              </div>
              <AnalyticsDashboard />
            </div>
          )}

          {/* SUBSCRIBERS TAB */}
          {(activeTab === 'subscribers' || activeTab === 'subscriptions') && (
            <SubscriptionsModule />
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <AdminAchievements />
          )}

          {/* HALL OF FAME TAB */}
          {activeTab === 'hall-of-fame' && (
            <HallOfFame />
          )}

          
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Notification Center</h1>
                  <p className="text-neutral-400 mt-1 text-sm">Store activity alerts, stream benchmarks, and subscriber logs.</p>
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const batch = writeBatch(db);
                        notifications.filter(n => !n.read).forEach(n => {
                          batch.update(doc(db, 'notifications', n.id), { read: true });
                        });
                        batch.commit();
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white border border-neutral-800 rounded-xl transition-all"
                    >
                      Mark all read
                    </button>
                    <button 
                      onClick={() => {
                        const batch = writeBatch(db);
                        notifications.filter(n => n.read).forEach(n => {
                          batch.delete(doc(db, 'notifications', n.id));
                        });
                        batch.commit();
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20 rounded-xl transition-all"
                    >
                      Clear read
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-900">
                {[
                  { id: 'ALL', label: 'All Alerts' },
                  { id: 'SALE', label: 'Sales' },
                  { id: 'MILESTONE', label: 'Milestones' },
                  { id: 'DOWNLOAD', label: 'Downloads' },
                  { id: 'TRENDING', label: 'Trending' },
                  { id: 'SUBSCRIBER', label: 'Subscribers' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setNotifFilter(f.id as any)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                      notifFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {notifications.filter(n => notifFilter === 'ALL' || n.type === notifFilter).length === 0 ? (
                  <div className="text-center py-16 bg-neutral-950/50 border border-neutral-900 rounded-2xl">
                    <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold text-neutral-400">No notifications in this view.</p>
                    <p className="text-xs text-neutral-600 mt-1">Real events will automatically log here.</p>
                  </div>
                ) : (
                  notifications
                    .filter(n => notifFilter === 'ALL' || n.type === notifFilter)
                    .map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          notif.read 
                            ? 'bg-neutral-950/80 border-neutral-900/80 opacity-70 hover:opacity-100' 
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-md'
                        }`}
                        onClick={() => {
                           if (!notif.read) {
                              updateDoc(doc(db, 'notifications', notif.id), { read: true });
                           }
                           if (notif.url) {
                              const targetTab = notif.url.replace('/admin/', '').replace('/admin', 'dashboard');
                              if (targetTab) {
                                setActiveTab(targetTab as any);
                              }
                           }
                        }}
                      >
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                             {notif.type === 'SALE' && <DollarSign className="w-5 h-5 text-emerald-400" />}
                             {notif.type === 'MILESTONE' && <Award className="w-5 h-5 text-amber-400" />}
                             {notif.type === 'DOWNLOAD' && <Download className="w-5 h-5 text-sky-400" />}
                             {notif.type === 'TRENDING' && <TrendingUp className="w-5 h-5 text-fuchsia-400" />}
                             {notif.type === 'SUBSCRIBER' && <Mail className="w-5 h-5 text-indigo-400" />}
                             {!['SALE', 'MILESTONE', 'DOWNLOAD', 'TRENDING', 'SUBSCRIBER'].includes(notif.type) && <Bell className="w-5 h-5 text-indigo-400" />}
                           </div>
                           <div className="flex-1">
                             <div className="flex justify-between items-start">
                               <h4 className={`text-sm font-bold ${notif.read ? 'text-neutral-300' : 'text-white'}`}>{notif.title}</h4>
                               <span className="text-[10px] text-neutral-500 font-mono">
                                 {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : ''}
                               </span>
                             </div>
                             <p className="text-sm text-neutral-400 mt-1 whitespace-pre-wrap">{notif.message}</p>
                           </div>
                           {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-12">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings & Configuration</h1>
                <p className="text-neutral-400">Manage system settings, seller payout routing, push notifications, and marketing.</p>
              </div>
              
              <OrdersModule hideTable={true} />

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Push Alerts</h2>
                <PushAlertsModule />
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Publishing Admin</h2>
                <PublishingModule />
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">YouTube Integrations</h2>
                <YouTubeManagerModule />
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Video Ad Engine</h2>
                <VideoAdMaker />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
