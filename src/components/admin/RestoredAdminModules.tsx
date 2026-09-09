import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Bell, Music, Video, ShieldCheck, CreditCard, Lock, UploadCloud, Save, CheckSquare, Square, Settings2 } from 'lucide-react';

// Utility to convert Base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushAlertsModule = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preference states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [categories, setCategories] = useState({
    sales: true,
    freeDownloads: true,
    milestones: true,
    trending: true,
    subscribers: true,
    systemErrors: true,
  });
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      });
    }

    // Load saved notification preferences
    const saved = localStorage.getItem('NIGHTRUNNA_NOTIF_PREFS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.pushEnabled === 'boolean') setPushEnabled(parsed.pushEnabled);
        if (typeof parsed.historyEnabled === 'boolean') setHistoryEnabled(parsed.historyEnabled);
        if (parsed.categories) setCategories(parsed.categories);
      } catch (e) {
        console.error("Error parsing notification preferences", e);
      }
    }
  }, []);

  const savePreferences = (updatedPush: boolean, updatedHistory: boolean, updatedCats: typeof categories) => {
    const prefs = {
      pushEnabled: updatedPush,
      historyEnabled: updatedHistory,
      categories: updatedCats,
    };
    localStorage.setItem('NIGHTRUNNA_NOTIF_PREFS', JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const toggleCategory = (cat: keyof typeof categories) => {
    const updated = { ...categories, [cat]: !categories[cat] };
    setCategories(updated);
    savePreferences(pushEnabled, historyEnabled, updated);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator)) throw new Error("Service Worker not supported in this browser");
      const reg = await navigator.serviceWorker.ready;
      
      const res = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await res.json();
      
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      setSubscribed(true);
      alert("Successfully subscribed to admin push notifications on this device!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to subscribe: " + e.message);
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      alert("Unsubscribed from admin notifications on this device.");
    } catch (e: any) {
      console.error(e);
      alert("Failed to unsubscribe: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-xl text-left animate-in fade-in duration-300 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Bell className="text-indigo-400" /> Web Push Device Connection</h2>
        <p className="text-neutral-400 text-sm">Receive real-time push alerts directly on your iPhone, iPad, or desktop when sales, subscriber signups, and milestones occur while away from the store.</p>
      </div>

      <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
           <h3 className="font-bold text-white text-sm mb-1">Current Device: {subscribed ? <span className="text-emerald-400 font-extrabold">● Connected</span> : <span className="text-neutral-500 font-extrabold">○ Not Connected</span>}</h3>
           <p className="text-xs text-neutral-400">Add this device subscription to receive background store alerts when the website is closed.</p>
         </div>
         {subscribed ? (
           <button onClick={handleUnsubscribe} disabled={loading} className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm transition-all whitespace-nowrap">
             {loading ? "Processing..." : "Disconnect Device"}
           </button>
         ) : (
           <button onClick={handleSubscribe} disabled={loading} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all whitespace-nowrap">
             {loading ? "Processing..." : "Connect This Device"}
           </button>
         )}
      </div>

      <div className="border-t border-neutral-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Notification Preferences & Channels
          </h3>
          {prefsSaved && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in">
              Preferences Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Push Notifications</p>
              <p className="text-xs text-neutral-400">Deliver OS alerts to connected devices</p>
            </div>
            <button
              onClick={() => {
                const next = !pushEnabled;
                setPushEnabled(next);
                savePreferences(next, historyEnabled, categories);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Admin Notification History</p>
              <p className="text-xs text-neutral-400">Store activity in Admin panel notification center</p>
            </div>
            <button
              onClick={() => {
                const next = !historyEnabled;
                setHistoryEnabled(next);
                savePreferences(pushEnabled, next, categories);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${historyEnabled ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${historyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Active Notification Categories</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'sales', label: 'New Beat Sales', desc: 'Instant alerts on completed sales' },
            { id: 'freeDownloads', label: 'Free-Download Activity', desc: 'Throttled batch download alerts' },
            { id: 'milestones', label: 'Beat Milestones', desc: 'Stream benchmarks (25, 100, 1000 plays)' },
            { id: 'trending', label: 'Trending Beats', desc: 'Unusual surges in real play activity' },
            { id: 'subscribers', label: 'New Subscribers', desc: 'New artist email list signups' },
            { id: 'systemErrors', label: 'System Errors', desc: 'Critical operational issues' },
          ].map(cat => {
            const isChecked = (categories as any)[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${isChecked ? 'bg-indigo-950/20 border-indigo-500/40 text-white' : 'bg-neutral-950 border-neutral-800/80 text-neutral-400'}`}
              >
                {isChecked ? <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{cat.label}</p>
                  <p className="text-[11px] text-neutral-400 leading-tight">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ISRCModule = () => {
  const { state } = useStore();
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl text-left animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Music className="text-emerald-400" /> ISRC & Distribution Config</h2>
      <p className="text-neutral-400 mb-6 text-sm">Manage ISRC codes and DSP metadata for your catalog.</p>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {state.beats.map(beat => (
          <div key={beat.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{beat.title}</p>
              <p className="text-xs text-neutral-500">BPM: {beat.bpm} • Key: {beat.key}</p>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="ISRC Code" defaultValue={beat.isrcCode || ''} className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-white w-32" />
              <button className="bg-white text-black px-3 py-1.5 rounded text-sm font-bold"><Save size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const YouTubeManagerModule = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl text-left animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Video className="text-red-500" /> YouTube Content ID & Manager</h2>
      <p className="text-neutral-400 mb-6 text-sm">Sync beats with YouTube Content ID using Google APIs and OAuth.</p>
      <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg w-full flex items-center justify-center gap-2 mb-4">
        Authenticate YouTube Account
      </button>
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
        Connect account to view active Content ID claims.
      </div>
    </div>
  );
};

export const PublishingModule = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl text-left animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="text-amber-400" /> Publishing & Splits</h2>
      <p className="text-neutral-400 mb-6 text-sm">Manage PRO registrations (BMI/ASCAP) and royalty splits.</p>
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-neutral-500 text-sm">
        No active splits found. Upload a collaboration to configure publishing arrays.
      </div>
    </div>
  );
};

export const VaultsModule = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl text-left animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Lock className="text-purple-400" /> Secure Vaults</h2>
      <p className="text-neutral-400 mb-6 text-sm">Manage private access links and unreleased encrypted assets using Vercel Blob and AWS S3.</p>
      <button className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-6 rounded-lg w-full flex items-center justify-center gap-2">
        + Create New Private Vault
      </button>
    </div>
  );
};
