import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Mail, Send, Filter, Download, Plus, Check, 
  Trash2, Tag, Eye, RefreshCw, Settings, Sparkles, Music, 
  ExternalLink, Clock, CheckCircle2, AlertCircle, Calendar,
  ShieldCheck, ArrowUpRight, BarChart3, Layers, UserPlus, Play, X, LogIn, LogOut, Inbox, MessageSquare
} from 'lucide-react';
import { MailingListSubscriber, MailingListSettings, EmailCampaign, EmailLog } from '../../types';
import { useStore } from '../../context/StoreContext';
import { 
  connectGmailAccount, 
  disconnectGmailAccount, 
  fetchGmailProfile, 
  fetchGmailRecentMessages, 
  sendGmailMessage, 
  GmailProfile, 
  GmailMessageSummary 
} from '../../lib/gmail';

export const SubscriptionsModule: React.FC = () => {
  const { state } = useStore();
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaign' | 'settings' | 'history'>('subscribers');

  // Gmail OAuth State
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [useGmailForDispatch, setUseGmailForDispatch] = useState(false);
  const [showGmailConfirmModal, setShowGmailConfirmModal] = useState(false);
  const [pendingDispatchType, setPendingDispatchType] = useState<'test' | 'campaign' | null>(null);

  const [subscribers, setSubscribers] = useState<MailingListSubscriber[]>([]);
  const [settings, setSettings] = useState<MailingListSettings>({
    welcomeSubject: "WELCOME TO THE NIGHTRUNNA EMPIRE 🔥",
    welcomeHeadline: "WELCOME TO THE NIGHTRUNNA EMPIRE",
    welcomeBody: "Thank you for joining the NightRunna Empire.\n\nYou're now part of our exclusive inner circle. You'll receive instant alerts for new beat drops, exclusive collections, special offers, free downloads, and important store updates.",
    welcomeFooter: "© 2026 NightRunna Audio Labs. All rights reserved. You received this email because you subscribed on NightRunna.",
    welcomeCtaText: "EXPLORE CATALOG & DOWNLOADS ↗",
    welcomeCtaUrl: "/",
    senderDisplayName: "NightRunna Audio Labs <nightrunna842@gmail.com>",
    notificationEmail: "nightrunna842@gmail.com",
    alreadySubscribedMsg: "You're already on the NightRunna list.",
    newSubscriberSuccessMsg: "Welcome to the NightRunna Empire."
  });

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filters for Subscribers
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'unsubscribed'>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');

  // Manual Add Subscriber Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');

  // Tag Modal State
  const [editingSub, setEditingSub] = useState<MailingListSubscriber | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Campaign Composer State
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignHeadline, setCampaignHeadline] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignImageUrl, setCampaignImageUrl] = useState('');
  const [campaignCtaText, setCampaignCtaText] = useState('EXPLORE BEAT & LICENSES ↗');
  const [campaignCtaUrl, setCampaignCtaUrl] = useState('/');
  const [campaignTargetTag, setCampaignTargetTag] = useState('ALL');
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Settings form saving
  const [savingSettings, setSavingSettings] = useState(false);

  // Gmail OAuth Handlers
  const handleConnectGmail = async () => {
    setGmailLoading(true);
    setActionMessage(null);
    try {
      const res = await connectGmailAccount();
      if (res && res.accessToken) {
        setGmailToken(res.accessToken);
        setUseGmailForDispatch(true);
        const profile = await fetchGmailProfile(res.accessToken);
        setGmailProfile(profile);
        const recent = await fetchGmailRecentMessages(res.accessToken, 'label:SENT OR label:INBOX', 10);
        setGmailMessages(recent);
        setActionMessage({
          type: 'success',
          text: `✓ Gmail account connected successfully (${profile.emailAddress}).`
        });
      }
    } catch (err: any) {
      console.error("Gmail connect error:", err);
      setActionMessage({
        type: 'error',
        text: err.message || "Failed to connect Gmail account. Please allow requested permissions."
      });
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    await disconnectGmailAccount();
    setGmailToken(null);
    setGmailProfile(null);
    setGmailMessages([]);
    setUseGmailForDispatch(false);
    setActionMessage({ type: 'success', text: "✓ Gmail account successfully disconnected. Stored OAuth session and tokens revoked." });
  };

  const refreshGmailData = async () => {
    if (!gmailToken) return;
    setGmailLoading(true);
    try {
      const profile = await fetchGmailProfile(gmailToken);
      setGmailProfile(profile);
      const recent = await fetchGmailRecentMessages(gmailToken, 'label:SENT OR label:INBOX', 10);
      setGmailMessages(recent);
    } catch (err: any) {
      console.error("Error refreshing Gmail data:", err);
    } finally {
      setGmailLoading(false);
    }
  };

  const fetchMarketingData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscribers');
      if (res.ok) {
        const data = await res.json();
        if (data.subscribers) setSubscribers(data.subscribers);
        if (data.settings) setSettings(data.settings);
        if (data.campaigns) setCampaigns(data.campaigns);
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch marketing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  // When beat is selected in campaign builder, auto populate details
  const handleSelectBeatForCampaign = (beatId: string) => {
    setSelectedBeatId(beatId);
    if (!beatId) return;
    const beat = state.beats.find(b => b.id === beatId);
    if (beat) {
      setCampaignSubject(`🔥 NEW BEAT DROP: "${beat.title.toUpperCase()}" (${beat.bpm} BPM)`);
      setCampaignHeadline(`NEW BEAT RELEASE: ${beat.title.toUpperCase()}`);
      setCampaignImageUrl(beat.coverArtUrl || '');
      setCampaignBody(`NightRunna just dropped a brand new banger: "${beat.title.toUpperCase()}".\n\nTrack Details:\n- BPM: ${beat.bpm}\n- Key: ${beat.key || 'C minor'}\n- Primary Genre: ${beat.primaryGenre || 'Hip Hop / Trap'}\n- Standard Lease: $${beat.price}\n\nStream the full untagged preview or lock in your license now on the store!`);
      setCampaignCtaText(`STREAM & LICENSE "${beat.title.toUpperCase()}" ↗`);
      setCampaignCtaUrl(`/beat/${beat.id}`);
    }
  };

  // Handle Manual Subscriber Add
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail) return;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSubEmail,
          firstName: newSubName,
          name: newSubName,
          source: 'Admin Manual Add'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || 'Subscriber added.' });
        setNewSubEmail('');
        setNewSubName('');
        setShowAddModal(false);
        fetchMarketingData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to add subscriber.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server error adding subscriber.' });
    }
  };

  // Handle Tag Update
  const handleAddTagToSub = async (email: string, tag: string) => {
    if (!tag.trim()) return;
    try {
      const res = await fetch('/api/subscribers/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tag: tag.trim(), action: 'add' })
      });
      if (res.ok) {
        setTagInput('');
        fetchMarketingData();
      }
    } catch (err) {
      console.error("Tag update error", err);
    }
  };

  const handleRemoveTagFromSub = async (email: string, tag: string) => {
    try {
      const res = await fetch('/api/subscribers/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tag, action: 'remove' })
      });
      if (res.ok) {
        fetchMarketingData();
      }
    } catch (err) {
      console.error("Tag removal error", err);
    }
  };

  // Toggle subscriber status
  const handleToggleStatus = async (email: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'unsubscribed' : 'active';
    try {
      const res = await fetch('/api/subscribers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: newStatus })
      });
      if (res.ok) {
        fetchMarketingData();
      }
    } catch (err) {
      console.error("Status toggle error", err);
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return;
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Subscriber removed.' });
        fetchMarketingData();
      }
    } catch (err) {
      console.error("Delete subscriber error", err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert("No subscribers to export.");
      return;
    }
    const headers = ["ID", "Email", "First Name", "Status", "Subscribed Date", "Source", "Tags"];
    const rows = subscribers.map(s => [
      s.id,
      s.email,
      s.firstName || s.name || "",
      s.status,
      s.subscribedDate,
      s.source || "",
      (s.tags || []).join("; ")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nightrunna_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/mailing-list/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Mailing list settings updated successfully.' });
      } else {
        setActionMessage({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Server error saving settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: campaignSubject || settings.welcomeSubject,
          headline: campaignHeadline || settings.welcomeHeadline,
          body: campaignBody || settings.welcomeBody,
          imageUrl: campaignImageUrl,
          ctaText: campaignCtaText || settings.welcomeCtaText,
          ctaUrl: campaignCtaUrl || settings.welcomeCtaUrl,
          footer: settings.welcomeFooter,
          recipient: settings.notificationEmail,
          gmailAccessToken: useGmailForDispatch ? gmailToken : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        fetchMarketingData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to send test email.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error sending test email.' });
    } finally {
      setSendingTest(false);
    }
  };

  // Send Campaign Broadcast
  const handleSendCampaign = async () => {
    if (!campaignSubject || !campaignBody) {
      alert("Please fill in both Subject and Body for your campaign.");
      return;
    }

    const activeCount = subscribers.filter(s => s.status === 'active').length;
    if (!confirm(`Are you sure you want to broadcast this campaign to ${activeCount} active subscribers?`)) return;

    await executeCampaignBroadcast();
  };

  const executeCampaignBroadcast = async () => {
    setSendingCampaign(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/email/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignSubject,
          subject: campaignSubject,
          headline: campaignHeadline || campaignSubject,
          body: campaignBody,
          imageUrl: campaignImageUrl,
          beatId: selectedBeatId,
          ctaText: campaignCtaText,
          ctaUrl: campaignCtaUrl,
          footer: settings.welcomeFooter,
          targetTag: campaignTargetTag,
          gmailAccessToken: useGmailForDispatch ? gmailToken : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setCampaignSubject('');
        setCampaignHeadline('');
        setCampaignBody('');
        setCampaignImageUrl('');
        setSelectedBeatId('');
        fetchMarketingData();
        setActiveTab('history');
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to send campaign.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error sending campaign.' });
    } finally {
      setSendingCampaign(false);
      setShowGmailConfirmModal(false);
      setPendingDispatchType(null);
    }
  };

  // Filtered subscribers calculation
  const filteredSubscribers = subscribers.filter(s => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.firstName && s.firstName.toLowerCase().includes(query)) ||
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.source && s.source.toLowerCase().includes(query)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(query)));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesTag = selectedTagFilter === 'ALL' || (s.tags && s.tags.includes(selectedTagFilter));

    return matchesSearch && matchesStatus && matchesTag;
  });

  // Calculate metrics
  const totalSubscribersCount = subscribers.length;
  const activeSubscribersCount = subscribers.filter(s => s.status === 'active').length;
  const unsubscribedCount = subscribers.filter(s => s.status === 'unsubscribed').length;
  const todayDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const newTodayCount = subscribers.filter(s => s.subscribedDate && s.subscribedDate.includes(todayDateStr.slice(0, 8))).length;

  // Extract all unique tags
  const allTags = Array.from(new Set(subscribers.flatMap(s => s.tags || [])));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  First-Party Email Engine
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Mailing List & Automated Email System
              </h1>
              <p className="text-neutral-400 text-sm mt-0.5">
                Manage subscribers, build release announcements, configure welcome sequences, and view real delivery metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Subscriber
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-800 rounded-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-neutral-400" /> Export CSV
            </button>
            <button
              onClick={fetchMarketingData}
              className="p-2.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-800/80">
          <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Total Subscribers</div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono">{totalSubscribersCount}</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Active Subscribers</div>
            <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">{activeSubscribersCount}</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Unsubscribed</div>
            <div className="text-2xl md:text-3xl font-black text-amber-400 font-mono">{unsubscribedCount}</div>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Total Campaigns</div>
            <div className="text-2xl md:text-3xl font-black text-indigo-400 font-mono">{campaigns.length}</div>
          </div>
        </div>
      </div>

      {/* ACTION ALERTS */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm font-bold ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs underline opacity-80 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" /> Subscribers Database ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'campaign'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Send className="w-4 h-4" /> New Campaign & Release
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Settings className="w-4 h-4" /> Welcome Email & Template
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Campaign Logs & Delivery
        </button>
      </div>

      {/* TAB 1: SUBSCRIBERS DATABASE */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                placeholder="Search by email, name, source, or tag..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                className="bg-neutral-950 border border-neutral-800 text-white text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>

              <select
                className="bg-neutral-950 border border-neutral-800 text-white text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500"
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
              >
                <option value="ALL">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE OF SUBSCRIBERS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Subscriber Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4">Subscribed Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map(sub => (
                      <tr key={sub.id || sub.email} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-white text-sm">
                            {sub.firstName || sub.name || 'Anonymous Listener'}
                          </div>
                          <div className="text-xs text-indigo-400 font-mono mt-0.5">{sub.email}</div>
                          <div className="text-[10px] text-neutral-600 font-mono mt-0.5">ID: {sub.id}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {sub.status || 'active'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-neutral-400">
                          {sub.source || 'NightRunna Store'}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {(sub.tags || ['New Subscriber']).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] font-bold rounded-md border border-neutral-700 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-indigo-400" />
                                {tag}
                                <button
                                  onClick={() => handleRemoveTagFromSub(sub.email, tag)}
                                  className="text-neutral-500 hover:text-red-400 ml-0.5"
                                  title="Remove Tag"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => setEditingSub(sub)}
                              className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold rounded border border-neutral-700"
                              title="Add Tag"
                            >
                              + Tag
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {sub.subscribedDate}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(sub.email, sub.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                sub.status === 'active'
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {sub.status === 'active' ? 'Unsubscribe' : 'Reactivate'}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all"
                              title="Delete Subscriber"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-neutral-500 italic">
                        No subscribers found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGN & RELEASE COMPOSER */}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COMPOSER FORM (LEFT 7 COLS) */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Broadcast Release & Campaign Builder
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Select a beat to auto-populate or create a custom email broadcast.
              </p>
            </div>

            {/* SELECT BEAT DROP-DOWN */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                🎵 Select Beat from Catalog (Auto-Fills Email Content)
              </label>
              <select
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                value={selectedBeatId}
                onChange={(e) => handleSelectBeatForCampaign(e.target.value)}
              >
                <option value="">-- Choose a Beat from Store --</option>
                {state.beats.map(beat => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title} (${beat.price}) - {beat.bpm} BPM | Key: {beat.key || 'C minor'}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBJECT */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Subject Line *
              </label>
              <input
                type="text"
                placeholder="e.g. 🔥 NEW BEAT DROP: 'MIDNIGHT RUN' (140 BPM)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
              />
            </div>

            {/* HEADLINE */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Main Headline
              </label>
              <input
                type="text"
                placeholder="e.g. EXCLUSIVE NEW RELEASE NOW AVAILABLE"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                value={campaignHeadline}
                onChange={(e) => setCampaignHeadline(e.target.value)}
              />
            </div>

            {/* IMAGE URL */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Artwork / Banner Cover Image URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs"
                value={campaignImageUrl}
                onChange={(e) => setCampaignImageUrl(e.target.value)}
              />
            </div>

            {/* BODY TEXT */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Message Body *
              </label>
              <textarea
                rows={6}
                placeholder="Write your email body here..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none leading-relaxed"
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
              />
            </div>

            {/* CTA BUTTON CONFIG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                  value={campaignCtaText}
                  onChange={(e) => setCampaignCtaText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  CTA Button Destination Link
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs"
                  value={campaignCtaUrl}
                  onChange={(e) => setCampaignCtaUrl(e.target.value)}
                />
              </div>
            </div>

            {/* TARGET AUDIENCE TAG */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Target Audience Segment
              </label>
              <select
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                value={campaignTargetTag}
                onChange={(e) => setCampaignTargetTag(e.target.value)}
              >
                <option value="ALL">All Active Subscribers ({activeSubscribersCount})</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    Segment: {tag} ({subscribers.filter(s => s.status === 'active' && s.tags?.includes(tag)).length})
                  </option>
                ))}
              </select>
            </div>

            {/* ACTIONS */}
            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="px-5 py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs rounded-xl border border-neutral-800 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                {sendingTest ? 'Sending Test...' : 'Send Test to Admin'}
              </button>

              <button
                onClick={handleSendCampaign}
                disabled={sendingCampaign}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingCampaign ? 'Broadcasting Email...' : `Broadcast Campaign Now (${activeSubscribersCount})`}
              </button>
            </div>
          </div>

          {/* LIVE EMAIL PREVIEW (RIGHT 5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" /> Real-time Email Preview
              </h3>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                    previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all ${
                    previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className={`mx-auto transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
            }`}>
              <div className="bg-[#050505] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-4">
                
                {/* PREVIEW HEADER */}
                <div className="bg-[#000000] border-b border-neutral-800 p-4 text-center">
                  <div className="text-lg font-black tracking-tight text-white uppercase">
                    ⚡ NIGHT<span className="text-indigo-500">RUNNA</span>
                  </div>
                  <div className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase mt-0.5">
                    AUDIO LABS // OFFICIAL DISPATCH
                  </div>
                </div>

                {/* PREVIEW ARTWORK */}
                {campaignImageUrl && (
                  <div className="w-full h-48 bg-black overflow-hidden border-b border-neutral-800">
                    <img src={campaignImageUrl} alt="Preview Artwork" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* PREVIEW BODY */}
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-extrabold text-white tracking-tight uppercase">
                    {campaignHeadline || campaignSubject || 'YOUR EMAIL HEADLINE'}
                  </h2>

                  <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {campaignBody || 'Your campaign email body content will render here in high resolution...'}
                  </div>

                  {campaignCtaText && (
                    <div className="pt-2">
                      <div className="w-full py-3 bg-indigo-600 text-white text-center font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg">
                        {campaignCtaText}
                      </div>
                    </div>
                  )}
                </div>

                {/* PREVIEW FOOTER */}
                <div className="bg-[#050505] border-t border-neutral-900 p-4 text-center text-[10px] text-neutral-500 space-y-1">
                  <p>{settings.welcomeFooter}</p>
                  <p className="text-indigo-400 underline">Unsubscribe or Manage Preferences</p>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: WELCOME EMAIL & SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" /> Welcome Email Sequence & Response Settings
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Customize the automated welcome email and response notifications sent to new subscribers.
              </p>
            </div>

            {/* SENDER DISPLAY NAME */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Sender Name & Email Header
              </label>
              <input
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                value={settings.senderDisplayName}
                onChange={(e) => setSettings({ ...settings, senderDisplayName: e.target.value })}
              />
            </div>

            {/* ADMIN NOTIFICATION EMAIL */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Admin Notification Email (Receives New Subscriber Alerts)
              </label>
              <input
                type="email"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              />
            </div>

            {/* WELCOME SUBJECT */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Welcome Email Subject Line
              </label>
              <input
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                value={settings.welcomeSubject}
                onChange={(e) => setSettings({ ...settings, welcomeSubject: e.target.value })}
              />
            </div>

            {/* WELCOME HEADLINE */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Welcome Email Main Headline
              </label>
              <input
                type="text"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                value={settings.welcomeHeadline}
                onChange={(e) => setSettings({ ...settings, welcomeHeadline: e.target.value })}
              />
            </div>

            {/* WELCOME BODY */}
            <div>
              <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                Welcome Email Body Text
              </label>
              <textarea
                rows={5}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none leading-relaxed"
                value={settings.welcomeBody}
                onChange={(e) => setSettings({ ...settings, welcomeBody: e.target.value })}
              />
            </div>

            {/* BUTTON LABEL & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                  value={settings.welcomeCtaText}
                  onChange={(e) => setSettings({ ...settings, welcomeCtaText: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  Button Destination Link
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none font-mono text-xs"
                  value={settings.welcomeCtaUrl}
                  onChange={(e) => setSettings({ ...settings, welcomeCtaUrl: e.target.value })}
                />
              </div>
            </div>

            {/* MESSAGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  Success Message (New Subscriber)
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  value={settings.newSubscriberSuccessMsg}
                  onChange={(e) => setSettings({ ...settings, newSubscriberSuccessMsg: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-2">
                  Already Subscribed Response
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  value={settings.alreadySubscribedMsg}
                  onChange={(e) => setSettings({ ...settings, alreadySubscribedMsg: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {savingSettings ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* PREVIEW RIGHT */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" /> Welcome Email Preview
            </h3>

            <div className="bg-[#050505] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-4">
              <div className="bg-[#000000] border-b border-neutral-800 p-4 text-center">
                <div className="text-lg font-black tracking-tight text-white uppercase">
                  ⚡ NIGHT<span className="text-indigo-500">RUNNA</span>
                </div>
                <div className="text-[9px] font-extrabold text-indigo-400 tracking-widest uppercase mt-0.5">
                  AUDIO LABS // OFFICIAL DISPATCH
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-white tracking-tight uppercase">
                  {settings.welcomeHeadline}
                </h2>

                <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {settings.welcomeBody}
                </div>

                {settings.welcomeCtaText && (
                  <div className="pt-2">
                    <div className="w-full py-3 bg-indigo-600 text-white text-center font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg">
                      {settings.welcomeCtaText}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#050505] border-t border-neutral-900 p-4 text-center text-[10px] text-neutral-500 space-y-1">
                <p>{settings.welcomeFooter}</p>
                <p className="text-indigo-400 underline">Unsubscribe or Manage Preferences</p>
              </div>
            </div>
          </div>

        </form>
      )}

      {/* TAB 4: CAMPAIGN LOGS & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Broadcast Campaign History
            </h2>

            <div className="space-y-4">
              {campaigns.length > 0 ? (
                campaigns.map(camp => (
                  <div key={camp.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                      <div>
                        <div className="text-base font-extrabold text-white">{camp.name || camp.subject}</div>
                        <div className="text-xs text-indigo-400 font-mono mt-0.5">Subject: {camp.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {camp.status || 'SENT'}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          {new Date(camp.sentAt || camp.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">Target Segment</div>
                        <div className="text-xs font-bold text-neutral-300 mt-0.5">{camp.targetTag || 'ALL'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">Attempted</div>
                        <div className="text-xs font-mono font-bold text-white mt-0.5">{camp.attemptedCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">Delivered</div>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{camp.successCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">Failed</div>
                        <div className="text-xs font-mono font-bold text-red-400 mt-0.5">{camp.failedCount || 0}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-500 italic">
                  No email campaigns broadcasted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GMAIL WORKSPACE INTEGRATION */}
      {activeTab === 'gmail' && (
        <div className="space-y-6">
          {/* GMAIL OAUTH STATUS CARD */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-neutral-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
                  <Mail className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                      Google Workspace Integration
                    </span>
                    {gmailProfile ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Connected to Gmail
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">
                    {gmailProfile ? gmailProfile.emailAddress : 'Connect Store Gmail Account'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                    Dispatch campaign emails and test announcements directly using your connected Google Workspace account via the official Gmail API.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {gmailProfile ? (
                  <>
                    <button
                      onClick={refreshGmailData}
                      disabled={gmailLoading}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button
                      onClick={handleConnectGmail}
                      disabled={gmailLoading}
                      className="px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-800/50 flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Switch Google Account
                    </button>
                    <button
                      onClick={handleDisconnectGmail}
                      className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-extrabold text-xs rounded-xl border border-red-800/50 flex items-center gap-2 uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" /> DISCONNECT GMAIL
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={gmailLoading}
                    className="px-6 py-3 bg-white hover:bg-neutral-100 text-neutral-900 font-black text-xs rounded-xl shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    {gmailLoading ? 'Connecting...' : 'Sign in with Google / Gmail'}
                  </button>
                )}
              </div>
            </div>

            {/* GMAIL PROFILE STATS & DISPATCH TOGGLE */}
            {gmailProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Connected Address</div>
                  <div className="text-sm font-extrabold text-white font-mono truncate">{gmailProfile.emailAddress}</div>
                </div>
                <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Mailbox Metrics</div>
                  <div className="text-sm font-extrabold text-indigo-400 font-mono">
                    {gmailProfile.messagesTotal.toLocaleString()} messages / {gmailProfile.threadsTotal.toLocaleString()} threads
                  </div>
                </div>
                <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Primary Dispatch</div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {useGmailForDispatch ? 'Gmail API Active' : 'Resend/Express Default'}
                    </div>
                  </div>
                  <button
                    onClick={() => setUseGmailForDispatch(!useGmailForDispatch)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      useGmailForDispatch ? 'bg-red-600' : 'bg-neutral-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      useGmailForDispatch ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* GMAIL RECENT MESSAGES INSPECTOR */}
          {gmailProfile && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-red-400" /> Recent Gmail Activity & Inbox Messages
                </h3>
                <span className="text-xs text-neutral-400">
                  Showing top {gmailMessages.length} messages
                </span>
              </div>

              <div className="space-y-3">
                {gmailMessages.length > 0 ? (
                  gmailMessages.map((msg) => (
                    <div key={msg.id} className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-xl hover:border-neutral-700 transition-all space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white truncate max-w-md">
                          {msg.subject || '(No Subject)'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {msg.date || msg.internalDate ? new Date(Number(msg.internalDate || Date.now())).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        {msg.from && <span><strong>From:</strong> {msg.from}</span>}
                        {msg.to && <span><strong>To:</strong> {msg.to}</span>}
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 pt-1 font-mono bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/50">
                        {msg.snippet}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-500 italic">
                    No recent Gmail activity fetched. Click Refresh to load messages.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GMAIL CONFIRMATION MODAL */}
      {showGmailConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-400" /> Confirm Gmail Workspace Action
              </h3>
              <button onClick={() => setShowGmailConfirmModal(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-300">
              <p>
                You are about to execute an email action using your connected Google Workspace account:
              </p>
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 font-mono text-xs">
                <div><strong>Sender Account:</strong> {gmailProfile?.emailAddress || settings.notificationEmail}</div>
                <div><strong>Action Type:</strong> {pendingDispatchType === 'campaign' ? 'Campaign Email Broadcast' : 'Test Email Dispatch'}</div>
                <div><strong>Subject:</strong> {campaignSubject || settings.welcomeSubject}</div>
                <div><strong>Target Recipients:</strong> {subscribers.filter(s => s.status === 'active').length} Active Subscribers</div>
              </div>
              <p className="text-xs text-amber-400/90 italic">
                Emails will be dispatched directly through the Gmail API on behalf of your connected account.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGmailConfirmModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCampaignBroadcast}
                disabled={sendingCampaign}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                {sendingCampaign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm & Send via Gmail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBSCRIBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Add New Subscriber
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="artist@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-neutral-300 mb-1">
                  First Name / Artist Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Young Producer"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Save Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TAG MODAL */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" /> Manage Subscriber Tags
              </h3>
              <button onClick={() => setEditingSub(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-neutral-400">
                Adding tags to <span className="text-indigo-400 font-mono font-bold">{editingSub.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Beat Buyer, VIP, Producer"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTagToSub(editingSub.email, tagInput);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddTagToSub(editingSub.email, tagInput)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {['Beat Buyer', 'Free Download', 'VIP', 'Rapper', 'Producer', 'Customer'].map(suggestedTag => (
                  <button
                    key={suggestedTag}
                    onClick={() => handleAddTagToSub(editingSub.email, suggestedTag)}
                    className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-lg border border-neutral-800"
                  >
                    + {suggestedTag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setEditingSub(null)}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
